GDN Database Implementation Architecture

1. Purpose

Define the implementation architecture for GDN's central database layer.

2. Database Principle

The database is the central source of truth for GDN business data.

3. Single Source of Truth

Products, offers, stores, deals, users, rewards, orders, payments and analytics must use centralized authoritative records.

4. Initial Database Strategy

Start with a modular relational database architecture.

5. Future Scaling

The architecture must support read replicas, partitioning, sharding and specialized databases when required.

6. Recommended Primary Database

Use PostgreSQL-compatible relational infrastructure.

7. Database Ownership

Each domain owns its tables, schemas and business rules.

8. Service Boundary

Application services access database data through controlled repositories/services.

9. Direct Database Access

Frontend clients must never access the production database directly.

10. API Boundary

Website, Telegram Mini App, mobile apps and external clients access data through the API Gateway.

---

11. Database Domains

Core domains include:

- Identity
- Users
- Markets
- Products
- Offers
- Deals
- Merchants
- Affiliate
- Search
- Earn
- Rewards
- Wallet
- Commerce
- Payments
- Notifications
- Campaigns
- Analytics
- Support
- Trust
- Content
- AI
- Administration

12. Schema Organization

Schemas may be organized by business domain as the system grows.

13. Initial Modular Structure

A modular monolith may use logical modules while sharing one database.

14. Future Service Extraction

Modules must be designed so they can later become independent services.

---

15. Primary Keys

Every major entity must have a globally unique primary identifier.

16. ID Strategy

Use UUID or equivalent globally unique identifiers.

17. Public IDs

Public-facing IDs should not expose sequential internal identifiers where enumeration could create risk.

18. External IDs

External merchant, affiliate and provider IDs must be stored separately from GDN IDs.

19. Natural Keys

Natural identifiers such as SKU, GTIN or email must not automatically replace internal primary keys.

---

20. Standard Timestamp Fields

Major tables should support:

- created_at
- updated_at

Where relevant:

- published_at
- starts_at
- expires_at
- deleted_at
- verified_at
- completed_at

21. Timezone

Store timestamps in UTC.

22. Local Time

Convert timestamps to the user's market timezone at presentation time.

23. Daylight Saving

Timezone-aware libraries must handle DST.

---

24. Soft Deletion

Entities requiring historical integrity may use soft deletion.

25. Hard Deletion

Hard deletion should be restricted to data where retention rules permit it.

26. Privacy Deletion

User deletion workflows must support anonymization or deletion according to applicable requirements.

---

27. Database Naming

Use predictable snake_case naming.

Examples:

user_id
merchant_id
product_id
created_at
updated_at

28. Table Naming

Use plural table names where the project convention supports them.

Examples:

users
products
offers
deals
merchants

29. Foreign Keys

Foreign-key columns should follow:

<entity>_id

---

30. Identity Tables

Core identity tables may include:

users
user_profiles
user_identities
user_sessions
user_devices
user_consents
user_preferences

31. Anonymous Users

Anonymous visitors may receive an anonymous identity identifier.

32. Account Linking

Multiple external identities may link to one GDN user.

33. Telegram Identity

Telegram identifiers must be stored through the identity layer.

34. Email Identity

Email authentication must use normalized email records.

35. Identity Security

Authentication secrets must never be stored in plaintext.

---

36. Market Tables

Core market tables:

markets
countries
regions
languages
currencies
timezones
market_languages
market_currencies

37. Market Authority

Market configuration determines country-specific availability and presentation.

38. Country

Country should have a stable internal ID and ISO-compatible code.

39. Currency

Currencies should use ISO-compatible codes.

40. Language

Languages should use standardized locale identifiers.

41. Market Status

Markets should support:

draft
active
paused
inactive

---

42. Product Tables

Core product tables:

products
product_variants
product_identifiers
product_images
product_attributes
product_categories
product_brands

43. Canonical Product

One canonical product may have many merchant offers.

44. Product Identifiers

Support identifiers such as:

GTIN
UPC
EAN
ISBN
MPN
SKU
model_number

45. Identifier Normalization

Identifiers must be normalized before matching.

46. Product Variants

Variants may include:

- size
- color
- capacity
- configuration
- edition
- pack size

47. Product Images

Images should reference object storage rather than storing large binary objects directly in relational tables.

---

48. Merchant Tables

Core merchant tables:

merchants
stores
merchant_users
merchant_applications
merchant_verifications
merchant_documents
merchant_markets

49. Merchant vs Store

Merchant represents the business entity.

Store represents a commercial storefront or sales destination.

50. Store ID

Every approved store receives a unique GDN Store ID.

51. Store Domain

Store domains must be normalized for verification and deduplication.

52. Store Status

Support:

pending
under_review
approved
suspended
rejected
inactive

---

53. Offer Tables

Core offer tables:

offers
offer_prices
offer_variants
offer_inventory
offer_shipping
offer_coupons

54. Offer Principle

An Offer represents a specific merchant/store listing of a canonical Product.

55. Price History

Important price changes should be historically tracked.

56. Currency

Original price currency must be preserved.

57. Converted Price

Converted display prices must not overwrite original financial data.

58. Stock

Inventory state should be represented independently from price.

59. Condition

Support:

new
used
refurbished
open_box
unknown

---

60. Deal Tables

Core deal tables:

deals
deal_prices
deal_conditions
deal_markets
deal_categories
deal_events

61. Deal Lifecycle

Support:

draft
pending_review
active
paused
expired
rejected
archived

62. Deal Start

Store explicit start time when available.

63. Deal Expiry

Store explicit expiry time when available.

64. Deal Verification

Deal quality and verification status must be stored separately from lifecycle status.

---

65. Affiliate Tables

Core affiliate tables:

affiliate_networks
affiliate_programs
affiliate_accounts
affiliate_links
affiliate_subids
affiliate_clicks
affiliate_conversions
affiliate_commissions
affiliate_reconciliations

66. Affiliate Authority

Affiliate link generation belongs to the central Affiliate Engine.

67. SubID Tracking

Channel, campaign, user and placement attribution may be represented through controlled SubIDs.

68. Conversion Records

Conversions must retain source and attribution information.

69. Commission State

Support:

estimated
pending
confirmed
reversed
cancelled

---

70. Search Data

Search may use a specialized search index in addition to PostgreSQL.

71. Database Authority

Search indexes are derived data.

72. Reindexing

Search indexes must be rebuildable from authoritative database records.

73. Search Documents

A search document may contain:

- product information
- offer information
- merchant
- market
- category
- price
- availability
- deal signals

---

74. Category Tables

Core tables:

categories
category_translations
category_relationships
category_markets

75. Hierarchy

Categories must support parent-child relationships.

76. Category Slugs

Slugs must be unique within the appropriate scope.

77. Category Mapping

External source categories must map to GDN canonical categories.

---

78. Brand Tables

Core tables:

brands
brand_aliases
brand_categories
brand_markets

79. Brand Normalization

Brand names must support aliases and normalized matching.

80. Brand Ownership

Brand records must not assume official ownership without verification.

---

81. Deal Source Tables

Core tables:

deal_sources
source_connectors
source_runs
source_records
source_errors

82. Raw Data

Raw external data should be preserved where useful for debugging and lineage.

83. Source Lineage

Every normalized record should be traceable to its source.

84. Source Freshness

Track last successful synchronization.

85. Connector Status

Connectors should support:

active
paused
failed
disabled

---

86. Feed Tables

Support:

merchant_feeds
feed_runs
feed_items
feed_errors
feed_mappings

87. Feed Formats

Support future:

CSV
XML
JSON
API
Shopify

88. Feed Versioning

Feed configurations should be versioned.

89. Feed Failure

Failed feeds must not automatically erase valid previous offers.

---

90. Earn Tables

Core tables:

tasks
task_categories
task_markets
task_eligibility
task_claims
task_submissions
task_reviews
task_rewards
task_events

91. Task IDs

Every task must have a unique identifier.

92. Task Status

Support:

draft
review
approved
scheduled
active
completed
expired
archived

93. Task Claims

Claims must prevent duplicate reservation.

94. Task Submissions

Submission records must preserve evidence and validation state.

---

95. Reward Tables

Core tables:

reward_ledger
reward_transactions
reward_reversals
reward_adjustments

96. Reward Authority

The reward ledger is the authoritative record of earned rewards.

97. Ledger Integrity

Reward transactions must be append-oriented and auditable.

98. Reward Status

Support:

pending
confirmed
reversed
cancelled

99. Idempotency

Reward creation must be idempotent.

---

100. Wallet Tables

Core tables:

wallets
wallet_transactions
wallet_balances
wallet_holds

101. Wallet Principle

Wallet balance must be derived from authoritative transactions or controlled balance projections.

102. Wallet Holds

Pending rewards may be held before confirmation.

103. Wallet Reconciliation

Balances should periodically reconcile against the transaction ledger.

---

104. Purchase Goal Tables

Core tables:

purchase_goals
goal_progress
wishlist_items
goal_events

105. Goal

A user can select a desired product or purchase target.

106. Progress

Progress should reference confirmed eligible rewards.

107. Wishlist

Wishlist items can be connected to products, offers or goals.

---

108. Commerce Tables

Core tables:

purchase_intents
carts
cart_items
commerce_orders
order_items
order_events
merchant_checkouts
merchant_order_refs
purchase_clicks
purchase_conversions

109. Affiliate Purchase

Affiliate purchases may not create a GDN-owned merchant order.

110. External Order

External merchant order references must be stored when available.

111. Seller Checkout

GDN seller marketplace purchases may use the central commerce architecture.

---

112. Payment Tables

Core tables:

payments
payment_intents
payment_events
refunds
payouts
settlements
invoices
subscriptions

113. Payment Provider

Provider-specific identifiers must remain separate from GDN financial identifiers.

114. Payment Status

Use explicit state machines.

115. Webhooks

Payment webhooks must be idempotent and verified.

---

116. Financial Ledger

Core financial records:

transactions
ledger_entries
financial_adjustments
reconciliation_records

117. Financial Integrity

Every financial movement must be traceable.

118. Currency Preservation

Store original currency and amount.

119. Decimal Precision

Financial amounts must use appropriate decimal/numeric database types.

120. Floating Point

Do not use binary floating-point types for financial balances.

---

121. Notification Tables

Core tables:

notifications
notification_preferences
notification_deliveries
notification_events
notification_suppressions

122. Notification Status

Track:

queued
sent
delivered
failed
cancelled

123. User Preference

Notification eligibility must respect user preferences and consent.

---

124. Campaign Tables

Core tables:

campaigns
campaign_audiences
campaign_markets
campaign_channels
campaign_variants
campaign_events

125. Campaign Lifecycle

Support:

draft
scheduled
active
paused
completed
cancelled

---

126. Analytics Tables

Core events may include:

events
sessions
page_views
search_events
click_events
conversion_events
revenue_events

127. Event Design

Events should use a consistent event envelope.

128. Event IDs

Every event requires a unique event ID.

129. Event Time

Store event occurrence time separately from ingestion time.

130. Analytics Separation

High-volume analytics workloads should eventually be separated from transactional workloads.

---

131. Support Tables

Core tables:

support_tickets
support_messages
support_categories
support_assignments
support_slas
support_attachments

132. Trust Tables

Core tables:

reports
cases
case_evidence
appeals
trust_scores
risk_events
risk_actions
moderation_events
incident_records

---

133. Content Tables

Core tables:

content_pages
content_blocks
content_versions
seo_metadata
localized_content

134. PSEO Records

PSEO pages must reference authoritative market/product/deal/merchant data.

135. Content Versioning

Published content should have version history.

---

136. AI Tables

Core tables:

ai_requests
ai_responses
ai_models
ai_model_versions
ai_prompts
ai_prompt_versions
ai_usage
ai_costs
ai_evaluations
ai_feedback
ai_embeddings
ai_risk_scores
ai_actions
ai_audit_logs

137. AI Authority

AI output must not overwrite authoritative financial, reward, price or affiliate records without controlled business logic.

---

138. Administrative Tables

Core tables:

admin_users
admin_roles
admin_permissions
admin_audit_logs
admin_actions

139. Audit Principle

Important administrative changes must be auditable.

---

140. Indexing Strategy

Indexes should be created based on real query patterns.

141. Primary Indexes

Primary keys automatically require appropriate indexes.

142. Foreign-Key Indexes

Frequently joined foreign keys should be indexed.

143. Composite Indexes

Use composite indexes for common multi-column filters.

Example:

market_id + status
merchant_id + status
product_id + market_id

144. Time Indexes

High-volume event tables should index relevant timestamps.

145. Partial Indexes

Use partial indexes where they materially improve active-record queries.

146. Index Discipline

Avoid unnecessary indexes because they increase write cost and storage.

---

147. Unique Constraints

Use database-level uniqueness wherever business rules require it.

