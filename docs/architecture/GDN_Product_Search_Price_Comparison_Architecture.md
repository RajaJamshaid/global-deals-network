GDN Product Search & Price Comparison Architecture

1. Purpose

Global Deals Network (GDN) ka Product Search & Price Comparison system users ko different countries ke stores, merchants aur marketplaces se products discover, compare aur purchase karne ka centralized experience provide karega.

System ka core purpose:

- Product search
- Image-based product search
- Product identification
- Exact product matching
- Similar product matching
- Multi-store comparison
- Price comparison
- Discount comparison
- Shipping comparison
- Availability comparison
- Coupon/offer comparison
- Affiliate monetization
- Country-specific marketplace discovery
- Personalized product discovery
- Telegram Mini App marketplace experience

---

2. Core Architecture Principle

GDN mein:

Product = Canonical Product Entity

Offer = Store/merchant ka specific product listing

Store = Retailer/Merchant

Country = Market Context

Deal = Promotional/discount opportunity

Affiliate Engine = Monetization & outbound tracking

Price Comparison Engine = Offer comparison

Search Engine = Discovery

Country selection sirf product search ko control nahi karegi.

Selected country poori marketplace experience ka active context hoga.

---

3. Global Market Context Architecture

GDN ka marketplace experience ek centralized Market Context system use karega.

Market Context determine karega:

- Active country
- Currency
- Eligible stores
- Available products
- Available offers
- Deals
- Discounts
- Shipping context
- Product availability
- Affiliate programs
- Direct purchase links
- Country-specific landing pages
- Localized content
- Localized recommendations

Market Context Flow

User
  ↓
Automatic Country Detection
  ↓
Default Market
  ↓
Country Selector
  ↓
Manual Country Override
  ↓
Active Market Context
  ↓
Mini App / Website Experience
  ↓
Deals + Offers + Search + Stores + Products

---

4. Automatic Country Detection

GDN user ka country automatically detect karne ki koshish karega.

Possible signals:

- IP geolocation
- Telegram country-related metadata where legally/technically available
- Browser locale
- Currency preference
- Existing user preference

Automatic detection sirf default suggestion hogi.

System user ko permanently detected country mein lock nahi karega.

Example:

Detected Country: United States

Default Market:
USA

User isay change kar sakta hai.

---

5. Manual Country Selector

Telegram Mini App mein prominent:

Country Selector

provide kiya jayega.

Example:

🌎 Shop Market

🇺🇸 United States
🇬🇧 United Kingdom
🇨🇦 Canada
🇦🇺 Australia
🇳🇿 New Zealand
🇩🇪 Germany
🇫🇷 France
...

User kisi bhi supported country ko manually select kar sakta hai.

---

6. Active Country / Active Market

User ke select karne ke baad selected country:

Active Market Context

ban jayegi.

Example:

Detected Country:
USA

User Selected:
UK

Active Market:
UK

Ab Mini App ka marketplace UK context mein operate karega.

---

7. Country Selection Scope

Country selector sirf product search ke liye nahi hoga.

Selected country apply hogi:

- Home marketplace
- Deals
- Offers
- Discounts
- Coupons
- Products
- Product Search
- Price Comparison
- Stores
- Merchants
- Categories
- Recommendations
- Trending products
- Price drops
- Shipping information
- Currency
- Affiliate links
- Direct purchase links
- PSEO landing pages
- Notifications
- Country-specific content

---

8. Country Selection Example

Agar user USA mein hai:

Detected:
🇺🇸 USA

Active Market:
🇺🇸 USA

Mini App show kare:

- USA deals
- USA stores
- USD prices
- USA availability
- USA shipping context
- USA affiliate links

Agar user manually UK select karta hai:

Active Market:
🇬🇧 United Kingdom

Mini App immediately switch kare:

- UK deals
- UK offers
- UK stores
- GBP prices
- UK availability
- UK shipping context
- UK affiliate links
- UK landing pages

---

9. Country Preference Persistence

User ka manually selected country persist kiya ja sakta hai.

Storage:

user_preferences.market_country_id

Anonymous users ke liye:

local storage / secure client preference

Telegram authenticated users ke liye:

central User Preference Engine

Agar user manually country select kare, manual preference automatic detection par priority rakhegi.

---

10. Country Priority Logic

Priority:

1. Explicit User Selection
2. Saved User Market Preference
3. Telegram/User Profile Market Preference
4. Automatic IP Detection
5. Default Global Market

Example:

IP = USA
Saved Preference = UK

Active Market = UK

---

11. Country Selector UX

Mini App mein Country Selector accessible hona chahiye.

Possible locations:

- Header
- Top navigation
- Home page
- Search page
- Marketplace page
- Settings

Example:

🌎 UK ▾

Click karne par country selection panel open ho.

---

12. Country Search

Agar countries bohat zyada hon to selector mein search hona chahiye.

Example:

Search country...

United States
United Kingdom
United Arab Emirates
Canada
Australia
Germany

---

13. Country Registry

GDN centralized Country Registry maintain karega.

Example:

countries
---------
id
code
name
native_name
currency
currency_symbol
timezone
locale
status
supported_market
created_at
updated_at

---

14. Country Market Configuration

Har country ka market configuration centralized hoga.

Example:

country_market_config
---------------------
country_id
default_currency
supported_stores
supported_affiliate_programs
shipping_regions
tax_context
market_status
localization_status
seo_status

---

15. Country-Specific Store Registry

Har country ke eligible stores centrally mapped honge.

Example:

USA
→ Amazon US
→ Walmart
→ Target
→ Best Buy

UK
→ Amazon UK
→ Argos
→ Currys
→ Tesco

Canada
→ Amazon CA
→ Walmart CA
→ Best Buy CA

Store eligibility database-driven hogi.

---

16. Country-Specific Deals

Selected country ke basis par deals filter honge.

Example:

Active Country = UK

Deals API
↓
country_id = UK
↓
UK eligible deals

Mini App USA deals accidentally display nahi karega jab active market UK ho.

---

17. Country-Specific Offers

Offer comparison mein country filter mandatory market context ho sakta hai.

Example:

Product:
iPhone 17

Active Market:
UK

Offers:
Amazon UK
Currys UK
Argos UK
Apple UK

USA offers default result set mein nahi honge jab tak user explicitly cross-market comparison enable na kare.

---

18. Cross-Country Comparison

Future feature ke taur par user multiple countries compare kar sakta hai.

Example:

Compare Markets

🇺🇸 USA
🇬🇧 UK
🇨🇦 Canada

Lekin default experience:

Single Active Market

hoga.

---

19. Product Search Architecture

Product search centralized Search Engine ke through operate karega.

Flow:

User Query
↓
Active Country
↓
Search Engine
↓
Candidate Products
↓
Offer Matching
↓
Country Eligibility
↓
Price Comparison
↓
Ranking
↓
Results

---

20. Text Product Search

User product name enter kar sakta hai.

Examples:

iPhone 17 Pro
Nike Air Max
Sony headphones
Samsung TV
MacBook Air

Search engine:

- keywords
- brand
- model
- category
- SKU
- GTIN
- UPC
- EAN
- MPN

ko use karega.

---

21. Image Product Search

User image upload kar sakta hai.

System possible signals:

- Computer vision
- OCR
- Barcode detection
- Logo recognition
- Product metadata extraction
- Visual similarity

use karega.

---

22. Image Search Flow

Image Upload
↓
Image Validation
↓
Image Processing
↓
OCR / Barcode / Vision
↓
Product Identification
↓
Candidate Products
↓
Exact / Similar Matching
↓
Offer Search
↓
Price Comparison

---

23. Product Identification

System uploaded image se:

- Brand
- Product type
- Model
- SKU
- Barcode
- Text
- Visual characteristics

extract karne ki koshish karega.

Agar confidence low ho to system uncertain result ko exact product ke taur par present nahi karega.

---

24. Canonical Product Entity

Canonical Product centralized database mein store hoga.

Example:

products
--------
id
canonical_name
brand_id
category_id
model
gtin
upc
ean
mpn
description
image
status
created_at
updated_at

---

25. Offer Entity

Offer ek specific store ka product listing hoga.

offers
------
id
product_id
store_id
country_id
url
affiliate_link_id
price
currency
shipping_cost
tax
discount
coupon
availability
condition
last_verified_at
status

---

26. Product vs Offer

Important distinction:

Product
=
What the product is

Offer
=
Where/how the product is currently sold

Example:

Product:
Apple iPhone 17 Pro 256GB

Offers:
Amazon US
Best Buy US
Apple US
Walmart US

---

27. Exact Product Matching

Exact matching signals:

- GTIN
- UPC
- EAN
- SKU
- MPN
- Model number
- Brand
- Variant
- Size
- Color
- Storage
- Condition

System exact product aur similar product ko mix nahi karega.

---

28. Similar Product Matching

Agar exact product unavailable ho to similar products show kiye ja sakte hain.

Label:

Exact Match

ya

Similar Product

Similar result ko exact result ke taur par represent nahi kiya jayega.

---

29. Variant Matching

Product variants separately identify kiye ja sakte hain.

Examples:

- Size
- Color
- Storage
- RAM
- Capacity
- Pack size
- Condition

Example:

iPhone 17 Pro
256GB
Black

aur

iPhone 17 Pro
512GB
Black

separate variants ho sakte hain.

---

30. Store Data Sources

Store data lawful and technically supported sources se aa sakta hai:

- Affiliate feeds
- Merchant APIs
- Product feeds
- Partner APIs
- Publicly permitted data
- Approved data providers

Unauthorized scraping ko architecture ka required dependency nahi banaya jayega.

---

31. Store Connector Architecture

Har store ke liye modular connector architecture hoga.

Example:

connectors/
    amazon/
    walmart/
    bestbuy/
    target/

Har connector standardized output produce karega.

---

32. Offer Normalization

Different stores ka data standardized format mein convert hoga.

Example:

Store A:
price = 99

Store B:
sale_price = 94.99

Store C:
current_price = 97

System sab ko common:

offer.price

structure mein normalize karega.

---

33. Currency Normalization

Har offer ke saath original currency preserve hogi.

Example:

price:
99.99

currency:
USD

Comparison ke liye system optional normalized currency calculate kar sakta hai.

Original price kabhi overwrite nahi hogi.

---

34. Currency Conversion

Currency conversion centralized service se hogi.

Example:

USD
GBP
EUR
CAD
AUD
AED

Conversion timestamp store kiya jayega.

Approximate converted prices ko clearly indicate kiya jayega.

---

35. Shipping Cost

Shipping information separately track hogi.

Possible states:

Free
Paid
Unknown
Unavailable
Calculated at checkout

Unknown shipping ko zero assume nahi kiya jayega.

---

36. Taxes

Tax information available hone par store/market context ke according calculate/display ki ja sakti hai.

Agar tax unavailable ho:

Tax not included / calculated at checkout

show kiya jayega.

---

37. Total Effective Price

Comparison engine possible total effective price calculate karega:

Product Price
+
Shipping
+
Known Taxes
-
Discount
-
Coupon
=
Effective Price

Sirf jab required inputs reliable hon.

Agar koi component unknown ho to system false precision create nahi karega.

---

38. Discount Comparison

System compare kar sakta hai:

- Original price
- Sale price
- Discount percentage
- Coupon
- Cashback where applicable
- Bundle discount

Discount claims source data se validate hone chahiye.

---

39. Deal Integration

Product offers aur GDN Deals Engine integrate honge.

Example:

Product
↓
Offer
↓
Active Deal
↓
Coupon
↓
Affiliate Link

User ko product ke saath active deal available ho to show kiya ja sakta hai.

---

40. Price Ranking

Default ranking relevance + product match + verified effective price ko consider karegi.

Possible ranking factors:

- Exact match
- Effective price
- Availability
- Shipping
- Store eligibility
- Data freshness
- User filters
- Deal value
- Relevance

Commercial value relevance ko override nahi karegi.

---

41. Lowest Price Logic

System lowest price ko blindly select nahi karega.

Valid comparison ke liye:

- Correct product
- Correct variant
- Correct country
- Valid offer
- Current price
- Sufficient freshness

required honge.

---

42. Offer Freshness

Har offer ka:

last_verified_at

store hoga.

Old offers ko:

- refresh
- deprioritize
- hide
- mark stale

kiya ja sakta hai.

---

43. Availability

Possible states:

In Stock
Low Stock
Out of Stock
Preorder
Unavailable
Unknown

---

44. Store Trust Metadata

Store-level metadata maintain kiya ja sakta hai:

- Store identity
- Country
- Market
- Data source
- Affiliate status
- Last successful sync
- Availability reliability
- Price freshness

System unsupported trust claims nahi karega.

---

45. Affiliate Link Integration

Har offer ke saath centralized Affiliate Engine integrate hoga.

Flow:

Offer
↓
Affiliate Engine
↓
Tracked Affiliate Link
↓
Redirect
↓
Merchant

Frontend affiliate links hardcode nahi karega.

---

46. Direct Link Fallback

Agar affiliate link available nahi:

monetization_type = direct

aur user ko direct merchant link diya ja sakta hai.

Example:

monetization_type:
affiliate

or

direct

---

47. Affiliate Attribution

Affiliate Engine tracking parameters use karega.

Possible identifiers:

click_id
user_id
session_id
offer_id
product_id
store_id
country_id
campaign_id
channel

Telegram Mini App traffic separately identify kiya ja sakta hai.

---

48. Product Search Result Schema

Typical result:

Product
├── Product Name
├── Image
├── Brand
├── Variant
├── Match Type
│
└── Offers
    ├── Store
    ├── Price
    ├── Currency
    ├── Discount
    ├── Shipping
    ├── Availability
    ├── Last Updated
    └── CTA

