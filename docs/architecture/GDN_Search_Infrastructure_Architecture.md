GDN Search Infrastructure Architecture

1. Purpose

Define the infrastructure architecture for GDN's global product, offer, deal, merchant and content search system.

2. Core Principle

Search is a specialized discovery layer built from GDN's central database.

3. Source of Truth

The central GDN database remains authoritative.

4. Search Index

The search index is derived data and must be rebuildable.

5. Frontend Rule

Website, Telegram Mini App and mobile applications access search through the central API Gateway.

6. Search Architecture

GDN Database
     ↓
Change Events / Indexing Queue
     ↓
Search Indexer
     ↓
Search Infrastructure
     ↓
Search API
     ↓
API Gateway
     ↓
Website / Mini App / Mobile / Future Channels

---

7. Search Domains

Search should support:

- Products
- Product variants
- Offers
- Deals
- Merchants
- Stores
- Brands
- Categories
- Coupons
- Content
- PSEO pages
- Services
- Future marketplace listings

8. Product Search

Product search is the primary global commerce search capability.

9. Offer Search

Offer search retrieves merchant-specific availability and pricing.

10. Deal Search

Deal search prioritizes active promotions.

11. Merchant Search

Users can search approved merchants and stores.

12. Unified Search

Future unified search may combine products, deals, stores, services and content.

---

13. Search Infrastructure Strategy

The initial implementation may use one managed search engine.

14. Search Engine Abstraction

GDN should maintain a search-provider abstraction.

Possible future providers may include:

- OpenSearch
- Elasticsearch
- Typesense
- Meilisearch
- Managed cloud search

15. Provider Independence

Application code should avoid unnecessary provider-specific coupling.

16. Search Adapter

Use a central search adapter:

src/search/
├── search-service
├── search-provider
├── indexer
├── ranking
├── filters
├── autocomplete
├── synonyms
└── analytics

---

17. Search Indexes

Recommended logical indexes:

products
offers
deals
merchants
categories
brands
content
services

18. Product Index

Product index contains canonical product information.

19. Offer Index

Offer index contains merchant-specific commercial information.

20. Deal Index

Deal index contains promotional information.

21. Merchant Index

Merchant index contains approved store information.

---

22. Product Search Document

A product search document may contain:

product_id
title
normalized_title
brand_id
brand_name
category_ids
description
attributes
identifiers
image_urls
variant_summary
market_ids
status
popularity
quality_score
updated_at

23. Offer Search Document

May contain:

offer_id
product_id
merchant_id
store_id
market_id
price
currency
availability
condition
shipping
affiliate_eligible
updated_at

24. Deal Search Document

May contain:

deal_id
product_id
offer_id
merchant_id
market_id
discount
sale_price
original_price
starts_at
expires_at
status
quality_score

---

25. Market Context

Every market-sensitive search must understand:

country
currency
language
timezone
market

26. Automatic Country

IP-based country detection may establish the default market.

27. Manual Country

A user-selected country overrides automatic detection.

28. Market Filter

Search must not return offers that are invalid for the active market unless explicitly requested.

29. Market-Aware Indexing

Market IDs should be available as filterable index fields.

---

30. Language

Search must support multilingual queries.

31. Locale

Search requests should include locale where relevant.

32. Language Fallback

Use:

Exact locale
→ Language
→ Global/default

33. Translation

Translated search fields may be indexed separately.

---

34. Text Normalization

Normalize:

- case
- whitespace
- punctuation
- accents
- common symbols
- equivalent units
- common spelling variations

35. Tokenization

Use language-appropriate tokenization.

36. Stemming

Stemming may be enabled where it improves search quality.

37. Stop Words

Stop-word removal should be language-aware.

---

38. Synonyms

Maintain a controlled synonym system.

Examples:

mobile → smartphone
tv → television
laptop → notebook

39. Synonym Governance

Synonyms must be versioned and reviewed.

40. Merchant Synonyms

Merchant aliases should map to canonical merchants.

41. Brand Aliases

Brand aliases should map to canonical brands.

---

42. Typo Tolerance

Search should handle common spelling mistakes.

43. Fuzzy Matching

Fuzzy matching should have controlled limits.

44. Exact Match Priority

