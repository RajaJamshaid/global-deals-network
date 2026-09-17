GDN Internationalization & Localization Architecture

1. Purpose

GDN ko global users, countries, markets, languages, currencies aur regional commerce requirements ke liye design kiya jayega.

Internationalization (i18n) system application ko multiple languages aur markets support karne ke qabil banayega.

Localization (l10n) system user ke selected market ke mutabiq content, currency, formatting, offers aur experience provide karega.

---

2. Core Principle

Global Platform
      ↓
Active Market
      ↓
Country + Language + Currency + Timezone
      ↓
Localized Experience
      ↓
Localized Deals + Stores + Prices + Content

---

3. Internationalization vs Localization

Internationalization

System ko multiple markets ke liye technically ready banana.

Examples:

- Multiple languages
- Multiple currencies
- Multiple date formats
- Multiple number formats
- RTL support
- Unicode support
- Locale-aware formatting

Localization

Specific country/market ke liye experience adapt karna.

Examples:

- USA pricing
- UAE stores
- Germany language
- UK shipping
- Local currencies
- Local deal availability

---

4. Global Market Model

Har market ko centralized market configuration ke through manage kiya jayega.

Example:

Market
├── Country
├── Currency
├── Languages
├── Timezone
├── Merchants
├── Affiliate Programs
├── Shipping Rules
├── Tax Display Rules
├── Deal Availability
└── SEO Configuration

---

5. Country Architecture

Countries centralized database mein maintain honge.

Example:

US
GB
CA
AE
DE
JP
AU

Country entity mein:

- country_id
- ISO code
- name
- default currency
- supported languages
- timezone(s)
- active/inactive status
- market configuration

---

6. Active Market

GDN ka Active Market localization architecture ka central component hoga.

Active Market determine karega:

- Country
- Currency
- Language
- Timezone
- Available stores
- Available offers
- Shipping options
- Affiliate programs
- Localized content
- Notifications
- Recommendations
- Campaigns

---

7. Automatic Country Detection

Initial visit par system available signals ke basis par default country determine kar sakta hai.

Possible signals:

- IP-based country
- Browser locale
- Telegram context
- Existing user preference

IP detection ko permanent user preference nahi samjha jayega.

---

8. Manual Country Selection

User manually country change kar sakta hai.

Example:

Current Market: UAE 🇦🇪

Change Country
USA 🇺🇸
UK 🇬🇧
Canada 🇨🇦
Germany 🇩🇪
Japan 🇯🇵

Manual selection automatic detection par priority rakhegi.

---

9. Country Persistence

Authenticated user ka selected country centralized User Preference system mein store kiya ja sakta hai.

Anonymous user ke liye:

- secure cookie
- local storage
- session context

use kiya ja sakta hai, subject to privacy requirements.

---

10. Language Architecture

Language ko country se completely hardcode nahi kiya jayega.

Ek country multiple languages support kar sakta hai.

Example:

Canada
├── English
└── French

---

11. Default Language

Language selection priority:

Explicit User Language
        ↓
Saved Preference
        ↓
Browser / Telegram Locale
        ↓
Market Default
        ↓
Global Fallback Language

---

12. Language Codes

Standard locale codes use kiye jayenge.

Examples:

en
en-US
en-GB
de
fr
ja
ar

---

13. Translation Architecture

UI text ko code ke andar hardcode nahi kiya jayega.

Example:

translations/
├── en/
├── de/
├── fr/
├── ar/
└── ja/

Translation keys centralized hongi.

Example:

deal.view_deal
deal.price_drop
search.search_products
market.change_country

---

14. Translation Fallback

Agar requested language mein translation available na ho:

Requested Locale
      ↓
Regional Locale
      ↓
Base Language
      ↓
English Fallback

System broken/missing UI text display nahi karega.

---

15. Dynamic Content Localization

Sirf UI translation enough nahi hogi.