---

49. Country-Aware Search Result

Active market result mein visible context:

Market:
🇬🇧 United Kingdom

Currency:
GBP

Stores:
UK stores

Shipping:
UK context

CTA:
UK merchant link

---

50. Product Search Filters

Possible filters:

- Price
- Brand
- Category
- Store
- Discount
- Rating where available
- Availability
- Condition
- Size
- Color
- Variant
- Shipping
- Delivery
- Deal type
- Exact match
- Similar products

Country filter active market ke saath synchronized hoga.

---

51. User Country Override During Search

User search screen se bhi country change kar sakta hai.

Example:

Search:
Nike shoes

Market:
🇺🇸 USA ▾

User UK select kare:

Market:
🇬🇧 UK

Search results UK context mein refresh honge.

---

52. Marketplace Browsing Without Search

User ko product search karna zaroori nahi hoga.

Mini App mein user simply browse kar sakta hai:

Home
↓
Deals
↓
Categories
↓
Stores
↓
Trending
↓
Discounts
↓
Price Drops
↓
Products

Sab active country ke according display honge.

---

53. Country-Aware Mini App Home

Example:

🇬🇧 United Kingdom ▾

Today's Deals

🔥 Trending
💰 Biggest Discounts
📉 Price Drops
🏪 Popular Stores
🛍️ Categories

Country change karne par content refresh ho.

---

54. Country-Aware Deals

Deals API active market context receive karegi.

Example:

GET /api/v1/deals?country=GB

Returned deals:

UK eligible deals

---

55. Country-Aware Offers

Example:

GET /api/v1/offers?product_id=123&country=GB

Sirf eligible UK offers return honge.

---

56. Country-Aware Stores

Store discovery:

GET /api/v1/stores?country=GB

User ko relevant UK stores show honge.

---

57. Country-Aware Currency

Active market ke basis par default display currency determine hogi.

Example:

USA → USD
UK → GBP
Canada → CAD
Australia → AUD
EU market → EUR

User future mein display currency separately override kar sakta hai.

Market country aur display currency ko technically separate concepts rakha jayega.

---

58. Country-Aware Shipping

Shipping context active market se derive hoga.

Example:

Market:
UK

Shipping:
UK delivery context

Agar store international shipping deta hai to cross-border shipping separately identify ki jayegi.

---

59. Country-Aware Affiliate Routing

Affiliate Engine active country ke basis par correct program/link select karega.

Example:

Product
+
Country = UK
↓
UK Affiliate Program
↓
UK Affiliate Link

USA user manually UK market select kare to UK affiliate route use ho sakta hai, subject to program availability and merchant rules.

---

60. Country-Aware Direct Routing

Affiliate unavailable ho to country-specific direct merchant URL select kiya ja sakta hai.

Example:

Amazon US
Amazon UK
Amazon CA

same canonical product se mapped ho sakte hain.

---

61. Country-Specific Landing Pages

GDN PSEO system country-aware landing pages generate karega.

Examples:

/products/iphone-17-pro/

and country-specific context:

/us/products/iphone-17-pro/
uk/products/iphone-17-pro/
ca/products/iphone-17-pro/

Exact URL architecture centralized PSEO architecture ke saath consistent hogi.

---

62. Country + Product Pages

Country-specific product page show kar sakta hai:

- Local stores
- Local prices
- Local currency
- Local deals
- Shipping context
- Affiliate links
- Availability
- Related products

---

63. Country + Category Pages

Examples:

/uk/electronics/
/us/electronics/
/ca/electronics/

Pages active country ke real deal/store data se powered honge.

---

64. Country + Merchant Pages

Example:

/uk/stores/amazon/
/us/stores/amazon/

Merchant availability country-specific hogi.

---

65. Country + Deal Pages

Deal pages country context maintain karengi.

Example:

/uk/deals/samsung-tv/

UK deal inventory show karegi.

---

66. Search Index Architecture

Search engine mein products/offers ke saath country context indexed ho sakta hai.

Example:

product_id
offer_id
store_id
country_id
category_id
brand_id
price
availability
freshness

---

67. Product Database

Central product database:

products
product_variants
product_identifiers
product_images
product_categories
product_brands

---

68. Offer Database

Central offer database:

offers
offer_prices
offer_shipping
offer_availability
offer_discounts
offer_coupons
offer_history

---

69. Store Database

stores
store_markets
store_connectors
store_affiliate_programs
store_categories

---

70. Country Database

countries
country_markets
country_currencies
country_store_mappings
country_affiliate_mappings
country_shipping_rules

