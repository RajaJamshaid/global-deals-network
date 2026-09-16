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

List responses should support:

data

pagination

total where practical

current page

limit

next/previous indicators



---

24. Error Response Structure

Errors should use a consistent structure.

Example:

{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters"
  }
}

API errors should use appropriate HTTP status codes.

Examples:

400 — Bad Request

401 — Unauthorized

403 — Forbidden

404 — Not Found

409 — Conflict

422 — Validation Error

429 — Rate Limited

500 — Internal Error



---

25. Pagination

Large datasets must use pagination.

Recommended parameters:

page

limit

Example:

GET /api/v1/deals?page=2&limit=50

Cursor-based pagination may be introduced later for very large/high-volume datasets.

Maximum page size must be enforced.


---

26. Rate Limiting

Public and authenticated APIs must have rate limits.

Rate limits should vary by:

IP

User

API key

Endpoint

Authentication level

Traffic type


Higher limits may be granted to trusted internal services.

Rate limiting must protect the system from abuse and accidental overload.


---

27. Caching

Read-heavy API responses should support caching.

Potential cache targets:

Categories

Countries

Merchant pages

Popular deals

Featured deals

Search results where appropriate


Cache invalidation must occur when relevant underlying data changes.

Highly personalized responses should be handled carefully to avoid leaking user-specific data.


---

28. API Security

Security requirements:

HTTPS only

Secure authentication

Authorization checks

Input validation

Rate limiting

CORS controls

CSRF protection where applicable

Secure headers

Secret management

Audit logs

Abuse detection


Database credentials and affiliate secrets must never be returned through API responses.


---

29. CORS

CORS must allow only approved application origins.

Production origins should be explicitly configured.

Development origins should be separate from production.

Wildcard CORS should not be used for authenticated APIs unless there is a specific controlled requirement.


---

30. API Logging

The API should log important operational information.

Examples:

Request ID

Endpoint

Status code

Response time

Error code

Service

Timestamp


Sensitive information must not be written to logs.

Examples of data that should not be logged unnecessarily:

Passwords

Authentication secrets

API keys

Private tokens

Sensitive personal information



---

31. API Monitoring

Monitor:

Error rate

Request volume

Response time

Rate-limit events

Authentication failures

Database errors

Affiliate redirect failures

Third-party API failures


Alerts should be configured for critical production failures.


---

32. API Idempotency

Operations that may be retried must support idempotency where appropriate.

This is especially important for:

Deal imports

Conversion imports

Payment-related future features

Notification jobs

Affiliate events


Duplicate requests must not unnecessarily create duplicate records.


---

33. Webhooks

Future integrations may use webhooks for:

Affiliate conversions

Merchant updates

Deal updates

External services

Notifications


Webhook requirements:

Signature verification

Authentication

Replay protection

Idempotency

Retry handling

Event logging



---

34. Background Jobs

Long-running operations should not block normal API requests.

Background jobs may handle:

Deal imports

Data normalization

Deduplication

Expiry checks

Affiliate synchronization

Conversion synchronization

Notifications

Analytics processing

PSEO generation

Cache invalidation



---

35. API and Database Separation

API business logic must be separated from database access.

Recommended conceptual structure:

API Routes → Controllers/Handlers → Services → Data Access Layer → Database

This separation makes the system easier to test, maintain and scale.


---

36. API Documentation

All production APIs should be documented.

Documentation should include:

Endpoint

HTTP method

Authentication

Parameters

Request body

Response structure

Error codes

Examples

Rate limits


OpenAPI/Swagger may be introduced for formal API documentation.


---

37. API Environment Separation

Separate environments should be maintained:

Development

Staging

Production


Each environment should have separate:

API configuration

Database credentials

Secrets

Affiliate credentials where applicable

External service credentials


Production secrets must never be committed to GitHub.


---

38. API Scalability

The API architecture must support increasing traffic.

Scaling mechanisms may include:

CDN

Caching

Database indexing

Stateless API services

Horizontal scaling

Queues

Background workers

Dedicated search infrastructure

Analytics processing pipeline


The architecture should avoid unnecessary single points of failure.


---

39. API Data Flow

Website

Website → API → Services → Database → API Response → Website

Telegram Mini App

Mini App → API → User/Deal Services → Database → API Response → Mini App

Telegram Bot

Telegram → Bot Service → API → Database → Bot Response

Admin

Admin Dashboard → Authenticated Admin API → Services → Database

Affiliate

User → GDN Deal → Affiliate Redirect API → Click Event → Affiliate Network → Merchant


---

40. API Architecture Principle

The API must remain the central application gateway for GDN.

Core rule:

Website, Telegram Bot, Telegram Mini App and Admin Dashboard should share the same backend logic and centralized data layer.

No distribution channel should create its own isolated business logic or deal database.

This architecture allows GDN to add new channels in the future without rebuilding the core platform.
