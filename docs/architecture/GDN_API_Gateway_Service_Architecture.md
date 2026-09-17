Global Deals Network

API Gateway & Service Architecture

1. Purpose

GDN API Gateway central entry point hoga jo Website, PWA, Telegram Mini App, Bot aur future mobile apps ko central backend services se connect karega.

---

2. Core Principle

Many Clients → One API Gateway → Central Services → One Data Authority

---

3. Client Applications

Gateway serve karega:

- Website
- PWA
- Telegram Mini App
- Telegram Bot
- Android
- iOS
- Future channels

---

4. Gateway Responsibilities

API Gateway handle karega:

- Routing
- Authentication
- Authorization checks
- Rate limiting
- Request validation
- CORS
- Request IDs
- API versioning
- Observability

---

5. Gateway Does Not Own Business Logic

Gateway mein complex business rules nahi honge.

Examples:

- Reward calculation
- Affiliate commission
- Product ranking
- Merchant approval

central services mein rahenge.

---

6. Architecture

Clients
   ↓
Cloudflare Edge
   ↓
API Gateway
   ↓
Service Layer
   ↓
Central Database / Cache / Search / Queues

---

7. API Version

Initial public API:

/api/v1/

---

8. Versioning

Future breaking changes:

/api/v2/

ke through introduce ki ja sakti hain.

---

9. Base Domains

Production architecture future dedicated API domain support karegi.

Example:

api.globaldealsnetwork.com

---

10. Environment Separation

Environments:

- Development
- Staging
- Production

separate configuration use karenge.

---

11. Request ID

Har request ko unique request ID milegi.

Example:

X-Request-ID

---

12. Correlation ID

Distributed workflows mein correlation ID use hogi.

Example:

User Request
 ↓
API
 ↓
Queue
 ↓
Worker
 ↓
Affiliate

same correlation context maintain karega.

---

13. Authentication

Gateway supported authentication methods identify karega:

- Guest
- User session
- Telegram authentication
- API key
- OAuth where applicable
- Admin authentication

---

14. Authorization

Authorization central identity/RBAC rules ke according enforce hogi.

---

15. Guest Access

Public endpoints guest access allow kar sakte hain:

- Search
- Deals
- Products
- Merchants
- Categories

---

16. Authenticated Access

Authenticated endpoints:

- Wishlist
- Goals
- Wallet
- Tasks
- Account
- Purchase history

---

17. Admin Access

Admin endpoints separate privileged authorization require karenge.

---

18. Seller Access

Seller APIs only authorized Store/Seller resources access karengi.

---

19. Service Boundaries

Major services:

Identity
Market
Search
Deals
Products
Merchants
Affiliate
Earn
Wallet
Commerce
Notifications
Campaigns
Analytics
Support
Trust
Payments
Content/PSEO
AI

---

20. Service Principle

Har service ka clear responsibility boundary hoga.

---

21. Identity Service

Responsible for:

- Users
- Sessions
- External identities
- Account linking
- Authentication

---

22. Market Service

Responsible for:

- Countries
- Markets
- Currency
- Language
- Timezone
- Market configuration

---

23. Product Service

Responsible for:

- Canonical products
- Product identifiers
- Variants
- Product metadata

---

24. Offer Service

Responsible for:

- Merchant offers
- Price
- Availability
- Market eligibility

---

25. Deal Service

Responsible for:

- Deals
- Discounts
- Coupons
- Deal lifecycle

---

26. Search Service

Responsible for:

- Full-text search
- Filters
- Autocomplete
- Ranking
- Search indexes

---

27. Merchant Service

Responsible for:

- Merchants
- Stores
- Seller applications
- Store status
- Store profiles

---

28. Affiliate Service

Responsible for:

- Affiliate networks
- Programs
- Affiliate links
- Redirects
- Click tracking
- Conversion attribution

---

29. Earn Service

Responsible for:

- Tasks
- Claims
- Submissions
- Reward calculations
- Task validation

---

30. Wallet Service

Responsible for:

- Reward balance
- Wallet transactions
- Goal allocations
- Reversals

---

31. Commerce Service

Responsible for:

- Purchase intents
- Carts
- Merchant checkout routing
- Orders where available
- Purchase events

---

32. Payment Service

