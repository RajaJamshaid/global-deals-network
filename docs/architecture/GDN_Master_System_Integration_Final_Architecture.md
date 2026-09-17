Global Deals Network — Master System Integration Final Architecture

1. Purpose

Yeh document tamam GDN technical architecture documents ko aik final integrated system mein connect karta hai.

GDN ka core principle:

One Central Platform → One Data Authority → One User Identity → One Market System → One Commerce System → Multiple Channels → Global Scale

---

2. Complete GDN Architecture

                    GLOBAL DEALS NETWORK
                           │
                           ▼
                    CLOUDFLARE EDGE
                           │
                           ▼
                    API GATEWAY
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Website/PWA     Telegram Mini App   Mobile Apps
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                  CENTRAL GDN API
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
 Identity               Market              Search
       │                   │                   │
       ▼                   ▼                   ▼
 Users              Country/Currency      Search Index
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                    CENTRAL DATABASE
                           │
     ┌───────────┬─────────┼─────────┬───────────┐
     ▼           ▼         ▼         ▼           ▼
 Products     Offers     Deals    Merchants    Users
     │           │         │         │           │
     └───────────┴─────────┼─────────┴───────────┘
                           │
                           ▼
                    BUSINESS ENGINES
                           │
 ┌────────┬────────┬────────┬────────┬────────┬────────┐
 ▼        ▼        ▼        ▼        ▼        ▼
Affiliate Commerce Earn   Payment Notification Campaign
 ▼        ▼        ▼        ▼        ▼        ▼
Revenue  Orders   Wallet  Ledger   Messages  Promotion

---

3. Single Source of Truth

GDN must maintain one central authority for each major domain.

Domain| Authority
User| Identity Engine
Country| Market Engine
Product| Product Database
Offer| Offer Database
Deal| Deal Engine
Merchant| Merchant Engine
Affiliate Link| Affiliate Engine
Reward| Reward Ledger
Wallet| Wallet Engine
Payment| Payment Engine
Order| Commerce Engine
Notification| Notification Engine
Campaign| Campaign Engine
Search| Search Infrastructure
Analytics| Analytics Engine
Content| Content/PSEO Engine
AI| AI Intelligence Layer
Support| Support Engine
Risk| Trust & Safety Engine

No frontend should create its own competing authority.

---

4. Channel Architecture

GDN channels are interfaces only.

                    CENTRAL GDN PLATFORM
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
      Website          Telegram            Mobile
        │               Bot/App             Apps
        ▼                  ▼                  ▼
                     Future Channels

Possible future channels:

- WhatsApp
- Email
- SMS
- TikTok
- YouTube
- Reddit
- X
- Browser notifications
- Other apps

All channels consume the same APIs.

---

5. Website

Website responsibilities:

- user interface
- search
- product discovery
- deal discovery
- PSEO
- merchant pages
- seller onboarding
- Earn interface
- wallet interface
- goals
- wishlist
- account

Website must not own:

- affiliate links
- user identity database
- reward ledger
- merchant database
- central deal database

---

6. Telegram Architecture

Telegram consists of:

Telegram Channel
       │
       ▼
Telegram Bot
       │
       ▼
Telegram Mini App
       │
       ▼
Central GDN API

Telegram is a distribution/interface layer.

---

7. Telegram Channel

Channel responsibilities:

- deal distribution
- campaigns
- announcements
- Earn promotion
- product discovery
- seller onboarding CTA
- Mini App deep links

Example:

🔥 Deal Alert

Product
Price
Discount

[View Deal]
[Open GDN Mini App]

---

8. Telegram Bot

Bot responsibilities:

- "/start"
- account linking
- Mini App launch
- notifications
- commands
- support
- deep links

Business logic remains in central GDN services.

---

9. Telegram Mini App

Primary sections:

Home
Deals
Search
Categories
Countries
Earn
Wallet
Goals
Wishlist
Profile

Future sections may include:

- Services
- Stores
- Orders
- Rewards
- AI Shopping Assistant

---

10. Active Market System