Exact product identifiers and exact names should receive stronger relevance.

---

45. Identifier Search

Search should support:

- GTIN
- UPC
- EAN
- ISBN
- MPN
- SKU
- model number

46. Identifier Priority

Exact identifier matches should strongly influence ranking.

47. Barcode Search

Barcode input may directly query product identifiers.

---

48. Image Search

GDN should support future product image search.

49. Image Search Flow

User Image
→ Image Upload
→ Security Validation
→ Image Processing
→ Visual Search / AI Matching
→ Candidate Products
→ Exact/Similar Classification
→ Search Results

50. Image Storage

Uploaded images should use secure object storage.

51. Image Index

Visual embeddings may be stored in a specialized vector system.

---

52. Search Query Pipeline

User Query
→ Validation
→ Normalization
→ Locale Detection
→ Market Context
→ Query Understanding
→ Candidate Retrieval
→ Filtering
→ Ranking
→ Business Rules
→ Result Formatting

---

53. Query Validation

Validate:

- length
- encoding
- unsupported patterns
- abusive input
- malformed filters

54. Query Limits

Apply reasonable maximum query lengths.

55. Rate Limits

Search APIs must have rate limits.

---

56. Query Understanding

The system should identify possible:

- product
- brand
- category
- merchant
- model
- price
- discount
- color
- size
- condition
- market

57. Natural Language Search

Future AI search may understand queries such as:

Find the cheapest iPhone 16 Pro available in UAE

58. AI Boundary

AI may interpret the query, but actual prices and availability must come from verified GDN data.

---

59. Candidate Retrieval

Candidate retrieval may combine:

- exact match
- lexical match
- fuzzy match
- identifier match
- category match
- semantic match
- popularity
- market eligibility

60. Multiple Retrieval Paths

Multiple retrieval strategies may run in parallel.

---

61. Ranking

Search ranking should consider:

- textual relevance
- exact match
- identifier match
- market availability
- price
- stock
- deal quality
- freshness
- merchant quality
- product quality
- user preferences
- popularity

62. Relevance First

Commercial signals must not automatically override strong relevance.

63. Price Ranking

When the user explicitly requests cheapest results, price becomes a primary ranking factor.

64. Default Ranking

Default ranking may balance relevance, availability, quality and commercial usefulness.

---

65. Price Comparison

Search infrastructure must support price comparison.

Product
├── Store A → $100
├── Store B → $95
├── Store C → $110
└── Store D → $99

66. Lowest Price

The lowest valid market-eligible offer may be highlighted.

67. Effective Price

Where data exists, ranking may consider:

Product Price
+ Shipping
+ Mandatory Fees
- Valid Coupon

68. Currency

Do not compare currencies without conversion.

69. Exchange Timestamp

Currency conversion must retain exchange-rate timestamp.

---

70. Availability

Search should filter or label:

- in stock
- limited stock
- out of stock
- preorder
- unknown

71. Stale Availability

Old availability data must receive freshness penalties or be excluded according to rules.

---

72. Condition

Users may filter:

- New
- Used
- Refurbished
- Open Box

73. Condition Ranking

Condition must not be silently mixed where it could mislead the user.

---

74. Merchant Quality

Merchant signals may include:

- verification
- availability
- feed freshness
- complaint rate
- trust signals
- fulfillment information

75. Trust

Trust signals should be transparent and governed by the central Trust system.

---

76. Deal Quality

Deal ranking may consider:

- verified discount
- price history
- freshness
- expiry
- stock
- merchant quality

77. Discount Integrity

Search must not present an unverified discount as verified.

---

78. Search Filters

Support:

- country
- category
- brand
- merchant
- price
- currency
- discount
- condition
- availability
- rating where available
- shipping
- deal status
- affiliate availability

79. Facets

Search should return facet counts where practical.

80. Dynamic Facets

Facets should adapt to the query and result set.

---

81. Sorting

Support:

relevance
price_low_to_high
price_high_to_low
discount
newest
popular
ending_soon

82. Explicit Sorting

Explicit user sorting should override default ranking where appropriate.

---

83. Autocomplete

Autocomplete should provide:

- products
- brands
- categories
- merchants
- recent searches
- trending searches

84. Autocomplete Latency

