# GDN Deal Data Pipeline

## 1. Purpose

Global Deals Network (GDN) ka Deal Data Pipeline duniya bhar ke multiple sources se deals collect, process, verify, normalize, deduplicate aur central Deal Database mein publish karega.

Core flow:

Source
→ Ingestion
→ Raw Data
→ Normalization
→ Validation
→ Deduplication
→ Enrichment
→ Verification
→ Approval
→ Central Deal Database
→ Distribution Channels

---

# 2. Core Principle

Deal data kisi bhi frontend mein manually maintain nahi hoga.

Central Deal Database single source of truth hoga.

Website, Telegram Bot, Telegram Mini App aur future channels same centralized deal data consume karenge.

---

# 3. Deal Sources

GDN multiple deal sources support karega:

- Affiliate network APIs
- Merchant APIs
- Merchant feeds
- Product feeds
- Coupon feeds
- CSV feeds
- XML feeds
- JSON feeds
- Webhooks
- Approved scraping sources
- Manual admin entry
- Partner submissions
- Future AI-assisted discovery

Har source ka separate source record hoga.

---

# 4. Source Registry

Har deal source central registry mein registered hoga.

Fields:

- source_id
- source_name
- source_type
- merchant_id
- affiliate_network_id
- country
- region
- category
- API_endpoint
- feed_location
- authentication_type
- sync_frequency
- status
- last_sync_at
- next_sync_at
- created_at
- updated_at

---

# 5. Source Types

Supported source types:

```text
affiliate_api
merchant_api
product_feed
coupon_feed
csv
xml
json
webhook
manual
partner
approved_scraper

Source type ke basis par appropriate ingestion adapter use hoga.


---

6. Source Adapters

Har source ka data format different ho sakta hai.

Is liye modular adapters use honge.

Conceptual structure:

src/
  pipeline/
    sources/
      awin/
      cj/
      impact/
      amazon/
      merchant/
      csv/
      xml/
      json/

Har adapter standardized internal format mein data convert karega.


---

7. Data Ingestion

Pipeline source se data fetch karega.

Flow:

Source
↓
Source Adapter
↓
Raw Deal Record
↓
Raw Data Storage

Raw data ko immediately publish nahi kiya jayega.


---

8. Raw Data Layer

Raw source data preserve kiya ja sakta hai for:

Debugging

Reprocessing

Auditing

Source comparison

Parser improvement

Data recovery


Raw data mein source-specific structure preserve ho sakta hai.


---

9. Ingestion Jobs

Background jobs:

fetchSourceData
importFeed
syncMerchantDeals
syncAffiliateProducts
processWebhook
processPartnerSubmission

Heavy ingestion requests background workers ke through execute hongi.


---

10. Scheduling

Har source ki sync frequency configurable hogi.

Examples:

Every 15 minutes
Every 30 minutes
Hourly
Every 6 hours
Daily
Weekly

High-value / fast-changing sources ko more frequent sync mil sakti hai.


---

11. Source Priority

Sources ko priority assign ki ja sakti hai.

Example:

1 = Highest
2 = High
3 = Normal
4 = Low
5 = Backup

Primary merchant API ko third-party feed se higher priority mil sakti hai.


---

12. Raw Deal Schema

Raw deal record conceptual structure:

{
  "source_id": "source_123",
  "external_id": "external_456",
  "title": "Example Product Deal",
  "description": "Example description",
  "product_url": "https://merchant.example/product",
  "image_url": "https://merchant.example/image.jpg",
  "original_price": 100,
  "sale_price": 70,
  "currency": "USD",
  "coupon_code": null,
  "starts_at": null,
  "expires_at": null
}

Raw schema source-specific fields ko preserve kar sakta hai.


---

13. Normalization

Different sources ko ek standard GDN Deal Schema mein convert kiya jayega.

Example:

Source A:
discount_percent

Source B:
discountPercentage

Source C:
discount

        ↓

GDN:
discount_percentage


---

14. Standard Deal Schema

Normalized deal mein:

deal_id

title

slug

description

merchant_id

product_id

category_id

country_id

region_id

deal_type

original_price

sale_price

discount_value

discount_percentage

currency

coupon_code

destination_url

affiliate_link_id

source_id

starts_at

expires_at

status

verification_status

featured

created_at

updated_at



---

15. Data Cleaning

Normalization ke baad cleaning:

HTML cleanup

Whitespace cleanup

Encoding correction

Currency normalization

Price formatting

Invalid characters removal

URL cleanup

Image URL validation

Description cleanup

Coupon cleanup



---

16. Price Validation

Price fields validate honge.

Checks:

original_price >= 0
sale_price >= 0
sale_price <= original_price

Invalid pricing records review ke liye flag honge.


---

17. Discount Calculation

Agar source discount percentage provide nahi karta:

Discount % =
(Original Price - Sale Price)
/
Original Price
× 100

Example:

Original = $100
Sale = $70

Discount = 30%

Source-provided discount aur calculated discount mein mismatch ho to record flag kiya ja sakta hai.


---

18. Currency Normalization

Original currency preserve hogi.

Examples:

USD
GBP
EUR
CAD
AUD
AED
NZD
JPY

Global reporting ke liye optional normalized currency bhi maintain ki ja sakti hai.


---

19. Merchant Matching

Incoming deal ko existing merchant se match kiya jayega.

Matching signals:

Merchant ID

Domain

Affiliate program

Merchant name

External merchant ID


Duplicate merchant records create nahi hone chahiye.


---

20. Product Matching

Deal ko existing product se match kiya ja sakta hai.

Matching signals:

External product ID

SKU

UPC

EAN

GTIN

Merchant product ID

Canonical product URL

Product title

Brand + model



---

21. Category Mapping

Source categories ko GDN categories se map kiya jayega.

Example:

Source:
Consumer Electronics

↓ 

GDN:
Electronics

Category mapping centralized configuration mein hogi.


---

22. Country Mapping

Deals country-specific ho sakti hain.

Pipeline country identify karega from:

Merchant availability

Feed metadata

Shipping region

Source

Merchant program

Deal metadata


Country records centralized Countries table se reference honge.


---

23. Region Mapping

Country ke andar regions support kiye ja sakte hain.

Examples:

United States
→ California
→ Texas
→ New York

Global regions:

North America
Europe
Middle East
Asia-Pacific


---

24. Deal Type Classification

Deal types:

percentage_discount
fixed_discount
coupon
cashback
bundle
free_shipping
price_drop
clearance
flash_sale
limited_time

Future types configuration ke through add kiye ja sakte hain.


---

25. Deal Deduplication

Multiple sources same deal provide kar sakte hain.

Example:

Source A
Source B
Source C

        ↓

Same Merchant
Same Product
Same Price
Same Offer

        ↓

One GDN Deal

Duplicate deals user experience aur SEO dono ko damage kar sakti hain.


---

26. Deduplication Signals

Possible matching signals:

External deal ID

Merchant ID

Product ID

Canonical URL

SKU

UPC/EAN/GTIN

Coupon code

Sale price

Original price

Title similarity

Start/end date


Multiple signals combine kiye jayenge.


---

27. Deduplication Confidence

Duplicate detection confidence:

high
medium
low

High-confidence duplicate automatically merge ho sakta hai.

Low-confidence match manual review ke liye flag ho sakta hai.


---

28. Deal Merge Rules

Duplicate records merge karte waqt:

Trusted source preferred

Better image preferred

Better description preferred

Latest valid price preferred

Earliest valid start date preserved

Latest expiry validated

Affiliate link priority applied


Original source references preserve rahenge.


---

29. Canonical Deal

Multiple source records se ek canonical GDN deal create ho sakti hai.

Structure:

Raw Deal A
Raw Deal B
Raw Deal C

      ↓

Canonical GDN Deal

Canonical deal central database mein publish hogi.


---

30. Deal Enrichment

Normalized deal ko additional data se enrich kiya ja sakta hai:

Brand

Product

Category

Country

Region

Merchant

Affiliate program

Coupon

Images

Product metadata

SEO metadata

Popularity signals



---

31. Image Processing

Deal images:

Validate

Normalize URL

Check availability

Optional resize

Optional compression

Optional CDN storage


Broken images flag ki jayengi.


---

32. URL Validation

Deal destination URLs validate honge.

Checks:

Valid URL

HTTPS where applicable

Merchant domain

Redirect chain

Affiliate compatibility

HTTP status

Canonical destination


Untrusted arbitrary URLs publish nahi honge.


---

33. Deal Verification

Deal verification levels:

unverified
source_verified
system_verified
admin_verified

Verification status deal record mein stored hoga.


---

34. Automated Verification

Automated checks:

Merchant active

URL active

Price valid

Discount valid

Expiry valid

Image valid

Affiliate link valid

Required fields present


Successful automated validation deal ko publish queue mein bhej sakti hai.


---

35. Admin Verification

High-value ya suspicious deals manual review ke liye bheji ja sakti hain.

Examples:

Extremely high discount

Missing price

Conflicting price

Unknown merchant

Suspicious URL

Duplicate uncertainty



---

36. Deal Quality Score

Future system internal quality score calculate kar sakta hai.

Signals:

Source trust

Price validity

Discount validity

Merchant trust

Verification

Image quality

Data completeness

Expiry freshness


Ye internal operational score hoga.


---

37. Deal Status

Deal statuses:

draft
processing
pending_review
active
scheduled
expired
paused
rejected
archived


---

38. Deal Publishing Flow

Raw Data
↓
Normalized
↓
Validated
↓
Deduplicated
↓
Enriched
↓
Verified
↓
Approved
↓
Active


---

39. Scheduled Deals

Future-starting deals:

scheduled

Start time par automatically:

scheduled
↓
active


---

40. Deal Expiration

Expiry time ke baad:

active
↓
expired

Expired deal affiliate CTA se accessible nahi honi chahiye unless explicitly configured.


---

41. Expiration Detection

System expiry detect karega:

expires_at

Source update

Merchant response

Product availability

Price change

Coupon status



---

42. Expired Deal Handling

Expired deal:

User-facing active listings se remove

Search ranking se remove

Affiliate CTA disable

PSEO page state update

Historical analytics preserve



---

43. Price Change Detection

Pipeline previous aur current price compare karega.

Example:

Previous:
$79

Current:
$59

↓
Price Drop Detected

Price history optionally maintain ki ja sakti hai.


---

44. Deal Change Detection

Fields monitor kiye ja sakte hain:

Price

Discount

Coupon

Expiry

Product availability

Merchant

Destination URL


Important changes event create karenge.


---

45. Deal Event System

Events:

deal_created
deal_updated
deal_verified
deal_approved
deal_published
deal_price_changed
deal_discount_changed
deal_expired
deal_paused
deal_reactivated
deal_rejected


---

46. Deal History

Deal history preserve ki jayegi.

Example:

$100 → $80 → $65 → $55

Historical data future analytics aur price-drop detection ke liye useful hogi.


---

47. Source Reliability

Har source ke performance metrics maintain kiye ja sakte hain:

Sync success rate

Error rate

Data completeness

Broken URL rate

Duplicate rate

Conversion performance

Freshness



---

48. Source Freshness

Har source ke liye:

last_sync_at
last_success_at
last_error_at
next_sync_at

maintain hoga.

Stale sources dashboard mein flag honge.


---

49. Pipeline Error Handling

Possible errors:

API timeout

Authentication failure

Invalid feed

Malformed JSON

XML parsing error

Missing fields

Invalid URL

Database error


Errors retry queue mein ja sakte hain.


---

50. Retry Strategy

Temporary failures ke liye controlled retries:

Attempt 1
↓
Attempt 2
↓
Attempt 3
↓
Dead Letter Queue

Permanent validation errors automatically repeated nahi honge.


---

51. Dead Letter Queue

Failed records:

Dead Letter Queue

mein temporarily store kiye ja sakte hain.

Admin:

Inspect

Fix

Retry

Reject


kar sakta hai.


---

52. Batch Processing

Large feeds batch mein process honge.

Example:

100,000 source records
↓
Batch 1
Batch 2
Batch 3
...

Is se memory aur processing load control rahega.


---

53. Queue Architecture

Conceptual:

Source
↓
Ingestion Queue
↓
Normalization Worker
↓
Validation Worker
↓
Deduplication Worker
↓
Enrichment Worker
↓
Verification Worker
↓
Publishing Queue
↓
Deal Database


---

54. Parallel Processing

Independent source jobs parallel process ho sakti hain.

Example:

Amazon Sync
CJ Sync
Awin Sync
Impact Sync
Merchant API Sync

ek doosre se independently execute ho sakte hain.


---

55. Idempotency

Same source data multiple times receive hone par duplicate records create nahi hone chahiye.

Idempotency key example:

source_id
+
external_deal_id

Agar external ID available nahi ho to composite fingerprint use ho sakta hai.


---

56. Deal Fingerprint

Fallback fingerprint:

merchant
+
product
+
destination_url
+
price
+
coupon

Hash generate karke duplicate detection mein use kiya ja sakta hai.


---

57. Data Quality Rules

Mandatory checks:

Title required

Merchant required

Destination required

Currency valid

Price valid

Country/category mapping valid

Status valid

Source valid


Missing critical fields:

pending_review


---

58. Data Completeness

System completeness track karega:

title
description
image
price
discount
merchant
category
country
affiliate link
expiry

Incomplete deals ko lower publishing priority mil sakti hai.


---

59. Deal Publishing Rules

Deal active tab hogi jab:

Required fields complete hon

Merchant valid ho

URL valid ho

Price valid ho

Duplicate check pass ho

Verification requirements meet hon

Affiliate link available ho, where required



---

60. Affiliate Integration

Pipeline Affiliate Engine ke saath connected hogi.

Flow:

Deal
↓
Merchant
↓
Affiliate Program
↓
Affiliate Link
↓
Deal Record

Affiliate link directly frontend mein generate nahi hogi.


---

61. Search Integration

Active deals Search Engine ko feed hongi.

Search index fields:

Title

Merchant

Category

Product

Brand

Country

Discount

Price

Keywords

Availability


Expired deals active search index se remove/disable hongi.


---

62. Recommendation Integration

Recommendation Engine deal metadata use karega:

Category

Product

Merchant

Country

Price

Discount

Popularity

User preferences


Recommendation Engine central Deal Database se data consume karega.


---

63. PSEO Integration

Deal pipeline PSEO engine ko structured data provide karegi.

Possible pages:

/deals/
/deals/electronics/
/deals/shoes/
/deals/amazon/
/deals/usa/
/deals/under-50/
/deals/50-percent-off/

PSEO pages active/valid deal data se generate hongi.


---

64. Telegram Integration

Telegram Bot aur Mini App:

Central Deal Database
↓
API
↓
Telegram Bot
Telegram Mini App

Telegram systems independently deal databases maintain nahi karenge.


---

65. Notification Integration

Important deal events notification engine ko feed kar sakte hain.

Examples:

Flash sale

Price drop

Coupon expiring

Deal ending

User preference match


Flow:

Deal Event
↓
Notification Engine
↓
Telegram / Email / Push / Other Channel


---

66. AI Integration — Future

Future AI layer:

Deal classification

Title cleanup

Description generation

Category mapping

Duplicate detection assistance

Merchant matching

Product matching

Deal quality analysis

Anomaly detection


AI output directly publish nahi hoga jab tak required validation pass na kare.


---

67. AI Guardrails

AI-assisted data processing mein:

Source data preserve hoga

Original values overwrite nahi honge without rules

Confidence score store ho sakta hai

Human review required for sensitive changes

Invalid output reject hoga

AI-generated content clearly separated ho sakta hai



---

68. Admin Review Queue

Admin dashboard:

Pending Deals
Duplicate Candidates
Price Conflicts
Broken URLs
Invalid Images
Suspicious Discounts
Failed Imports
AI Review

Admin actions:

Approve
Reject
Edit
Merge
Retry
Pause
Publish


---

69. Audit Trail

Important deal changes log honge:

deal_id
action
actor
old_value
new_value
timestamp
source
reason

Is se deal history traceable rahegi.


---

70. Data Lineage

Har canonical deal ka source traceable hona chahiye.

Example:

Canonical Deal
↓
Source Record
↓
Source
↓
External Deal ID
↓
Original Data

Is se kisi bhi deal ko original source tak trace kiya ja sakta hai.


---

71. Multi-Source Deal Intelligence

Ek deal multiple sources se aa sakti hai.

GDN system:

Source A
Source B
Source C
       ↓
Data Comparison
       ↓
Best Valid Data
       ↓
Canonical Deal

Is se data quality improve ho sakti hai.


---

72. Deal Freshness

Deal freshness important ranking signal ho sakta hai.

Possible states:

fresh
recent
aging
stale
expired

Freshness source sync aur last verification se calculate ki ja sakti hai.


---

73. Global Scalability

Pipeline future mein support karegi:

Millions of deals

Thousands of merchants

Multiple affiliate networks

Multiple countries

Multiple currencies

Multiple languages

High-frequency price updates

Millions of daily events


Architecture asynchronous aur modular rahegi.


---

74. Observability

Pipeline monitoring:

Jobs processed

Jobs failed

Processing time

Source latency

Duplicate rate

Validation failure rate

Publishing rate

Expiry rate

Queue depth

Worker health



---

75. Pipeline Metrics

Core metrics:

Deals Imported
Deals Validated
Deals Rejected
Deals Published
Deals Expired
Duplicates Detected
Price Changes
Source Errors
Processing Time


---

76. Security

Pipeline security:

API credentials server-side

Secrets encrypted

Input validation

Source allowlisting

SSRF protection

URL validation

Rate limiting

Authentication

Authorization

Audit logging



---

77. SSRF Protection

External URL fetching controlled hoga.

System:

Arbitrary internal IP access block karega

Private network ranges block karega

Allowed protocols restrict karega

Redirect destinations validate karega

Source allowlist use karega where appropriate



---

78. Environment Separation

Pipeline environments:

Development
Staging
Production

Production source credentials development mein use nahi honge.


---

79. Testing

Pipeline testing:

Unit

Parsers

Normalizers

Validators

Deduplication

Price calculations


Integration

Source APIs

Feed imports

Database

Affiliate Engine


Load

Large feeds

High event volume

Parallel processing


Regression

Existing sources

Existing deal schemas

Existing publishing rules



---

80. Recommended Module Structure

Conceptual backend:

src/
  pipeline/
    ingestion/
    sources/
    raw/
    normalization/
    validation/
    deduplication/
    enrichment/
    verification/
    publishing/
    expiration/
    history/
    reconciliation/
    monitoring/
    queues/
    workers/


---

81. End-to-End Pipeline

Complete flow:

Deal Source
↓
Source Adapter
↓
Ingestion
↓
Raw Data
↓
Normalization
↓
Cleaning
↓
Merchant Matching
↓
Product Matching
↓
Category Mapping
↓
Country Mapping
↓
Price Validation
↓
Deduplication
↓
Enrichment
↓
Affiliate Mapping
↓
Verification
↓
Admin Review if Required
↓
Approval
↓
Central Deal Database
↓
Search / Recommendation / PSEO
↓
Website / Telegram Bot / Telegram Mini App / Future Channels


---

82. Single Source of Truth

Central Deal Database GDN ka official deal source hoga.

Website:

API → Deal Database

Telegram Bot:

API → Deal Database

Telegram Mini App:

API → Deal Database

Future channels:

API → Deal Database

Kisi channel mein independent deal database maintain nahi hoga.


---

83. Final Architecture Principle

GDN ka Deal Data Pipeline raw global deal data ko reliable, structured aur monetizable canonical deal data mein convert karega.

Final principle:

Many Sources
↓
One Pipeline
↓
One Canonical Deal Database
↓
Many Distribution Channels

Website, Telegram Bot, Telegram Mini App aur future channels independently deal data systems implement nahi karenge.

Sab channels centralized Deal Database aur Central API ko consume karenge.

Is architecture ki wajah se GDN future mein millions of deals, thousands of merchants, multiple affiliate networks, global countries, multiple currencies aur multiple distribution channels ko ek unified deal infrastructure ke andar manage kar sakega.
