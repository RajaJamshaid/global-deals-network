GDN Data ETL & Merchant Feed Connector Architecture

1. Purpose

Define GDN's centralized architecture for collecting, importing, validating, normalizing, matching and updating product, offer, merchant and deal data from multiple sources.

2. Core Principle

Many Sources → One Data Pipeline → One Canonical GDN Database → Many Channels

3. Source of Truth

External sources provide data; GDN's canonical database remains the internal source of truth.

4. Connector Principle

Every external data source must connect through a controlled connector architecture.

5. No Channel-Specific Feeds

Website, Telegram, Mini App and mobile apps must not maintain separate merchant feeds.

---

6. Supported Data Sources

Potential sources include:

- Affiliate networks
- Merchant APIs
- Merchant feeds
- Shopify stores
- CSV feeds
- XML feeds
- JSON feeds
- Direct APIs
- Approved seller submissions
- Manual admin imports
- Future marketplace integrations

7. Source Registry

Maintain a central source registry.

data_sources
source_connectors
source_credentials
source_configurations

8. Source Types

Each source must identify its type.

Example:

affiliate_network
merchant_api
merchant_feed
shopify
manual
seller

---

9. Connector Architecture

External Source
      ↓
Connector
      ↓
Raw/Staging Data
      ↓
Validation
      ↓
Normalization
      ↓
Entity Matching
      ↓
Canonical Database
      ↓
Search / Affiliate / Analytics / PSEO / Channels

10. Connector Abstraction

All connectors should implement a common interface.

11. Connector Responsibilities

A connector may:

- authenticate
- fetch data
- paginate
- parse
- validate
- transform
- report errors
- provide source metadata

12. Business Logic Boundary

Connectors should not directly implement core GDN business decisions.

---

13. Connector Registry

Maintain:

connector_id
source_id
connector_type
status
version
configuration
last_run_at
last_success_at

14. Connector Status

Support:

draft
active
paused
failed
disabled

15. Connector Version

Every connector should have a version.

---

16. Authentication

Supported methods may include:

- API key
- OAuth
- Basic authentication where required
- signed requests
- token authentication
- Shopify authentication
- secure file access

17. Credential Security

Credentials must never be stored in source code or GitHub.

18. Secret Storage

Use centralized secret management.

19. Credential Rotation

Connector credentials must support rotation without code changes.

---

20. Feed Types

Support:

CSV
XML
JSON
REST API
GraphQL
Shopify
Affiliate API
Affiliate feed

21. File Sources

File feeds may be retrieved through:

- HTTPS
- SFTP
- approved cloud storage
- secure upload

---

22. Feed Configuration

Each feed should support:

source_id
feed_url
format
schedule
timezone
authentication
mapping_version
status

23. Schedule

Feeds may run:

- hourly
- every few hours
- daily
- weekly
- on-demand

24. Manual Sync

Admins may trigger controlled manual synchronization.

---

25. Feed Runs

Every synchronization creates a feed run.

feed_runs

Fields may include:

run_id
feed_id
started_at
completed_at
status
records_received
records_processed
records_created
records_updated
records_rejected
error_count

---

26. Raw Data Layer

Raw external records should be preserved when useful.

27. Raw Data Purpose

Raw data supports:

- debugging
- replay
- audits
- connector development
- mapping changes
- reconciliation

28. Raw Data Storage

Large raw payloads may use object storage.

29. Sensitive Data

Raw data must not unnecessarily retain sensitive credentials or personal information.

---

30. Staging Layer

External records should pass through staging where appropriate.

raw
→ staging
→ validation
→ normalization

31. Staging Isolation

Invalid external records must not directly corrupt canonical tables.

---

32. Schema Mapping

Each connector requires a mapping configuration.

Example:

source.title → product.title
source.price → offer.price
source.brand → brand.name
source.sku → product_identifier

33. Mapping Version

Mappings must be version-controlled.

