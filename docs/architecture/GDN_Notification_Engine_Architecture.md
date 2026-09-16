GDN Notification Engine Architecture

1. Purpose

GDN Notification Engine ka purpose users ko relevant deals, price drops, coupons, availability updates aur personalized alerts correct time aur correct channel par deliver karna hai.

Notification system centralized hoga aur Website, Telegram Bot, Telegram Mini App, Email, SMS aur future channels isi engine ko use karenge.

---

2. Core Principle

Many Events → One Notification Engine → User Preferences + Consent → Channel Router → Multiple Notification Channels → Tracking & Attribution

---

3. Notification Engine Role

Notification Engine:

- notification events receive karega
- user eligibility check karega
- country/market context verify karega
- preferences apply karega
- frequency limits apply karega
- correct channel select karega
- notification generate karega
- send/schedule karega
- delivery track karega
- clicks track karega
- conversions/revenue attribute karega

---

4. Centralized Notification Architecture

Kisi individual channel ko apna independent notification logic nahi banana chahiye.

Website, Telegram Bot, Telegram Mini App, Email aur future channels:

Central Notification Engine → Channel Delivery

use karenge.

---

5. Notification Sources

Notification events multiple GDN systems se aa sakte hain:

- Deal Engine
- Deal Data Pipeline
- Price Comparison Engine
- Product Search Engine
- Recommendation Engine
- User Preference Engine
- Affiliate Engine
- Analytics Engine
- PSEO Engine
- Admin Dashboard
- Campaign Engine

---

6. Notification Types

GDN support karega:

- New Deal Alert
- Price Drop Alert
- Coupon Alert
- Discount Alert
- Back-in-Stock Alert
- Ending Soon Alert
- New Product Alert
- Personalized Deal Alert
- Merchant Alert
- Brand Alert
- Category Alert
- Product Watch Alert
- Price Threshold Alert
- Trending Deal Alert
- Deal Digest
- Campaign Notification

---

7. Country-Based Notification Principle

User ko alerts uski active country/market ke according hi milenge.

Example:

USA user:

- USA stores
- USA prices
- USA deals
- USA coupons
- USA shipping
- USA affiliate offers

UAE user:

- UAE stores
- AED prices
- UAE deals
- UAE coupons
- UAE availability
- UAE affiliate offers

---

8. Active Market Context

User ke liye ek Active Market Context maintain hoga.

Is mein:

- country
- currency
- language
- timezone
- eligible merchants
- eligible offers
- shipping market
- affiliate programs

include honge.

---

9. Automatic Country Detection

Initial market automatic signals se determine ho sakta hai:

- IP country
- Telegram country-related signals where available
- browser locale
- account preference

Automatic detection sirf initial/default market determine karega.

---

10. Manual Country Selection

User manually country select kar sakta hai.

Manual selection automatic detection par priority rakhegi.

Example:

Detected country = UAE

User selects = USA

Active Market = USA

Future alerts USA market ke according honge.

---

11. Country Notification Isolation

Notification Engine ko doosri country ki irrelevant offers user ko nahi bhejni chahiye.

Example:

UAE active market user ko:

- USA-only coupon
- USA-only store
- USA-only shipping offer

default notification nahi milegi.

---

12. Future Multi-Market Alerts

Future mein user multiple markets ke alerts separately opt-in kar sakta hai.

Example:

- UAE Deals
- USA Deals
- UK Deals

Lekin default architecture:

One Active Market → Primary Notification Market

hoga.

---

13. Country + Category Alerts

User country ke andar specific categories follow kar sakta hai.

Example:

USA:

- Electronics
- Fashion
- Travel

Notification Engine sirf relevant combinations generate karega.

---

14. Country + Merchant Alerts

User specific merchants follow kar sakta hai.

Example:

- Amazon USA
- Walmart USA
- Best Buy USA

Merchant notification bhi active market ke saath validate hogi.

---

15. Country + Brand Alerts

Brand alerts bhi market-aware honge.

Example:

Nike USA deal aur Nike UAE deal separate offers honge.

---

16. Country + Product Alerts

Product watch alerts:

- product
- country
- target price
- currency
- preferred merchants

ke combination par based honge.

---

17. Currency Context

Notification price active market currency mein show karegi.

Examples:

- USD
- AED
- GBP
- CAD
- AUD

Currency conversion actual market price ko replace nahi karegi jab verified local price available ho.

---

18. Notification Channels

Initial/future channels:

1. Telegram Bot
2. Telegram Mini App
3. Email
4. SMS
5. Web Push
6. WhatsApp
7. Other future messaging channels

---

19. Telegram Bot Notifications

Telegram Bot primary real-time notification channel ho sakta hai.

Examples:

- New deal
- Price drop
- Coupon
- Ending soon
- Back in stock
- Personalized alert

---

20. Telegram Mini App Notification Center

Mini App ke andar user notification center dekh sakega.

Possible sections:

- New
- Price Drops
- Saved Deals
- Alerts
- Recommendations
- Expiring Soon

---

21. Email Notifications

Email support:

- deal alerts
- price drops
- daily digest
- weekly digest
- personalized recommendations
- campaign notifications

ke liye use hoga.

---

22. SMS Notifications

SMS high-priority alerts ke liye future channel ho sakta hai.

Example:

- major price drop
- important availability alert
- user-selected urgent alert

SMS default channel nahi hoga jab tak user consent na de.

---

23. Web Push

Future Web Push:

- browser notifications
- price drops
- deal alerts
- personalized offers

support karega.

---

24. WhatsApp

Future WhatsApp integration centralized Notification Engine ke through hogi.

WhatsApp ka independent notification logic nahi banega.

---

25. User Consent

Notification bhejne se pehle user consent aur channel opt-in verify hoga.

Consent categories:

- Telegram
- Email
- SMS
- Push
- WhatsApp

---

26. Unsubscribe

Har supported channel mein unsubscribe capability hogi.

User:

- specific alert disable
- category disable
- merchant disable
- channel disable
- all marketing notifications disable

kar sakega.

---

27. Notification Preferences

User preferences mein:

- country
- categories
- merchants
- brands
- products
- deal types
- price thresholds
- channels
- frequency
- quiet hours
- language
- timezone

store honge.

---

28. Preference Priority

Preference hierarchy:

Explicit User Preference > Default Preference > Behavioral Signal

Explicit user settings automatically override inferred preferences.

---

29. Notification Frequency

Supported frequency:

- Immediate
- Hourly digest
- Daily digest
- Weekly digest
- Custom schedule

---

30. Frequency Caps

Spam prevent karne ke liye caps honge.

Examples:

- maximum daily notifications
- maximum hourly notifications
- maximum category notifications
- maximum campaign notifications

---

31. Quiet Hours

User quiet hours define kar sakta hai.

Example:

22:00 → 08:00

Non-urgent notifications queue mein hold ho sakti hain.

---

32. Timezone

Notifications user timezone ke according schedule hongi.

Example:

UAE user → UAE timezone

USA user → relevant USA timezone

---

33. Urgency Levels

Notifications ke priority levels:

- Low
- Normal
- High
- Critical

Priority delivery behavior ko control karegi.

---

34. Deal Alert

Deal Engine new eligible deal event generate karega.

Notification Engine:

1. deal country check
2. category check
3. user preference check
4. consent check
5. frequency check
6. channel check
7. notification generate

karega.

---

35. Price Drop Alert

Price Comparison Engine price change detect karega.

Example:

Previous price: $500
New price: $399

Agar user ka configured threshold match kare to Price Drop Event generate hoga.

---

36. Price Drop Threshold

User set kar sakta hai:

- percentage drop
- fixed amount drop
- target price

Example:

“Notify me when price goes below $400.”

---

37. Back-in-Stock Alert

Agar watched product unavailable se available ho jaye:

Back-in-Stock Event

generate hoga.

Notification country-specific offer availability ke according hogi.

---

38. Ending Soon Alert

Deal expiry time near hone par:

- Ending Soon
- Last Chance

type notification generate ho sakti hai.

Sirf active market ke eligible deal par alert generate hoga.

---

39. Coupon Alert

Valid coupon detect hone par matching users ko notification mil sakti hai.

Coupon:

- merchant
- country
- category
- expiry
- eligibility

validate hoga.

---

40. Personalized Deal Alert

Recommendation Engine user signals ke basis par relevant deals identify karega.

Notification Engine sirf eligible users ko notification deliver karega.

---

41. Trending Deal Alert

Trending deals country-specific honge.

Example:

USA trending deals UAE users ko automatically nahi bheje jayenge.

---

42. Deal Digest

Multiple deals ko ek notification mein combine kiya ja sakta hai.

Example:

Today’s Top Electronics Deals – UAE

Digest frequency user preference ke according hogi.

---

43. Notification Event

Basic event structure:

notification_event_id
event_type
user_id
country_id
market_id
entity_type
entity_id
priority
created_at
scheduled_at
metadata

---

44. Notification Record

Notification record:

notification_id
user_id
event_id
channel
template_id
country_id
status
scheduled_at
sent_at
delivered_at
opened_at
clicked_at
created_at

---

45. Notification Status

Possible statuses:

- pending
- scheduled
- processing
- sent
- delivered
- opened
- clicked
- failed
- cancelled
- expired

---

46. Notification Template Engine

Templates centralized honge.

Template variables:

- user name
- deal title
- product
- merchant
- price
- discount
- currency
- country
- expiry
- CTA
- tracking link

---

47. Template Versioning

Templates version-controlled honge.

Example:

deal_alert_v1
deal_alert_v2
price_drop_v1

Old notifications historical template version retain karengi.

---

48. Localization

Notifications localized ho sakti hain:

- English
- future supported languages

Translation active market aur user language preference ke according hogi.

---

49. Market-Aware Content

Notification content mein local context use hoga:

- local currency
- local merchant
- local price
- local shipping
- local availability
- local affiliate offer

---

50. Notification Deep Links

CTA centralized deep-link system use karega.

Possible destinations:

- Product page
- Deal page
- Merchant page
- Category page
- PSEO landing page
- Telegram Mini App
- Website

---

51. Affiliate CTA

Affiliate CTA centralized Affiliate Engine ke through generate hoga.

Notification Engine affiliate links hardcode nahi karega.

---

52. Affiliate Tracking

Notification CTA mein:

- notification ID
- campaign ID
- user/session ID where permitted
- deal ID
- product ID
- channel
- country

tracking context pass ho sakta hai.

---

53. Conversion Attribution

Agar notification click ke baad conversion hoti hai to Analytics + Affiliate Engine attribution receive karenge.

Flow:

Notification → Click → Affiliate Redirect → Merchant → Conversion → Revenue

---

54. Notification Event Bus

Notification Engine asynchronous event architecture use karega.

Example:

Deal Event
    ↓
Event Bus
    ↓
Notification Eligibility
    ↓
Preference Check
    ↓
Queue
    ↓
Channel Router
    ↓
Delivery

---

55. Queue Architecture

High-volume notifications ke liye queues use hongi.

Queues:

- notification-events
- telegram-notifications
- email-notifications
- sms-notifications
- push-notifications
- retry-queue
- dead-letter-queue

---

56. Background Workers

Workers:

- event processor
- eligibility worker
- scheduling worker
- Telegram worker
- Email worker
- SMS worker
- Push worker
- retry worker
- analytics worker

---

57. Scheduling Engine

Future notifications schedule ki ja sakti hain.

Examples:

- daily digest
- weekly digest
- ending soon
- quiet-hours release
- campaign schedule

---

58. Retry System

Temporary delivery failures automatically retry honge.

Retry strategy:

- exponential backoff
- maximum attempts
- provider-specific limits

---

59. Dead Letter Queue

Repeated failures DLQ mein move honge.

Admin:

- failure reason
- provider
- event
- user
- retry history

dekh sakega.

---

60. Idempotency

Same notification event duplicate send nahi karega.

Idempotency key example:

user_id + event_type + entity_id + channel + time_window

---

61. Deduplication

Agar same deal multiple sources se aaye to Deal Engine canonical deal create karega.

Notification Engine canonical event consume karega.

---

62. Notification Suppression

Notification suppress ho sakti hai agar:

- user unsubscribed
- country mismatch
- deal expired
- product unavailable
- frequency cap reached
- quiet hours
- duplicate event
- consent missing

---

63. Country Eligibility Check

Har market-sensitive notification ke liye:

Event Country
        ↓
User Active Country
        ↓
Market Eligibility
        ↓
Eligible / Suppress

check hoga.

---

64. Merchant Eligibility

Merchant offer active market mein available hona chahiye.

---

65. Shipping Eligibility

Agar offer selected country mein ship nahi karta to standard deal alert suppress ya appropriately label kiya jayega.

---

66. Price Freshness

Price-drop notifications stale prices par generate nahi honi chahiye.

Price freshness threshold configurable hoga.

---

67. Deal Expiration

Expired deal ke liye pending notification cancel ho sakti hai.

---

68. Notification Campaigns

Admin Dashboard se campaigns create ki ja sakti hain.

Campaign fields:

- name
- country
- category
- merchant
- audience
- channel
- schedule
- template
- start/end time
- status