Every important request receives a market context.

User
↓
Country Detection
↓
Manual Override?
↓
Active Market
↓
Currency
Language
Timezone
Merchants
Offers
Shipping
Affiliate
Notifications
Campaigns
PSEO

---

11. Automatic Country Detection

Default:

Detect country automatically.

But:

User selection overrides automatic detection.

The selected country should be saved to the user's preferences where appropriate.

---

12. Product Architecture

Canonical Product:

Product
├── Brand
├── Model
├── SKU
├── GTIN
├── UPC
├── EAN
├── MPN
├── Images
└── Attributes

Product is independent from any individual store.

---

13. Offer Architecture

Canonical Product
       │
       ├── Amazon Offer
       ├── Walmart Offer
       ├── eBay Offer
       ├── Seller Offer
       └── Other Merchant Offers

Each Offer can contain:

- price
- currency
- availability
- condition
- shipping
- coupon
- market
- affiliate route
- direct route

---

14. Deal Architecture

Deal Engine evaluates:

- price change
- discount
- historical price
- coupon
- merchant
- availability
- freshness
- market

Only verified/qualified deals should be promoted.

---

15. Product Search & Comparison

User search:

Search Product
↓
Identify Product
↓
Find Offers
↓
Market Filter
↓
Price/Shipping/Coupon
↓
Effective Price
↓
Ranking
↓
Comparison

Lowest price alone should not always determine ranking.

---

16. Image Search

User may upload a product image.

Image
↓
Validation
↓
Image Processing
↓
Visual Matching
↓
Candidate Products
↓
Confidence
↓
Offers
↓
Comparison

Exact and similar matches must be clearly distinguished.

---

17. Affiliate Architecture

All affiliate activity passes through:

Central Affiliate Engine

Product
↓
Offer
↓
Merchant
↓
Affiliate Program
↓
Affiliate Engine
↓
Tracked Link
↓
Redirect
↓
Click
↓
Conversion
↓
Commission

No channel creates independent affiliate tracking logic.

---

18. Affiliate Fallback

If an affiliate link is unavailable:

Affiliate Link Available?
       │
    YES → Affiliate Route
       │
     NO
       ↓
Direct Merchant Route

The user may still discover the store/product.

---

19. Merchant Architecture

Merchant types may include:

- affiliate merchants
- marketplace sellers
- Shopify sellers
- direct stores
- service providers
- future local businesses

Merchant onboarding:

Add Your Store
↓
Application
↓
Registration Fee if applicable
↓
Automated Verification
↓
Admin Review
↓
Approval
↓
Store ID
↓
Feed/API
↓
Offers

---

20. Seller Marketplace

Approved sellers receive:

- Store ID
- store profile
- product feed capability
- analytics
- offer management
- market configuration
- verification status

Seller data enters the same canonical product/offer architecture.

---

21. Feed Architecture

Supported sources may include:

- Affiliate networks
- Merchant APIs
- Shopify
- CSV
- XML
- JSON
- Seller submissions
- Manual imports

All sources enter:

Connector Framework
↓
ETL
↓
Normalization
↓
Validation
↓
Matching
↓
Canonical Database

---

22. Search Infrastructure

Search index is derived.

Central Database
       ↓
Indexing Queue
       ↓
Search Infrastructure
       ↓
Search API

Search must never become the primary source of product truth.

---

23. User Identity

One GDN identity works across:

- Website
- Telegram
- Mini App
- Mobile apps
- Email
- Future channels

Example:

One User
├── Website Identity
├── Telegram Identity
├── Mobile Identity
└── Preferences

---

24. Anonymous Users

Anonymous users may use:

- search
- browsing
- product discovery
- market detection
- selected public features

Account creation can later migrate eligible anonymous data.

---

25. User Preferences

Central preferences may include:

- country
- language
- currency
- timezone
- categories
- brands
- merchants
- products
- price thresholds
- notification settings
- wishlist
- goals

---

26. Recommendation System

Recommendations combine:

User Preferences
+
Behavior
+
Market
+
Product
+
Offer
+
Deal Quality
+
Availability

AI may improve recommendations but does not become the source of truth.

---

27. Earn Engine

GDN Earn is a central platform capability.

Global Tasks
↓
Eligibility
↓
Claim
↓
Submission
↓
Validation
↓
Reward
↓
Reward Ledger
↓
Purchase Wallet

---

28. Task Types

Examples:

- Watch Video
- Research
- Testing
- Verification
- Data labeling
- Translation
- Fact checking
- Feedback
- Search evaluation
- Product research
- Data quality

---

29. Training Video Tasks

Where applicable:

Task
↓
Training Video
↓
Completion Validation
↓
Task
↓
Submission
↓
Review
↓
Reward

Training material should improve task quality rather than merely exist as an engagement mechanism.

---

30. Reward Economics

Reward configuration must consider:

- task value
- expected effort
- country
- difficulty
- quality
- fraud risk
- processing cost
- available task budget
- GDN revenue/value

The Reward Engine remains the authority for actual reward issuance.

---

31. Reward Ledger

Reward states:

Pending
↓
Validated
↓
Confirmed

Possible failure:

Pending
↓
Rejected

Fraud reversal:

Confirmed
↓
Reversed

---

32. Purchase Wallet

Wallet tracks eligible purchase rewards.

Earned Rewards
↓
Reward Ledger
↓
Purchase Wallet
↓
Goal
↓
Eligible Purchase

Telegram Stars and other platform-specific mechanisms must follow current platform rules and must not be assumed to have a universal fiat/cash-out equivalence.

---

33. Goals

User may create:

Goal
├── Product
├── Target Price
├── Current Progress
├── Reward Contribution
└── Status

Example:

Desired Product
Target: $100
Progress: $37
Remaining: $63

---

34. Wishlist

Wishlist connects:

Product
↓
Wishlist
↓
Price Watch
↓
Deal Alert
↓
Goal
↓
Purchase

---

35. Commerce Engine

Commerce architecture:

Product
↓
Offer
↓
Purchase Intent
↓
Purchase Router
↓
Affiliate / Direct / Seller Checkout
↓
Purchase Event
↓
Attribution

---

36. Cart

Cart may support:

- discovery cart
- eligible seller checkout
- future GDN-native commerce

Affiliate merchant purchases remain external unless the merchant integration supports direct checkout/order APIs.

---

37. Payment Architecture

Payment Engine handles:

- seller fees
- subscriptions
- sponsored campaigns
- premium services
- task sponsorship
- future commerce payments

All financial activity passes through the central financial architecture.

---

38. Financial Ledger

Every financial movement must be traceable.

Payment
↓
Transaction
↓
Ledger Entry
↓
Reconciliation
↓
Financial Reporting

---

39. Notification Engine

Notification sources include:

- new deal
- price drop
- back in stock
- coupon
- ending soon
- wishlist
- goal
- task
- reward
- campaign
- merchant
- system

---

40. Notification Routing

Event
↓
Market Validation
↓
User Preferences
↓
Consent
↓
Frequency Rules
↓
Channel Selection
↓
Notification

---

41. Campaign Engine

Campaign Engine controls:

- what is promoted
- where
- when
- to whom
- budget
- creative
- attribution

Notification Engine controls delivery mechanics.

---

42. PSEO Architecture

PSEO generates pages from verified GDN data.

Possible pages:

- country
- category
- merchant
- product
- brand
- deal
- coupon
- discount
- price comparison
- price drop
- market
- search intent

---

43. PSEO Rule

No page should be created solely to increase page count.

Page must provide useful, data-backed information.

---

44. Content Authority

Content may use:

- canonical product data
- offer data
- deal data
- merchant data
- market data
- verified analytics
- approved AI-generated copy

AI cannot invent commercial facts.

---

45. AI Architecture

AI is an intelligence layer.

GDN Data
↓
Central APIs
↓
AI Intelligence
↓
Verified Output
↓
GDN Business Engine

AI must not bypass:

- database authority
- business rules
- security
- financial controls
- reward controls
- affiliate engine

---

46. AI Use Cases

AI may support:

- natural language search
- product matching
- image search
- recommendations
- deal intelligence
- price intelligence
- translation
- PSEO
- merchant verification
- fraud detection
- support
- analytics
- task recommendations

---

47. AI Guardrails

AI cannot independently:

- issue rewards
- modify wallet balances
- create unauthorized affiliate links
- approve financial transactions
- bypass market restrictions
- bypass security
- invent product data
- invent prices
- invent discounts
- invent availability

---

48. Support System

Central support handles:

- account issues
- purchase issues
- affiliate issues
- merchant complaints
- seller disputes
- reward disputes
- payment disputes
- task disputes

---

49. Trust & Safety

Trust layer protects:

- users
- merchants
- sellers
- affiliates
- tasks
- rewards
- payments
- platform

---

50. Fraud Architecture

Potential signals:

- multi-account activity
- abnormal task behavior
- automated activity
- reward abuse
- affiliate abuse
- payment abuse
- merchant abuse

High-risk actions may require human review.

---

51. Queue Architecture

Long-running work uses:

Service
↓
Event / Job
↓
Queue
↓
Worker
↓
Database / External Service

Examples:

- feed processing
- search indexing
- notifications
- analytics
- PSEO
- AI
- reward validation
- reconciliation

---

52. Event Architecture

Important state changes generate events.

Example:

OfferUpdated
├── Search
├── Deal Engine
├── Recommendation
├── Notification
└── Analytics

---

53. Outbox Pattern

Critical events should use transactional outbox patterns.

DB Transaction
├── Business Change
└── Outbox Event
        ↓
Queue
        ↓
Consumers

---

54. Database Architecture

Primary database:

PostgreSQL-compatible relational architecture

Logical domains include:

identity
market
catalog
merchant
offer
deal
affiliate
earn
wallet
commerce
payment
financial
notification
campaign
analytics
support
trust
content
ai
admin

---

55. Search Database

Search infrastructure is derived from the central database.

It may use:

- OpenSearch
- Elasticsearch
- Typesense
- Meilisearch
- managed search services

Provider abstraction should prevent unnecessary lock-in.

---

56. Cache Architecture

Cache layers may include:

- Cloudflare edge cache
- API cache
- database query cache
- search cache
- recommendation cache
- image CDN cache

Cache invalidation must follow canonical data changes.

---

57. Object Storage

Object storage may contain:

- product images
- seller images
- uploaded search images
- documents
- media
- generated assets

Access must be controlled.

---

58. Cloud Architecture

Primary infrastructure can use:

Cloudflare
├── DNS
├── CDN
├── Pages
├── Workers
├── Queues
├── Object Storage
└── Edge Security

Additional managed infrastructure may be added when scale requires it.

---

59. Infrastructure Principle

Start simple.

Then scale according to:

- traffic
- database size
- queue depth
- search volume
- revenue
- reliability requirements

Do not introduce unnecessary complexity too early.

---

60. Deployment Architecture

GitHub
↓
CI
↓
Tests
↓
Staging
↓
QA
↓
Production
↓
Monitoring

---

61. Environment Architecture

Maintain:

development
staging
production

Secrets and databases must remain environment-specific.

---

62. Security Architecture

Security layers:

Cloudflare
↓
API Gateway
↓
Authentication
↓
Authorization
↓
Validation
↓
Business Rules
↓
Database

---

63. RBAC

Roles may include:

- User
- Seller
- Merchant
- Support Agent
- Moderator
- Analyst
- Content Manager
- Finance
- Admin
- Super Admin

Permissions must follow least privilege.

---

64. Audit Architecture

Sensitive actions require audit logs.

Examples:

- admin login
- merchant approval
- reward adjustment
- wallet adjustment
- financial adjustment
- seller suspension
- trust action
- data export

---

65. Privacy Architecture

GDN should follow:

Collect Less → Protect More → Explain Clearly → Give Control → Retain Responsibly

