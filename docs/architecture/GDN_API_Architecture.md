# GDN API Architecture

## 1. API Overview

GDN API centralized communication layer hoga jo tamam applications ko core backend aur database se connect karega.

API consumers:

- GDN Website
- Telegram Bot
- Telegram Mini App
- Admin Dashboard
- Future Mobile Apps
- Future Partner Integrations

Core principle:

Frontend → API → Business Logic → Database

Frontend directly database ko access nahi karega.

---

## 2. API Versioning

API versioning day one se use hogi.

Primary version:

`/api/v1/`

Examples:

`/api/v1/deals`

`/api/v1/products`

`/api/v1/merchants`

Future breaking changes ke liye new version create ki jayegi.

Example:

`/api/v2/`

---

## 3. API Base Structure

Recommended structure:

`/api/v1/`

### Public APIs

- `/deals`
- `/products`
- `/merchants`
- `/categories`
- `/countries`
- `/search`
- `/content`

### User APIs

- `/users`
- `/preferences`
- `/favorites`
- `/notifications`

### Affiliate APIs

- `/affiliate`
- `/redirect`
- `/clicks`
- `/conversions`

### Admin APIs

- `/admin/deals`
- `/admin/products`
- `/admin/merchants`
- `/admin/users`
- `/admin/analytics`

---

## 4. HTTP Methods

Standard HTTP methods use kiye jayenge.

GET:

Data retrieve karna.

POST:

New resource/action create karna.

PUT:

Complete resource update karna.

PATCH:

Partial resource update karna.

DELETE:

Resource remove/archive karna where appropriate.

---

## 5. Deals API

### Get Deals

`GET /api/v1/deals`

Supported filters:

- country
- region
- category
- merchant
- product
- price
- discount
- status
- featured
- expiry
- sort
- pagination

Example:

`GET /api/v1/deals?country=us&category=electronics`

### Get Single Deal

`GET /api/v1/deals/{deal_id}`

### Get Deal by Slug

`GET /api/v1/deals/slug/{slug}`

### Create Deal

`POST /api/v1/deals`

Admin/service authentication required.

### Update Deal

`PATCH /api/v1/deals/{deal_id}`

Admin/service authentication required.

### Archive Deal

`POST /api/v1/deals/{deal_id}/archive`

---

## 6. Products API

### Get Products

`GET /api/v1/products`

### Get Product

`GET /api/v1/products/{product_id}`

### Get Product by Slug

`GET /api/v1/products/slug/{slug}`

### Get Product Deals

`GET /api/v1/products/{product_id}/deals`

Admin operations require authentication.

---

## 7. Merchant API

### Get Merchants

`GET /api/v1/merchants`

### Get Merchant

`GET /api/v1/merchants/{merchant_id}`

### Get Merchant by Slug

`GET /api/v1/merchants/slug/{slug}`

### Get Merchant Deals

`GET /api/v1/merchants/{merchant_id}/deals`

### Get Merchant Products

`GET /api/v1/merchants/{merchant_id}/products`

---

## 8. Category API

### Get Categories

`GET /api/v1/categories`

### Get Category

`GET /api/v1/categories/{category_id}`

### Get Category Deals

`GET /api/v1/categories/{category_id}/deals`

Categories must support hierarchical parent/child relationships.

---

## 9. Country API

### Get Countries

`GET /api/v1/countries`

### Get Country

`GET /api/v1/countries/{country_id}`

### Get Country Deals

`GET /api/v1/countries/{country_id}/deals`

### Get Country Categories

`GET /api/v1/countries/{country_id}/categories`

Country-specific APIs will support GDN's global architecture and PSEO system.

---

## 10. Search API

Primary endpoint:

`GET /api/v1/search`

Possible parameters:

- q
- country
- category
- merchant
- price_min
- price_max
- discount_min
- sort
- page
- limit

Example:

`GET /api/v1/search?q=laptop&country=us`

Search results may include:

- Deals
- Products
- Merchants
- Categories
- Content

The search architecture should allow migration to a dedicated search engine later.

---

