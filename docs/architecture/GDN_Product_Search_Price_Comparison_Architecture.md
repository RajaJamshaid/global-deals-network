# GDN Product Search & Price Comparison Architecture

## 1. Purpose

Global Deals Network (GDN) will provide a centralized product discovery and price comparison system.

A user can search for a product using:

- Text
- Product name
- Brand
- Model number
- SKU/GTIN/UPC/EAN/MPN
- Product image
- Barcode from image where detectable

The system will identify the product and search relevant stores in the user's detected country.

The system will compare available offers and present the most relevant verified offer first, with price comparison as the primary commercial ranking signal.

---

## 2. Core Principle

GDN follows:

**User → Automatic Country Detection → Country Store Registry → Product Search → Product Matching → Offer Collection → Price Normalization → Effective Price Calculation → Ranking → Affiliate/Direct Product Link**

The user should not normally need to manually select a country.

---

## 3. Automatic Country Detection

GDN will automatically detect the user's country using IP geolocation.

Example:

User connects from USA
→ System detects USA
→ USA store registry is loaded
→ Product is searched across eligible USA stores.

User connects from UK
→ System detects UK
→ UK store registry is loaded
→ Product is searched across eligible UK stores.

Country detection must be treated as a default context, not an irreversible user setting.

---

## 4. Manual Country Override

Although automatic country detection is the default, users must have a visible option to change country.

Example:

- Detected: USA
- Change Country
- UK
- Canada
- Australia
- UAE
- etc.

Manual selection should override automatic IP detection for the current session.

If the user is authenticated, the selected country may be saved as a preference.

---

## 5. Country Store Registry

Every supported country will have a centralized store registry.

Example:

USA
- Store A
- Store B
- Store C
- Store D
- Store E
- Store F
- Store G
- Store H
- Store I
- Store J

UK
- Store A
- Store B
- Store C
- etc.

Each store record should contain:

- Store ID
- Store name
- Country
- Region
- Website
- Store status
- Supported categories
- Product feed availability
- API availability
- Search availability
- Affiliate availability
- Currency
- Shipping regions
- Data source
- Data freshness
- Store reliability status

---

## 6. Product Search Across Stores

When a user searches for a product, GDN will search all eligible stores for the detected country.

Example:

USA user searches:

"Apple AirPods Pro"

System:

1. Detect USA
2. Load USA store registry
3. Search all eligible USA stores
4. Collect candidate products
5. Match products
6. Normalize offers
7. Compare prices
8. Rank results
9. Display offers

Searches should run in parallel where technically possible.

---

## 7. Text Product Search

Text search should support:

- Product name
- Brand
- Model
- SKU
- UPC
- EAN
- GTIN
- MPN
- Merchant SKU
- Natural-language product descriptions

The search engine should support:

- Typo tolerance
- Synonyms
- Stemming
- Brand recognition
- Model recognition
- Autocomplete
- Exact-match detection
- Variant detection

---

## 8. Image Product Search

The main search interface should support product image upload.

User flow:

**Upload Image → Analyze Image → Identify Product → Search Stores → Match Offers → Compare Prices**

The system may extract:

- Product type
- Brand
- Product name
- Model
- Visible text
- Barcode
- Packaging information
- Product attributes
- Visual features

Image search should work together with text search rather than being completely isolated.

---

## 9. Image Processing Pipeline

Image search pipeline:

```text
User Image
    ↓
Image Validation
    ↓
Resize / Optimize
    ↓
OCR
    ↓
Barcode Detection
    ↓
Visual Product Recognition
    ↓
Product Metadata Extraction
    ↓
Candidate Product Search
    ↓
Product Matching
    ↓
Offer Comparison

Temporary uploaded images should not be retained longer than necessary unless the user explicitly saves them or consent requires retention.


---

10. Product Identification

The system should identify the most likely canonical product.

Identification signals may include:

GTIN

UPC

EAN

ISBN where applicable

MPN

Model number

Brand

Product title

Product attributes

Image similarity

OCR text

Merchant metadata


Multiple signals should be combined to improve accuracy.


---

11. Product Entity

A canonical Product represents the actual product.

Example:

Product ID:
GDN-PROD-12345

Brand:
Apple

Product:
AirPods Pro

Generation:
2nd Generation

Variant:
USB-C

Identifiers:
UPC
EAN
GTIN
MPN

The Product entity is independent of any individual store.


---

12. Offer Entity

An Offer represents one store's listing of a Product.

Example:

Product:
Apple AirPods Pro 2 USB-C

Offer 1:
Store A
$189

Offer 2:
Store B
$179

Offer 3:
Store C
$199

The Product is canonical.

The Offers belong to individual stores.


---

13. Product Matching

GDN must distinguish between:

Exact product

Exact variant

Similar product

Uncertain match


Matching should consider:

Brand

Model

Generation

Size

Color

Storage

Quantity

Package size

Variant

Condition

Product identifiers


A visually similar product must not automatically be treated as the same product.


---

14. Exact vs Similar Results

Search results should clearly identify match confidence.

Example:

Exact Match

Apple AirPods Pro 2 USB-C

Similar Match

Apple AirPods Pro 2 Lightning

Similar products must not be incorrectly presented as exact matches.


---

15. Product Variant Matching

Variant accuracy is critical.

The system must avoid comparing:

128GB vs 256GB

Small vs Large

1-pack vs 3-pack

Black vs White

New vs Refurbished

Different generations

Different model numbers


unless the user specifically requests comparison across variants.


---

16. Store Data Sources

Stores may provide product data through:

Official APIs

Affiliate feeds

Product feeds

Merchant feeds

Approved data integrations

Other lawful and permitted sources


GDN must respect:

Store terms

API terms

Affiliate network rules

Data licensing

Robots.txt where applicable

Applicable laws


No store should be integrated through a method that violates its applicable restrictions.


---

17. Offer Normalization

Store data will be normalized into one common GDN Offer format.

Normalization may include:

Product title

Brand

Model

Variant

Product ID

Store ID

Price

Currency

Shipping

Tax

Discount

Coupon

Availability

Condition

Product URL

Affiliate URL

Last updated time



---

18. Price Normalization

Prices from different stores must be converted into a common comparison format.

The system should store:

Original price

Original currency

Converted price

Conversion rate

Currency conversion timestamp


Example:

Store A: $199 USD
Store B: £145 GBP
Store C: €170 EUR

For the user's market, GDN can display prices in the appropriate local currency.


---

19. Currency Conversion

Currency conversion should use a centralized currency service.

The system must store:

Source currency

Target currency

Exchange rate

Rate timestamp

Conversion source


Currency conversion must not overwrite the original store price.


---

20. Shipping Cost

Where shipping information is available, GDN should include it in effective price calculations.

Example:

Product Price: $180
Shipping: $10
Effective Price: $190

If shipping information is unavailable, the result must clearly indicate:

Shipping not included

GDN must never invent shipping costs.


---

21. Taxes

Where reliable tax information is available, the system may include estimated or known taxes.

If tax information is unavailable:

Tax not included / calculated at checkout

must be displayed where appropriate.

GDN must not represent an incomplete price as a guaranteed final checkout price.


---

22. Coupons & Discounts

The system should detect valid:

Store discounts

Product discounts

Coupon codes

Automatic promotions

Member-only pricing where clearly applicable


Only verified and currently valid discounts should affect the effective price.


---

23. Total Effective Price

The primary comparison metric should be:

Total Effective Price
=
Product Price
+ Shipping
+ Known Applicable Taxes
- Valid Discount/Coupon

Only known values should be included.

If some components are unavailable, the system should label the limitation.


---

24. Price Ranking

Default offer ranking should prioritize the lowest verified effective price among sufficiently confident product matches.

Example:

1. Store B — $179
2. Store A — $189
3. Store C — $199
4. Store D — $205

A low price for the wrong product must never outrank an exact product match.

Product-match confidence is therefore a prerequisite for price ranking.


---

25. Alternative Sort Options

Users may also sort by:

Lowest price

Lowest total effective price

Highest discount

Fastest delivery

Relevance

Store

Availability

Newest offer


Default:

Lowest verified effective price for the matching product/variant


---

26. Availability

Offer results should include:

In stock

Limited stock

Out of stock

Pre-order

Unknown


Out-of-stock offers may be hidden from the primary results by default but can remain accessible through filters where useful.


---

27. Condition

Where relevant, offers should identify:

New

Used

Refurbished

Open box

Other


Different conditions should not be silently compared as equivalent.


---

28. Store Trust Metadata

GDN may display store information such as:

Store name

Store rating where legally/technically available

Availability

Shipping information

Return information where available

Data freshness

Affiliate status


Store trust metadata must not artificially change the price ranking unless the user explicitly chooses a relevant filter.


---

29. Affiliate Link Architecture

Affiliate monetization is optional at the offer level.

If an affiliate link exists:

Offer
→ Affiliate Engine
→ Tracked Affiliate URL
→ Store

If an affiliate link does not exist:

Offer
→ Direct Store/Product URL
→ Store


---

30. Affiliate-Independent Product Discovery

GDN must never remove a relevant store simply because it has no affiliate program.

Core principle:

Product Discovery First → User Value First → Affiliate Monetization Where Available

A non-affiliate store can still appear in price comparison.


---

31. Monetization Type

Every offer should internally support:

monetization_type:
- affiliate
- direct

Potential future values:

- sponsored
- partner
- other

Monetization status must not automatically determine price ranking.


---

32. Affiliate Attribution

Affiliate offers should use the centralized Affiliate Engine.

The Affiliate Engine handles:

Affiliate network

Affiliate program

Affiliate account

Tracking parameters

SubIDs

Click tracking

Attribution

Conversion tracking

Revenue tracking


The Product Search Engine should not independently implement affiliate tracking.


---

33. Search Result Schema

A normalized result may contain:

Product
├── product_id
├── title
├── brand
├── model
├── variant
├── identifiers
├── image
│
└── Offers[]
    ├── offer_id
    ├── store_id
    ├── store_name
    ├── price
    ├── currency
    ├── shipping
    ├── tax
    ├── discount
    ├── effective_price
    ├── availability
    ├── condition
    ├── match_confidence
    ├── monetization_type
    ├── product_url
    └── last_updated


---

34. Search Filters

Users should be able to filter by:

Price

Store

Brand

Category

Availability

Condition

Variant

Discount

Shipping

Delivery

Currency


Country remains the primary market context.


---

35. User Country & Currency

Country affects:

Eligible stores

Store availability

Product availability

Currency

Shipping

Taxes

Affiliate routing

Landing-page content

Deals

Promotions


Example:

USA User
→ USA Stores
→ USD
→ USA Shipping Context
→ USA Product Landing Page


---

36. Country-Specific Product Landing Pages

Product landing pages must automatically adapt to the user's country context.

Example:

USA:
Product → USA Stores → USD Prices → USA Offers

UK:
Product → UK Stores → GBP Prices → UK Offers

Canada:
Product → Canadian Stores → CAD Prices → Canadian Offers

The same canonical Product can therefore have different country-specific offer views.


---

37. PSEO Product Pages

GDN can generate country-specific product pages such as:

/us/product/product-name
/uk/product/product-name
/ca/product/product-name
/au/product/product-name

Pages should only be indexed when they contain sufficient useful, current, and differentiated content.

Thin automatically generated pages must not be indexed simply because a URL exists.


---

38. Canonical Product Architecture

There should be one canonical Product entity.

Country-specific pages are views of that Product using country-specific Offers.

Example:

Canonical Product
        ↓
 ┌──────┼──────┐
USA     UK     Canada
 ↓       ↓       ↓
Offers Offers  Offers

This prevents duplicate product entities.


---

39. International Product Search

If the user intentionally changes country, the search engine should switch the store registry.

Example:

Detected Country: USA
User selects: UK

USA Store Registry
        ↓
   replaced by
        ↓
UK Store Registry

The same product can then be searched in UK stores.


---

40. Duplicate Offer Handling

The system must prevent duplicate offers from appearing due to:

Multiple feeds

Multiple affiliate networks

Multiple data sources

Duplicate merchant records

URL variations


Each offer should have a stable identity.


---

41. Price Freshness

Prices change frequently.

Each offer should store:

last_checked_at

price_updated_at

availability_checked_at

source_timestamp


Stale offers should be marked accordingly.

Example:

Price checked 8 minutes ago

or:

Price information may be outdated


---

42. Price Validation

Before displaying an offer prominently, GDN should validate:

Product identity

Price

Currency

Availability

Product URL

Store status


If validation fails, the offer may be:

Refreshed

Temporarily hidden

Marked uncertain

Removed from primary ranking



---

43. Search Index

The search infrastructure should index:

Products

Product identifiers

Brands

Models

Variants

Stores

Offers

Categories

Countries


Offer indexes should support rapid price and availability updates.


---

44. Product & Offer Database

Core entities:

Country
Store
Product
ProductVariant
ProductIdentifier
Offer
OfferPrice
OfferAvailability
OfferDiscount
ShippingOption
AffiliateLink
SearchIndex

These connect to the existing GDN:

Deal Database

Affiliate Engine

User Engine

Analytics Engine

Search Engine

PSEO Engine



---

45. API Architecture

Core APIs may include:

GET  /api/v1/products/search
POST /api/v1/products/image-search
GET  /api/v1/products/{product_id}
GET  /api/v1/products/{product_id}/offers
GET  /api/v1/products/{product_id}/offers?country=US
GET  /api/v1/stores
GET  /api/v1/stores/{store_id}
GET  /api/v1/price-comparison/{product_id}

Country should normally be inferred from the user context rather than requiring manual selection.


---

46. Image Search API

Image search should support:

POST /api/v1/products/image-search

Processing:

Image
→ Validation
→ OCR / Barcode / Vision
→ Candidate Products
→ Product Matching
→ Store Search
→ Offer Comparison
→ Results


---

47. Background Jobs

Heavy tasks should run asynchronously where appropriate:

Image processing

Product matching

Store feed ingestion

Price updates

Availability updates

Product deduplication

Search indexing

Currency updates

Affiliate link validation

Stale offer cleanup



---

48. Caching

Frequently requested products and offers should be cached.

Cache candidates:

Product search

Product details

Store results

Price comparison

Country store registry

Currency rates


Price-sensitive data must have appropriate TTLs and invalidation rules.


---

49. Analytics

Track:

Product searches

Image searches

Search queries

Country

Stores searched

Products identified

Match confidence

Offers returned

Price comparison views

Store clicks

Affiliate clicks

Direct clicks

Conversions

Revenue

Failed searches

No-result searches


These events feed the centralized Analytics Engine.


---

50. User Preferences & Personalization

The User Preference Engine may later personalize:

Preferred stores

Preferred brands

Preferred categories

Price range

Currency

Country

Delivery preferences

Favorite products


Personalization must not secretly distort factual price information.

The system should clearly distinguish:

Lowest Price

from:

Recommended for You


---

51. Telegram Mini App UX

Primary flow:

Open Telegram Mini App
        ↓
Automatic Country Detection
        ↓
Search Bar
        ↓
Text OR Image Upload
        ↓
Product Identification
        ↓
Search Country Stores
        ↓
Compare Offers
        ↓
Lowest Verified Effective Price
        ↓
Other Offers
        ↓
Store / Affiliate / Direct CTA

The search interface should be extremely simple.

Example:

[ Search for any product... ] [📷]


---

52. Product Comparison Result Card

Each result may show:

Product Image

Apple AirPods Pro 2

Store:
Example Store

Price:
$179

Shipping:
Free

Effective Price:
$179

Availability:
In Stock

Match:
Exact Match

Price checked:
5 min ago

[View Deal]

If affiliate is unavailable, the CTA still works through the direct store URL.


---

53. Website Integration

The same Product Search and Price Comparison Engine should power:

GDN Website

Telegram Mini App

Telegram Bot

Future mobile apps

Future browser extensions

Future APIs

Other distribution channels


No channel should maintain a separate product comparison database.


---

54. Telegram Bot Integration

The Telegram Bot may support:

/search
/product
/compare

The Bot can send users to the Mini App for richer image-based search and comparison.


---

55. AI & Vision Layer

Future AI capabilities may include:

Image product recognition

Visual similarity search

Natural-language product search

Product attribute extraction

Query understanding

Product matching

Variant detection

Similar-product discovery

Price comparison explanations


AI must assist the matching system but should not blindly override verified identifiers.


---

56. Search Confidence

Every product identification should have a confidence score internally.

Example:

GTIN Match: High confidence
Model Match: High confidence
Image Match: Medium confidence
OCR Match: High confidence

The final match decision should combine multiple signals.


---

57. Error Handling

If one store fails:

Store A ✓
Store B ✓
Store C ✗
Store D ✓

The system should continue with available stores.

A single store failure must not break the complete search.

If all stores fail, show a useful retry/fallback response.


---

58. No-Result Handling

If the exact product is unavailable:

1. Search exact identifiers


2. Search normalized product name


3. Search related variants


4. Search similar products


5. Clearly label results as similar



Never silently replace an exact product with a different product.


---

59. Security & Privacy

Image and search systems must follow the central GDN Security Architecture.

Requirements include:

Secure image upload

File type validation

File size limits

Malware protection where applicable

Temporary storage controls

Rate limiting

Abuse prevention

API authentication

Input validation

Privacy controls

Secure third-party integrations


IP country detection should be used only for necessary localization and service functionality.


---

60. Scalability

The architecture must support growth from:

1 Country
→ 10 Stores
→ 50 Stores
→ 100+ Stores
→ 1,000+ Stores

and eventually:

Many Countries
→ Thousands of Stores
→ Millions of Products
→ Millions of Offers
→ Large Global User Base

Store connectors must therefore use a modular adapter architecture.


---

61. Store Connector Architecture

Each store integration should be isolated behind a common interface.

Example:

Store Connector Interface
        ↓
 ┌──────┼────────┬────────┐
Store A Store B Store C Store D

Each connector can implement:

Product search

Product lookup

Price retrieval

Availability retrieval

Shipping retrieval

Product URL

Affiliate URL


The rest of GDN should not depend on store-specific implementation details.


---

62. Parallel Store Search

For a country with 10 stores:

User Search
     ↓
Country Registry
     ↓
10 Store Connectors
     ↓
Parallel Search
     ↓
Candidate Offers
     ↓
Product Matching
     ↓
Price Comparison

Parallel processing should reduce total response time.


---

63. Graceful Degradation

If some data is unavailable:

Show available price

Label missing shipping

Label missing tax

Show last update time

Continue using working stores


Never fabricate missing information.


---

64. Testing & QA

Testing must cover:

Country Detection

USA

UK

Canada

Australia

Other supported markets


Search

Exact product

Misspelled product

Model number

UPC/EAN/GTIN

Brand search


Image Search

Clear image

Blurry image

Multiple products

Packaging

Barcode image

Unsupported image


Matching

Exact product

Similar product

Different variant

Different generation

Different package quantity


Price

Different currencies

Discounts

Coupons

Shipping

Missing shipping

Tax availability

Stale prices


Affiliate

Affiliate URL available

Affiliate URL unavailable

Direct URL fallback


Store Failure

One store unavailable

Multiple stores unavailable

All stores unavailable



---

65. Example: USA

User opens GDN from the USA.

System:

IP Detection
↓
USA
↓
USA Store Registry
↓
10 Eligible Stores

User searches:

Sony WH-1000XM5

GDN searches all 10 stores.

Results:

Store B — $299
Store F — $305
Store A — $319
Store H — $329
...

The lowest verified effective price appears first.


---

66. Example: Image Search

User uploads a photo of a product.

System:

Image
↓
OCR
↓
Barcode Detection
↓
Visual Recognition
↓
Brand + Model Identification
↓
Canonical Product
↓
Country Store Search
↓
Offer Matching
↓
Price Comparison

The user receives offers for the identified product.


---

67. Example: Affiliate Unavailable

Product exists at:

Store A — Affiliate Available
Store B — Affiliate Available
Store C — No Affiliate Program

GDN displays all three relevant offers.

Store C
$175
Direct Store Link

Store C is not removed merely because GDN cannot monetize it.


---

68. Integration With Deal Engine

Product offers may connect with the Deal Engine.

Example:

Product
↓
Store Offer
↓
Current Deal
↓
Discount
↓
Coupon
↓
Effective Price

This allows GDN to combine product discovery with deal discovery.


---

69. Integration With Affiliate Engine

Product Search
      ↓
Offer
      ↓
Affiliate Engine
      ↓
Affiliate Link Available?
     / \
   Yes  No
   ↓     ↓
Tracked Direct
Link    URL

The Product Search Engine remains independent from affiliate monetization.


---

70. Integration With User Engine

User context can provide:

Country

Currency

Language

Preferred stores

Preferred brands

Categories

Price preferences


Automatic country detection remains the default for anonymous users.


---

71. Integration With Analytics Engine

Every important event should flow into the centralized Analytics Engine.

Search
↓
Product Identification
↓
Offer Results
↓
Offer Click
↓
Affiliate/Direct Redirect
↓
Conversion
↓
Revenue

This enables complete funnel measurement.


---

72. Integration With PSEO Engine

The Product Search Engine provides real product and offer data to PSEO pages.

PSEO pages should never create fake products or fake prices.

Example:

Product Data
+
Country
+
Real Store Offers
+
Price Comparison
+
Useful Content
=
Country-Specific Product Page


---

73. Integration With Recommendation Engine

After a product search, GDN can recommend:

Similar products

Related products

Accessories

Alternative brands

Price-drop alerts

Related deals


Recommendations should remain clearly distinct from exact product comparison.


---

74. Data Quality Rules

The system must prioritize:

1. Correct product identity


2. Correct variant


3. Current price


4. Availability


5. Shipping transparency


6. Discount validity


7. Correct store URL


8. Affiliate/direct routing



Commission must never override product-data accuracy.


---

75. Core Data Flow

USER
 ↓
Automatic IP Country Detection
 ↓
Country Store Registry
 ↓
Text / Image Product Search
 ↓
Product Identification
 ↓
Canonical Product Matching
 ↓
Store Connectors
 ↓
Offer Collection
 ↓
Offer Normalization
 ↓
Price / Shipping / Tax / Discount Processing
 ↓
Total Effective Price
 ↓
Match Confidence Validation
 ↓
Price Ranking
 ↓
Product Comparison Results
 ↓
Affiliate Link OR Direct Store Link
 ↓
Analytics


---

76. Final Architecture Principle

One Canonical Product → Many Store Offers → One Central Comparison Engine → Country-Aware Search → Lowest Verified Effective Price First → Affiliate Where Available → Direct Link Where Not Available → One Unified Experience Across Website, Telegram Mini App, Telegram Bot and Future Channels.

The primary objective is:

Help the user find the correct product at the best available verified price in their market, regardless of whether GDN earns an affiliate commission from that store.