---

66. Analytics Architecture

Central analytics tracks:

- users
- sessions
- searches
- products
- offers
- clicks
- affiliate conversions
- revenue
- tasks
- rewards
- wallet
- purchases
- campaigns
- notifications

---

67. Attribution

Attribution connects:

User
↓
Channel
↓
Campaign
↓
Product
↓
Offer
↓
Affiliate Click
↓
Conversion
↓
Revenue

---

68. Observability

Monitor:

- API
- database
- search
- queues
- workers
- affiliate
- payments
- rewards
- notifications
- Telegram
- feeds
- PSEO
- AI

---

69. Disaster Recovery

Critical systems require:

- backups
- restore testing
- recovery runbooks
- RPO/RTO
- event replay
- database recovery
- configuration recovery

---

70. Backup Architecture

Backups should cover:

- database
- object storage
- configuration
- infrastructure definitions
- critical event records

---

71. Business Continuity

If a non-critical component fails:

AI Down
→ Core Search Continues

Analytics Down
→ Commerce Continues

PSEO Worker Down
→ Existing Pages Continue

Notification Failure
→ Core Deals Continue

---

72. Performance Architecture

Performance strategy:

Cache → Optimize → Async → Scale Horizontally → Isolate Failures

---

73. Scalability

Architecture should support growth from:

1K Users
↓
10K
↓
100K
↓
1M+
↓
Global Scale

Without redesigning the entire platform.

---

74. Multi-Market Expansion

Initial market may be:

USA

Then progressively:

UK
Canada
Germany
Japan
Middle East
Southeast Asia
Other Markets

Market activation must be configuration-driven wherever possible.

---

75. Affiliate Expansion

Affiliate infrastructure should support multiple networks/programs.

Potential integrations:

- Amazon
- Walmart
- eBay
- Impact
- CJ
- Awin
- Rakuten Advertising
- TradeTracker
- A8.net
- ValueCommerce
- other regional networks

Actual availability and program terms must be validated before activation.

---

76. Merchant Expansion

GDN may support:

Global Merchants
+
Regional Merchants
+
Verified Sellers
+
Service Providers

All must enter the same merchant architecture.

---

77. Global Services Vision

GDN may eventually expand beyond physical products into:

- services
- real estate
- vehicles
- food
- travel
- digital products
- tools
- local businesses

These categories should use the same central identity, market, search, commerce, analytics and trust foundations while allowing category-specific schemas.

---

78. Category Architecture

Every vertical should have:

Category
↓
Subcategory
↓
Entity
↓
Offer / Service
↓
Market
↓
Merchant

Category-specific logic should remain modular.

---

79. Central API

All clients communicate through:

/api/v1/

Major service groups:

/auth
/users
/markets
/products
/offers
/deals
/search
/merchants
/affiliate
/earn
/wallet
/goals
/wishlist
/commerce
/payments
/notifications
/campaigns
/analytics
/support
/trust
/content
/ai
/admin

---

80. API Gateway

Gateway handles:

- authentication
- authorization
- routing
- validation
- rate limits
- CORS
- request IDs
- logging
- API versioning

Business logic stays inside domain services.

---

81. Frontend Authority

Frontend should never independently calculate authoritative:

- wallet balance
- reward balance
- financial balance
- affiliate commission
- merchant approval
- product identity
- offer validity

Frontend displays backend authority.

---

82. Financial Authority

Financial truth:

Payment Engine
+
Financial Ledger

No UI, AI or background worker can independently override financial truth.

---

83. Reward Authority

Reward truth:

Task Validation
↓
Reward Ledger
↓
Wallet

---

84. Affiliate Authority

Affiliate truth:

Affiliate Engine

All tracked affiliate links originate here.

---

85. Market Authority

Market truth:

Market Engine

All country-aware systems consume the same market context.

---

86. Product Authority

Product truth:

Canonical Product Database

Search and AI are consumers of product truth.

---

87. Offer Authority

Offer truth:

Offer Database

Search ranking may change presentation but cannot invent an offer.