34. Mapping Validation

Changes to mappings must be tested before production.

---

35. Required Fields

Required fields vary by entity.

For offers, typical requirements include:

- merchant/store
- product identification
- price
- currency
- destination URL
- market or availability context

36. Optional Fields

Optional fields may include:

- images
- descriptions
- ratings
- shipping
- inventory
- coupons

---

37. Validation

Validation should occur at multiple stages.

Format Validation
→ Schema Validation
→ Business Validation
→ Entity Validation
→ Market Validation

38. Format Validation

Check whether the input is structurally valid.

39. Schema Validation

Check required fields and data types.

40. Business Validation

Check business rules such as valid prices.

---

41. Price Validation

Reject or flag:

- negative prices
- impossible currency values
- malformed numbers
- missing currency
- invalid discount calculations

42. Discount Validation

Verify:

original_price
sale_price
discount_percentage

are mathematically consistent where possible.

43. Fake Discount Protection

Historical pricing should be used where available to identify suspicious discount claims.

---

44. Currency Normalization

Preserve:

original_amount
original_currency

45. Converted Currency

Converted values are derived fields.

46. Exchange Rates

Use the central exchange-rate system.

---

47. Market Validation

Validate:

- country
- shipping availability
- store market
- affiliate program
- currency
- local inventory
- merchant eligibility

48. Market Mapping

External country codes must map to canonical GDN markets.

---

49. Product Normalization

Normalize:

- title
- brand
- model
- identifiers
- attributes
- units
- variants

50. Text Normalization

Apply controlled normalization without destroying useful product information.

---

51. Identifier Normalization

Normalize:

- GTIN
- UPC
- EAN
- ISBN
- MPN
- SKU
- model number

52. Identifier Priority

Reliable global identifiers receive higher matching confidence.

---

53. Brand Matching

Match external brand names against canonical brands.

54. Brand Aliases

Maintain aliases for common variations.

---

55. Category Mapping

External categories must map to GDN categories.

56. Category Confidence

Low-confidence automated mappings should enter review queues.

---

57. Product Matching

External products must map to canonical GDN products where possible.

58. Matching Signals

Use:

- identifiers
- brand
- model
- normalized title
- attributes
- variant information
- images
- semantic similarity

59. Match Confidence

Possible states:

exact
high_confidence
probable
uncertain
unmatched

---

60. Human Review

Uncertain matches may require admin review.

61. Review Queue

Maintain:

product_match_reviews
category_mapping_reviews
brand_mapping_reviews

---

62. Canonical Product Creation

If no reliable product match exists, the pipeline may create a new canonical product after validation.

63. Duplicate Protection

Before creating a new product, check all relevant identifiers and matching signals.

---

64. Offer Creation

Once a product is matched:

External Record
→ Merchant
→ Store
→ Product
→ Offer

65. Offer Identity

An offer should have a stable internal GDN ID.

---

66. Offer Updates

Repeated feed imports should update existing offers rather than create duplicates.

67. Upsert

Use controlled upsert logic.

68. External Record ID

Store the source's external offer/product ID where available.

---

69. Deduplication

Deduplicate using:

- source ID
- merchant ID
- external ID
- SKU
- product ID
- destination URL
- normalized identifiers

70. Fingerprint

Create a deterministic source-record fingerprint where useful.

---

71. Data Freshness

Track:

first_seen_at
last_seen_at
last_updated_at
last_verified_at

72. Freshness Rules

Each source may have a different acceptable freshness window.

---

73. Stale Offers

Stale offers should not remain indefinitely as active.

74. Stale Status

Possible states:

fresh
aging
stale
expired
unknown

---

75. Inventory

Where inventory is supplied:

in_stock
low_stock
out_of_stock
preorder
unknown

76. Inventory Freshness

Inventory timestamps should be preserved.

---

77. Shipping

Where available, normalize:

- destination country
- shipping price
- free shipping
- delivery estimate
- shipping method

78. Shipping Uncertainty

Unknown shipping information must not be represented as free shipping.

---

79. Coupons

Coupon data may be imported separately or attached to offers.

80. Coupon Validation

Track:

- code
- validity
- restrictions
- expiry
- market
- source

---

81. Affiliate Data

Affiliate feeds may contain:

- merchant
- product
- offer
- tracking URL
- commission
- program
- market

82. Affiliate Separation

Affiliate metadata must remain separate from canonical product data.

---

83. Affiliate Link Generation

The Affiliate Engine generates final tracked links.

84. Connector Rule

Connectors may provide destination URLs, but they do not become the final affiliate-link authority.

---

85. Direct Merchant Fallback

If no valid affiliate path exists, GDN may retain a direct merchant destination where permitted.

---

86. Deal Detection

Feeds may be analyzed for:

- discount
- price drop
- coupon
- sale
- promotion
- clearance

87. Deal Creation

Only validated promotional information should become an active GDN deal.

---

88. Price Drop Detection

Compare current price with historical price snapshots.

89. Price Drop Event

Significant changes may generate:

price_drop_detected

---

90. Data Quality Score

Each imported record may receive a quality score.

Signals may include:

- completeness
- freshness
- identifier quality
- image quality
- price validity
- merchant reliability
- matching confidence

91. Quality Thresholds

Low-quality records may be:

- rejected
- quarantined
- reviewed
- partially imported

---

92. Error Handling

Errors must be classified.

Types:

authentication_error
network_error
format_error
mapping_error
validation_error
rate_limit
provider_error
data_quality_error

---

93. Retry Policy

Retry transient errors.

94. Do Not Retry

Permanent validation errors should not repeatedly consume resources.

---

95. Dead-Letter Queue

Failed records may enter a DLQ.

feed_dlq
connector_dlq
mapping_dlq

96. DLQ Replay

Admins or workers may replay corrected records.

---

97. Rate Limits

Respect external provider rate limits.

98. Backoff

Use exponential backoff for transient failures.

99. Provider Quotas

Track API quota consumption.

---

100. Connector Health

Monitor:

- success rate
- failure rate
- latency
- records processed
- freshness
- quota usage
- mapping errors

---

101. Connector Dashboard

Admin dashboard should show:

Connector
Status
Last Run
Last Success
Records
Errors
Freshness
Quota

---

102. Connector Alerts

Alert on:

- repeated failures
- authentication expiration
- feed disappearance
- abnormal record count
- stale data
- quota exhaustion
- mapping failures

---

103. Record Count Anomaly

Detect unexpected feed changes.

Example:

Yesterday: 1,000,000 records
Today:       12 records

This should trigger investigation before replacing valid production data.

---

104. Safe Updates

A failed or suspicious feed must not automatically wipe valid active offers.

105. Snapshot Strategy

Maintain previous successful feed state where necessary.

---

106. Feed Reconciliation

Compare:

previous feed
current feed
canonical database

107. Reconciliation Results

Identify:

- new
- changed
- removed
- unchanged
- suspicious

---

108. Soft Removal

When a source no longer provides an offer, mark it stale/removed according to policy instead of immediately deleting historical records.

---

109. Data Lineage

Every canonical record should be traceable to its source.

Possible fields:

source_id
connector_id
external_id
source_record_id
feed_run_id

---

110. Provenance

Track where important price, product and deal information originated.

111. Provenance Visibility

Internal admin systems should be able to inspect provenance.

---

112. Seller Feed Architecture

Approved GDN sellers may connect:

- Shopify
- CSV
- XML
- JSON
- API
- manual upload

113. Seller Feed Flow

Seller
→ Store ID
→ Feed Connection
→ Authentication
→ Feed Run
→ Validation
→ Product Matching
→ Offer Creation

---

114. Shopify Connector

The Shopify connector should support approved seller stores.