---

69. Campaign Audience

Audience filters:

- country
- category
- merchant
- brand
- product
- engagement
- notification preferences
- active users

---

70. Campaign Country Rule

Campaign country targeting mandatory market validation follow karegi.

Example:

UAE campaign → UAE eligible audience.

---

71. Broadcasts

Admin broadcast kar sakta hai:

- Telegram
- Email
- Push
- future channels

Lekin consent aur targeting rules apply honge.

---

72. Notification Center

Mini App mein centralized notification center hoga.

User:

- read
- unread
- saved
- clicked
- dismissed

states dekh sakega.

---

73. Read State

Notification read state user-level par maintain hogi.

---

74. Notification History

User ko relevant notification history available ho sakti hai.

Retention policy privacy rules ke according hogi.

---

75. User Notification State

System track karega:

- last notification
- last channel
- last click
- frequency counters
- suppression state
- consent state

---

76. Notification APIs

Possible API structure:

/api/v1/notifications
/api/v1/notifications/preferences
/api/v1/notifications/unread
/api/v1/notifications/read
/api/v1/notifications/subscribe
/api/v1/notifications/unsubscribe
/api/v1/notifications/test

---

77. Admin Notification APIs

/api/v1/admin/notifications
/api/v1/admin/notifications/templates
/api/v1/admin/notifications/campaigns
/api/v1/admin/notifications/queue
/api/v1/admin/notifications/failures
/api/v1/admin/notifications/analytics

---

78. Telegram Flow

Deal Event
↓
Notification Engine
↓
Country Check
↓
Preference Check
↓
Consent Check
↓
Frequency Check
↓
Telegram Queue
↓
Telegram Bot
↓
User

---

79. Email Flow

Event
↓
Eligibility
↓
Template
↓
Email Queue
↓
Email Provider
↓
User

---

80. SMS Flow

High Priority Event
↓
Eligibility
↓
Consent
↓
SMS Queue
↓
SMS Provider
↓
User

---

81. Web Push Flow

Event
↓
Eligibility
↓
Push Queue
↓
Browser Push
↓
User

---

82. Notification Analytics

Core metrics:

- notifications created
- notifications sent
- delivery rate
- open rate
- click rate
- unsubscribe rate
- conversion rate
- revenue
- revenue per notification

---

83. Channel Analytics

Separate performance:

- Telegram
- Email
- SMS
- Push
- WhatsApp

track hogi.

---

84. Country Analytics

Analytics:

- notifications by country
- clicks by country
- conversions by country
- revenue by country
- unsubscribe rate by country

---

85. Category Analytics

Track:

- electronics alerts
- fashion alerts
- travel alerts
- grocery alerts
- etc.

---

86. Deal Notification Performance

Har deal ke liye:

- sent
- clicks
- conversions
- revenue
- CTR

measure ho sakta hai.

---

87. Notification Attribution

Notification attribution centralized Analytics Engine ke saath integrate hogi.

No separate attribution system.

---

88. Conversion Revenue

Affiliate conversion se generated revenue notification campaign/channel ke saath associate ho sakti hai.

---

89. A/B Testing

Future mein test kiya ja sakta hai:

- title
- CTA
- image
- timing
- frequency
- template
- channel

---

90. Send-Time Optimization

Future AI/analytics system user ke historical engagement se optimal notification timing estimate kar sakta hai.

---

91. AI Personalization

Future AI layer:

- notification relevance
- deal ranking
- send timing
- digest composition
- title generation
- personalization

improve kar sakti hai.

AI user consent aur preference rules bypass nahi karega.

---

92. AI Notification Guardrails

AI:

- country rules bypass nahi karega
- consent bypass nahi karega
- affiliate links invent nahi karega
- prices invent nahi karega
- expired deals promote nahi karega

---

93. Recommendation Integration

Recommendation Engine relevant deals identify karega.

Notification Engine delivery eligibility handle karega.

---

94. Search Integration

User search activity future alert suggestions ko influence kar sakti hai, subject to privacy and preference rules.

---

95. PSEO Integration

PSEO pages se relevant notification CTA ho sakta hai.

Example:

Product PSEO page → “Notify me when price drops.”

---

96. Product Watch

User product watch create kar sakta hai.

Watch configuration:

product_id
country_id
target_price
minimum_discount
preferred_merchants
channels
frequency

---

97. Merchant Watch

User merchant follow kare to new eligible merchant deals notification mein aa sakti hain.

---

98. Category Watch