---

88. Event Authority

Important state changes must be represented as versioned events.

---

89. Data Flow — Deal

Merchant / Affiliate Feed
↓
Connector
↓
ETL
↓
Validation
↓
Product Matching
↓
Offer
↓
Deal Detection
↓
Database
↓
Search
↓
Recommendation
↓
Notification
↓
Telegram / Website / App

---

90. Data Flow — User Purchase

User
↓
Identity
↓
Active Market
↓
Search
↓
Product
↓
Offers
↓
Comparison
↓
Purchase Intent
↓
Affiliate / Direct / Seller Route
↓
Purchase Event
↓
Attribution
↓
Revenue

---

91. Data Flow — Earn to Purchase

User
↓
Goal
↓
Task Discovery
↓
Task Claim
↓
Training / Task
↓
Submission
↓
Validation
↓
Reward
↓
Wallet
↓
Goal Progress
↓
Product Search
↓
Offer Comparison
↓
Purchase

---

92. Data Flow — Seller

Seller
↓
Add Your Store
↓
Application
↓
Payment
↓
Verification
↓
Admin Review
↓
Store ID
↓
Feed/API
↓
Products
↓
Offers
↓
Search
↓
Deals
↓
Users
↓
Analytics

---

93. Data Flow — Notification

Event
↓
Notification Engine
↓
Market
↓
Eligibility
↓
Consent
↓
Preferences
↓
Frequency
↓
Channel
↓
Message
↓
Delivery
↓
Analytics

---

94. Data Flow — PSEO

Canonical Data
↓
Page Eligibility
↓
Template
↓
Localized Content
↓
SEO Metadata
↓
Structured Data
↓
Page
↓
Sitemap
↓
Search Engine
↓
Organic User
↓
GDN Search/Commerce

---

95. Data Flow — AI

User Request
↓
API
↓
Relevant GDN Data
↓
AI
↓
Confidence / Guardrails
↓
Verified Output
↓
Business Engine
↓
User

---

96. Data Flow — Support

User
↓
Support
↓
Identity / Context
↓
Knowledge / Automation
↓
Human Escalation if Needed
↓
Resolution
↓
Feedback
↓
Analytics

---

97. Data Flow — Trust

Event
↓
Risk Signals
↓
Rules / Models
↓
Risk Score
↓
Action
↓
Human Review if Required
↓
Appeal
↓
Final Decision

---

98. Queue Architecture

Central queues connect asynchronous systems.

API
Services
Schedulers
Webhooks
      ↓
   QUEUES
      ↓
 Workers
      ↓
Database / Services

---

99. Testing Architecture

Every major flow must have:

- unit tests
- integration tests
- API tests
- E2E tests
- security tests
- performance tests
- regression tests

Critical financial/reward flows require additional integrity tests.

---

100. Deployment Architecture

GitHub
↓
CI
↓
Automated Tests
↓
Security
↓
Build
↓
Staging
↓
QA
↓
Production
↓
Smoke Tests
↓
Monitoring

---

101. Repository Architecture

Recommended high-level structure:

global-deals-network/
├── src/
│   ├── api/
│   ├── identity/
│   ├── market/
│   ├── catalog/
│   ├── offers/
│   ├── deals/
│   ├── merchants/
│   ├── affiliate/
│   ├── search/
│   ├── earn/
│   ├── wallet/
│   ├── commerce/
│   ├── payments/
│   ├── notifications/
│   ├── campaigns/
│   ├── analytics/
│   ├── support/
│   ├── trust/
│   ├── content/
│   ├── ai/
│   ├── jobs/
│   └── shared/
│
├── database/
├── tests/
├── scripts/
├── deploy/
├── docs/
├── public/
└── .github/

---

102. Architecture Documentation

The architecture documents should remain version-controlled.

docs/
└── architecture/

Every major architecture change should update the relevant document.

---

103. Configuration

Business configuration should be centralized where practical.

Examples:

- markets
- currencies
- reward rules
- task limits
- notification limits
- affiliate settings
- campaign settings
- feature flags