Examples:

unique(store_domain)
unique(user_email)
unique(external_id, source_id)

148. Conditional Uniqueness

Use partial/conditional uniqueness when only active records need uniqueness.

---

149. Foreign Keys

Use foreign keys for critical relational integrity.

150. Delete Rules

Deletion behavior must be explicitly defined.

Possible rules:

RESTRICT
CASCADE
SET NULL

151. Historical Data

Historical financial and affiliate records should generally not be casually cascaded away.

---

152. Constraints

Business-critical constraints should exist at the database layer where practical.

Examples:

- non-negative balances where applicable
- valid status values
- required foreign keys
- unique identifiers
- valid timestamps
- valid currency codes

---

153. State Machines

Lifecycle fields must use controlled state transitions.

154. Invalid Transitions

Invalid state transitions must be rejected.

155. Transition History

Important state changes should generate events or audit records.

---

156. Transactions

Use database transactions for atomic multi-step operations.

157. Reward Transaction

Reward ledger creation and related wallet state changes must be consistent.

158. Payment Transaction

Payment state changes must be atomic with required financial records.

159. Order Transaction

Order creation must preserve item and purchase intent consistency.

---

160. Idempotency

Critical write operations must support idempotency.

Examples:

- payments
- rewards
- affiliate conversions
- webhook processing
- task submissions
- order events

161. Idempotency Keys

Store idempotency keys with appropriate uniqueness constraints.

---

162. Concurrency

Use database locking or optimistic concurrency where necessary.

163. Wallet Concurrency

Wallet operations must prevent double spending.

164. Task Claims

Task claim operations must prevent multiple users from consuming the same limited reservation.

165. Inventory

Inventory-sensitive seller operations require concurrency-safe updates.

---

166. Data Validation

Validate data at multiple layers:

Frontend
API
Business Logic
Database

167. Database Role

The database provides final structural integrity but should not contain all application business logic.

---

168. Migrations

All schema changes must use version-controlled migrations.

169. Migration Naming

Use sequential or timestamped migration identifiers.

Example:

20260917_create_users.sql
20260918_create_products.sql

170. Migration Testing

Migrations must be tested before production execution.

171. Rollback

Where feasible, migrations should have a safe rollback or forward-fix strategy.

172. Backward Compatibility

Deploy schema changes before application code that depends on them when required.

---

173. Seed Data

Maintain controlled seed data for:

- countries
- currencies
- languages
- timezones
- categories
- system roles
- initial configuration

174. Production Seeds

Production seed operations must be idempotent.

---

175. Environment Separation

Maintain separate databases for:

development
staging
production

176. Production Isolation

Development systems must never accidentally connect to production.

177. Credentials

Each environment uses separate credentials.

---

178. Connection Management

Use controlled connection pooling.

179. Serverless

For serverless environments, use a database access pattern compatible with serverless concurrency.

180. Connection Limits

Monitor database connection limits.

---

181. Query Optimization

Every frequently executed query should be measurable.

182. Slow Query Monitoring

Track slow queries.

183. Explain Plans

Use query execution plans to diagnose expensive queries.

184. N+1 Prevention

Application repositories must avoid N+1 query patterns.

---

185. Pagination

Use pagination for large datasets.

186. Cursor Pagination

Cursor-based pagination should be preferred for very large or frequently changing datasets.

187. Offset Pagination

Offset pagination may be used for small administrative datasets.

---

188. Data Partitioning

Partition high-volume tables when required.

Candidates may include:

events
affiliate_clicks
analytics_events
notification_deliveries
task_events
order_events

189. Partition Strategy

Time-based partitioning is a possible first strategy for high-volume event tables.

---

190. Read Replicas

Introduce read replicas when production read traffic justifies them.

191. Read/Write Separation

Transactional writes remain on the primary database.

192. Replica Lag

Applications must account for replication lag.

---

193. Caching

Frequently requested data may use Redis or equivalent caching.

194. Cacheable Data

Potential candidates:

- markets
- countries
- categories
- popular products
- active deals
- merchant summaries
- recommendation results

195. Cache Authority

Cache is never the source of truth.

---

196. Cache Invalidation

Updates to authoritative records should invalidate or refresh affected caches.

197. Market-Aware Cache

Market must be included in cache keys where relevant.

Example:

deals:US:electronics
deals:AE:electronics

---