Responsible for:

- Payment intents
- Payment providers
- Payment events
- Refunds
- Billing

---

33. Notification Service

Responsible for:

- Notification rules
- Scheduling
- Routing
- Delivery
- Suppression

---

34. Campaign Service

Responsible for:

- Campaigns
- Audiences
- Placements
- Campaign attribution

---

35. Analytics Service

Responsible for:

- Events
- Funnels
- Attribution
- Metrics

---

36. Support Service

Responsible for:

- Tickets
- Messages
- SLA
- Disputes

---

37. Trust Service

Responsible for:

- Reports
- Fraud signals
- Risk
- Moderation
- Appeals

---

38. Content Service

Responsible for:

- SEO content
- PSEO pages
- Localized content
- Metadata

---

39. AI Service

Responsible for:

- AI requests
- AI routing
- Search intelligence
- Recommendations
- Product matching
- AI support

AI remains subordinate to source-of-truth services.

---

40. Service Communication

Services may communicate through:

- Internal APIs
- Events
- Queues
- Database references

---

41. Synchronous Requests

Use synchronous API calls for:

- Search
- Product details
- Offer details
- User profile
- Wallet display

where appropriate.

---

42. Asynchronous Requests

Use queues for:

- Data imports
- Notifications
- Analytics processing
- Affiliate reconciliation
- Merchant feed processing
- AI batch jobs

---

43. Event Bus

Central event infrastructure may distribute:

Deal Created
Price Changed
Task Completed
Purchase Clicked
Conversion Received
Order Updated

---

44. Event Consumers

Multiple services may consume the same event.

Example:

Price Drop
 ↓
Notification
Analytics
Recommendation
Campaign

---

45. Idempotency

Mutating requests should support idempotency where duplicate execution could cause harm.

Examples:

- Payment
- Reward
- Purchase intent
- Seller registration
- Refund

---

46. Idempotency Key

Example:

Idempotency-Key

---

47. Request Validation

Gateway validates basic:

- Schema
- Content type
- Request size
- Required headers

Service validates business rules.

---

48. Response Format

Standard response:

{
  "success": true,
  "data": {},
  "meta": {},
  "request_id": "..."
}

---

49. Error Format

Standard error:

{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found"
  },
  "request_id": "..."
}

---

50. Error Codes

Use stable machine-readable error codes.

Examples:

- AUTH_REQUIRED
- FORBIDDEN
- NOT_FOUND
- VALIDATION_ERROR
- RATE_LIMITED
- SERVICE_UNAVAILABLE

---

51. Pagination

Large collections use pagination.

Possible methods:

- Cursor pagination
- Page/limit for simple cases

Cursor pagination preferred at scale.

---

52. Filtering

Filtering must be validated and bounded.

---

53. Sorting

Allowed sort fields must be whitelisted.

---

54. Search Queries

Search query length and complexity must be limited.

---

55. Rate Limiting

Limits apply by:

- IP
- User
- API key
- Endpoint
- Seller
- Merchant

where appropriate.

---

56. Burst Protection

Short traffic bursts may be absorbed through edge/cache/queues.

---

57. Abuse Protection

Protect against:

- Bots
- Scraping
- Credential attacks
- Click flooding
- Reward abuse
- API abuse

---

58. CORS

CORS allowlists approved GDN origins.

Arbitrary origins should not receive privileged access.

---

59. CSRF

State-changing browser requests use appropriate CSRF protection where cookie-based authentication requires it.

---

60. Authentication Headers

Token-based requests may use:

Authorization: Bearer <token>

---

61. Cookie Security

If cookies are used:

- Secure
- HttpOnly where appropriate
- SameSite

settings required.

---

62. Telegram Authentication

Telegram Mini App authentication is validated server-side.

Client-provided identity is not trusted without verification.

---

63. API Keys

Seller/integration API keys:

- Scoped
- Rotatable
- Revocable
- Audited

---

64. API Scopes

Examples:

products:read
offers:read
orders:read
orders:write
feeds:write
analytics:read

---

65. Least Privilege

Every API credential gets minimum required permissions.

---

66. Secrets

Secrets stored in approved secrets management systems.

Never commit secrets to GitHub.

---

67. Webhook Gateway

External webhooks enter through dedicated validated endpoints.