115. Shopify Data

Potential data:

- products
- variants
- prices
- inventory
- images
- collections
- URLs

116. Shopify Security

Store credentials/tokens must be securely managed.

---

117. CSV Connector

CSV imports require:

- column mapping
- encoding detection
- delimiter handling
- required-field validation
- row-level errors

---

118. XML Connector

XML connectors must support:

- schema parsing
- namespaces
- nested products
- feed validation

---

119. JSON Connector

JSON connectors must support:

- pagination
- nested structures
- schema validation
- field mapping

---

120. API Connector

API connectors should support:

- pagination
- rate limits
- authentication
- retries
- incremental sync
- webhooks where available

---

121. Incremental Sync

Prefer incremental synchronization where supported.

122. Full Sync

Use full synchronization when incremental data is unavailable or reconciliation requires it.

---

123. Webhooks

External providers may send:

- product updates
- inventory updates
- price updates
- order events
- store events

124. Webhook Flow

Provider
→ API Gateway
→ Signature Validation
→ Event Queue
→ Connector Processor
→ Canonical Database

---

125. Webhook Security

Validate:

- signature
- timestamp
- event ID
- source
- replay protection

---

126. Batch Processing

Large feeds must be processed in batches.

127. Batch Size

Batch sizes should be configurable.

128. Parallel Processing

Safe independent records may process in parallel.

---

129. Backpressure

If database/search systems are overloaded, ingestion workers must slow down rather than overwhelm downstream services.

---

130. Queue Architecture

Feed Scheduler
      ↓
Ingestion Queue
      ↓
Parser Workers
      ↓
Validation Queue
      ↓
Normalization Workers
      ↓
Matching Queue
      ↓
Canonical Write
      ↓
Index/Event Queue

---

131. Idempotency

Every feed run and record-processing operation should support idempotency.

132. Duplicate Runs

Repeated jobs must not create duplicate offers.

---

133. Transaction Boundaries

Canonical database writes must use controlled transactions.

134. External Calls

Do not hold database transactions open during external network requests.

---

135. Data Transformation

Transformation pipeline:

Raw
→ Clean
→ Normalize
→ Enrich
→ Match
→ Validate
→ Canonicalize

---

136. Enrichment

Possible enrichment:

- category
- brand
- product identifiers
- market
- currency
- attributes
- images
- shipping
- deal signals

137. AI Enrichment

AI may assist with:

- category classification
- title normalization
- attribute extraction
- matching

But authoritative records remain controlled by business rules.

---

138. AI Guardrails

AI must not invent:

- prices
- inventory
- merchants
- discounts
- affiliate links
- availability

139. Human Review

Low-confidence AI enrichment should enter review.

---

140. Image Processing

Product images may pass through:

Download
→ Security Scan
→ Format Validation
→ Resize
→ Optimize
→ Object Storage
→ CDN

141. Image Deduplication

Use image hashes where useful.

---

142. URL Validation

Validate destination URLs.

143. Malicious URL Protection

Unsafe or suspicious domains must be blocked or reviewed.

---

144. Merchant Verification

Merchant feeds should only become publicly searchable according to merchant approval rules.

---

145. Store Domain Verification

Approved sellers may need domain verification.

Methods may include:

- DNS
- HTML verification
- provider verification

---

146. Merchant Trust

Feed data quality contributes to merchant operational monitoring but must not automatically determine merchant trust status.

---

147. Feed Permissions

Seller users may only manage feeds belonging to their authorized store.

---

148. Admin Controls

Admins may:

- activate connector
- pause connector
- retry feed
- replay DLQ
- edit mappings
- approve mappings
- disable source
- inspect errors
- trigger full sync

---

149. Audit Logging

Record important connector/admin actions.

---

150. Data Retention

Retention should be defined for:

- raw records
- feed runs
- errors
- DLQ records
- source snapshots
- audit data

---

151. Storage Strategy