198. Data Archiving

Old high-volume records may be archived.

199. Archive Policy

Archive policies must respect financial, legal, privacy and analytics requirements.

200. Cold Storage

Historical data may move to lower-cost storage where appropriate.

---

201. Backup Strategy

Database backups must support:

- full backups
- incremental backups
- point-in-time recovery where available

202. Backup Encryption

Backups must be encrypted.

203. Backup Testing

Restores must be tested periodically.

---

204. Disaster Recovery

Database recovery must support defined RPO and RTO targets.

205. Recovery Validation

After restoration, integrity checks must run before production traffic resumes.

---

206. Security

Database access must follow least privilege.

207. Database Roles

Potential roles:

application_read
application_write
migration
analytics_read
admin

208. Secrets

Database credentials must be stored in a secure secret-management system.

209. Encryption

Use encryption in transit and at rest.

210. Sensitive Data

Sensitive information must be minimized and protected.

---

211. Row-Level Security

Row-level security may be used where tenant or role isolation requires it.

212. Seller Isolation

Seller users must only access authorized seller records.

213. User Isolation

Users must only access their own private records.

---

214. Audit Logging

Audit important actions such as:

- admin changes
- merchant approval
- reward adjustment
- wallet adjustment
- payment adjustment
- affiliate changes
- security changes

215. Immutable Audit Principle

Audit history should be protected against unauthorized modification.

---

216. Personal Data

Separate personally identifiable information from operational data where practical.

217. Data Minimization

Do not store data without a defined purpose.

218. Anonymization

Analytics data should use anonymized or pseudonymous identifiers where practical.

---

219. Data Quality

Implement automated data-quality checks.

Checks may include:

- missing required fields
- invalid prices
- invalid currencies
- duplicate products
- duplicate stores
- expired offers
- impossible discounts
- broken relationships
- stale feeds

---

220. Product Deduplication

Product matching should use multiple signals:

- GTIN
- UPC
- EAN
- MPN
- brand
- model
- normalized title
- attributes
- images

221. Match Confidence

Store confidence where automated matching is uncertain.

---

222. Offer Deduplication

Avoid duplicate active offers from the same store and source.

223. Source Priority

Source priority rules may determine which record becomes authoritative when multiple sources conflict.

---

224. Price History

Store historical prices for price intelligence.

225. Price Snapshot

A snapshot may include:

product_id
offer_id
market_id
price
currency
captured_at
source_id

226. Price Change Events

Significant price changes may trigger notifications and analytics.

---

227. Exchange Rates

Exchange rates should be stored with:

base_currency
quote_currency
rate
source
captured_at

228. Historical Rates

Do not overwrite historical exchange rates used for financial reporting.

---

229. Search Synchronization

Database changes should generate search-index update events.

230. Eventual Consistency

Search results may temporarily lag transactional data.

231. Rebuild

Search indexes must support full rebuild.

---

232. Queue Integration

Database events may publish to queues for:

- search indexing
- notifications
- analytics
- affiliate processing
- feed processing
- PSEO
- recommendations

233. Outbox Pattern

Use an outbox pattern for critical database-to-event consistency where appropriate.

---

234. Event Outbox

Potential table:

outbox_events

Fields may include:

event_id
event_type
aggregate_type
aggregate_id
payload
created_at
published_at
retry_count
status

---

235. Dead-Letter Handling

Failed event processing must not silently disappear.

236. Retry State

Store retry metadata where required.

---

237. Database Observability

Monitor:

- CPU
- memory
- storage
- connections
- latency
- locks
- deadlocks
- slow queries
- replication lag
- backup status

---

238. Database Alerts

Critical alerts include:

- database unavailable
- storage near limit
- excessive connection usage
- replication failure
- backup failure
- abnormal query latency
- deadlock spikes

---

239. Scalability Stages

Stage 1

Single primary relational database.

Stage 2

Connection pooling + caching + query optimization.

Stage 3

Read replicas + partitioning.

Stage 4

Dedicated search and analytics systems.

Stage 5

Service/database separation where justified.

Stage 6

Multi-region architecture where justified.

---

240. Multi-Region Future

Future architecture may support regional database replicas.

241. Global Writes

Global write architecture must only be introduced when consistency requirements and traffic justify the complexity.

---

242. Database Cost Control

Optimize:

- indexes
- storage
- query frequency
- retention
- connection usage
- backups
- replicas
- archival

