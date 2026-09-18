"""Verification test for all Catalog endpoints."""
import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://localhost:8030/api/v1"

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

def main():
    # --- Setup: login as both seeded suppliers and a manufacturer ---
    print("Logging in as Supplier 1 (Kariuki Hardware)...")
    supplier1_token = login("kariuki.hardware@proculink.co.ke", "Supplier@123")

    print("Logging in as Supplier 2 (Nairobi Metals)...")
    supplier2_token = login("nairobi.metals@proculink.co.ke", "Supplier@123")

    print("Registering a Manufacturer user...")
    mfr_email = f"mfr_{uuid.uuid4().hex[:6]}@test.com"
    s, _ = fetch("POST", f"{BASE_URL}/auth/register", data={
        "email": mfr_email, "full_name": "Test Manufacturer",
        "role": "MANUFACTURER", "password": "Secure123"
    })
    assert s == 201, f"Manufacturer registration failed: {_}"
    mfr_token = login(mfr_email, "Secure123")

    # --- Test 1: Supplier creates a catalog item ---
    print("\n[1] Supplier creates a catalog item...")
    s, d = fetch("POST", f"{BASE_URL}/catalog", data={
        "name": "Aluminium sheets, 2mm",
        "category": "METAL",
        "unit": "SHEET",
        "retail_price_per_unit": 2200,
        "bulk_price_per_unit": 1800,
        "bulk_threshold_quantity": 40,
        "stock_quantity": 150
    }, headers={"Authorization": f"Bearer {supplier1_token}"})
    print(f"   Status: {s}, name: {d.get('data', {}).get('name')}")
    assert s == 201, f"Expected 201, got {s}: {d}"
    new_item_id = d["data"]["id"]

    # --- Test 2: Manufacturer CANNOT create an item (403) ---
    print("\n[2] Manufacturer attempts to create a catalog item (expect 403)...")
    s, d = fetch("POST", f"{BASE_URL}/catalog", data={
        "name": "Fake item", "category": "METAL", "unit": "KG",
        "retail_price_per_unit": 100, "bulk_price_per_unit": 80,
        "bulk_threshold_quantity": 50, "stock_quantity": 0
    }, headers={"Authorization": f"Bearer {mfr_token}"})
    print(f"   Status: {s}")
    assert s == 403, f"Expected 403, got {s}"

    # --- Test 3: Public browse (no auth) ---
    print("\n[3] Public browse of all catalog items...")
    s, d = fetch("GET", f"{BASE_URL}/catalog")
    total = d["meta"]["totalItems"]
    print(f"   Status: {s}, totalItems: {total}")
    assert s == 200, f"Expected 200, got {s}"
    assert total >= 10, f"Expected at least 10 items, got {total}"

    # --- Test 4: Search by name ---
    print("\n[4] Search by name 'steel'...")
    s, d = fetch("GET", f"{BASE_URL}/catalog?search=steel")
    print(f"   Status: {s}, totalItems: {d['meta']['totalItems']}")
    assert s == 200 and d["meta"]["totalItems"] >= 2

    # --- Test 5: Filter by category ---
    print("\n[5] Filter by category=METAL...")
    s, d = fetch("GET", f"{BASE_URL}/catalog?category=METAL")
    print(f"   Status: {s}, totalItems: {d['meta']['totalItems']}")
    assert s == 200 and d["meta"]["totalItems"] >= 4

    # --- Test 6: Get single item ---
    print(f"\n[6] Get single item (id={new_item_id})...")
    s, d = fetch("GET", f"{BASE_URL}/catalog/{new_item_id}")
    print(f"   Status: {s}, name: {d.get('data', {}).get('name')}")
    assert s == 200

    # --- Test 7: Update as owner ---
    print("\n[7] Update item price as owner supplier...")
    s, d = fetch("PUT", f"{BASE_URL}/catalog/{new_item_id}", data={
        "retail_price_per_unit": 2500
    }, headers={"Authorization": f"Bearer {supplier1_token}"})
    print(f"   Status: {s}, new price: {d.get('data', {}).get('retail_price_per_unit')}")
    assert s == 200 and float(d["data"]["retail_price_per_unit"]) == 2500.0

    # --- Test 8: Supplier 2 cannot update Supplier 1's item (403) ---
    print("\n[8] Supplier 2 attempts to update Supplier 1's item (expect 403)...")
    s, d = fetch("PUT", f"{BASE_URL}/catalog/{new_item_id}", data={
        "retail_price_per_unit": 999
    }, headers={"Authorization": f"Bearer {supplier2_token}"})
    print(f"   Status: {s}")
    assert s == 403, f"Expected 403, got {s}"

    # --- Test 9: Get supplier catalog ---
    print("\n[9] Get Supplier 1's full catalog...")
    supplier1_id = "075d87bb-0358-474b-a138-d6913f160f08"
    s, d = fetch("GET", f"{BASE_URL}/catalog/supplier/{supplier1_id}")
    print(f"   Status: {s}, totalItems: {d['meta']['totalItems']}")
    assert s == 200 and d["meta"]["totalItems"] >= 6  # 5 seeded + 1 created

    # --- Test 10: Delete as owner ---
    print(f"\n[10] Delete item (id={new_item_id}) as owner...")
    s, _ = fetch("DELETE", f"{BASE_URL}/catalog/{new_item_id}",
                 headers={"Authorization": f"Bearer {supplier1_token}"})
    print(f"   Status: {s}")
    assert s == 204, f"Expected 204, got {s}"

    # --- Test 11: Confirm deleted item returns 404 ---
    print(f"\n[11] Confirm deleted item is gone (expect 404)...")
    s, _ = fetch("GET", f"{BASE_URL}/catalog/{new_item_id}")
    print(f"   Status: {s}")
    assert s == 404, f"Expected 404, got {s}"

    print("\n✅  All Catalog endpoint tests passed!")

if __name__ == "__main__":
    main()