Autocomplete must be optimized for very low latency.

85. Prefix Index

Use prefix-compatible indexing or dedicated autocomplete structures.

---

86. Search Suggestions

Suggestions may include:

"iphone"
"iphone 16"
"iphone 16 pro"
"iphone 16 pro max"

87. Suggestion Personalization

Authenticated users may receive personalized suggestions.

88. Privacy

Personalized suggestions must respect privacy and account settings.

---

89. Recent Searches

Users may store recent searches.

90. Anonymous Searches

Anonymous recent searches may be stored locally or under an anonymous identifier.

91. Delete History

Users should be able to clear search history.

---

92. Trending Searches

Trending search data may be generated from aggregated search events.

93. Manipulation Protection

Trending systems must detect abnormal artificial activity.

---

94. Search Analytics

Track:

- query
- market
- locale
- result count
- click
- conversion
- zero-result
- filter usage
- sort usage

95. Query Performance

Track:

- latency
- provider latency
- index latency
- ranking latency
- cache hit rate

---

96. Zero-Result Search

Zero-result searches must be recorded.

97. Zero-Result Recovery

Possible recovery:

Exact Search
→ Fuzzy Search
→ Synonym Search
→ Category Suggestion
→ Similar Products

98. Zero-Result Analytics

Frequently occurring zero-result searches should feed product/catalog improvement.

---

99. Search Cache

Cache common queries where appropriate.

100. Cache Key

Cache keys may include:

query
market
locale
filters
sort
page/cursor

101. User Personalization

Personalized queries should not share inappropriate global cache entries.

---

102. Cache Invalidation

Invalidate search-related caches when:

- products change
- offers change
- deals expire
- merchant status changes
- market eligibility changes

---

103. Search Indexing

Index updates may occur through:

Database Change
→ Outbox Event
→ Queue
→ Index Worker
→ Search Provider

104. Batch Indexing

Large imports should use bulk indexing.

105. Incremental Indexing

Normal changes should use incremental indexing.

---

106. Index Versioning

Search indexes should support versioned schemas.

107. Blue-Green Index

Future production deployments may use:

index_v1
index_v2

with controlled alias switching.

108. Reindexing

Full reindexing must not require application downtime.

---

109. Index Failure

If indexing fails:

- retry
- log error
- preserve event
- use DLQ
- alert when threshold exceeded

110. Data Recovery

Search index must be rebuildable from canonical data.

---

111. Search Infrastructure Availability

Use managed infrastructure where practical.

112. Redundancy

Production search should support redundancy appropriate to traffic and business criticality.

113. Health Checks

Monitor:

search health
cluster health
index health
query latency
error rate

---

114. Search API

Example:

GET /api/v1/search

Possible parameters:

q
market
country
locale
category
brand
merchant
min_price
max_price
condition
availability
sort
cursor
limit

---

115. Product Search API

GET /api/v1/search/products

116. Offer Search API

GET /api/v1/search/offers

117. Deal Search API

GET /api/v1/search/deals

118. Merchant Search API

GET /api/v1/search/merchants

119. Autocomplete API

GET /api/v1/search/autocomplete

120. Image Search API

Future:

POST /api/v1/search/image

---

121. Search Response

Standard response should include:

query
market
locale
results
facets
sort
pagination
search_metadata

122. Result Metadata

May include:

total
took_ms
index_version
fallback_used

---

123. Pagination

Use cursor pagination for large result sets.

124. Maximum Results

Limit maximum page size.

125. Deep Pagination

Avoid unrestricted deep pagination.

---

126. Search Security

Protect against:

- query abuse
- scraping
- excessive requests
- malicious filters
- injection
- resource exhaustion

127. Query Sanitization

Search input must be safely passed to the search provider.

---

128. Search Rate Limiting

Different limits may apply to:

- guests
- authenticated users
- sellers
- admins
- internal services

---

129. Bot Protection

Automated high-volume search traffic should be monitored and controlled.

---

130. Merchant Search

Merchant results must only expose stores allowed to appear publicly.

131. Suspended Stores

Suspended stores should be removed or appropriately restricted from normal public search.

---

132. Seller Search

Seller-specific dashboards may use authenticated search scopes.

133. Seller Data Isolation

One seller must never access another seller's private data.

