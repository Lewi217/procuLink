Version: 1.0 (Draft)
Scope: B2B raw material aggregation and procurement backend API (manufacturer/supplier facing)
Base URL: `https://api.<project-domain>.co.ke/api` (placeholder — update once deployed)
Protocol: REST over HTTPS
Stack: Python 3.11+, FastAPI, PostgreSQL (SQLAlchemy), Pydantic for request/response validation
Authentication: JWT Bearer tokens

## Table of Contents

- [Conventions](#conventions)
- [Core Entities](#core-entities)
- [1. Authentication & User Management](#1-authentication--user-management)
- [2. Catalog](#2-catalog)
- [3. RFQ (Request for Quote)](#3-rfq-request-for-quote)
- [4. Aggregation Pools](#4-aggregation-pools)
- [5. Orders](#5-orders)
- [6. Payments (PayHero)](#6-payments-payhero)
- [7. Trust Score](#7-trust-score)
- [8. Notifications (SMS/USSD/Push)](#8-notifications-smsussdpush)
- [9. Admin](#9-admin)
- [Error Codes Reference](#error-codes-reference)

## Conventions

### Base headers

Unless otherwise noted, every authenticated request must include:

```
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

### Standard response envelope

All responses follow this shape:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

On failure:

```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number is already registered",
    "fields": {
      "phoneNumber": "Already in use"
    }
  }
}
```

### Pagination

List endpoints accept `page` and `pageSize` query parameters and return:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 134,
    "totalPages": 7
  }
}
```

### Timestamps

All timestamps are ISO 8601 UTC strings, e.g. `"2026-09-04T08:30:00Z"`. The client converts to local display time.

### Idempotency for offline-created records

USSD/SMS-originated orders and any client-created record accept an optional `clientGeneratedId` (UUID v4). The server treats this as an idempotency key — replaying the same request with the same ID does not create a duplicate record.

### Roles

| Role | Description |
|---|---|
| `MANUFACTURER` | Small-scale manufacturer / jua kali fabricator posting RFQs and joining pools |
| `SUPPLIER` | Raw material supplier managing a catalog and fulfilling pooled orders |
| `ADMIN` | Platform administrator |

## Core Entities

### User

```json
{
  "id": "usr_7a2c19",
  "role": "MANUFACTURER",
  "fullName": "James Mwangi",
  "businessName": "Mwangi Metal Works",
  "phoneNumber": "+254712345678",
  "county": "Nairobi",
  "accountType": "APP",
  "createdAt": "2026-04-01T09:00:00Z",
  "updatedAt": "2026-08-20T11:15:00Z"
}
```

`accountType`: `APP` (uses the web/mobile app) | `SMS_ONLY` (no app session; interacts via USSD/SMS only, registered manually or via self-service USSD).

### ManufacturerProfile

```json
{
  "userId": "usr_7a2c19",
  "businessType": "METAL_FABRICATION",
  "county": "Nairobi",
  "trustScoreId": "score_1123",
  "preferredSupplierIds": ["usr_sup_4471"]
}
```

`businessType`: `METAL_FABRICATION` | `CARPENTRY` | `AGRO_PROCESSING` | `PACKAGING` | `OTHER`.

### SupplierProfile

```json
{
  "userId": "usr_sup_4471",
  "businessName": "Kariuki Hardware Ltd",
  "county": "Nairobi",
  "verified": true,
  "catalogItemCount": 24
}
```

### CatalogItem

```json
{
  "id": "cat_8821",
  "supplierId": "usr_sup_4471",
  "name": "Mild steel sheets, 3mm",
  "category": "METAL",
  "unit": "SHEET",
  "retailPricePerUnit": 1800,
  "bulkPricePerUnit": 1450,
  "bulkThresholdQuantity": 60,
  "stockQuantity": 210,
  "createdAt": "2026-05-10T09:00:00Z",
  "updatedAt": "2026-08-15T09:00:00Z"
}
```

`category`: `METAL` | `TIMBER` | `PACKAGING` | `CHEMICAL` | `OTHER`. `unit`: `SHEET` | `PIECE` | `KG` | `BAG` | `METER` | `LITRE`.

### RFQ

```json
{
  "id": "rfq_5512",
  "manufacturerId": "usr_7a2c19",
  "rawText": "Nahitaji mabati sita nzito na hinges nne kwa job ya gate",
  "inputChannel": "APP_TEXT",
  "parsed": {
    "material": "Corrugated iron sheets",
    "matchedCatalogItemId": "cat_2210",
    "quantity": 6,
    "unit": "SHEET",
    "notes": "heavy gauge; also needs 4 hinges"
  },
  "parseConfidence": 0.91,
  "status": "POOLING",
  "poolId": "pool_3391",
  "createdAt": "2026-08-29T08:10:00Z"
}
```

`inputChannel`: `APP_TEXT` | `APP_VOICE` | `USSD` | `SMS`. `status`: `PARSED` | `POOLING` | `LOCKED` | `CANCELLED` | `FULFILLED`.

### Pool

```json
{
  "id": "pool_3391",
  "catalogItemId": "cat_2210",
  "supplierId": "usr_sup_4471",
  "totalQuantity": 40,
  "thresholdQuantity": 60,
  "status": "OPEN",
  "lockedAt": null,
  "createdAt": "2026-08-25T07:00:00Z"
}
```

`status`: `OPEN` | `LOCKED` | `EXPIRED` | `FULFILLED`.

### Order

```json
{
  "id": "ord_2291",
  "poolId": "pool_3391",
  "supplierId": "usr_sup_4471",
  "totalAmount": 87000,
  "status": "AWAITING_PAYMENT",
  "createdAt": "2026-08-30T10:00:00Z"
}
```

`status`: `AWAITING_PAYMENT` | `PAID` | `FULFILLED` | `DELIVERED` | `CANCELLED`.

### OrderContribution

Links a manufacturer's RFQ to an order once its pool locks, so each manufacturer's share of a bulk order is tracked individually for payment and fulfillment purposes.

```json
{
  "id": "contrib_991",
  "orderId": "ord_2291",
  "manufacturerId": "usr_7a2c19",
  "rfqId": "rfq_5512",
  "quantity": 6,
  "amountDue": 8700,
  "paymentStatus": "PENDING",
  "deliveryConfirmed": false
}
```

### Payment

```json
{
  "id": "pay_4471",
  "orderContributionId": "contrib_991",
  "manufacturerId": "usr_7a2c19",
  "payheroReference": "PH-9911-2026",
  "mpesaReceiptNumber": "SFC7XJ2KQ1",
  "externalReference": "contrib_991",
  "amount": 8700,
  "status": "COMPLETED",
  "initiatedAt": "2026-08-30T10:05:00Z",
  "completedAt": "2026-08-30T10:06:12Z"
}
```

`status`: `PENDING` (STK push sent, awaiting PIN entry) | `COMPLETED` | `FAILED` | `CANCELLED`. `payheroReference` is PayHero's own transaction reference, returned at initiation and used for status polling. `mpesaReceiptNumber` is only populated once PayHero's callback confirms the underlying M-Pesa transaction. `externalReference` is the value the backend sends PayHero at initiation, so the callback can be matched back to the correct `OrderContribution` — set to the contribution ID.

### TrustScore

```json
{
  "userId": "usr_7a2c19",
  "score": 92,
  "fulfilledOrders": 17,
  "cancelledOrders": 1,
  "formula": "fulfilledOrders / (fulfilledOrders + cancelledOrders) * 100",
  "updatedAt": "2026-08-30T10:00:00Z"
}
```

### Notification

```json
{
  "id": "notif_3301",
  "userId": "usr_7a2c19",
  "category": "POOL_LOCKED",
  "title": "Your pool has locked",
  "body": "Mild steel sheets pool reached 60 units. Pay now to confirm your order.",
  "channel": "SMS",
  "isRead": false,
  "createdAt": "2026-08-30T10:00:00Z"
}
```

`category`: `POOL_LOCKED` | `PAYMENT_CONFIRMED` | `ORDER_FULFILLED` | `RFQ_PARSED` | `TRUST_SCORE_UPDATED`. `channel`: `PUSH` | `SMS` | `USSD`.

---

## 1. Authentication & User Management

### `POST /api/auth/register`

Headers: none beyond base headers (public endpoint).

Request body:

```json
{
  "fullName": "James Mwangi",
  "businessName": "Mwangi Metal Works",
  "phoneNumber": "+254712345678",
  "role": "MANUFACTURER",
  "county": "Nairobi",
  "password": "SecurePass123"
}
```

Response `201 Created`:

```json
{
  "success": true,
  "data": {
    "user": { "...": "User entity" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

Errors: `400 VALIDATION_ERROR`, `409 PHONE_ALREADY_REGISTERED`.

### `POST /api/auth/login`

Request body:

```json
{ "phoneNumber": "+254712345678", "password": "SecurePass123" }
```

Response `200 OK`: same shape as register.

Errors: `401 INVALID_CREDENTIALS`, `423 ACCOUNT_LOCKED`.

### `POST /api/auth/refresh`

Request body: `{ "refreshToken": "..." }`

Response `200 OK`: `{ "success": true, "data": { "accessToken": "...", "expiresIn": 3600 } }`

Errors: `401 INVALID_REFRESH_TOKEN`, `401 REFRESH_TOKEN_EXPIRED`.

### `POST /api/auth/logout`

Headers: `Authorization` required. Request body: `{ "refreshToken": "..." }`. Response: `204 No Content`.

### `POST /api/auth/register-sms-only`

Not called from the app. A manufacturer without a smartphone dials a USSD self-registration code; the USSD gateway calls this internally. Documented here because it produces the same `User` shape mobile/web depend on.

Request body:

```json
{ "fullName": "Esther Nyambura", "phoneNumber": "+254712004552", "role": "MANUFACTURER", "county": "Kiambu", "accountType": "SMS_ONLY" }
```

Response `201 Created`: `{ "success": true, "data": { "user": { "...": "User entity" } } }`

### `POST /api/auth/forgot-password` / `POST /api/auth/reset-password`

Same OTP-based flow as standard password reset. Errors: `400 INVALID_OTP`, `410 OTP_EXPIRED`.

### `GET /api/users/me`

Response `200 OK`: `{ "success": true, "data": { "user": {...}, "profile": {...} } }` — `profile` is `ManufacturerProfile` or `SupplierProfile` depending on role.

### `PUT /api/users/me`

Request body: any subset of profile fields. Response `200 OK`: updated entity.

### `GET /api/users/{id}` — admin only

### `GET /api/users?role=&county=&status=` — admin only, filtered list

---

## 2. Catalog

### `POST /api/catalog`

Role required: `SUPPLIER`.

Request body:

```json
{
  "name": "Mild steel sheets, 3mm",
  "category": "METAL",
  "unit": "SHEET",
  "retailPricePerUnit": 1800,
  "bulkPricePerUnit": 1450,
  "bulkThresholdQuantity": 60,
  "stockQuantity": 210
}
```

Response `201 Created`: `{ "...": "CatalogItem entity" }`

### `GET /api/catalog?search=&category=&county=&page=&pageSize=`

Public browse/search endpoint (used by the RFQ matcher and by manufacturers browsing directly).

Response `200 OK`: `{ "success": true, "data": [ { "...": "CatalogItem entity" } ], "meta": { "...": "pagination" } }`

### `GET /api/catalog/{id}`

### `PUT /api/catalog/{id}` — role required: `SUPPLIER` (owner only)

### `DELETE /api/catalog/{id}` — role required: `SUPPLIER` (owner only)

### `GET /api/catalog/supplier/{supplierId}`

Returns a specific supplier's full catalog.

---

## 3. RFQ (Request for Quote)

### `POST /api/rfq/parse`

Sends raw free-text or voice-transcribed input to the NLP parsing engine and returns a structured **draft** for the manufacturer to review before submitting. Does not create a persisted RFQ.

Request body:

```json
{ "rawText": "Nahitaji mabati sita nzito na hinges nne kwa job ya gate", "inputChannel": "APP_TEXT" }
```

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "parsed": {
      "material": "Corrugated iron sheets",
      "matchedCatalogItemId": "cat_2210",
      "matchedCatalogItemName": "Mild steel sheets, 3mm",
      "quantity": 6,
      "unit": "SHEET",
      "notes": "heavy gauge; also needs 4 hinges"
    },
    "parseConfidence": 0.91,
    "alternativeMatches": [
      { "catalogItemId": "cat_2214", "catalogItemName": "Galvanized iron sheets", "confidence": 0.74 }
    ]
  }
}
```

Errors: `422 PARSE_FAILED` (input too ambiguous — client should fall back to manual catalog selection).

### `POST /api/rfq`

Submits a confirmed RFQ (typically the output of `/parse`, possibly edited by the manufacturer).

Request body:

```json
{
  "rawText": "Nahitaji mabati sita nzito na hinges nne kwa job ya gate",
  "inputChannel": "APP_TEXT",
  "matchedCatalogItemId": "cat_2210",
  "quantity": 6,
  "unit": "SHEET",
  "notes": "heavy gauge; also needs 4 hinges",
  "clientGeneratedId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Response `201 Created`: `{ "...": "RFQ entity" }` — also auto-attaches to an existing open `Pool` for the matched catalog item, or creates a new `Pool` if none exists (see Module 4).

### `GET /api/rfq/mine`

Query params: `status`, `page`, `pageSize`. Response: manufacturer's own RFQs.

### `GET /api/rfq/{id}`

### `PUT /api/rfq/{id}` — only while `status` is `PARSED` or `POOLING` (pool not yet locked)

### `DELETE /api/rfq/{id}` — cancels; only while pool not yet locked

---

## 4. Aggregation Pools

### `GET /api/pools?catalogItemId=&supplierId=&status=`

Response `200 OK`: `{ "success": true, "data": [ { "...": "Pool entity" } ] }`

### `GET /api/pools/{id}`

### `GET /api/pools/{id}/progress`

Response `200 OK`:

```json
{
  "success": true,
  "data": {
    "poolId": "pool_3391",
    "totalQuantity": 40,
    "thresholdQuantity": 60,
    "percentComplete": 67,
    "contributingManufacturerCount": 5
  }
}
```

### `POST /api/pools/{id}/join`

Internal — called automatically when an RFQ is submitted against a catalog item with an open pool. Not typically called directly by clients.

### `POST /api/pools/{id}/lock`

Triggered automatically by a scheduled job once `totalQuantity >= thresholdQuantity`, or manually by an admin. Locking a pool creates an `Order` and one `OrderContribution` per attached RFQ, and fires a `POOL_LOCKED` notification to every contributing manufacturer.

Response `200 OK`: `{ "success": true, "data": { "pool": { "...": "status: LOCKED" }, "orderId": "ord_2291" } }`

---

## 5. Orders

### `GET /api/orders/{id}`

### `GET /api/orders/mine`

Manufacturer view — returns orders via their `OrderContribution` records.

### `GET /api/orders/supplier`

Role required: `SUPPLIER`. Returns incoming orders for the authenticated supplier.

### `PUT /api/orders/{id}/status`

Role required: `SUPPLIER`. Request body: `{ "status": "FULFILLED" }`

### `POST /api/orders/{id}/contributions/{contributionId}/confirm-delivery`

Role required: `MANUFACTURER` (the contribution owner). Marks their portion as received — this is the event that feeds the trust score.

Response `200 OK`: `{ "...": "OrderContribution entity, deliveryConfirmed: true" }`

---

## 6. Payments (PayHero)

PayHero sits in front of M-Pesa as a payment facilitator — the backend never talks to Safaricom's Daraja API directly. Server-side config requires three PayHero credentials (API Username, API Password, Channel ID) obtained from a PayHero merchant account, plus a Payment Channel configured for M-Pesa STK Push. PayHero has a separate sandbox mode for development; real payments only succeed once the PayHero account completes KYC and the channel is switched to Live.

### `POST /api/payments/stkpush`

Initiates an M-Pesa STK push, via PayHero, for a single manufacturer's `OrderContribution`. The backend calls PayHero's payment endpoint server-side using the stored API Username/Password and Channel ID; the client only ever calls this endpoint on our own API.

Request body: `{ "orderContributionId": "contrib_991" }`

Response `200 OK`:

```json
{
  "success": true,
  "data": { "payheroReference": "PH-9911-2026", "status": "PENDING" }
}
```

Errors: `502 PAYHERO_UNAVAILABLE` (PayHero API unreachable or rejected the request), `400 INVALID_PHONE_NUMBER`.

### `POST /api/payments/callback`

PayHero webhook — not called by clients. PayHero calls this URL once the customer completes (or fails/cancels) the STK push on their phone. The backend matches the callback's `externalReference` back to the originating `OrderContribution`, updates the `Payment` record, and — once all contributions on an order are `COMPLETED` — triggers `POST /api/payments/split`. Documented here for backend reference.

Request body (PayHero-defined shape, example):

```json
{
  "reference": "PH-9911-2026",
  "external_reference": "contrib_991",
  "status": "SUCCESS",
  "mpesa_receipt": "SFC7XJ2KQ1",
  "amount": 8700
}
```

Response `200 OK`: `{ "success": true }` (PayHero-required envelope, distinct from our standard response shape).

### `GET /api/payments/{orderContributionId}/status`

Returns our own `Payment` record for the contribution. If still `PENDING` and the callback hasn't arrived within a reasonable window, the backend falls back to actively polling PayHero's transaction-status endpoint using the stored `payheroReference` before responding, rather than leaving the client to guess.

Response `200 OK`: `{ "...": "Payment entity" }`

### `POST /api/payments/split`

Internal — triggered once all contributions on an order are `COMPLETED`. Uses PayHero's wallet/withdrawal capability to disburse the aggregated amount to the supplier's registered mobile or bank account. Not called by clients.

### `GET /api/payments/wallet-balance` — admin only

Internal reference endpoint for checking the platform's PayHero service wallet balance (used to fund supplier payouts). Proxies PayHero's wallet balance inquiry.

Response `200 OK`: `{ "success": true, "data": { "walletBalance": 154200 } }`

---

## 7. Trust Score

### `GET /api/trust-score/{userId}`

Response `200 OK`: `{ "...": "TrustScore entity" }`

### `POST /api/trust-score/recalculate`

Internal — triggered by a scheduled job or immediately after `confirm-delivery` / an order cancellation. Not called by clients.

---

## 8. Notifications (SMS/USSD/Push)

### `GET /api/notifications?unreadOnly=&page=&pageSize=`

### `PUT /api/notifications/{id}/read`

### `POST /api/notifications/sms/send` — internal, backend reference only

### `POST /api/ussd/session`

USSD gateway webhook entry point (e.g. Africa's Talking). Handles the entire session tree via one endpoint; session state is passed back and forth by the gateway per its standard USSD protocol.

Request body (gateway-defined, example):

```json
{ "sessionId": "ATUid_1a2b3c", "phoneNumber": "+254712004552", "text": "1*2" }
```

Response `200 OK`: plain-text USSD menu response per Africa's Talking's expected format (not the standard JSON envelope, since the gateway requires raw text).

### `POST /api/devices/register` / `DELETE /api/devices/{tokenId}`

Standard push notification device token registration.

---

## 9. Admin

### `GET /api/admin/dashboard/stats`

Response `200 OK`:

```json
{
  "success": true,
  "data": { "totalUsers": 248, "activePools": 14, "ordersThisMonth": 63, "gmvThisMonth": 1240000 }
}
```

### `GET /api/admin/users?role=&status=`

### `PUT /api/admin/users/{id}/status`

Request body: `{ "status": "SUSPENDED" }`

### `GET /api/admin/pools?status=`

### `GET /api/admin/orders?status=`

---

## Error Codes Reference

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | One or more fields failed validation; see `error.fields` |
| 400 | `NO_MATCHING_CATALOG_ITEM` | RFQ parser could not confidently match any catalog item |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 401 | `INVALID_CREDENTIALS` | Login phone/password mismatch |
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token invalid or revoked |
| 401 | `REFRESH_TOKEN_EXPIRED` | Refresh token past expiry |
| 403 | `FORBIDDEN` | Authenticated but lacks permission for this resource |
| 404 | `NOT_FOUND` | Generic resource not found |
| 404 | `NO_ACTIVE_POOL` | No open pool exists for the requested catalog item |
| 409 | `PHONE_ALREADY_REGISTERED` | Registration attempted with an existing phone number |
| 409 | `POOL_ALREADY_LOCKED` | Attempted to edit/cancel an RFQ after its pool locked |
| 410 | `OTP_EXPIRED` | Password reset OTP expired |
| 400 | `INVALID_PHONE_NUMBER` | Phone number not in a format PayHero/M-Pesa accepts |
| 502 | `PAYHERO_UNAVAILABLE` | PayHero API unreachable, timed out, or rejected the request |
| 422 | `PARSE_FAILED` | NLP parser could not confidently extract structured order data |
| 423 | `ACCOUNT_LOCKED` | Too many failed login attempts |
| 429 | `RATE_LIMITED` | Too many requests in a short window |
| 500 | `INTERNAL_ERROR` | Unexpected server error |