User category follow kare to category-specific alerts mil sakte hain.

---

99. Brand Watch

User brand follow kare to brand-specific deals mil sakti hain.

---

100. Price Alert

User target price set kar sakta hai.

Example:

Product: Example Laptop
Country: USA
Target Price: $799

Price threshold reach hone par alert generate hoga.

---

101. Notification Rules Engine

Eligibility rules centralized rules engine se evaluate hongi.

Possible rules:

country_match
category_match
merchant_match
brand_match
product_match
price_threshold
discount_threshold
consent_enabled
frequency_allowed
quiet_hours
deal_active
offer_available

---

102. Notification Priority Engine

Priority calculate kar sakta hai based on:

- user preference
- price drop magnitude
- deal expiry
- product watch
- merchant importance
- campaign priority

---

103. Spam Prevention

System:

- frequency caps
- duplicate prevention
- suppression
- unsubscribe handling
- abuse monitoring

implement karega.

---

104. Provider Rate Limits

Har provider ke API limits respected hongi.

Workers provider-specific throttling use karenge.

---

105. Provider Failover

Future mein multiple notification providers support kiye ja sakte hain.

Example:

Primary Email Provider → Backup Email Provider

---

106. Delivery Failure Isolation

Agar Email provider fail ho:

Telegram aur other channels automatically affected nahi hone chahiye.

---

107. Observability

Monitor:

- queue depth
- processing time
- delivery failures
- provider latency
- retry count
- DLQ size
- notification volume

---

108. Alerts

Admin alerts:

- delivery failure spike
- provider outage
- queue backlog
- unusual unsubscribe rate
- unusual click behavior
- notification abuse

---

109. Security

Notification system:

- authenticated APIs
- authorization
- rate limiting
- encrypted secrets
- provider credential protection
- webhook verification
- audit logging

use karega.

---

110. Privacy

Notification Engine minimum required user data use karega.

Sensitive information unnecessarily notifications mein include nahi ki jayegi.

---

111. Consent Storage

Consent records:

user_id
channel
consent_status
consent_source
timestamp
version

maintain ho sakte hain.

---

112. Data Retention

Notification events aur analytics retention policy ke according expire/archive honge.

---

113. Admin Dashboard Integration

Admin Dashboard se:

- notifications
- templates
- campaigns
- queues
- failures
- preferences
- analytics
- providers

manage kiye ja sakenge.

---

114. Notification Template Management

Admin:

- create
- edit
- preview
- activate
- deactivate
- version

templates kar sakega.

---

115. Test Notifications

Admin test notification ko selected:

- user
- country
- channel
- template

par send kar sakta hai.

---

116. Dry Run

Campaign launch se pehle dry-run mode:

- eligible audience count
- country breakdown
- channel breakdown
- suppression count
- estimated notification volume

show karega.

---

117. Cost Management

SMS aur Email costs control karne ke liye:

- frequency caps
- batching
- digest
- suppression
- provider optimization

use honge.

---

118. Notification Database

Core tables/entities:

notifications
notification_events
notification_preferences
notification_templates
notification_template_versions
notification_channels
notification_campaigns
notification_deliveries
notification_schedules
notification_suppressions
notification_consents
notification_failures
notification_digests
notification_watches

---

119. Notification Relationships

Basic relationship:

User
 ↓
Preferences
 ↓
Watch / Subscription
 ↓
Notification Event
 ↓
Eligibility
 ↓
Notification
 ↓
Channel Delivery
 ↓
Click
 ↓
Affiliate
 ↓
Conversion
 ↓
Revenue

---

120. Central Data Relationships

Notification Engine centralized systems se connected hoga:

Deal Engine
      ↓
Notification Engine
      ↑
User Preference Engine
      ↑
Recommendation Engine
      ↓
Channel Router
 ↓     ↓      ↓
TG    Email   SMS
      ↓
Analytics Engine
      ↓
Affiliate Engine

---

121. Caching

Cache ho sakta hai:

- notification preferences
- templates
- user eligibility
- country configuration
- campaign configuration

Critical consent state stale cache ke basis par bypass nahi hogi.

---

122. Scalability

System millions of notifications handle karne ke liye:

- queues
- workers
- batching
- partitioning
- caching
- asynchronous processing
- provider throttling

use karega.

---

123. Global Scaling

Country-wise processing future mein partition ho sakti hai.

Example:

USA Notification Queue
UAE Notification Queue
UK Notification Queue
Canada Notification Queue
Australia Notification Queue