---

68. Webhook Verification

Verify:

- Signature
- Timestamp
- Provider
- Event ID

---

69. Replay Protection

Old/replayed webhook events should be rejected or safely deduplicated.

---

70. External API Protection

Third-party API calls use:

- Timeouts
- Retry policies
- Circuit breakers
- Rate limits

---

71. Circuit Breaker

If an external provider repeatedly fails:

Provider Failure
 ↓
Circuit Open
 ↓
Temporary Fallback
 ↓
Recovery Check
 ↓
Circuit Closed

---

72. Timeouts

Every external call must have a bounded timeout.

---

73. Retry

Retries only safe/idempotent operations unless explicit idempotency exists.

---

74. Service Discovery

At early stage, simple configuration may be sufficient.

Future architecture can use service discovery if needed.

---

75. Monolith First

Initial implementation may use a modular monolith.

This reduces unnecessary operational complexity.

---

76. Modular Boundaries

Even inside a monolith, modules maintain clear boundaries.

---

77. Future Microservices

High-scale modules can later become independent services.

Possible candidates:

- Search
- Affiliate
- Notifications
- Analytics
- AI
- Feed processing

---

78. Database Boundary

Services should access only required repositories/data interfaces.

---

79. Direct Database Access

Cross-module arbitrary SQL access should be avoided.

---

80. Transactions

Use database transactions for operations requiring atomicity.

---

81. Distributed Transactions

Avoid unnecessary distributed transactions.

Prefer:

- Events
- Idempotency
- Saga-like workflows
- Reconciliation

---

82. Cache Layer

Gateway/services may use centralized caching.

---

83. Cache-Aside

Typical pattern:

Request
 ↓
Cache?
 ├─ Yes → Return
 └─ No → Database → Cache → Return

---

84. Cache Invalidation

Invalidate when authoritative data changes.

---

85. Market-Aware Cache

Cache keys must include market where data differs by market.

---

86. Authentication Cache

Sensitive authentication state must not be incorrectly shared between users.

---

87. Search Integration

Gateway routes search requests to Search Service.

---

88. Recommendation Integration

Recommendation requests use Recommendation/AI services as appropriate.

---

89. Affiliate Redirect

Affiliate redirect may use specialized low-latency routing.

---

90. Redirect Reliability

Affiliate redirect failures should have direct merchant fallback where permitted.

---

91. Commerce Integration

Commerce requests:

Product
 ↓
Offer
 ↓
Purchase Intent
 ↓
Commerce
 ↓
Affiliate / Direct

---

92. Earn Integration

Earn requests:

Task
 ↓
Claim
 ↓
Submit
 ↓
Validation
 ↓
Reward Ledger

---

93. Wallet Integration

Wallet reads must come from central wallet authority.

---

94. Payment Integration

Payment requests route through central Payment Service.

---

95. Support Integration

Support tickets may reference:

- User
- Product
- Offer
- Order
- Task
- Reward
- Payment

---

96. Trust Integration

Risk events can be generated by any relevant service.

Trust Service centralizes evaluation.

---

97. Analytics Integration

Important service events should emit analytics events.

---

98. Event Schema

Events should include:

event_id
event_type
timestamp
source
user_id
session_id
market_id
entity_type
entity_id
metadata
version

---

99. Event Versioning

Events require versioning to support future consumers.

---

100. Event Ordering

Where ordering matters, partition events using appropriate entity keys.

---

101. Event Delivery

Event delivery should support:

- Retry
- DLQ
- Idempotency
- Monitoring

---

102. Queue Backpressure

When downstream services are overloaded:

- Queue
- Rate limit
- Defer
- Degrade

rather than crashing the whole platform.

---

103. Health Checks

Endpoints:

/health
/ready
/live

---

104. Readiness

Readiness should verify required dependencies before accepting traffic.

---

105. Liveness

Liveness should confirm the service process is functioning.

---

106. Dependency Health

Monitor:

- Database
- Cache
- Search
- Queue
- External APIs

---

107. Observability

Every request should be traceable across:

Client
 ↓
Gateway
 ↓
Service
 ↓
Database/Queue
 ↓
External Provider

---

108. Metrics

Track:

- Requests
- Latency
- Errors
- Throughput
- Cache hit rate
- Queue depth