---

134. Admin Search

Admin search may include internal states not exposed publicly.

---

135. Content Search

PSEO and editorial content may use a separate content index.

136. Content Ranking

Content ranking must consider relevance and freshness.

---

137. Service Search

Future GDN service marketplace records may use the same search infrastructure.

138. Service/Product Separation

Products and services should have clearly defined schemas or entity types.

---

139. Semantic Search

Future semantic search may use embeddings.

140. Vector Infrastructure

Potential architecture:

Text/Image
→ Embedding Model
→ Vector Index
→ Candidate Retrieval
→ Hybrid Ranking

141. Hybrid Search

Combine lexical and semantic retrieval.

---

142. Vector Security

Embeddings must follow applicable privacy and data governance rules.

---

143. AI Search

AI may translate natural-language intent into structured filters.

Example:

"Find a cheap gaming laptop under $800"

may become:

category = gaming_laptop
max_price = 800
sort = price

144. AI Validation

AI-generated filters must be validated by normal search/business rules.

---

145. Similar Product Search

Support:

Exact Product
Similar Product
Alternative Product

146. Confidence

Matching confidence should be available internally.

---

147. Product Matching

Search infrastructure may assist canonical product matching during feed ingestion.

148. Matching Pipeline

External Offer
→ Identifier Match
→ Brand/Model Match
→ Attribute Match
→ Image/semantic Match
→ Confidence
→ Human Review if Needed

---

149. Search Ranking Experiments

Future ranking experiments may use controlled A/B testing.

150. Experiment Isolation

Experiments must be measurable and reversible.

---

151. Personalization

Search may incorporate:

- favorite categories
- favorite brands
- preferred market
- price preferences
- previous interactions

152. Personalization Boundary

Personalization must not hide important relevant results without appropriate reason.

---

153. Cold Start

Anonymous users receive market-aware default ranking.

154. New Users

New users can gradually receive personalization from explicit preferences and behavior.

---

155. Search Recommendation Integration

Search can provide candidates to Recommendation Engine.

156. Recommendation Boundary

Recommendation results remain separate from core search relevance.

---

157. Affiliate Integration

Search results may expose affiliate CTA metadata.

158. Affiliate Link Authority

Actual affiliate links must come from the central Affiliate Engine.

159. Direct Fallback

If affiliate routing is unavailable, direct merchant routing may be used.

---

160. Search Click Tracking

Search result clicks should create central analytics events.

Possible data:

query_id
result_id
product_id
offer_id
merchant_id
position
market_id
user/session

---

161. Position Tracking

Record result position to measure ranking performance.

---

162. Conversion Feedback

Affiliate conversions may feed search-quality analytics.

163. Commercial Feedback

Conversion data must not automatically create hidden ranking bias without controlled ranking governance.

---

164. Search Quality Metrics

Track:

- zero-result rate
- click-through rate
- result engagement
- conversion rate
- search abandonment
- reformulation rate
- latency
- relevance feedback

---

165. Search Evaluation

Maintain benchmark query sets.

166. Golden Queries

Golden queries should cover:

- products
- brands
- categories
- identifiers
- multilingual searches
- typo searches
- market searches
- price searches

---

167. Regression Testing

Search changes must run benchmark queries.

168. Ranking Regression

Detect unexpected result-order changes.

---

169. Performance Targets

Production search should target low latency.

Example initial target:

P50 < 100ms
P95 < 300ms

Actual targets must be validated against infrastructure and user experience.

---

170. Autocomplete Performance

Autocomplete should aim for substantially lower latency than full search.

---

171. Scalability

Search infrastructure must scale horizontally.

172. Traffic Growth

Architecture should support:

1K users
10K users
100K users
1M+ users

without requiring a fundamental redesign.

---

173. Large Catalog

Support millions of products and offers.

174. High-Frequency Updates

Support frequent price, inventory and deal updates.

---

175. Bulk Imports

Large merchant feeds must not overload live search infrastructure.

176. Bulk Pipeline

Use:

Feed
→ Staging
→ Validation
→ Batch Processing
→ Database
→ Bulk Index

---

177. Backpressure

Indexer queues must support backpressure.

178. Priority

Critical changes such as deal expiry may receive higher indexing priority than low-priority metadata changes.