243. Cost Monitoring

Database costs must be monitored by environment and workload.

---

244. Testing

Database testing must include:

- schema tests
- migration tests
- constraint tests
- transaction tests
- repository tests
- integration tests
- performance tests
- recovery tests

245. Test Database

Automated tests should use isolated test databases.

---

246. Load Testing

Test realistic workloads for:

- product search
- deal listing
- offer comparison
- task claims
- wallet operations
- checkout
- affiliate redirects
- analytics events

---

247. Financial Testing

Test:

- duplicate payments
- duplicate rewards
- refunds
- reversals
- partial payments
- currency conversion
- reconciliation

---

248. Reward Testing

Test:

- duplicate claim
- duplicate submission
- reward approval
- reward reversal
- wallet credit
- wallet hold
- wallet reconciliation

---

249. Merchant Testing

Test:

- registration
- verification
- approval
- feed ingestion
- offer creation
- price updates
- suspension
- reactivation

---

250. Security Testing

Test:

- unauthorized access
- privilege escalation
- SQL injection
- broken access control
- credential leakage
- data exposure
- insecure queries

---

251. Data Migration

Large migrations must be planned.

252. Migration Safety

Use:

backup
migration
validation
monitoring
rollback/forward-fix

---

253. Data Import

External data imports must use staging tables where appropriate.

254. Import Flow

External Source
→ Raw/Staging
→ Validation
→ Normalization
→ Matching
→ Canonical Database
→ Search/Cache/Event Systems

---

255. Database API Repositories

Application modules should use repository/service abstractions.

Example:

ProductRepository
OfferRepository
DealRepository
MerchantRepository
TaskRepository
WalletRepository
OrderRepository
PaymentRepository

256. Repository Rule

Business modules should not scatter raw SQL throughout unrelated application code.

---

257. ORM Strategy

An ORM or query builder may be used for standard operations.

258. Raw SQL

Raw SQL may be used where performance or database-specific capabilities justify it.

259. SQL Review

Complex queries must be reviewed and tested.

---

260. Database Configuration

Configuration should support environment variables/secrets for:

DATABASE_URL
DATABASE_POOL_SIZE
DATABASE_TIMEOUT
DATABASE_SSL

261. Production Configuration

Production credentials must never be committed to GitHub.

---

262. Schema Documentation

Every major table should document:

- purpose
- primary key
- foreign keys
- important indexes
- lifecycle
- sensitive fields
- ownership
- retention

---

263. Data Dictionary

Maintain a centralized data dictionary for important entities and fields.

264. Canonical Definitions

The same field must have one canonical meaning across services.

Example:

market_id
product_id
merchant_id
offer_id
user_id

---

265. API/Database Contract

API schemas must map consistently to database models.

266. Database Independence

External API contracts should not expose internal implementation details unnecessarily.

---

267. Database Event Contract

Events must include:

event_id
event_type
version
aggregate_id
occurred_at
producer
payload

268. Event Versioning

Event contracts must support backward compatibility.

---

269. Transaction Boundaries

Transactions should remain short and focused.

270. External APIs

Do not hold database transactions open while waiting for external APIs.

---

271. External Provider Data

Provider-specific data should be stored in controlled integration tables or metadata structures.

272. Provider Failure

External provider failure must not corrupt canonical records.

---

273. Metadata

Flexible metadata may use JSON/JSONB where appropriate.

274. Metadata Rule

Do not use flexible metadata as a replacement for well-defined relational columns that are frequently queried.

---

275. Large Objects

Large images/videos/documents should use object storage.

276. Database References

Database stores metadata and object references.

---

277. Search Images

Product image references should support:

original
thumbnail
medium
large
optimized

---

278. Localization

Localized fields may use dedicated translation tables.

Example:

product_translations
category_translations
merchant_translations
content_translations

279. Fallback

Localization must follow the central locale fallback system.

---

280. Market-Specific Data

Market-specific records should reference:

market_id

where the information genuinely differs by market.

---

281. Market-Aware Offers

Offer availability may differ by:

- country
- currency
- shipping region
- inventory
- affiliate eligibility
- merchant availability

---

282. Affiliate Eligibility

Affiliate relationships may be market-specific.

283. Store Availability

A store can exist globally while only being active in selected markets.

---

284. Notification Data

Notification records must preserve enough context to explain why a notification was generated.