---

124. Country-Based Routing

Market-aware routing:

Event
 ↓
Country
 ↓
Eligible Users
 ↓
User Preferences
 ↓
Channel
 ↓
Delivery

---

125. Graceful Degradation

Agar ek notification channel unavailable ho:

- event lost nahi hona chahiye
- retry hona chahiye
- other permitted channels independently operate kar sakein

Fallback user preferences aur consent ke according hoga.

---

126. Event Ordering

Important events mein ordering maintain ki jayegi.

Example:

Price Drop → Price Restored

system outdated event ko newer state ke baad incorrectly send nahi karega.

---

127. Event Expiration

Notification events TTL ke saath expire ho sakte hain.

Example:

Expired deal ka delayed alert automatically suppress hoga.

---

128. Notification Freshness

Deal aur price notifications delivery se pehle latest relevant data validate kar sakti hain.

---

129. Testing

Testing categories:

- unit tests
- integration tests
- queue tests
- provider tests
- country tests
- preference tests
- consent tests
- deduplication tests
- scheduling tests
- load tests
- security tests
- end-to-end tests

---

130. Country Testing

Mandatory test cases:

- UAE user → UAE alerts
- USA user → USA alerts
- UK user → UK alerts
- manual country change
- country mismatch suppression
- currency correctness
- merchant availability
- shipping eligibility

---

131. Preference Testing

Test:

- category opt-in
- category opt-out
- merchant opt-in
- brand opt-in
- product watch
- frequency cap
- quiet hours
- channel opt-out

---

132. Affiliate Testing

Test:

- notification CTA
- affiliate redirect
- tracking parameters
- click attribution
- conversion attribution
- revenue attribution

---

133. Failure Testing

Test:

- provider timeout
- API failure
- queue failure
- duplicate event
- invalid template
- expired deal
- unavailable product
- missing affiliate link

---

134. Notification Quality Rules

Notification should be:

- relevant
- accurate
- timely
- market-specific
- user-permissioned
- non-duplicated
- actionable

---

135. No Hardcoded Deals

Notification templates aur code mein deals hardcode nahi hongi.

All deal data centralized Deal Database se ayega.

---

136. No Hardcoded Affiliate Links

Affiliate links centralized Affiliate Engine se ayengi.

---

137. Single Source of Truth

Notification Engine:

- Deal Database
- User Preference Engine
- Affiliate Engine
- Analytics Engine

ko source of truth ke taur par consume karega.

---

138. Notification Architecture Integration

Deal Engine

Deal events provide karega.

Price Comparison Engine

Price changes provide karega.

User Engine

Preferences aur consent provide karega.

Recommendation Engine

Personalized candidates provide karega.

Affiliate Engine

Tracked destination provide karega.

Analytics Engine

Events, clicks aur revenue track karega.

Telegram Architecture

Telegram delivery provide karegi.

PSEO Engine

Landing-page/deep-link destinations provide karega.

---

139. End-to-End Example

User:

Country: UAE
Category: Electronics
Target Price: AED 2,000
Channel: Telegram

Product price:

AED 2,300 → AED 1,950

Flow:

Price Comparison Engine
        ↓
Price Drop Event
        ↓
Notification Engine
        ↓
Country = UAE
        ↓
Product = Watched
        ↓
Price < Target
        ↓
Telegram Consent = Yes
        ↓
Frequency Check
        ↓
Telegram Queue
        ↓
Telegram Bot
        ↓
User
        ↓
Affiliate Redirect
        ↓
Merchant
        ↓
Conversion
        ↓
Revenue Attribution

---

140. Future Multi-Channel Intelligence

Future Notification Engine user ke allowed channels mein intelligently select kar sakta hai.

Example:

- urgent → Telegram
- daily digest → Email
- browser engagement → Push

Lekin user preferences aur consent highest priority rahenge.

---

141. Final Architecture Principle

Many Global Events → One Central Notification Engine → Country/Market Validation → User Preferences + Consent → Smart Scheduling → Channel Routing → Telegram / Mini App / Email / SMS / Push → Central Analytics → Affiliate Attribution

Sab se important rule:

User ko default alerts uski Active Country/Market ke according hi milenge.

GDN Notification Engine independent notification systems create nahi karega. Yeh centralized architecture Deal Database, User Preference Engine, Affiliate Engine, Analytics Engine, Telegram Architecture, Search/Recommendation Engine aur PSEO Architecture ke saath integrated rahegi.