Dynamic content bhi market-aware hoga.

Examples:

- Deal titles
- Product descriptions
- Merchant information
- Coupon text
- Campaign content
- PSEO content
- Notification text

---

16. Product Content

Canonical Product data language-neutral structure mein store ki jayegi.

Localized fields separately maintain kiye ja sakte hain.

Example:

Product
├── canonical_name
├── brand
├── model
├── identifiers
└── localized_content[]

---

17. Deal Content

Deal entity centralized rahegi.

Localized presentation market ke mutabiq generate hogi.

Example:

Deal
├── Product
├── Merchant
├── Market
├── Price
├── Currency
├── Discount
├── Validity
└── Localized Content

---

18. Currency Architecture

Currency centralized Currency entity ke through manage hogi.

Examples:

USD
EUR
GBP
AED
CAD
JPY

---

19. Currency Display

Prices locale-aware format mein display honge.

Examples:

$29.99
€29.99
£24.99
AED 109
¥4,980

Currency symbol aur formatting ko hardcode nahi kiya jayega.

---

20. Currency Conversion

Original merchant price preserve ki jayegi.

Example:

Original:
USD 29.99

Converted:
AED 110.00

Original currency aur converted currency dono identifiable honi chahiye.

---

21. Exchange Rate Architecture

Exchange rates centralized service/data source se obtain kiye jayenge.

System ko:

- rate timestamp
- source
- currency pair
- rate

store karna chahiye.

Rates ko silently assume nahi kiya jayega.

---

22. Currency Conversion Rule

Currency conversion informational comparison ke liye use ho sakti hai.

Merchant ki actual checkout currency ko converted display price se replace nahi kiya jayega.

---

23. Price Transparency

User ko clearly distinguish kiya jayega:

Merchant Price
Converted Display Price
Shipping
Tax
Coupon
Total Effective Price

Agar tax/shipping unavailable ho to system usay unknown/estimated ke taur par label karega.

---

24. Number Formatting

Locale-aware number formatting use hogi.

Examples:

1,299.99
1.299,99
1 299,99

Formatting locale ke according automatically change hogi.

---

25. Date Formatting

Dates locale-aware format mein render hongi.

Example:

Sep 17, 2026
17 Sep 2026
17.09.2026

---

26. Time Formatting

User ke timezone ke mutabiq times display kiye jayenge.

Backend timestamps UTC mein store karna preferred hoga.

Frontend localized timezone mein render karega.

---

27. Timezone Architecture

Timezone user aur market context ka separate property hoga.

Examples:

America/New_York
Europe/London
Asia/Dubai
Europe/Berlin
Asia/Tokyo

---

28. Daylight Saving Time

System fixed UTC offsets par permanently depend nahi karega.

IANA timezone identifiers use kiye jayenge.

---

29. RTL Support

Arabic jaisi RTL languages ke liye complete RTL architecture support hogi.

Requirements:

- RTL layout
- RTL typography
- direction-aware spacing
- icons
- navigation
- forms
- tables
- cards

---

30. Mixed LTR/RTL Content

Product names, brand names, URLs, numbers aur prices mixed-direction content ho sakte hain.

System ko bidirectional text properly handle karna hoga.

---

31. Typography

Fonts language coverage ke according select kiye jayenge.

Unsupported glyphs ke liye reliable fallback fonts available honge.

---

32. Mobile Localization

Localization mobile-first architecture ke saath compatible hogi.

Special attention:

- long translated text
- buttons
- product cards
- prices
- country selector
- notifications
- Telegram Mini App screens

---

33. Telegram Localization

Telegram Bot aur Mini App same centralized localization configuration consume karenge.

Example:

User Language
      ↓
GDN User Preference
      ↓
Localization Service
      ↓
Bot + Mini App

---

34. Website Localization

Website bhi centralized localization APIs/data consume karegi.

Website aur Mini App ke translations independently maintain nahi kiye jayenge.