## 11. User API

### Get Current User

`GET /api/v1/users/me`

### Update User

`PATCH /api/v1/users/me`

### Get Preferences

`GET /api/v1/users/me/preferences`

### Update Preferences

`PATCH /api/v1/users/me/preferences`

### Get Favorites

`GET /api/v1/users/me/favorites`

User endpoints must require appropriate authentication.

---

## 12. Favorites API

### Save Deal

`POST /api/v1/users/me/favorites/deals/{deal_id}`

### Remove Deal

`DELETE /api/v1/users/me/favorites/deals/{deal_id}`

### Get Saved Deals

`GET /api/v1/users/me/favorites/deals`

Future support may include:

- Saved products
- Saved merchants
- Saved searches

---

## 13. Recommendation API

Primary endpoint:

`GET /api/v1/recommendations`

Possible parameters:

- user
- country
- category
- context
- limit

Examples:

`GET /api/v1/recommendations?context=homepage`

`GET /api/v1/recommendations?context=deal&id=123`

Initial recommendation logic may be rule-based.

Future versions may use machine-learning/AI systems.

---

## 14. Affiliate Redirect API

Affiliate redirects must be centrally controlled.

Example:

`GET /api/v1/redirect/deal/{deal_id}`

Flow:

User
→ GDN Redirect
→ Click recorded
→ Affiliate URL generated
→ Merchant

The redirect system must not expose internal tracking secrets.

---

## 15. Click Tracking API

Important clicks should be recorded through a standardized event system.

Example:

`POST /api/v1/events/click`

Possible data:

- user_id
- deal_id
- product_id
- merchant_id
- affiliate_link_id
- session_id
- channel
- timestamp

The API should validate event data before storing it.

---

## 16. Conversion API

Where affiliate networks provide conversion data:

`POST /api/v1/conversions`

Conversion information may originate from:

- Affiliate network APIs
- Affiliate network reports
- Webhooks
- Approved partner integrations
- Manual reconciliation

Conversion records must be linked to available click/affiliate identifiers where possible.

---

## 17. Telegram API Integration

Telegram Bot and Mini App will communicate with GDN through the central API.

Flow:

Telegram User
→ Telegram Bot / Mini App
→ GDN API
→ Business Logic
→ Database

Telegram-specific services may handle:

- Telegram user verification
- Telegram init data validation
- Bot commands
- Notifications
- Deep links
- Mini App context

Telegram credentials must remain server-side.

---

## 18. Telegram User Authentication

Telegram Mini App authentication must validate Telegram-provided initialization data on the server.

The client must never be trusted to provide an unverified Telegram identity.

Server responsibilities:

- Validate authentication data
- Identify Telegram user
- Create/update GDN user mapping
- Apply permissions
- Create authenticated session

---

## 19. Admin API

Admin APIs will be separated from public APIs.

Examples:

`/api/v1/admin/deals`

`/api/v1/admin/merchants`

`/api/v1/admin/products`

`/api/v1/admin/users`

`/api/v1/admin/analytics`

Admin endpoints require:

- Authentication
- Authorization
- Role verification
- Audit logging

---

## 20. Authentication

API authentication will depend on endpoint type.

Public endpoints:

- No user authentication where appropriate
- Rate limiting
- Abuse protection

User endpoints:

- Authenticated user session/token

Admin endpoints:

- Strong authentication
- Role-based authorization

Service-to-service endpoints:

- Secure service credentials

Secrets must never be included in frontend JavaScript.

---

## 21. Authorization

Role-based access control should be supported.

Possible roles:

- User
- Moderator
- Editor
- Affiliate Manager
- Analyst
- Admin
- Super Admin
- Service Account

Each role should have only the permissions required for its responsibilities.

---

## 22. Request Validation

Every API endpoint must validate:

- Required fields
- Data types
- String length
- Numeric ranges
- IDs
- URLs
- Dates
- Enum values
- Authentication
- Authorization

Invalid requests must return structured errors.

---

## 23. API Response Structure

Successful responses should use a consistent structure.

Example:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