---

109. Security Logs

Security events:

- Login failures
- Token abuse
- Permission failures
- Rate-limit violations
- Suspicious API activity

---

110. Audit Logs

Privileged actions must create immutable/auditable records.

---

111. Privacy

Logs must not unnecessarily contain:

- Passwords
- Payment secrets
- Access tokens
- Sensitive personal data

---

112. Data Masking

Sensitive fields should be masked/redacted in logs.

---

113. Request Size Limits

API gateway limits:

- Body size
- Query length
- Header size
- Upload size

---

114. File Upload Gateway

Large files should use controlled object-storage upload flows rather than passing large files through normal API routes where practical.

---

115. Upload Security

Validate:

- MIME type
- Extension
- Size
- Malware risk
- Authorization

---

116. API Documentation

Use machine-readable API documentation.

Potential standard:

OpenAPI

---

117. API Contract

Every endpoint should document:

- Request
- Response
- Authentication
- Errors
- Rate limits
- Examples

---

118. Contract Testing

Clients and services should validate API contracts automatically.

---

119. Backward Compatibility

Non-breaking changes preferred.

Examples:

- Adding optional response fields
- Adding optional request fields

---

120. Breaking Changes

Breaking changes require:

- New API version
- Migration plan
- Deprecation period

---

121. API Deprecation

Deprecated endpoints should return appropriate headers/metadata where supported.

---

122. Internal APIs

Internal APIs may have stricter access controls than public APIs.

---

123. Public APIs

Public APIs require:

- Authentication policy
- Rate limits
- Abuse controls
- Documentation

---

124. Admin APIs

Admin APIs require:

- Strong authentication
- RBAC
- MFA
- Audit logs
- Additional restrictions

---

125. Seller APIs

Seller APIs require store-scoped authorization.

---

126. Affiliate APIs

Affiliate APIs require restricted service credentials.

---

127. Payment APIs

Payment APIs require highest security controls.

---

128. Reward APIs

Reward APIs require idempotency and fraud controls.

---

129. Commerce APIs

Commerce APIs must prevent duplicate purchase intents and unsafe state transitions.

---

130. Service Failure Isolation

One service failure should not automatically bring down all GDN functionality.

---

131. Example Failure

If AI service fails:

AI Down
 ↓
Normal Search Continues
 ↓
Normal Deals Continue
 ↓
Normal Commerce Continues

---

132. Example Search Failure

If advanced search unavailable:

- Basic search fallback
- Cached results
- Category browsing

where practical.

---

133. Example Notification Failure

Notification failure must not block:

- Purchase
- Search
- Earn
- Wallet

---

134. Example Affiliate Failure

Affiliate provider failure may use:

- Another configured affiliate route
- Direct merchant route

where allowed.

---

135. Deployment

Gateway and services deploy through central CI/CD.

---

136. Configuration

Environment configuration includes:

- API URLs
- Database
- Cache
- Queue
- External providers
- Feature flags

---

137. Configuration Security

Secrets must never be stored in source code.

---

138. Scaling

Gateway should scale horizontally.

Stateless request handling preferred.

---

139. Global Edge

Cloudflare edge can provide:

- TLS
- CDN
- DDoS protection
- Rate limiting
- Routing
- Caching

---

140. Final Architecture

                         GDN CLIENTS
                              │
       ┌──────────┬───────────┼───────────┬──────────┐
       │          │           │           │          │
     Web/PWA   Telegram    Android       iOS       Future
                 Mini App
                              │
                       Cloudflare Edge
                              │
                         API Gateway
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                 Auth      Routing    Security
                    │         │         │
                    └─────────┼─────────┘
                              │
                    CENTRAL SERVICE LAYER
                              │
 ┌──────┬──────┬──────┬──────┼──────┬──────┬──────┐
 │      │      │      │      │      │      │      │
Identity Market Search Deals Affiliate Earn Commerce
 │      │      │      │      │      │      │
 └──────┴──────┴──────┴──────┼──────┴──────┴──────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       Database             Cache              Queues
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    Analytics / Monitoring

Core Principle

One API Gateway → Clear Service Boundaries → Central Data Authority → Secure Routing → Async Processing → Independent Scaling → Global GDN Platform