---

35. Country-Aware Search

Search Active Market ko respect karegi.

Example:

Search: iPhone

USA:
USA offers/stores

UAE:
UAE offers/stores

Germany:
German-market offers/stores

---

36. Country-Aware Recommendations

Recommendation Engine:

- country
- language
- currency
- availability
- user preferences
- local merchant data

ko consider karega.

---

37. Country-Aware Deals

Default deal feed Active Market ke according filter hoga.

UAE user ko default mein UAE market ke relevant deals milenge.

USA user ko USA market ke relevant deals milenge.

---

38. Country-Aware Notifications

Notification Engine Active Market ko mandatory targeting signal ke taur par use karega.

User Market = UAE
        ↓
UAE Deals
        ↓
UAE Notification

Country mismatch notifications default mein suppress ki jayengi.

---

39. Country-Aware Campaigns

Campaign Engine bhi Active Market respect karega.

Campaign configuration mein:

campaign_markets

maintain kiya jayega.

---

40. Country-Aware Affiliate Links

Affiliate Engine selected market ke available affiliate program ko identify karega.

Example:

Product
 ↓
UAE Market
 ↓
UAE Affiliate Program
 ↓
Tracked Affiliate Link

Affiliate links frontend mein hardcode nahi honge.

---

41. Merchant Localization

Merchant data mein market availability maintain hogi.

Example:

Merchant
├── Global Identity
├── Markets
├── Websites
├── Currencies
├── Shipping Regions
└── Affiliate Programs

---

42. Store Availability

Ek merchant global ho sakta hai lekin har country mein available nahi hoga.

System market eligibility check karega.

---

43. Shipping Localization

Shipping information market-specific ho sakti hai.

Example:

USA:
Free Shipping

UAE:
AED 20 Shipping

Germany:
Free Shipping

Unknown shipping ko zero assume nahi kiya jayega.

---

44. Tax Display

Tax treatment market-specific configuration se control hoga.

System tax-inclusive aur tax-exclusive prices ko distinguish karega jab source data available ho.

---

45. Local Deal Eligibility

Deal publish hone se pehle:

Market
+
Merchant Availability
+
Product Availability
+
Affiliate/Direct Link
+
Price
+
Validity

validate kiye ja sakte hain.

---

46. Localized PSEO

PSEO architecture country + language context support karegi.

Examples:

/us/
 /deals/

 /ae/
 /deals/

 /de/
 /deals/

Exact URL structure centralized SEO architecture decide karegi.

---

47. Country-Specific Landing Pages

Country pages mein local:

- deals
- stores
- categories
- prices
- campaigns
- shipping
- currency

display kiye jayenge.

---

48. Language-Specific SEO

Localized pages ke liye:

- localized title
- localized description
- localized headings
- localized structured data
- hreflang
- canonical rules

implement kiye jayenge.

---

49. Hreflang Architecture

Equivalent localized pages ko appropriate hreflang relationships ke through connect kiya jayega.

Example:

en-US
en-GB
de-DE
fr-CA
ar-AE
ja-JP

Invalid language-country combinations generate nahi kiye jayenge.

---

50. Canonicalization

Localized duplicate pages ke liye canonical strategy centralized SEO system ke through manage hogi.

---

51. Translation Quality

Machine translation ko automatically publish karne se pehle quality checks required ho sakte hain.

Checks:

- missing translations
- incorrect placeholders
- broken formatting
- untranslated critical text
- currency errors
- country mismatch

---

52. Translation Workflow

Recommended workflow:

Source Content
      ↓
Translation
      ↓
Automated QA
      ↓
Review
      ↓
Publish

---

53. Translation Versioning

Translations version-controlled hongi.

Example:

translation_key
locale
version
status
updated_at

---

54. Localization Variables

Dynamic values translation strings mein placeholders ke through insert honge.

Example:

"Save {discount}% today"

System translated sentence structure ko preserve karega.

---

55. Pluralization

Languages ke different plural rules support kiye jayenge.

Example:

1 deal
5 deals

Translation system language-specific plural rules handle karega.

---

56. Gendered Language

Jahan language require kare, translation framework grammatical gender rules support karega.

---

57. Localized Categories

Category taxonomy centralized hogi.

Category IDs same rahenge.

Sirf localized names change honge.

Example:

category_id: electronics

English:
Electronics

German:
Elektronik

---

58. Brand Names

Brand names normally translate nahi kiye jayenge unless official localized branding available ho.

---

59. Product Identifiers

GTIN, UPC, EAN, ISBN, MPN aur model numbers language-independent canonical identifiers rahenge.

---

60. URL Slugs

Localized SEO URLs ke liye localized slugs support kiye ja sakte hain.

Slug uniqueness centralized honi chahiye.

---

61. Slug Stability

Published URLs ko unnecessarily change nahi kiya jayega.

Agar slug change ho:

301 Redirect

implement kiya jayega.

---

62. Locale Resolution

Locale resolution centralized service/function ke through hogi.

resolveLocale(
  user,
  market,
  browserLocale
)

---

63. Market Resolution

Market resolution:

Manual Selection
      ↓
Saved Preference
      ↓
Automatic Detection
      ↓
System Default

---

64. Market and Language Independence

Country aur language separate concepts hain.

Example:

Country = UAE
Language = English

ya:

Country = Canada
Language = French

possible hona chahiye.

---

65. Market and Currency Independence

Currency bhi independently configurable ho sakti hai.

Example:

Market = UAE
Language = English
Currency = USD

agar user explicitly currency preference select karta hai aur system support karta hai.

---

66. User Currency Preference

User preferred display currency save kar sakta hai.

Market default currency fallback ke taur par use hogi.

---

67. Currency vs Checkout Currency

GDN display currency aur merchant checkout currency ko clearly distinguish karega.

---

68. Localization Cache

Cache keys mein localization context include hoga.

Example:

deals:{market}:{language}:{currency}

---

69. Cache Isolation

Ek market ka cached response accidentally doosre market ke user ko serve nahi hona chahiye.

---

70. API Localization

APIs market aur locale parameters support kar sakti hain.

Example:

GET /api/v1/deals?market=AE&locale=en-AE

Actual production API contract centralized API architecture ke according maintain hoga.

---

71. Database Localization

Localized tables ya JSON structures use kiye ja sakte hain.

Example:

product_translations
category_translations
merchant_translations
content_translations

---

72. Translation Storage Principle

Core business data ko translation text ke saath unnecessarily duplicate nahi kiya jayega.

---

73. Market Configuration Storage

Central market configuration:

markets
market_languages
market_currencies
market_merchants
market_affiliate_programs
market_shipping_rules

---

74. Localization Data Model

Recommended entities:

locales
translations
translation_keys
translation_versions
markets
market_languages
currencies
exchange_rates
timezones
localized_content

---

75. Country Activation

Naya country activate karne ke liye:

Country
 ↓
Market Configuration
 ↓
Currency
 ↓
Language
 ↓
Merchants
 ↓
Affiliate Programs
 ↓
Shipping
 ↓
Deals
 ↓
PSEO
 ↓
Notifications
 ↓
Analytics

---

76. Country Rollout

New country ko staged rollout ke through launch kiya ja sakta hai.

Example:

Internal
 ↓
Limited Traffic
 ↓
Public Beta
 ↓
Full Market

---

77. Localization Feature Flags

New language ya market ko feature flag ke through gradually enable kiya ja sakta hai.

---

78. Country Deactivation

Agar market temporarily unavailable ho:

- new traffic redirect/route
- deals unpublish
- notifications suppress
- affiliate links disable
- existing data preserve

kiya ja sakta hai.

---

