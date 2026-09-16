# GDN Affiliate Architecture

## 1. Purpose

Global Deals Network (GDN) ka Affiliate Engine centralized system hoga jo:

- Affiliate networks manage karega
- Merchants aur affiliate programs manage karega
- Affiliate links generate/store karega
- Clicks track karega
- Users ko merchant tak redirect karega
- Conversions track karega
- Commission aur revenue calculate karega
- Revenue ko deal, merchant, campaign aur user journey se attribute karega

Affiliate Engine GDN ke tamam channels ke liye single centralized system hoga.

---

# 2. Core Principle

Affiliate data kisi frontend mein hardcode nahi hoga.

Central flow:

User
→ GDN Frontend / Telegram / Mini App
→ Affiliate Redirect API
→ Click Tracking
→ Affiliate Link
→ Merchant
→ Conversion
→ Affiliate Network
→ Commission
→ GDN Revenue Database

Central Affiliate Engine single source of truth hoga.

---

# 3. Affiliate Architecture Components

Affiliate system ke major components:

1. Affiliate Networks
2. Affiliate Programs
3. Merchants
4. Affiliate Accounts
5. Affiliate Links
6. Affiliate Link Templates
7. Tracking Parameters
8. Redirect Engine
9. Click Tracking
10. Conversion Tracking
11. Commission Tracking
12. Revenue Attribution
13. SubID Management
14. Campaign Tracking
15. Deal Attribution
16. User Attribution
17. Revenue Reporting
18. Affiliate Health Monitoring

---

# 4. Affiliate Networks

GDN multiple affiliate networks support karega.

Examples:

- Awin
- CJ
- Impact
- Rakuten Advertising
- ShareASale
- Partnerize
- Admitad
- Amazon Associates
- Direct Merchant Programs
- Future affiliate networks

Network record mein:

- network_id
- network_name
- network_slug
- website
- API availability
- tracking method
- reporting method
- currency
- status
- credentials reference
- created_at
- updated_at

Sensitive credentials database mein plain text mein store nahi hongi.

---

# 5. Affiliate Programs

Ek network ke andar multiple affiliate programs ho sakte hain.

Example:

Network:
Impact

Programs:

- Merchant A
- Merchant B
- Merchant C

Affiliate Program fields:

- program_id
- network_id
- merchant_id
- external_program_id
- program_name
- status
- commission_type
- commission_rate
- cookie_duration
- approval_status
- deeplink_support
- API_support
- created_at
- updated_at

---

# 6. Merchants

Merchant central GDN merchant entity se connected hoga.

Merchant fields:

- merchant_id
- merchant_name
- slug
- website
- logo
- country
- region
- currency
- category
- affiliate_status
- trust_status
- active_status
- created_at
- updated_at

Ek merchant ke multiple affiliate programs ho sakte hain.

---

# 7. Affiliate Accounts

GDN ke affiliate network accounts centralized manage honge.

Fields:

- account_id
- network_id
- account_name
- external_account_id
- account_status
- api_enabled
- reporting_enabled
- credential_reference
- created_at
- updated_at

Credentials secure secrets manager mein store honge.

---

# 8. Affiliate Links

Affiliate links centralized database mein store honge.

Fields:

- affiliate_link_id
- affiliate_program_id
- merchant_id
- deal_id
- product_id
- destination_url
- affiliate_url
- tracking_template_id
- status
- created_at
- updated_at

Frontend affiliate URL directly expose ya hardcode nahi karega.

Frontend sirf internal redirect endpoint use karega.

Example:

`/go/deal/abc123`

---

# 9. Affiliate Link Generation

Affiliate links do ways se generate ho sakte hain:

## Method 1 — API

Affiliate network API ke through.

Flow:

GDN
→ Affiliate Network API
→ Generated Affiliate Link
→ GDN Database

## Method 2 — Template

Agar network API available nahi hai:

Destination URL
→ Tracking Template
→ Affiliate URL

Example conceptual structure:

```text
https://merchant.com/product
+
affiliate parameters
+
sub_id
+
campaign

Actual parameters network-specific honge.


---

10. Tracking Parameters

Har affiliate click ko unique tracking parameters mil sakte hain.

Possible parameters:

click_id

user_id

deal_id

product_id

merchant_id

campaign_id

source

channel

placement

country

device

session_id


Sensitive personal information tracking parameters mein include nahi ki jayegi.


---

11. SubID System

SubID system affiliate attribution ka important component hoga.

Example:

subid1 = deal_id
subid2 = channel
subid3 = campaign_id
subid4 = placement

Example:

deal_92831
telegram
summer_sale
featured_deal

Is se GDN identify kar sakta hai:

Kaunsi deal se click aya

Kis channel se aya

Kis campaign se aya

Kis placement se aya



---

12. Affiliate Redirect Engine

User direct affiliate URL par nahi jayega.

Flow:

User
↓
GDN URL
↓
Redirect API
↓
Validate Deal
↓
Validate Affiliate Link
↓
Create Click Record
↓
Generate Tracking Parameters
↓
Affiliate URL
↓
Merchant

Example:

https://globaldealsnetwork.com/go/deal/92831

Redirect engine:

1. Deal validate kare


2. Deal active hai ya nahi check kare


3. Affiliate link validate kare


4. Click ID generate kare


5. Click record create kare


6. Tracking parameters attach kare


7. Merchant par redirect kare




---

13. Redirect Security

Redirect engine open redirect vulnerability allow nahi karega.

System sirf approved affiliate URLs par redirect karega.

Allowed destination:

Approved merchant domain

Approved affiliate network

Approved affiliate URL


Arbitrary user-supplied URL redirect allowed nahi hoga.


---

14. Click Tracking

Har affiliate click centralized record create karega.

Click fields:

click_id

affiliate_link_id

deal_id

merchant_id

product_id

user_id

session_id

channel

campaign_id

placement

country

device_type

referrer

timestamp


Optional anonymous analytics:

browser family

operating system

language

approximate region


Privacy requirements ke mutabiq data minimize kiya jayega.


---

15. Click Attribution

Click ko multiple dimensions se attribute kiya ja sakta hai.

Primary attribution:

User
→ Session
→ Deal
→ Affiliate Link
→ Merchant

Secondary attribution:

Channel
Campaign
Placement
Country
Device

Example:

Telegram
→ Mini App
→ Electronics Deal
→ Amazon
→ Click


---

16. Conversion Tracking

Conversion affiliate network se receive ho sakti hai:

API

Webhook

Network report

CSV import

Manual reconciliation


Conversion fields:

conversion_id

network_id

affiliate_program_id

merchant_id

affiliate_link_id

click_id

order_reference

order_value

commission

currency

conversion_status

conversion_date

approval_status



---

17. Conversion Status

Supported statuses:

pending
approved
rejected
cancelled
reversed

Revenue reporting mein sirf approved/reconciled conversions ko finalized revenue consider kiya jayega.


---

18. Commission Model

GDN different commission models support karega.

Percentage

Order Value × Commission %

Fixed

Fixed Commission

Tiered

Example:

0–10 sales     → 3%
11–50 sales    → 5%
51+ sales      → 7%

Hybrid

Fixed + percentage.

Commission data historical snapshot ke taur par store ki jayegi taake future rate changes purani conversions ko alter na karein.


---

19. Revenue Attribution

Revenue ko multiple entities se connect kiya jayega.

Primary:

Conversion
→ Click
→ Affiliate Link
→ Deal
→ Merchant

Secondary:

User
Channel
Campaign
Country
Placement

Is se reporting possible hogi:

Revenue per deal

Revenue per merchant

Revenue per category

Revenue per country

Revenue per channel

Revenue per campaign

Revenue per Telegram source

Revenue per website page



---

20. Affiliate Revenue Ledger

Central revenue ledger maintain hoga.

Fields:

revenue_id

conversion_id

merchant_id

network_id

deal_id

order_value

commission_amount

currency

status

conversion_date

approved_date

payout_date

created_at


Revenue ledger immutable financial history maintain karega.


---

21. Currency Handling

Global system multiple currencies support karega.

Example:

USD

GBP

EUR

CAD

AUD

AED

NZD

JPY


Original transaction currency preserve hogi.

Optional reporting currency:

USD

Currency conversion historical reporting ke liye exchange-rate snapshot store kiya ja sakta hai.


---

22. Affiliate Campaigns

Campaign entity affiliate traffic ko organize karegi.

Campaign fields:

campaign_id

campaign_name

campaign_type

start_at

end_at

channel

country

merchant_id

status


Examples:

Black Friday 2026
Amazon Electronics
UK Christmas Deals
Telegram Weekend Deals


---

23. Placement Tracking

Ek deal multiple placements mein show ho sakti hai.

Examples:

Homepage

Category page

Search result

Deal page

Telegram Bot

Telegram Mini App

Newsletter

Social media

Push notification


Har placement ka tracking identifier ho sakta hai.

Example:

homepage_featured
telegram_bot
miniapp_home
category_sidebar
newsletter_top


---

24. Channel Attribution

GDN channels:

web
telegram_bot
telegram_mini_app
email
sms
youtube
tiktok
reddit
x
social

Affiliate clicks channel ke saath record honge.

Is se channel-level revenue comparison possible hoga.


---

25. Deal-Level Attribution

Har affiliate link optionally deal se connected hoga.

Example:

Deal:
"50% Off Running Shoes"

↓
Affiliate Link

↓
Click

↓
Conversion

↓
Commission

Is se exact deal revenue identify ki ja sakti hai.


---

26. Product-Level Attribution

Affiliate link product se bhi connected ho sakta hai.

Example:

Product
↓
Multiple Deals
↓
Affiliate Links
↓
Clicks
↓
Conversions

Product-level performance:

clicks

conversions

conversion rate

revenue

commission



---

27. Affiliate Link Lifecycle

Affiliate link lifecycle:

created
↓
validated
↓
active
↓
paused
↓
expired
↓
disabled

Invalid ya expired links users ko redirect nahi karenge.

System alternative active affiliate link search kar sakta hai.


---

28. Affiliate Link Validation

Automated validation checks:

URL format

Merchant domain

Affiliate network

HTTP response

Redirect chain

Affiliate parameters

Program status

Link expiry


Failed validation:

active → warning

Repeated failure:

warning → disabled


---

29. Affiliate Program Health

System affiliate programs monitor karega.

Metrics:

Active links

Broken links

Click volume

Conversion rate

Revenue

EPC

Approval rate

Reversal rate

Last successful conversion


Low-performing ya broken programs admin dashboard mein flag honge.


---

30. EPC

Earnings Per Click:

EPC = Commission / Clicks

EPC network, merchant, deal aur campaign level par calculate kiya ja sakta hai.

Example:

Clicks = 10,000
Commission = $500

EPC = $0.05


---

31. Conversion Rate

Conversion rate:

Conversion Rate =
Conversions / Clicks × 100

System calculate kar sakta hai:

Merchant conversion rate

Deal conversion rate

Campaign conversion rate

Channel conversion rate



---

32. Attribution Windows

Affiliate attribution windows configurable honge.

Examples:

1 day
7 days
30 days
90 days

Network ke actual cookie/attribution rules primary source honge.

GDN apni internal click attribution window separately maintain kar sakta hai.


---

33. Attribution Model

Default model:

Last Eligible GDN Affiliate Click

Future support:

First click

Last click

Campaign attribution

Assisted conversion

Multi-touch attribution


Attribution model configuration-driven hoga.


---

34. Duplicate Conversion Protection

Same conversion multiple times import ho sakti hai.

System duplicate protection use karega.

Unique key example:

network_id
+
external_conversion_id

Duplicate conversion:

ignored / reconciled

Financial totals double count nahi honge.


---

35. Conversion Reconciliation

Affiliate network aur GDN records periodically reconcile honge.

Flow:

GDN Clicks
↓
Network Conversions
↓
Match
↓
Validate
↓
Update Status
↓
Revenue Ledger

Mismatch cases admin dashboard mein show honge.


---

36. Affiliate Data Import

System support karega:

API import

Webhook

CSV import

Scheduled sync

Manual import


Import jobs background workers ke through execute honge.


---

37. Affiliate API Integration

Network-specific integrations isolated modules mein hongi.

Example structure:

affiliate/
  networks/
    awin/
    cj/
    impact/
    rakuten/
    amazon/

Har integration standard internal interface follow karegi.

Example conceptual interface:

getPrograms()
getLinks()
getConversions()
getReports()
generateDeepLink()


---

38. Affiliate Engine Internal Interface

Core Affiliate Engine network-specific implementation par directly depend nahi karega.

Architecture:

Affiliate Engine
       ↓
Network Adapter Interface
       ↓
Awin / CJ / Impact / etc.

Is se new affiliate network easily add kiya ja sakega.


---

39. Affiliate Redirect API

Example endpoint:

GET /api/v1/affiliate/redirect/{deal_id}

Responsibilities:

1. Deal lookup


2. Affiliate link lookup


3. Eligibility validation


4. Click ID creation


5. Attribution data creation


6. Tracking record


7. Affiliate URL generation


8. Redirect




---

40. Click Tracking API

Example:

POST /api/v1/affiliate/click

Payload:

{
  "affiliate_link_id": "alink_123",
  "deal_id": "deal_123",
  "channel": "telegram_mini_app",
  "campaign_id": "campaign_123",
  "placement": "featured_deal"
}

API click ID generate karegi.


---

41. Conversion Webhook

Example:

POST /api/v1/affiliate/webhooks/{network}

Webhook:

Network
↓
Webhook
↓
Signature Verification
↓
Payload Validation
↓
Duplicate Check
↓
Conversion Record
↓
Revenue Ledger

Webhook signature verify karna mandatory hoga jab network support kare.


---

42. Affiliate Security

Security rules:

API keys server-side only

Affiliate credentials encrypted

Webhook signature validation

Admin-only affiliate configuration

Rate limiting

Redirect allowlist

Input validation

Audit logs

No sensitive credentials in frontend

No affiliate credentials in Git repository



---

43. Affiliate Fraud Detection

Future fraud detection support karega.

Signals:

Abnormally high clicks

Repeated click patterns

Suspicious traffic

Excessive redirects

Conversion anomalies

Duplicate conversion patterns

Bot traffic


Fraud detection automated flag generate karega.

Final action admin review ke through ho sakta hai.


---

44. Affiliate Analytics

Dashboard metrics:

Traffic

Clicks

Unique clicks

CTR


Conversion

Conversions

Conversion rate

Approved conversions

Reversed conversions


Revenue

Order value

Commission

EPC

Revenue by merchant

Revenue by deal

Revenue by channel



---

45. Affiliate Reporting Dimensions

Reports filter kar sakte hain:

Date

Country

Merchant

Affiliate network

Affiliate program

Deal

Product

Category

Channel

Campaign

Placement

Device



---

46. Affiliate Dashboard

Admin dashboard sections:

Affiliate Overview
Networks
Programs
Merchants
Affiliate Links
Clicks
Conversions
Revenue
Campaigns
Reports
Broken Links
Reconciliation
Fraud Alerts


---

47. Affiliate Database Relationships

Core relationship:

Affiliate Network
      ↓
Affiliate Account
      ↓
Affiliate Program
      ↓
Merchant
      ↓
Affiliate Link
      ↓
Deal
      ↓
Click
      ↓
Conversion
      ↓
Revenue

Supporting relationships:

User
Campaign
Channel
Product
Category
Country
Placement


---

48. Affiliate Event System

Affiliate events:

affiliate_link_created
affiliate_link_updated
affiliate_link_disabled
affiliate_click
affiliate_redirect
conversion_received
conversion_approved
conversion_rejected
conversion_reversed
commission_recorded
payout_received

Events analytics aur audit system ko feed kar sakte hain.


---

49. Background Jobs

Affiliate background jobs:

syncAffiliatePrograms
syncAffiliateLinks
syncConversions
validateAffiliateLinks
reconcileConversions
updateRevenue
calculateAffiliateMetrics
detectAffiliateAnomalies

Heavy operations request-response cycle ke andar execute nahi kiye jayenge.


---

50. Caching

Cache candidates:

Merchant affiliate status

Affiliate programs

Affiliate link metadata

Network configuration

Campaign configuration


Click tracking aur conversion records real-time/near-real-time persist honge.


---

51. Affiliate Database Indexes

Important indexes:

merchant_id
affiliate_program_id
affiliate_link_id
deal_id
product_id
click_id
conversion_id
network_id
campaign_id
created_at
conversion_date
status

High-volume click tables partitioning consider ki jayegi.


---

52. Data Retention

Affiliate financial records long-term retain kiye jayenge according to business, legal aur accounting requirements.

High-volume raw analytics data ke liye:

aggregation

archival

retention policies


use ki ja sakti hain.

Financial records unnecessarily delete nahi kiye jayenge.


---

53. Privacy

Affiliate system:

Minimum required user data store karega

Sensitive personal information avoid karega

Tracking configuration privacy requirements ke mutabiq hogi

Anonymous analytics support karega

User deletion/privacy workflows ke saath integrate hoga



---

54. Telegram Affiliate Flow

Telegram Bot:

Telegram User
↓
Deal Message
↓
Affiliate CTA
↓
GDN Redirect API
↓
Click Tracking
↓
Merchant

Telegram Mini App:

Mini App
↓
Deal
↓
Affiliate CTA
↓
Affiliate Redirect API
↓
Click
↓
Merchant

Dono same Affiliate Engine use karenge.


---

55. Website Affiliate Flow

Google / Direct Traffic
↓
GDN Deal Page
↓
Deal CTA
↓
Affiliate Redirect API
↓
Click Tracking
↓
Merchant

Frontend affiliate URL hardcode nahi karega.


---

56. Social Affiliate Flow

Social channels se traffic GDN landing/deal pages par aa sakta hai.

Example:

TikTok
↓
GDN Deal Page
↓
Affiliate CTA
↓
Affiliate Engine
↓
Merchant

Campaign aur channel tracking preserve ki jayegi.


---

57. Deep Linking

Affiliate links product-level ya deal-level deep links support karenge.

Example:

Merchant Homepage

ke bajaye:

Merchant Product Page

Deep link destination database mein store hogi.


---

58. Fallback Affiliate Link

Agar primary affiliate link unavailable ho:

Primary Link
↓
Invalid
↓
Alternative Affiliate Program
↓
Alternative Link

Agar koi valid affiliate link available na ho:

Safe Merchant URL

use kiya ja sakta hai according to business rules.


---

59. Affiliate Link Priority

Multiple links ke case mein priority rules:

1. Active
2. Verified
3. Highest priority
4. Preferred network
5. Best tracking capability

Future mein performance-based dynamic routing support ki ja sakti hai.


---

60. Smart Affiliate Routing — Future

Future Affiliate Engine user/channel context ke basis par suitable merchant/affiliate route select kar sakta hai.

Possible signals:

Country

Currency

Merchant availability

Affiliate availability

Device

Campaign

Deal eligibility


Example:

US User
→ US Merchant Link

UK User
→ UK Merchant Link

Routing business rules ke through controlled hogi.


---

61. Affiliate Performance Optimization

Future optimization:

Clicks
↓
Conversions
↓
Revenue
↓
EPC
↓
Performance Analysis
↓
Routing / Placement Optimization

System historical performance data use karke affiliate placement aur routing improve kar sakta hai.


---

62. Revenue Attribution Chain

Complete chain:

User
↓
Channel
↓
Campaign
↓
Placement
↓
Deal
↓
Affiliate Link
↓
Click
↓
Merchant
↓
Order
↓
Conversion
↓
Commission
↓
Revenue

Ye GDN monetization analytics ka primary attribution chain hoga.


---

63. Affiliate Source of Truth

Affiliate system mein:

Affiliate Networks
        ↓
Affiliate Programs
        ↓
Affiliate Links
        ↓
Clicks
        ↓
Conversions
        ↓
Revenue

Central database source of truth hoga.

Kisi bhi frontend mein duplicate affiliate logic maintain nahi ki jayegi.


---

64. API Separation

Affiliate business logic backend services mein rahegi.

Frontend:

UI
↓
API

Backend:

API
↓
Affiliate Service
↓
Database

Frontend direct affiliate network APIs access nahi karega.


---

65. Scalability

System future mein support karega:

Thousands of merchants

Millions of affiliate links

Millions of clicks

Large conversion datasets

Multiple affiliate networks

Multiple countries

Multiple currencies

Multiple channels


High-volume tables ko optimize aur partition kiya ja sakta hai.


---

66. Failure Handling

Affiliate failure cases:

Network API unavailable

Retry + queue.

Affiliate link broken

Mark invalid + fallback.

Conversion webhook failure

Retry with idempotency.

Duplicate conversion

Ignore/reconcile.

Database failure

Queue/retry + monitoring.


---

67. Observability

Affiliate Engine monitor karega:

Redirect latency

Click events

Conversion ingestion

API errors

Network API failures

Broken links

Revenue anomalies

Webhook failures


Critical failures alerts generate karenge.


---

68. Audit Logs

Admin affiliate actions log hongi:

Who
What
When
Old Value
New Value
Reason

Examples:

Affiliate program disabled

Link changed

Commission setting changed

Merchant status changed

Conversion manually reconciled



---

69. Testing

Affiliate system ke tests:

Unit Tests

Link generation

Tracking parameter generation

Attribution

Commission calculation


Integration Tests

Network adapters

Webhooks

Redirect API

Conversion import


Security Tests

Open redirect

Unauthorized access

Invalid webhook

Credential exposure


Load Tests

High click volume

High redirect volume

Conversion ingestion



---

70. Development Environment

Affiliate system environments:

Development
Staging
Production

Affiliate credentials environment-specific honge.

Production affiliate credentials development environment mein use nahi honge.


---

71. Environment Variables

Conceptual variables:

AFFILIATE_NETWORK_API_KEY
AFFILIATE_NETWORK_API_SECRET
AFFILIATE_WEBHOOK_SECRET
AFFILIATE_DEFAULT_CURRENCY
AFFILIATE_REDIRECT_DOMAIN

Secrets Git repository mein commit nahi honge.


---

72. Recommended Module Structure

Conceptual backend structure:

src/
  affiliate/
    networks/
      awin/
      cj/
      impact/
      rakuten/
      amazon/
    programs/
    merchants/
    links/
    redirects/
    clicks/
    conversions/
    revenue/
    attribution/
    reconciliation/
    analytics/
    fraud/


---

73. Affiliate Service Boundaries

Major services:

AffiliateNetworkService
AffiliateProgramService
AffiliateLinkService
AffiliateRedirectService
AffiliateClickService
AffiliateConversionService
AffiliateRevenueService
AffiliateAttributionService
AffiliateReconciliationService
AffiliateAnalyticsService

Services modular honge.


---

74. Affiliate Engine and Deal Engine

Deal Engine:

Deal

Affiliate Engine:

How user reaches merchant
How click tracked hota hai
How conversion tracked hoti hai
How revenue attributed hota hai

Dono separate but connected systems honge.


---

75. Affiliate Engine and User Engine

User Engine user context provide kar sakta hai:

User
Country
Preferences
Session
Channel

Affiliate Engine attribution provide karega:

Click
Deal
Merchant
Conversion
Revenue

Sensitive user information unnecessarily affiliate records mein duplicate nahi ki jayegi.


---

76. Affiliate Engine and Analytics

Affiliate events Analytics Engine ko feed karenge.

Example:

affiliate_click
affiliate_conversion
affiliate_revenue

Analytics aggregated reporting generate karega.


---

77. Affiliate Engine and AI

Future AI Layer affiliate data ko use kar sakta hai for:

Deal recommendation

Merchant recommendation

Affiliate performance insights

Revenue optimization

Broken-link detection

Deal quality scoring

Personalized discovery


AI directly financial records modify nahi karega.


---

78. Affiliate Governance Rules

Mandatory rules:

1. Affiliate links centralized hon.


2. Affiliate credentials frontend mein nahi hon.


3. Open redirects allowed nahi.


4. Click tracking centralized ho.


5. Conversion deduplication mandatory ho.


6. Revenue ledger maintain ho.


7. Network-specific logic adapters mein isolate ho.


8. Financial records auditable hon.


9. Expired affiliate links disable hon.


10. Affiliate data central database se serve ho.




---

79. Complete Affiliate Flow

Merchant
    ↓
Affiliate Network
    ↓
Affiliate Program
    ↓
Affiliate Link
    ↓
GDN Deal Database
    ↓
GDN Website / Telegram / Mini App
    ↓
User Click
    ↓
Affiliate Redirect API
    ↓
Click Tracking
    ↓
Tracking Parameters
    ↓
Merchant
    ↓
Purchase
    ↓
Affiliate Network
    ↓
Conversion
    ↓
GDN Conversion Engine
    ↓
Revenue Ledger
    ↓
Analytics
    ↓
Admin Dashboard


---

80. Final Architecture Principle

Global Deals Network ka Affiliate Engine ek centralized, modular aur scalable monetization layer hoga.

Final principle:

Deal Database
      ↓
Affiliate Engine
      ↓
Tracking
      ↓
Merchant
      ↓
Conversion
      ↓
Revenue
      ↓
Analytics

Website, Telegram Bot, Telegram Mini App aur future channels independently affiliate systems implement nahi karenge.

Sab channels centralized Affiliate Engine ko consume karenge.

Is architecture ki wajah se GDN future mein multiple affiliate networks, millions of deals, global merchants, multiple currencies aur multiple distribution channels ko ek unified monetization infrastructure ke andar manage kar sakega.
