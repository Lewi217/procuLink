"""
Comprehensive test for RFQ + Aggregation Pool endpoints.
Tests: AI parse, submit, pool auto-create, pool auto-lock, idempotency, progress, admin lock.
"""
import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://localhost:8030/api/v1"

# Seeded supplier IDs from previous seed run
KARIUKI_ID = "075d87bb-0358-474b-a138-d6913f160f08"


def fetch(method, url, data=None, headers=None):
    if headers is None:
        headers = {}
    if data:
        data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            body = json.loads(body)
        except Exception:
            pass
        return e.code, body


def login(email, password):
    s, d = fetch("POST", f"{BASE_URL}/auth/login", data={"email": email, "password": password})
    assert s == 200, f"Login failed: {d}"
    return d["data"]["access_token"]


def register_manufacturer(suffix=""):
    email = f"mfr_{uuid.uuid4().hex[:6]}@test.com"
    s, _ = fetch("POST", f"{BASE_URL}/auth/register", data={
        "email": email, "full_name": f"Test Manufacturer {suffix}",
        "role": "MANUFACTURER", "password": "Secure123"
    })
    assert s == 201, f"Registration failed: {_}"
    return login(email, "Secure123")


def main():
    # --- Credentials ---
    print("Setting up credentials...")
    mfr1_token = register_manufacturer("One")
    mfr2_token = register_manufacturer("Two")
    admin_token = login("klausejohn41@gmail.com", "Password123")

    # Get a real catalog item to use
    s, d = fetch("GET", f"{BASE_URL}/catalog?category=METAL&pageSize=1")
    assert s == 200 and d["meta"]["totalItems"] > 0
    catalog_item = d["data"][0]
    item_id = catalog_item["id"]
    item_threshold = catalog_item["bulk_threshold_quantity"]
    print(f"\nUsing catalog item: '{catalog_item['name']}' (threshold={item_threshold})")

    # =====================================================================
    # TEST 1: AI Parse — free text in Swahili
    # =====================================================================
    print("\n[1] AI Parse: 'Nahitaji mabati tisa' (I need 9 iron sheets)...")
    s, d = fetch("POST", f"{BASE_URL}/rfq/parse",
                 data={"rawText": "Nahitaji mabati tisa nzito kwa gate yangu"},
                 headers={"Authorization": f"Bearer {mfr1_token}"})
    print(f"   Status: {s}, confidence: {d.get('data', {}).get('parse_confidence')}")
    print(f"   Matched: {d.get('data', {}).get('parsed', {}).get('matched_catalog_item_name')}")
    assert s == 200, f"Parse failed: {d}"
    parse_confidence = d["data"]["parse_confidence"]
    assert parse_confidence > 0.3, f"Low confidence: {parse_confidence}"
    print(f"   ✅ Parse OK — confidence={parse_confidence:.2f}")

    # =====================================================================
    # TEST 2: Submit RFQ — Manufacturer 1
    # =====================================================================
    print(f"\n[2] Manufacturer 1 submits RFQ for '{catalog_item['name']}'...")
    client_id = str(uuid.uuid4())
    submit_qty = max(1, item_threshold // 3)   # 1/3 of threshold
    s, d = fetch("POST", f"{BASE_URL}/rfq", data={
        "rawText": "Need steel sheets for gate fabrication",
        "inputChannel": "APP_TEXT",
        "matchedCatalogItemId": item_id,
        "quantity": submit_qty,
        "unit": catalog_item["unit"],
        "notes": "3mm gauge preferred",
        "clientGeneratedId": client_id,
    }, headers={"Authorization": f"Bearer {mfr1_token}"})
    print(f"   Status: {s}, RFQ status: {d.get('data', {}).get('status')}")
    print(f"   pool_id: {d.get('data', {}).get('pool_id')}")
    assert s == 201, f"Submit failed: {d}"
    rfq1 = d["data"]
    rfq1_id = rfq1["id"]
    pool_id = rfq1["pool_id"]
    assert rfq1["status"] == "POOLING", f"Expected POOLING, got {rfq1['status']}"
    assert pool_id is not None, "pool_id should be set"
    print(f"   ✅ RFQ created, pool_id={pool_id}")

    # =====================================================================
    # TEST 3: Idempotency — same clientGeneratedId returns same RFQ
    # =====================================================================
    print("\n[3] Submit same RFQ again (idempotency check)...")
    s, d = fetch("POST", f"{BASE_URL}/rfq", data={
        "rawText": "Need steel sheets for gate fabrication",
        "inputChannel": "APP_TEXT",
        "matchedCatalogItemId": item_id,
        "quantity": submit_qty,
        "unit": catalog_item["unit"],
        "clientGeneratedId": client_id,
    }, headers={"Authorization": f"Bearer {mfr1_token}"})
    print(f"   Status: {s}, returned RFQ id: {d.get('data', {}).get('id')}")
    assert s == 201 and d["data"]["id"] == rfq1_id, "Idempotency failed — different RFQ returned"
    print("   ✅ Same RFQ returned, no duplicate created")

    # =====================================================================
    # TEST 4: Pool progress endpoint
    # =====================================================================
    print(f"\n[4] Pool progress for pool {pool_id}...")
    s, d = fetch("GET", f"{BASE_URL}/pools/{pool_id}/progress",
                 headers={"Authorization": f"Bearer {mfr1_token}"})
    progress = d.get("data", {})
    print(f"   Status: {s}, totalQty={progress.get('total_quantity')}, "
          f"threshold={progress.get('threshold_quantity')}, "
          f"pct={progress.get('percent_complete')}%, "
          f"contributors={progress.get('contributing_manufacturer_count')}")
    assert s == 200
    assert progress["total_quantity"] == submit_qty
    assert progress["contributing_manufacturer_count"] == 1
    print("   ✅ Progress data correct")

    # =====================================================================
    # TEST 5: Manufacturer 1 lists their RFQs
    # =====================================================================
    print("\n[5] Manufacturer 1 lists own RFQs...")
    s, d = fetch("GET", f"{BASE_URL}/rfq/mine",
                 headers={"Authorization": f"Bearer {mfr1_token}"})
    print(f"   Status: {s}, total RFQs: {d['meta']['totalItems']}")
    assert s == 200 and d["meta"]["totalItems"] >= 1

    # =====================================================================
    # TEST 6: Manufacturer 2 submits to same pool (joins it)
    # =====================================================================
    print(f"\n[6] Manufacturer 2 joins the same pool (qty={submit_qty})...")
    s, d = fetch("POST", f"{BASE_URL}/rfq", data={
        "rawText": "Steel sheets for workshop roof",
        "inputChannel": "APP_TEXT",
        "matchedCatalogItemId": item_id,
        "quantity": submit_qty,
        "unit": catalog_item["unit"],
    }, headers={"Authorization": f"Bearer {mfr2_token}"})
    rfq2 = d.get("data", {})
    print(f"   Status: {s}, pool_id: {rfq2.get('pool_id')}, RFQ status: {rfq2.get('status')}")
    assert s == 201 and rfq2.get("pool_id") == pool_id, "Should join same pool"
    print("   ✅ Manufacturer 2 joined existing pool")

    # Check contributor count increased
    s, d = fetch("GET", f"{BASE_URL}/pools/{pool_id}/progress",
                 headers={"Authorization": f"Bearer {mfr1_token}"})
    contributors = d["data"]["contributing_manufacturer_count"]
    total_qty = d["data"]["total_quantity"]
    print(f"   Pool now: qty={total_qty}, contributors={contributors}")
    assert contributors == 2, f"Expected 2 contributors, got {contributors}"
    print("   ✅ Contributor count correct")

    # =====================================================================
    # TEST 7: Get RFQ by ID
    # =====================================================================
    print(f"\n[7] Get RFQ by ID {rfq1_id}...")
    s, d = fetch("GET", f"{BASE_URL}/rfq/{rfq1_id}",
                 headers={"Authorization": f"Bearer {mfr1_token}"})
    print(f"   Status: {s}, status: {d.get('data', {}).get('status')}")
    assert s == 200

    # =====================================================================
    # TEST 8: Manufacturer 2 cannot access Manufacturer 1's RFQ (403)
    # =====================================================================
    print(f"\n[8] Manufacturer 2 tries to access Manufacturer 1's RFQ (expect 403)...")
    s, d = fetch("GET", f"{BASE_URL}/rfq/{rfq1_id}",
                 headers={"Authorization": f"Bearer {mfr2_token}"})
    print(f"   Status: {s}")
    assert s == 403, f"Expected 403, got {s}"
    print("   ✅ Access denied correctly")

    # =====================================================================
    # TEST 9: Admin manually locks the pool
    # =====================================================================
    print(f"\n[9] Admin locks pool {pool_id}...")
    s, d = fetch("POST", f"{BASE_URL}/pools/{pool_id}/lock",
                 headers={"Authorization": f"Bearer {admin_token}"})
    locked_status = d.get("data", {}).get("status")
    print(f"   Status: {s}, pool status: {locked_status}")
    assert s == 200 and locked_status == "LOCKED", f"Expected LOCKED, got {locked_status}"
    print("   ✅ Pool locked by admin")

    # =====================================================================
    # TEST 10: Cannot edit RFQ after pool is locked (409)
    # =====================================================================
    print(f"\n[10] Try to update RFQ after pool lock (expect 409)...")
    s, d = fetch("PUT", f"{BASE_URL}/rfq/{rfq1_id}",
                 data={"quantity": 5},
                 headers={"Authorization": f"Bearer {mfr1_token}"})
    print(f"   Status: {s}, error code: {d.get('error', {}).get('code') if isinstance(d, dict) else 'n/a'}")
    assert s == 409, f"Expected 409, got {s}"
    print("   ✅ Edit blocked after lock")

    # =====================================================================
    # TEST 11: List pools (authenticated)
    # =====================================================================
    print("\n[11] List all pools...")
    s, d = fetch("GET", f"{BASE_URL}/pools",
                 headers={"Authorization": f"Bearer {mfr1_token}"})
    print(f"   Status: {s}, total pools: {d['meta']['totalItems']}")
    assert s == 200 and d["meta"]["totalItems"] >= 1

    print("\n" + "="*55)
    print("✅  All RFQ + Pool endpoint tests passed!")
    print("="*55)


if __name__ == "__main__":
    main()