79. Expired Market Data

Market deactivate hone par historical data immediately delete nahi kiya jayega.

Retention policy apply hogi.

---

80. Market-Specific Analytics

Analytics events mein:

- country
- market
- language
- currency
- timezone

context available ho sakta hai.

---

81. Revenue Localization

Revenue reporting:

- original currency
- reporting currency
- exchange rate
- market
- affiliate network
- merchant

ke basis par aggregate ki ja sakti hai.

---

82. Country Revenue

Admin dashboard market-level metrics provide karega.

Example:

Market
Revenue
Clicks
Conversions
Conversion Rate
EPC

---

83. Notification Localization

Notification templates locale-aware honge.

Example:

English:
Price dropped 20%

German:
Preis um 20 % gesunken

---

84. Campaign Localization

Campaign creatives multiple locales support karenge.

Campaign
├── en
├── de
├── fr
├── ar
└── ja

---

85. Email Localization

Email templates user locale aur Active Market ke according render hongi.

---

86. Web Push Localization

Push notification language user preference ke according select hogi.

---

87. Telegram Localization

Bot messages aur Mini App interface centralized locale resolution use karenge.

---

88. Search Localization

Search system:

- localized category names
- merchant names
- product synonyms
- language-specific keywords

support kar sakta hai.

---

89. Search Synonyms

Example:

mobile
smartphone
cell phone

language/market context ke mutabiq synonym mapping maintain ki ja sakti hai.

---

90. Recommendation Localization

Recommendations local:

- merchants
- products
- categories
- campaigns
- prices
- availability

ko prioritize kar sakti hain.

---

91. AI Localization

Future AI layer user ke:

- language
- market
- currency
- preferences

ko context ke taur par use kar sakti hai.

AI ko market rules bypass karne ki permission nahi hogi.

---

92. AI Translation Guardrails

AI translation:

- prices modify nahi karegi
- currency invent nahi karegi
- merchant details invent nahi karegi
- affiliate links generate nahi karegi unless controlled system explicitly provides them
- expired deal ko active nahi batayegi

---

93. Localized AI Search

Future natural-language search:

"Dubai mein 100 dirham se kam headphones"

ko market-aware search request mein convert kar sakti hai.

---

94. Localized Product Comparison

Comparison engine:

User Market
+
Currency
+
Shipping
+
Tax
+
Availability

ke basis par effective comparison karega.

---

95. Localized Store Ranking

Store ranking market-specific ho sakti hai.

Factors:

- availability
- price
- shipping
- delivery
- relevance
- merchant quality

Commercial ranking relevance ko override nahi karegi.

---

96. Localized Content Quality

Har localized page sirf translated text nahi hoga.

Useful local information include ho sakti hai:

- local merchants
- local prices
- shipping
- local availability
- local categories
- local deal context

---

97. Thin Localization Prevention

Sirf language change karke thousands of near-duplicate pages create nahi kiye jayenge.

Localized PSEO page tabhi publish hoga jab meaningful localized value available ho.

---

98. Duplicate Content Prevention

Canonicalization aur localized content strategy duplicate indexation risk ko reduce karegi.

---

99. Localization QA

Automated checks:

- missing translation
- invalid locale
- broken placeholders
- overflow
- RTL issues
- incorrect currency
- incorrect country
- incorrect timezone
- broken URLs

---

100. Visual QA

Har major supported locale ke liye:

- mobile
- desktop
- Mini App
- Bot
- website

QA ki jayegi.

---

101. RTL QA

Arabic/RTL QA mein:

- alignment
- icons
- navigation
- forms
- cards
- numbers
- prices
- mixed text

test kiya jayega.

---

102. Accessibility

Localization accessibility ko break nahi karegi.

ARIA labels aur accessible text bhi localized honge.

---

103. SEO Structured Data

Localized structured data:

- language
- currency
- price
- availability
- product
- offer