---

179. Deal Expiry

Expired deals should be removed or demoted promptly.

180. Expiry Worker

A scheduled worker should process deal expiry.

---

181. Offer Expiry

Stale offers should be marked or removed according to source freshness rules.

---

182. Merchant Suspension

Merchant suspension events should trigger search index updates.

---

183. Market Activation

Activating a new country should not require rebuilding unrelated global infrastructure.

184. Market Rollout

Use feature flags/configuration for staged market activation.

---

185. Country Search

Country-specific searches should use market context.

Example:

query = "iphone"
market = AE

---

186. Currency Search

Currency display should match active market preferences.

---

187. Shipping Search

Where reliable shipping data exists, users may filter by shipping availability.

---

188. Coupon Search

Coupons may be searchable as separate entities or attached to offers.

---

189. Price Drop Search

Price-drop search may use historical price data.

190. Price Intelligence

Historical pricing should help identify meaningful price changes.

---

191. Deal Discovery

Search can expose:

- today's deals
- price drops
- ending soon
- popular deals
- country-specific deals

---

192. Search + PSEO

PSEO pages should consume search/index data rather than duplicate search databases.

---

193. PSEO Search Pages

Controlled search-intent landing pages may be generated for valuable queries.

194. Thin Page Protection

Do not generate large numbers of low-value empty search pages.

---

195. Search + Notifications

Search behavior may trigger product watch or alert creation when the user explicitly chooses it.

---

196. Search + Wishlist

Users may add search results directly to wishlist.

---

197. Search + Earn

Users may discover tasks related to product research or search evaluation.

---

198. Search + Seller Marketplace

Approved seller products should enter the same canonical search system.

---

199. Seller Feed Priority

Seller feed quality must not automatically guarantee ranking priority.

---

200. Sponsored Search

Future sponsored placements may exist.

201. Sponsored Transparency

Sponsored results must be clearly identifiable.

202. Relevance Protection

Sponsored placement must follow defined relevance and safety rules.

---

203. Search Governance

Ranking rules must be versioned.

204. Ranking Configuration

Maintain configurable ranking weights rather than hardcoding every ranking rule.

---

205. Search Feature Flags

Support feature flags for:

- semantic search
- image search
- personalization
- new ranking
- new provider
- new market

---

206. Search Provider Failover

If the primary search provider fails, fallback options may include:

- cached results
- database search for limited scopes
- secondary provider
- degraded search mode

---

207. Graceful Degradation

Search failure must not necessarily take down:

- homepage
- saved items
- account
- static content
- previously cached deals

---

208. Search Monitoring

Monitor:

query_latency
error_rate
zero_result_rate
index_lag
index_failures
cache_hit_rate
provider_health

---

209. Index Lag

Measure the delay between database update and searchable result.

---

210. Search Alerts

Alert on:

- provider outage
- latency spike
- indexing backlog
- abnormal zero-result rate
- index corruption
- indexing failure
- unusual query volume

---

211. Search Logs

Use structured logs containing:

request_id
query_id
market_id
provider
latency
result_count
error

212. Privacy

Do not log sensitive personal data unnecessarily.

---

213. Query Privacy

Search queries can reveal personal interests.

214. Retention

Search history and raw queries must follow applicable retention policies.

---

215. Search Data Protection

Protect:

- user search history
- personalized results
- seller private search
- admin search
- internal ranking signals

---

216. Search API Authorization

Public search should expose only public records.

Private search requires authentication and authorization.

---

217. Database Integration

Search index synchronization should use the database outbox/event architecture.

---

218. Queue Integration

Recommended:

Database
→ Outbox
→ Search Queue
→ Index Worker
→ Search Provider

---

219. Worker Responsibilities

Indexer workers should:

1. Read event
2. Validate event
3. Fetch authoritative data
4. Build search document
5. Update index
6. Mark event complete
7. Retry failures
8. Send permanent failures to DLQ

---

220. Idempotency

Index operations must be idempotent.

221. Event Deduplication

Duplicate events must not create duplicate search documents.

---

222. Search Document Version

Include:

schema_version
indexed_at
source_updated_at

---

223. Full Rebuild

Full rebuild process:

Create New Index
→ Bulk Read Database
→ Transform
→ Bulk Index
→ Validate
→ Switch Alias
→ Monitor

---

224. Rebuild Safety

The current production index remains active until the replacement index passes validation.

---

225. Search Data Freshness

Each result may have a freshness timestamp internally.

---

226. Freshness Ranking

Recent verified changes may receive freshness boosts where appropriate.

---

227. Stale Data

Stale data should be clearly handled rather than presented as current fact.

---

228. Search Infrastructure Cost

Optimize:

- index size
- replica count
- storage
- query complexity
- cache usage
- retention
- vector workload

---

229. Cost Scaling

Start with a managed search deployment sized for actual traffic.

230. Avoid Premature Complexity

Do not deploy large distributed search infrastructure before GDN requires it.

---

231. Search Security Testing

Test:

- injection
- authorization bypass
- excessive query complexity
- scraping
- rate-limit bypass
- malicious payloads
- unauthorized private data exposure

---

232. Search Load Testing

Simulate:

- normal traffic
- peak traffic
- autocomplete spikes
- deal launches
- major sale events
- bulk merchant imports

---

233. Sale Event Scaling

Major shopping events may generate sudden traffic spikes.

Search infrastructure must support temporary horizontal scaling.

---

234. Cache Warmup

Popular queries may be prewarmed before planned campaigns.

---

235. Search Deployment

Search configuration must be version-controlled.

236. Deployment Flow

Code
→ Tests
→ Search Schema Validation
→ Staging
→ Benchmark
→ Production
→ Monitor

---

237. Search Rollback

Ranking/index configuration changes must be reversible.

---

238. Provider Migration

Future provider migration should support dual indexing:

Old Provider
+
New Provider

followed by controlled cutover.

---

239. Search Documentation

Document:

- index schemas
- analyzers
- ranking
- synonyms
- filters
- APIs
- operational procedures
- rebuild procedures

---

240. Search Ownership

Search infrastructure should have clear technical ownership and operational responsibility.

---

241. Final Search Architecture

                         GDN Central Database
                                  |
                             Outbox Events
                                  |
                            Search Queue
                                  |
                         Indexing Workers
                                  |
                 ┌────────────────┼────────────────┐
                 |                |                |
             Products           Offers           Deals
                 |                |                |
                 └────────────────┼────────────────┘
                                  ↓
                         Search Infrastructure
                                  |
                ┌─────────────────┼─────────────────┐
                |                 |                 |
             Lexical          Semantic          Autocomplete
                |                 |                 |
                └─────────────────┼─────────────────┘
                                  ↓
                             Search API
                                  ↓
                           API Gateway
                                  ↓
       Website / PWA / Telegram Mini App / Mobile / Future Channels

---

242. Golden Rule

Central Database is the Source of Truth → Search Index is Derived → Search API is the Access Layer → Every Channel Uses the Same Search Infrastructure.

---

243. Implementation Order

1. Search provider selection
2. Search abstraction
3. Product index
4. Offer index
5. Deal index
6. Merchant index
7. Category/brand indexes
8. Search API
9. Filters/facets
10. Autocomplete
11. Ranking
12. Market-aware search
13. Search analytics
14. Incremental indexing
15. Bulk indexing
16. Search monitoring
17. Image search
18. Semantic search
19. Personalization
20. Advanced AI search

---

244. Production Checklist

- [ ] Search provider configured
- [ ] Index schemas versioned
- [ ] Product indexing working
- [ ] Offer indexing working
- [ ] Deal indexing working
- [ ] Merchant indexing working
- [ ] Market filtering working
- [ ] Currency handling verified
- [ ] Filters tested
- [ ] Autocomplete tested
- [ ] Ranking tested
- [ ] Zero-result tracking active
- [ ] Search analytics active
- [ ] Queue/retry/DLQ configured
- [ ] Full rebuild tested
- [ ] Monitoring active
- [ ] Rate limiting active
- [ ] Security tests passed
- [ ] Load tests passed
- [ ] Rollback procedure documented

---

245. Final Principle

One Global Catalog → One Search Infrastructure → Market-Aware Discovery → Accurate Product/Offer Matching → Fast Ranking → Central Analytics → Continuous Improvement → Global Scale