---

71. Image Search API

Example:

POST /api/v1/search/image

Input:

image
country
filters

Output:

identified product
confidence
exact matches
similar matches
offers

---

72. Product Search API

Example:

GET /api/v1/search/products

Parameters:

q
country
category
brand
store
price_min
price_max
availability
condition
sort
page
limit

---

73. Market Context API

Central endpoint:

GET /api/v1/market/context

Possible response:

{
  "detected_country": "US",
  "selected_country": "GB",
  "active_country": "GB",
  "currency": "GBP",
  "market_status": "active"
}

---

74. Country Selection API

Example:

POST /api/v1/users/preferences/market

Payload:

{
  "country": "GB"
}

System user ki active market preference update karega.

---

75. Anonymous Market Context

Login required nahi hona chahiye sirf country select karne ke liye.

Anonymous user:

Detected Country
↓
Manual Country Selection
↓
Local Client Preference

Authenticated user:

Manual Selection
↓
Central User Preference Engine

---

76. Telegram Mini App Integration

Telegram Mini App centralized API consume karega.

Telegram Mini App
        ↓
Central API
        ↓
Market Context
        ↓
Search / Deals / Offers
        ↓
Central Database

Mini App directly database access nahi karega.

---

77. Telegram User Identity

Telegram "initData" validation ke through user identity establish ki jayegi.

User identity:

Telegram User
↓
GDN User
↓
User Preferences
↓
Active Market

---

78. Telegram Mini App Country UX

Mini App header example:

🌎 🇺🇸 USA ▾

User tap kare:

Choose your market

🇺🇸 United States
🇬🇧 United Kingdom
🇨🇦 Canada
🇦🇺 Australia
🇳🇿 New Zealand
...

Selection ke baad:

Market switched to 🇬🇧 United Kingdom

---

79. Country Switching Behavior

Country change ke baad relevant screens refresh honge:

Home
Deals
Offers
Products
Stores
Categories
Search
Recommendations

Cached country-specific data invalidate/refetch ki jayegi.

---

80. Recommendation Integration

Recommendation Engine active country ko ranking signal ke taur par use karega.

Example:

User:
UK

Recommendations:
UK deals
UK stores
UK products
UK price drops

---

81. Personalized Marketplace

User preferences + active country combine ho sakte hain.

Example:

Country:
UK

Category:
Electronics

Price:
Under £500

Preferred Stores:
Amazon UK + Currys

Recommendation Engine personalized marketplace create karega.

---

82. Analytics

System track karega:

- Country detected
- Country selected
- Country changed
- Search
- Image search
- Product view
- Offer view
- Store click
- Affiliate click
- Direct click
- Deal click
- Conversion
- Revenue

---

83. Country Analytics

Important metrics:

Users by country
Deals by country
Searches by country
Clicks by country
Affiliate revenue by country
Conversion rate by country
Top stores by country
Top products by country

---

84. Country Switching Analytics

Event:

market_country_changed

Properties:

from_country
to_country
source
user_id
session_id
channel

---

85. Offer Analytics

Offer-level metrics:

views
clicks
affiliate_clicks
direct_clicks
conversions
revenue

---

86. Price History

Future system price history maintain karega.

Example:

Product
↓
Offer
↓
Price History
↓
Price Drop Detection

This supports:

- Price drops
- Historical comparison
- Deal alerts
- Recommendations

---

87. Price Drop Engine

System detect kar sakta hai:

Previous Price:
$499

Current Price:
$399

Then:

Price Drop:
20%

Price-drop deals active country context ke according display honge.

---

88. Background Jobs

Background processing:

Store Sync
Offer Refresh
Price Update
Availability Update
Currency Update
Deal Validation
Image Processing
Product Matching
Search Indexing
Affiliate Link Validation

Queues use ki ja sakti hain.

---

89. Parallel Store Search

Multiple stores simultaneously search kiye ja sakte hain.

Example:

Search
├── Store A
├── Store B
├── Store C
├── Store D
└── Store E

Results normalize hone ke baad merge honge.

---

90. Graceful Degradation

Agar ek store unavailable ho:

Store A ❌
Store B ✅
Store C ✅

System baqi results return karega.

Ek store failure poori search ko fail nahi karega.

---

91. No Results Handling

Agar exact product nahi mila:

No exact match found.

Then optionally:

Similar products

show kiye ja sakte hain.

Agar selected country mein offer nahi:

No offers currently available in this market.

Future mein user ko:

Other Markets

option diya ja sakta hai.

---

92. Confidence Scores

Image/product matching mein confidence score internally maintain ho sakta hai.

Example:

Product Match Confidence:
0.94