context ke according generate hoga.

---

104. Sitemap Localization

Localized URLs ke liye appropriate sitemap architecture maintain hogi.

---

105. International Search Engines

SEO architecture globally indexed pages ke liye:

- hreflang
- canonical
- sitemap
- localized metadata
- structured data

support karegi.

---

106. Market-Aware Cache Keys

Cache architecture mein:

country
language
currency

required context ke mutabiq include hoga.

---

107. API Response Localization

API responses mein localized fields return kiye ja sakte hain.

Example:

{
  "product_id": "prod_123",
  "name": "Localized Product Name",
  "currency": "AED"
}

---

108. Error Localization

User-facing errors localized honge.

Internal logs standardized technical language mein reh sakte hain.

---

109. System Logs

Logs mein localization context useful debugging ke liye include kiya ja sakta hai:

market
locale
currency
timezone

Sensitive personal data unnecessarily log nahi kiya jayega.

---

110. Admin Localization

Admin dashboard initially English ho sakta hai.

Future mein selected admin locales add kiye ja sakte hain.

---

111. Merchant Portal Localization

Future merchant/store portal multiple languages support kar sakta hai.

---

112. Seller Country Context

Seller/store onboarding mein:

- business country
- supported markets
- currencies
- shipping markets
- languages

maintain kiye ja sakte hain.

---

113. Market Eligibility Engine

Central Market Eligibility Engine future mein determine kar sakta hai:

Can this Product
be shown to
this User
in this Market?

---

114. Market Rules

Market rules:

- merchant availability
- product availability
- shipping
- affiliate availability
- legal restrictions
- campaign eligibility

ko evaluate kar sakte hain.

---

115. Compliance Integration

Localization architecture privacy/compliance system ke saath integrate hogi.

Country detection ko unnecessary precise location storage mein convert nahi kiya jayega.

---

116. Data Minimization

Localization ke liye jitna data required ho sirf utna hi collect/store kiya jayega.

---

117. Consent

Marketing communications localization se independent consent rules follow karengi.

---

118. Regional Policy

Different countries ke liye:

- privacy notice
- cookie behavior
- marketing rules
- terms
- affiliate disclosure

regional configuration support kar sakti hai.

---

119. Merchant Terms

Merchant-specific regional restrictions ko central merchant/market configuration mein maintain kiya ja sakta hai.

---

120. Affiliate Market Mapping

Affiliate programs market aur country ke saath map honge.

Example:

Merchant
 ↓
Market
 ↓
Affiliate Program
 ↓
Affiliate Link

---

121. Notification Market Validation

Notification send se pehle:

User Active Market
        =
Notification Market

validation ki jayegi.

---

122. Campaign Market Validation

Campaign delivery bhi same market validation use karegi.

---

123. Search Market Validation

Search results Active Market ke available offers ke according filter honge unless user explicitly global search request kare.

---

124. Global Search

Future mein user:

Search Worldwide

select kar sakta hai.

Is case mein market restrictions explicitly expanded scope ke according apply hongi.

---

125. Cross-Market Comparison

Future feature:

Compare Worldwide

multiple markets ke offers compare kar sakta hai.

Shipping, taxes, currency aur availability clearly shown honge.

---

126. Local Currency Display in Global Search

Global comparison mein:

USD 29.99
≈ AED 110

jaisa display possible hoga, lekin original merchant currency preserve rahegi.

---

127. Market Context Propagation

Active Market:

Frontend
 ↓
API
 ↓
Search
 ↓
Deal Engine
 ↓
Recommendation
 ↓
Offer
 ↓
Affiliate
 ↓
Notification
 ↓
Analytics

tak consistently propagate hoga.

---

128. No Independent Localization Systems

Website, Telegram Bot aur Mini App independently separate country/language/currency logic maintain nahi karenge.

Centralized localization configuration consume ki jayegi.

---

129. Localization Service

Future service/module:

Localization Service

provide kar sakta hai:

- locale resolution
- translations
- currency formatting
- date formatting
- timezone handling
- market configuration

---

130. Suggested Module Structure

src/
  localization/
    locales/
    translations/
    currency/
    timezone/
    formatting/
    market/
    locale-resolver/
    translation-service/

---

131. Database Module Structure

database/
  localization/
    locales
    translations
    translation_versions
    markets
    market_languages
    currencies
    exchange_rates
    timezones
    localized_content

---

132. Configuration Principle

Market configuration code mein hardcode nahi hogi.

Database/configuration layer se manage hogi.

---

133. Testing Matrix

Testing combinations:

Country
×
Language
×
Currency
×
Timezone
×
Device
×
Channel

representative coverage ke saath test ki jayengi.

---

134. Performance

Localization lookup fast hona chahiye.

Recommended:

- cached translations
- cached market configuration
- CDN caching
- efficient locale resolution

---

135. Scalability

New language add karne ke liye core application rewrite required nahi hona chahiye.

New country activation modular hona chahiye.

---

136. Failure Handling

Agar localization service temporarily unavailable ho:

Cached Translation
      ↓
Default Locale
      ↓
Safe Fallback

use kiya jayega.

Core deal functionality completely fail nahi honi chahiye.

---

137. Observability

Monitor:

- missing translations
- locale errors
- market mismatch
- currency errors
- localization latency
- fallback rate
- translation failures

---

138. Analytics

Localization analytics:

- country
- language
- currency
- market
- conversion
- engagement

ke basis par analyze ki ja sakti hai.

---

139. Business Optimization

Localization performance se identify kiya ja sakta hai:

- high-value markets
- high-converting languages
- strong categories
- strong merchants
- weak localized pages

---

140. Future Expansion

Architecture future mein support kar sakti hai:

- dozens of countries
- multiple languages
- multiple currencies
- regional stores
- global comparison
- localized AI
- localized PSEO
- localized campaigns
- localized notifications

---

141. Final Internationalization Flow

Global User
     ↓
Country / Market Resolution
     ↓
Active Market
     ↓
Language + Currency + Timezone
     ↓
Localized API
     ↓
Localized Deals / Products / Stores
     ↓
Localized Search / Recommendations
     ↓
Localized Affiliate / Notifications / Campaigns
     ↓
Localized User Experience

---

Final Architecture Principle

One Global Platform → One Central Market System → One Localization Layer → Country + Language + Currency + Timezone Context → Localized Commerce Experience

GDN ka internationalization architecture aisa hona chahiye ke naya country, language ya currency add karna core system ko dobara build kiye baghair possible ho.

Most important rule:

Automatic Country Detection = Default Market

Manual Country Selection = User Override

Active Market = Entire GDN Experience

Language, Currency aur Timezone = Active Market ke saath coordinated but independently configurable

Website + Telegram Bot + Telegram Mini App + Future Channels = Same Central Localization & Market System

---

End State

                    GLOBAL USERS
                         ↓
                COUNTRY / MARKET
                    RESOLUTION
                         ↓
                   ACTIVE MARKET
                         ↓
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
   LANGUAGE           CURRENCY          TIMEZONE
       ↓                 ↓                 ↓
       └─────────────────┼─────────────────┘
                         ↓
              CENTRAL LOCALIZATION
                      LAYER
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
     WEBSITE          TELEGRAM         MINI APP
        ↓                ↓                ↓
        └────────────────┼────────────────┘
                         ↓
              CENTRAL GDN SERVICES
                         ↓
       Deals + Search + Offers + Affiliate
       Recommendations + Notifications
       Campaigns + PSEO + Analytics
                         ↓
              LOCALIZED GLOBAL
             COMMERCE EXPERIENCE

Core Rule:

«Build Global by Design → Localize by Market → Personalize by User → Scale Without Rebuilding»