---

285. Campaign Attribution

Campaign events should link to:

campaign_id
channel_id
user_id
market_id
deal_id
product_id

where applicable.

---

286. Analytics Attribution

Analytics records should support:

user
session
channel
campaign
market
product
offer
merchant
affiliate

---

287. Privacy Retention

Retention periods must be configurable by data category.

288. Automatic Cleanup

Expired temporary data may be removed by scheduled jobs.

---

289. Fraud Data

Fraud/risk events should preserve evidence required for investigation while respecting privacy requirements.

---

290. Support Data

Support records should reference the relevant user, order, task, reward or merchant where applicable.

---

291. Audit Correlation

Important actions should include:

actor_id
actor_type
request_id
correlation_id
timestamp
action
target_type
target_id

---

292. Database Health Endpoint

Application infrastructure should expose database readiness status through:

/ready

293. Liveness

Database availability should not necessarily determine application liveness.

---

294. Graceful Degradation

If a non-critical database-dependent subsystem fails:

- core browsing may continue
- cached data may remain available
- analytics may queue
- notifications may retry
- recommendations may fall back

---

295. Critical Path Protection

Protect these operations with highest priority:

1. Authentication
2. Product/offer retrieval
3. Purchase routing
4. Payment state
5. Reward ledger
6. Wallet integrity
7. Affiliate attribution

---

296. Data Integrity Priority

Financial, reward, identity and affiliate records receive stronger integrity controls than temporary analytics data.

---

297. Database Governance

Database schema changes require controlled review.

298. Production Changes

Direct manual production schema changes should be minimized.

299. Emergency Changes

Emergency changes must be documented and reconciled into version-controlled migrations.

---

300. Master Database Architecture

The final database model follows:

                    GDN API Gateway
                           |
                    Application Services
                           |
        ┌──────────────────┴──────────────────┐
        |                                     |
 Transactional Database                Event / Queue Layer
        |                                     |
 ┌──────┼─────────────┐               ┌───────┼────────┐
 |      |             |               |       |        |
Users  Commerce     Products        Search  Analytics Notifications
 |      |             |               |       |        |
 |    Payments      Offers           Index   Warehouse Channels
 |      |             |
 |    Rewards       Deals
 |      |
Earn   Affiliate
 |
Tasks / Wallet / Goals
 |
Seller / Merchant

---

301. Final Authority Map

Identity → Database
Markets → Database
Products → Database
Offers → Database
Deals → Database
Merchants → Database
Affiliate Links → Affiliate Engine
Rewards → Reward Ledger
Wallet → Wallet System
Payments → Financial System
Orders → Commerce System
Search → Search Index derived from Database
Analytics → Analytics Platform derived from Events
AI → AI Layer using verified GDN data
Frontend → API only
Telegram → API only
Mobile → API only

---

302. Golden Rule

No frontend, channel, AI model or external integration may become a separate source of truth for core GDN business data.

---

303. Implementation Order

Database implementation should proceed in this order:

1. Database infrastructure
2. Environment configuration
3. Migration framework
4. Core extensions
5. Countries/markets/currencies
6. Identity/users
7. Merchants/stores
8. Categories/brands
9. Products
10. Offers
11. Deals
12. Affiliate
13. Earn/tasks
14. Rewards/wallet
15. Wishlist/goals
16. Commerce
17. Payments
18. Notifications
19. Campaigns
20. Analytics
21. Support/trust
22. Content/PSEO
23. AI
24. Audit/observability
25. Performance optimization

---

304. Production Readiness Checklist

Before production:

- [ ] Production database created
- [ ] Credentials secured
- [ ] SSL/TLS enabled
- [ ] Migration system active
- [ ] Backup configured
- [ ] Restore tested
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Connection limits reviewed
- [ ] Indexes reviewed
- [ ] Slow queries monitored
- [ ] RPO/RTO documented
- [ ] Access roles configured
- [ ] Audit logging active
- [ ] Sensitive data protected
- [ ] Retention policies configured
- [ ] Disaster recovery tested

---

305. Final Architecture Principle

One Central Database Authority → Modular Domain Schemas → Strong Data Integrity → Versioned Migrations → Secure Access → Event-Driven Extensions → Search/Analytics as Derived Systems → Global Scalability

GDN database architecture must remain centralized, modular, secure and scalable while allowing future separation of high-volume workloads and independent services.