---

104. Feature Flags

Feature flags support:

- gradual rollout
- country rollout
- beta testing
- A/B testing
- emergency disabling

---

105. Cost Architecture

Control costs through:

- CDN caching
- database optimization
- queue batching
- search optimization
- AI routing
- image optimization
- autoscaling
- log retention
- provider quotas

---

106. Vendor Abstraction

Important external dependencies should use adapter interfaces.

Examples:

AffiliateProvider
PaymentProvider
SearchProvider
AIProvider
NotificationProvider
StorageProvider

This allows future provider replacement.

---

107. No Vendor Lock-In

Business logic should not depend directly on a single external provider whenever practical.

---

108. Observability Rule

Every critical service must provide:

- health
- metrics
- logs
- traces
- alerts

---

109. Error Handling

Errors should be:

- structured
- traceable
- safe
- user-friendly
- logged
- correlated

Sensitive internal information must not be exposed to users.

---

110. Correlation IDs

Requests and asynchronous jobs should carry correlation IDs.

User Request
↓
API
↓
Event
↓
Queue
↓
Worker
↓
Database

The complete journey should remain traceable.

---

111. Idempotency Rule

All operations with financial, reward, affiliate, commerce or externally visible consequences must implement idempotency.

---

112. Graceful Degradation

When optional services fail, GDN should continue providing core functionality wherever possible.

---

113. Security Rule

Security must be built into every layer rather than added after development.

---

114. Privacy Rule

Only data required for a defined purpose should be collected and retained.

---

115. AI Rule

Database = Truth

Business Rules = Authority

AI = Intelligence

Human/Admin = Oversight

---

116. Channel Rule

Channels distribute and present GDN capabilities.

They do not create parallel systems.

---

117. Affiliate Rule

One Affiliate Engine.

No channel-specific affiliate implementation.

---

118. Identity Rule

One GDN User Identity.

No independent identity databases per channel.

---

119. Market Rule

One Active Market System.

Country, currency, language, timezone and merchant availability must derive from central market configuration.

---

120. Commerce Rule

One Central Commerce Architecture.

All purchase paths must eventually feed central purchase attribution and analytics.

---

121. Reward Rule

One Reward Ledger + One Purchase Wallet.

Telegram or other channels cannot maintain separate balances.

---

122. Seller Rule

One Merchant/Store Architecture.

All approved sellers become part of the same merchant ecosystem.

---

123. Data Rule

One Canonical Product + One Offer Model.

Different sources must be normalized into the same structure.

---

124. Search Rule

Search is Derived Infrastructure.

The central database remains authoritative.

---

125. Analytics Rule

Track Once Centrally, Analyze Everywhere.

---

126. Notification Rule

One Notification Engine.

Channels are delivery endpoints.

---

127. Campaign Rule

One Campaign Engine.

Campaigns must not be duplicated independently across channels.

---

128. Support Rule

One Support + Trust + Safety Layer.

Users and sellers receive consistent handling across channels.

---

129. Infrastructure Rule

Start with a modular architecture.

Move to independent services only when scale, reliability or organizational requirements justify it.

---

130. Global Expansion Rule

New country launch should primarily require configuration, data/connectors, localization and QA rather than rebuilding the platform.

---

131. New Channel Rule

Adding a new channel should follow:

New Channel
↓
Authenticate User
↓
Connect Central Identity
↓
Consume Central APIs
↓
Use Central Market
↓
Use Central Search
↓
Use Central Commerce
↓
Use Central Affiliate
↓
Use Central Analytics

---

132. New Merchant Rule

Merchant
↓
Verification
↓
Merchant ID
↓
Connector
↓
Canonical Products
↓
Offers
↓
Market
↓
Search
↓
Commerce

---

133. New Affiliate Network Rule

Affiliate Network
↓
Provider Adapter
↓
Program
↓
Merchant
↓
Link Generation
↓
Tracking
↓
Conversion
↓
Reconciliation

---

134. New Task Type Rule