Use:

- relational DB for canonical records
- object storage for large raw payloads
- queue for asynchronous processing
- search index for discovery
- analytics system for high-volume analytics

---

152. Database Boundary

Do not use the relational database as a raw-data warehouse for unlimited external feed payloads.

---

153. Search Integration

After successful canonical updates:

Canonical Database
→ Change Event
→ Search Index Queue
→ Search Index

---

154. Analytics Integration

Record:

- source performance
- feed quality
- update volume
- merchant performance
- connector errors

---

155. Affiliate Integration

Feed records may map to affiliate programs and offers.

156. Affiliate Eligibility

Eligibility must be validated separately from product matching.

---

157. Notification Integration

Feed changes may trigger:

- price drop
- back in stock
- deal detected
- deal ending

through the central Notification Engine.

---

158. PSEO Integration

Validated canonical data may become input for PSEO pages.

159. PSEO Safety

Do not generate pages from unverified raw records.

---

160. Data Freshness by Source

Each source has a configurable freshness policy.

Example:

API: 1 hour
Fast feed: 6 hours
Daily feed: 36 hours
Manual: configurable

These values are examples and must be configured per source.

---

161. Source Priority

When multiple sources provide conflicting information, define source priority.

162. Conflict Resolution

Possible signals:

- source reliability
- freshness
- verification
- merchant authority
- identifier confidence

---

163. Canonical Record Protection

A low-quality external update must not overwrite a higher-confidence canonical value without validation.

---

164. Feed Monitoring

Monitor:

freshness
volume
success
errors
latency
quality
coverage

---

165. Coverage

Measure:

- products imported
- offers imported
- markets covered
- categories covered
- merchants covered

---

166. Connector Testing

Every connector requires:

- unit tests
- parser tests
- mapping tests
- authentication tests
- error tests
- sample feed tests
- integration tests

---

167. Contract Tests

External API schemas should have contract tests where practical.

---

168. Sample Data

Maintain sanitized sample payloads for each connector.

---

169. Connector CI/CD

Connector code changes must pass automated tests before deployment.

---

170. Connector Rollback

Connector versions must support rollback if a new parser or mapping causes bad data.

---

171. Bad Feed Protection

Use circuit breakers when a source produces abnormal data.

---

172. Data Quarantine

Suspicious records may enter quarantine rather than canonical tables.

---

173. Quarantine Workflow

Suspicious Record
→ Quarantine
→ Review / Automated Validation
→ Approve
→ Canonical Database

---

174. Merchant Suspension

If serious data or trust issues occur, a store can be temporarily excluded from public search.

---

175. Feed Reprocessing

Corrected mapping/configuration should allow historical raw records to be reprocessed.

---

176. Replay

Replay should be controlled and idempotent.

---

177. Source Deactivation

Deactivating a source must not automatically delete historical GDN records.

---

178. Source Migration

When changing providers, preserve canonical IDs wherever possible.

---

179. Provider Abstraction

External provider IDs remain integration metadata.

GDN IDs remain stable.

---

180. Global Scaling

Architecture must support:

- millions of products
- millions of offers
- thousands of merchants
- many markets
- frequent price changes
- high-volume feed ingestion

---

181. Horizontal Workers

Workers should scale horizontally.

182. Queue Partitioning

High-volume sources may receive separate queues or partitions.

---

183. Priority Queues

Possible priorities:

critical
high
normal
low

Example:

Price/stock updates may be higher priority than low-value metadata refreshes.

---

184. Cost Optimization

Optimize:

- API calls
- feed frequency
- storage
- compute
- image processing
- duplicate processing
- unnecessary enrichment

---

185. Provider Quota Optimization

Cache stable metadata and use incremental APIs where possible.

---

186. Merchant Feed Cost

Seller feed synchronization frequency may vary by seller tier or feed requirements.

---

187. Data Quality Dashboard

Admin dashboard should expose:

Source Health
Feed Freshness
Error Rate
Mapping Quality
Product Match Rate
Offer Match Rate
Duplicate Rate
Rejected Records

---

188. Merchant Dashboard

Sellers may see:

- feed status
- last sync
- products accepted
- products rejected
- errors
- stale products
- store status

---

189. Data Quality Feedback

Repeated feed errors should generate actionable messages for sellers.

---

190. Error Messages

Errors should explain:

- field
- row/item
- reason
- expected format
- correction guidance

---

191. Localization

Feed data may contain multilingual content.

192. Language Detection

Where needed, detect source language and map to canonical localization.

---

193. Translation

Translation may be handled by the central Localization/AI systems.

194. Original Content

Original source language should be preserved where required.

---

195. Data Governance

All external data processing must follow GDN privacy, compliance and source-usage rules.

196. Source Permission

Only use data from sources where GDN has appropriate access/permission.

---

197. Scraping Boundary

Unauthorized or prohibited scraping must not be used as a default ingestion method.

---

198. Legal/Policy Metadata

Store source terms/usage metadata where necessary.

---

199. Auditability

Important records should be traceable from:

Canonical Record
→ Feed Run
→ Source Record
→ Source
→ Connector Version

---

200. Final Data Pipeline

                 EXTERNAL DATA SOURCES
                          |
        ┌─────────────────┼─────────────────┐
        |                 |                 |
   Affiliate APIs     Merchant Feeds     Seller Stores
        |                 |                 |
        └─────────────────┼─────────────────┘
                          ↓
                   Connector Layer
                          ↓
                    Raw / Staging
                          ↓
                      Validation
                          ↓
                     Normalization
                          ↓
                    Enrichment
                          ↓
                  Product/Entity Match
                          ↓
                     Deduplication
                          ↓
                   Market Validation
                          ↓
                 Canonical GDN Database
                          |
          ┌───────────────┼────────────────┐
          ↓               ↓                ↓
       Search         Affiliate         Analytics
          ↓               ↓                ↓
       Channels       Commerce        Intelligence

---

201. Golden Rule

External Sources Provide Data → GDN Validates It → GDN Canonicalizes It → GDN Stores It → Central Engines Use It → All Channels Consume the Same Data.

---

202. Implementation Order

1. Source registry
2. Connector interface
3. Credential system
4. Feed configuration
5. Feed scheduler
6. Raw/staging layer
7. Validation framework
8. Mapping engine
9. Normalization engine
10. Product matching
11. Merchant/store matching
12. Offer ingestion
13. Deal detection
14. Deduplication
15. Freshness system
16. Error/DLQ system
17. Search indexing integration
18. Analytics integration
19. Seller feed system
20. Shopify connector
21. CSV/XML/JSON connectors
22. Affiliate network connectors
23. Advanced enrichment
24. AI matching
25. Global scaling

---

203. Production Checklist

- [ ] Source registry implemented
- [ ] Connector abstraction implemented
- [ ] Secrets secured
- [ ] Feed scheduler working
- [ ] Raw/staging pipeline working
- [ ] Validation active
- [ ] Mapping versioning active
- [ ] Product matching active
- [ ] Deduplication active
- [ ] Market validation active
- [ ] Price validation active
- [ ] Freshness tracking active
- [ ] DLQ active
- [ ] Retry policy active
- [ ] Feed anomaly detection active
- [ ] Search synchronization active
- [ ] Analytics tracking active
- [ ] Seller feeds supported
- [ ] Connector monitoring active
- [ ] Connector rollback tested
- [ ] Data provenance available
- [ ] Security review completed
- [ ] Load testing completed

---

204. Final Architecture Principle

One Connector Framework → Many Global Sources → Controlled ETL → Verified Canonical Products & Offers → Central Database → Search + Affiliate + Commerce + Analytics + PSEO + Notifications → Global GDN Ecosystem