Low-confidence results ko exact match label nahi diya jayega.

---

93. AI / Computer Vision Layer

Future AI layer support karegi:

- Image product recognition
- OCR
- Barcode recognition
- Visual similarity
- Natural language product search
- Product attribute extraction
- Query understanding
- Similar product discovery

AI output deterministic database validation ke baad user ko present kiya jayega.

---

94. AI Country Context

AI search/query understanding mein active market include hoga.

Example:

User:
"Find me the cheapest Nike Air Max"

Active Market:
UK

AI Search Context:
UK

Result UK market mein search hoga.

---

95. Security

System ko protect karega:

- Input validation
- File validation
- Image size limits
- Malware checks where applicable
- API authentication
- Telegram authentication
- Rate limiting
- Abuse prevention
- Affiliate fraud prevention
- SSRF protection for remote image/data URLs
- Store connector isolation

---

96. Privacy

Image search mein uploaded images:

- minimum required duration
- secure processing
- controlled storage
- deletion policies

ke under handle hongi.

User tracking applicable consent/privacy rules ke mutabiq design hogi.

---

97. Data Quality

System ko validate karna hoga:

- Product identity
- Price
- Currency
- Country
- Store
- Availability
- Shipping
- Affiliate link
- Last updated time

Incorrect product-price pairing avoid karna critical hai.

---

98. Duplicate Offers

Same store/product listing multiple sources se aaye to deduplication:

Store
+
Product
+
Variant
+
Country
+
Canonical URL

signals ke basis par ho sakti hai.

---

99. Canonical Product Architecture

Multiple stores same product sell karte hon to:

One Canonical Product
        ↓
Multiple Offers
        ↓
Multiple Stores
        ↓
Multiple Countries

maintain kiya jayega.

---

100. Global Country Architecture

GDN ko country-specific silos mein duplicate databases create nahi karne.

Instead:

Global Product
      ↓
Country
      ↓
Store
      ↓
Offer
      ↓
Deal
      ↓
Affiliate Link

Centralized relational architecture use hogi.

---

101. Country Market Isolation

Country filtering database/query layer par enforce ki jayegi.

Frontend sirf UI filter nahi hoga.

Example:

Active Country = GB

API
↓
country_id = GB
↓
Eligible Offers

Is se wrong-market results ka risk kam hoga.

---

102. Market Context Propagation

Active country request lifecycle mein propagate hoga:

Mini App
↓
API
↓
Authentication
↓
Market Context
↓
Search
↓
Recommendation
↓
Deals
↓
Offers
↓
Affiliate
↓
Analytics

---

103. Country Context + Affiliate Attribution

Affiliate tracking mein country context preserve ho sakta hai:

country_id
store_id
offer_id
product_id
campaign_id
channel
click_id

Is se country-level revenue analysis possible hoga.

---

104. Country Context + PSEO

PSEO engine same centralized product/offer data use karega.

Country
+
Category
+
Product
+
Merchant
+
Deal

se controlled landing pages generate ki ja sakti hain.

Thin/duplicate pages prevent karna mandatory hoga.

---

105. Country Context + Notifications

Future alerts country-aware honge.

Example:

User Market:
UK

Alert:
Nike shoes price dropped in UK

USA price drop automatically UK user ko send nahi hoga unless user explicitly cross-market alert enable kare.

---

106. Country Context + Favorites

Favorite product globally same reh sakta hai.

Lekin user ka preferred offer market-specific ho sakta hai.

Example:

Favorite:
iPhone 17 Pro

Market:
UK

Preferred Store:
Amazon UK

---

107. Country Context + Wishlist

Wishlist product-level ho sakti hai.

Price alerts market-level ho sakte hain.

Example:

Wishlist:
Sony Headphones

Alert Market:
Canada

---

108. Country Context + Search History

Search analytics mein country context preserve hoga.

Example:

Query:
MacBook Air

Country:
UK

aur:

Query:
MacBook Air

Country:
USA

separate market signals honge.

---

109. Store Connector Scaling

Initial phase mein limited high-value stores support kiye ja sakte hain.

Future:

10 stores
↓
50 stores
↓
100 stores
↓
500+ stores

Modular connectors architecture scale support karega.

---

110. API Caching

Country-aware caching keys use honge.

Example:

deals:GB:electronics
offers:GB:product123
stores:GB
search:GB:iphone

Country key cache isolation ke liye important hai.

---

111. Cache Invalidation

Country-specific cache invalidate hogi jab:

- Price change
- Deal expire
- Store status change
- Offer availability change
- Country configuration change

ho.

---

112. Error Handling

Standard errors:

INVALID_COUNTRY
MARKET_NOT_SUPPORTED
PRODUCT_NOT_FOUND
NO_OFFERS
STORE_UNAVAILABLE
OFFER_STALE
IMAGE_INVALID
SEARCH_FAILED
AFFILIATE_LINK_UNAVAILABLE

---

113. Testing Strategy

Testing categories:

Product Testing

- Exact match
- Similar match
- Variant match

Country Testing

- Automatic detection
- Manual selection
- Country switching
- Preference persistence

Offer Testing

- Price
- Currency
- Shipping
- Availability

Affiliate Testing

- Correct country affiliate route
- Tracking
- Redirect

Mini App Testing

- Mobile UX
- Country selector
- Search
- Deals
- Offers
- Store pages

---

114. Country Switching QA Matrix

Example:

Scenario| Expected
USA detected| USA active
USA → UK| UK active
UK → Canada| Canada active
App restart| Saved country restored
Anonymous user| Local preference works
Logged-in user| Central preference saved
Unsupported country| Fallback/default
Country with no offers| Proper empty state

---

115. Performance

Target:

- Fast country switching
- Fast search
- Parallel store querying
- Cached deals
- Incremental offer updates
- Lazy-loaded images
- CDN delivery
- Minimal Mini App payload

---

116. Scalability

Architecture ko support karna chahiye:

1 Country
↓
10 Countries
↓
50 Countries
↓
100+ Countries

Aur:

10 Stores
↓
100 Stores
↓
1000+ Stores

without redesigning the core product model.

---

117. Global Marketplace Architecture

Final marketplace structure:

                    GDN
                     │
             Central Market Context
                     │
        ┌────────────┴────────────┐
        │                         │
     Country                  Currency
        │                         │
      Stores                   Pricing
        │                         │
      Offers                Comparison
        │                         │
      Deals                  Products
        │                         │
     Affiliate              Search
        │                         │
        └────────────┬────────────┘
                     │
             Telegram Mini App
                     │
              Website / PSEO

---

118. Complete Product Search Flow

User
↓
Select / Detect Country
↓
Active Market Context
↓
Enter Product Query
OR
Upload Image
↓
Search Engine
↓
Product Identification
↓
Exact / Similar Matching
↓
Country Eligibility
↓
Offer Collection
↓
Offer Normalization
↓
Price + Shipping + Discount
↓
Effective Price
↓
Ranking
↓
Results
↓
Affiliate / Direct CTA
↓
Click Tracking
↓
Merchant
↓
Conversion
↓
Revenue Analytics

---

119. Complete Mini App Marketplace Flow

Telegram User
↓
Mini App
↓
Detect Country
↓
Show Default Market
↓
User Can Change Country
↓
Active Market Context
↓
Home Marketplace
├── Deals
├── Discounts
├── Products
├── Categories
├── Stores
├── Trending
├── Price Drops
└── Search
        ↓
Country-Aware Results
        ↓
Product / Deal Detail
        ↓
Affiliate / Direct CTA
        ↓
Merchant

---

120. Complete Data Flow

Store Sources
↓
Deal/Data Pipeline
↓
Normalization
↓
Product Matching
↓
Offer Database
↓
Central Product Database
↓
Search Index
↓
Price Comparison Engine
↓
Market Context
↓
Central API
↓
Website / Telegram Bot / Mini App / PSEO

---

121. Integration With Deal Engine

Product Comparison Engine Deal Engine ko consume karega.

Product
↓
Offer
↓
Deal
↓
Discount
↓
Coupon

Deal Engine independently product comparison logic duplicate nahi karega.

---

122. Integration With Affiliate Engine

Offer
↓
Affiliate Engine
↓
Affiliate Program
↓
Tracked Link
↓
Redirect
↓
Merchant

Affiliate logic centralized rahegi.

---

123. Integration With User Preference Engine

User
↓
Country
↓
Category
↓
Brand
↓
Store
↓
Price Preference
↓
Product Preference

Recommendation Engine is data ko use kar sakta hai.

---

124. Integration With Search Engine

Search Engine:

- Product discovery
- Store discovery
- Deal discovery
- Category discovery

handle karega.

Price Comparison Engine search results ke offers ko compare karega.

---

125. Integration With Recommendation Engine

Recommendation Engine:

User Preferences
+
Behavior
+
Active Country
+
Deals
+
Product Data
+
Offer Data

combine karega.

---

126. Integration With Analytics

Analytics centrally track karega:

Country
→ Search
→ Product
→ Offer
→ Click
→ Affiliate
→ Conversion
→ Revenue

---

127. Integration With PSEO

PSEO:

Country
+
Product
+
Category
+
Store
+
Deal
+
Search Demand

use karke useful landing pages generate karega.

---

128. Integration With Telegram Bot

Bot user ko:

- Country selection
- Deals
- Product search
- Price alerts
- Product links
- Store links

provide kar sakta hai.

Bot same central APIs consume karega.

---

129. Integration With Telegram Mini App

Mini App full visual marketplace experience provide karega.

Mini App:

- Country selection
- Deals
- Product search
- Image search
- Price comparison
- Store discovery
- Product pages
- Affiliate CTAs

provide karega.

---

130. Integration With Website

Website same centralized APIs consume karegi.

Website country-aware experience provide kar sakti hai.

Example:

User Market:
UK

Website:
UK deals + UK offers + GBP pricing

---

131. International Market Expansion

New country launch karne ke liye ideally:

Add Country
↓
Add Currency
↓
Add Stores
↓
Add Affiliate Programs
↓
Add Shipping Context
↓
Enable Deals
↓
Enable PSEO
↓
Enable Market

Core product architecture change nahi honi chahiye.

---

132. Market Activation Status

Countries ke statuses:

planned
beta
active
paused
disabled

Only active markets normal user experience mein available honge.

---

133. Unsupported Market

Agar user unsupported country select kare:

This market is currently unavailable.

System nearest/default supported market suggest kar sakta hai without silently changing the user's selection.

---

134. Market Context Security

Client-provided country ko blindly trust nahi kiya jayega.

API:

country_id

validate karegi against Country Registry.

Unauthorized/invalid market IDs reject honge.

---

135. Market Context as First-Class Architecture Component

Country ko sirf filter parameter nahi samjha jayega.

GDN mein:

Market Context ek first-class system component hoga.

Ye influence karega:

Discovery
Deals
Offers
Pricing
Stores
Shipping
Affiliate
Recommendations
PSEO
Analytics
Notifications

---

136. Future Multi-Market Shopping

Future mein user:

Primary Market:
UK

Secondary Markets:
USA
Canada
Germany

enable kar sakta hai.

Lekin default UX simple rahega:

One Active Market at a time.

---

137. Future Global Price Intelligence

Future system same product ki:

- Country price
- Store price
- Historical price
- Discount
- Shipping
- Tax
- Availability

compare karke global price intelligence provide kar sakta hai.

---

138. Future AI Shopping Assistant

Future AI layer user se natural language mein request le sakti hai.

Example:

«"Mujhe UK mein £500 ke andar best laptop deals dikhao."»

AI:

Intent
+
Country
+
Budget
+
Category
+
Preferences

extract karke Search + Recommendation + Price Comparison Engine ko call karegi.

---

139. AI Shopping Flow

User Natural Language
↓
AI Intent Extraction
↓
Active Market
↓
Search Engine
↓
Product Matching
↓
Offer Comparison
↓
Recommendation
↓
Result

AI khud merchant price invent nahi karegi.

---

140. Architecture Rules

Rule 1

Product data centralized rahega.

Rule 2

Offer data centralized rahega.

Rule 3

Affiliate links centralized rahengi.

Rule 4

Country selection centralized Market Context se control hogi.

Rule 5

Manual country selection automatic detection par priority rakhegi.

Rule 6

Country context sirf search par nahi, poori marketplace experience par apply hoga.

Rule 7

Frontend database ko directly access nahi karega.

Rule 8

Different stores ke data ko normalize kiya jayega.

Rule 9

Exact aur similar products ko clearly separate rakha jayega.

Rule 10

Unknown shipping/tax ko falsely zero nahi maana jayega.

Rule 11

Stale offers ko identify kiya jayega.

Rule 12

Commercial incentives search relevance ko override nahi karenge.

Rule 13

New countries modularly add kiye jayenge.

Rule 14

New stores modular connectors se add honge.

Rule 15

Website, Telegram Bot aur Telegram Mini App same centralized architecture consume karenge.

---

141. Final Architecture Principle

GDN Product Search & Price Comparison architecture ka final principle:

One Global Product System + One Central Offer System + One Market Context System + One Price Comparison Engine + One Affiliate Engine → Many Countries → Many Stores → Many Distribution Channels

Aur country architecture:

Automatic Detection = Default Market → Manual Country Selection = User Override → Active Market = Entire Marketplace Experience

Is architecture ki wajah se GDN future mein:

- global product discovery
- country-specific deals
- multi-store price comparison
- image-based shopping
- affiliate commerce
- Telegram Mini App commerce
- website commerce
- PSEO commerce
- personalized recommendations
- AI shopping

ko ek centralized global commerce infrastructure ke andar operate kar sakega.