Task Definition
↓
Eligibility
↓
Budget
↓
Claim
↓
Submission
↓
Validation
↓
Reward
↓
Analytics

---

135. New AI Feature Rule

Use Case
↓
Required GDN Data
↓
AI Processing
↓
Guardrails
↓
Confidence
↓
Human Review if Required
↓
Existing Business Engine

---

136. New Country Rule

Country Configuration
↓
Market
↓
Currency
↓
Language
↓
Timezone
↓
Merchants
↓
Affiliate Programs
↓
Offers
↓
Notifications
↓
PSEO
↓
QA
↓
Activation

---

137. Final Master Dependency Map

                    USER
                      │
                      ▼
                  IDENTITY
                      │
                      ▼
                   MARKET
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
      SEARCH       PRODUCTS       DEALS
        │             │             │
        └─────────────┼─────────────┘
                      ▼
                    OFFERS
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      MERCHANT     AFFILIATE    COMMERCE
          │           │           │
          └───────────┼───────────┘
                      ▼
                  PURCHASE
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       PAYMENT     ANALYTICS   NOTIFICATION
          │
          ▼
      FINANCIAL
       LEDGER


                    USER
                      │
                      ▼
                    EARN
                      │
                      ▼
                    TASK
                      │
                      ▼
                  VALIDATION
                      │
                      ▼
                    REWARD
                      │
                      ▼
                   WALLET
                      │
                      ▼
                     GOAL
                      │
                      ▼
                   PURCHASE

---

138. Complete Platform Map

                         GDN
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
     CHANNELS           ENGINES           DATA
        │                 │                 │
 Website/PWA          Identity          PostgreSQL
 Telegram             Market            Search
 Mobile               Search            Cache
 Email                Product           Object Storage
 WhatsApp             Offer             Analytics
 Social               Deal
                      Merchant
                      Affiliate
                      Earn
                      Wallet
                      Commerce
                      Payment
                      Financial
                      Notification
                      Campaign
                      Support
                      Trust
                      Content
                      AI
                          │
                          ▼
                    QUEUES/WORKERS
                          │
                          ▼
                     INFRASTRUCTURE
                          │
                          ▼
                       CLOUD

---

139. GDN Final System Principle

GDN should not be built as separate websites, bots, apps and affiliate systems.

It should be built as:

One Global Commerce Platform with Multiple Interfaces.

---

140. Final Architecture Statement

ONE CENTRAL GDN PLATFORM

        ↓

ONE USER IDENTITY
ONE MARKET SYSTEM
ONE PRODUCT DATABASE
ONE OFFER DATABASE
ONE DEAL ENGINE
ONE MERCHANT SYSTEM
ONE SEARCH SYSTEM
ONE AFFILIATE ENGINE
ONE EARN ENGINE
ONE REWARD LEDGER
ONE PURCHASE WALLET
ONE COMMERCE ENGINE
ONE PAYMENT ENGINE
ONE FINANCIAL LEDGER
ONE NOTIFICATION ENGINE
ONE CAMPAIGN ENGINE
ONE ANALYTICS SYSTEM
ONE SUPPORT SYSTEM
ONE TRUST & SAFETY SYSTEM
ONE CONTENT/PSEO SYSTEM
ONE AI INTELLIGENCE LAYER
ONE QUEUE/WORKER SYSTEM
ONE SECURITY ARCHITECTURE
ONE QA ARCHITECTURE

        ↓

MULTIPLE CHANNELS

Website
Telegram
Mini App
Mobile Apps
Email
WhatsApp
Social
Future Channels

        ↓

GLOBAL MARKETS

        ↓

GLOBAL USERS

        ↓

GLOBAL COMMERCE

---

141. Final GDN Architecture Principle

One Core → One Source of Truth → One Identity → One Market → One Data Layer → One Commerce Layer → One Affiliate Layer → One Earn & Reward Layer → One Financial Layer → One Analytics Layer → Multiple Distribution Channels → Global Scale.

GDN ka technical foundation isi principle ke around implement kiya jayega.
