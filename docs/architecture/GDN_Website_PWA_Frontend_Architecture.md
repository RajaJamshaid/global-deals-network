Global Deals Network

Website & PWA Frontend Architecture

1. Purpose

GDN Website/PWA Frontend global users ke liye central web interface hoga.

Frontend ka kaam:

- Discovery
- Search
- Product comparison
- Deals
- Merchants
- Earn
- Wallet
- Goals
- Seller onboarding
- Account
- Support

Business logic central APIs aur engines mein rahegi.

---

2. Core Principle

Frontend = Presentation + Interaction

Backend = Business Logic + Data Authority

Frontend mein independent:

- Affiliate engine
- User database
- Reward ledger
- Merchant database
- Financial ledger

nahi banaya jayega.

---

3. Architecture

User
 ↓
Cloudflare Edge
 ↓
GDN Web / PWA
 ↓
Central API
 ↓
Central Engines
 ↓
Database / Cache / Search / Queues

---

4. Frontend Channels

Architecture future mein support karegi:

- Website
- PWA
- Telegram Mini App
- Future mobile app
- Future desktop app

Common APIs use honge.

---

5. Mobile-First

Primary design mobile-first hoga.

Important areas:

- Thumb-friendly controls
- Fast loading
- Compact cards
- Bottom navigation
- Large CTA buttons
- Minimal form fields

---

6. Desktop Support

Desktop layout automatically adapt karega.

Support:

- Mobile
- Tablet
- Laptop
- Desktop
- Large screens

---

7. PWA

Website ko future mein Progressive Web App capabilities di ja sakti hain.

Potential features:

- Installable app
- Offline shell
- Push notifications
- App-like navigation
- Cached content

---

8. PWA Limitation

Offline mode live prices, stock, affiliate status aur wallet balance ko authoritative nahi samjhega.

Live data API se validate hoga.

---

9. Frontend Technology

Architecture modern component-based frontend ko support karegi.

Potential stack:

- TypeScript
- React-compatible framework
- CSS
- API client
- PWA service worker

Exact framework implementation stage par finalize hoga.

---

10. Repository Structure

Suggested:

src/
├── app/
├── components/
├── pages/
├── layouts/
├── features/
├── services/
├── api/
├── state/
├── hooks/
├── localization/
├── analytics/
├── auth/
├── commerce/
├── earn/
├── wallet/
├── search/
├── merchants/
├── support/
└── styles/

---

11. Shared Components

Common components:

- Header
- Footer
- Navigation
- Search bar
- Product card
- Deal card
- Offer card
- Merchant card
- Country selector
- Currency selector
- CTA
- Modal
- Toast
- Pagination
- Skeleton loader

---

12. Design System

Central design tokens maintain honge:

- Typography
- Spacing
- Radius
- Shadows
- Breakpoints
- Icons
- Buttons
- Forms
- Cards

---

13. Accessibility

Frontend should support:

- Keyboard navigation
- Screen readers
- Focus states
- Semantic HTML
- Accessible labels
- Sufficient contrast
- Reduced motion

---

14. Header

Header may contain:

- GDN logo
- Search
- Country/market indicator
- Account
- Menu

Mobile par compact version use hogi.

---

15. Navigation

Primary navigation future-ready hogi:

Home
Deals
Search
Earn
Wallet
Profile

---

16. Home Page

Home personalized aur market-aware hogi.

Potential sections:

- Today's Deals
- Trending
- Price Drops
- Categories
- Stores
- Earn Tasks
- Goals
- Recommended Products

---

17. Active Market

Frontend ko API se Active Market Context milega.

Example:

Country: US
Currency: USD
Language: English
Timezone: US/Eastern

---

18. Automatic Country Detection

First arrival par system IP-based country detect kar sakta hai.

Detection user ko force nahi karegi.

---

19. Manual Country Override

User manually country change kar sakta hai.

Manual selection automatic detection ko override karegi.

---

20. Market Persistence

Selected market browser/session/account level par persist ho sakta hai according to privacy rules.

---

21. Country Selector

Country selector available rahega.

User:

- Country browse kar sakta hai
- Local offers dekh sakta hai
- Local merchants dekh sakta hai
- Local currency use kar sakta hai

---

22. Language

Language selection central Localization Engine se controlled hogi.

---

23. Currency

Currency display:

- Market default
- User-selected display currency

Original merchant currency hidden nahi honi chahiye where relevant.

---

24. Search

Global search frontend:

Search
 ↓
Central Search API
 ↓
Results

---

25. Search Input

Support:

- Product names
- Brands
- Models
- Categories
- Merchants
- Keywords
- Natural-language queries

---

26. Autocomplete

Autocomplete API support karega:

- Products
- Brands
- Categories
- Merchants
- Popular searches

---

27. Search Filters

Potential filters:

- Country
- Price
- Category
- Brand
- Merchant
- Discount
- Availability
- Condition
- Shipping
- Rating where verified
- Deal type

---

28. Search Result Card

Product card may show:

- Product image
- Product name
- Lowest price
- Currency
- Merchant
- Discount
- Availability
- Compare CTA

---

29. Product Page

Product detail page may contain:

- Product image
- Product title
- Description
- Variants
- Current offers
- Price comparison
- Merchant information
- Coupons
- Shipping
- Price history where available
- Related products

---

30. Offer Comparison

Offer comparison should clearly separate:

Product

from

Merchant Offer

---

31. Lowest Price

Lowest displayed price must follow centralized comparison rules.

Frontend itself lowest price calculate nahi karega.

---

32. Offer CTA

Examples:

- View Deal
- Shop Now
- Compare
- View on Store
- Use Coupon

CTA central routing use karega.

---

33. Affiliate CTA

Affiliate URL frontend mein hardcode nahi hogi.

Flow:

CTA
 ↓
Central Redirect
 ↓
Affiliate Engine
 ↓
Merchant

---

34. Direct Merchant CTA

No affiliate available ho to:

CTA
 ↓
Central Commerce Router
 ↓
Direct Merchant

---

35. Deal Page

Deal page may include:

- Product
- Current price
- Previous price
- Discount
- Merchant
- Expiry
- Coupon
- Market
- Shipping
- CTA

---

36. Price History

Where verified data exists:

- Historical prices
- Lowest price
- Highest price
- Recent changes

show kiye ja sakte hain.

---

37. Price Drop

Price-drop page central Notification/Deal engines se connected hogi.

---

38. Categories

Category browsing:

Category
 ↓
Subcategory
 ↓
Products
 ↓
Offers

---

39. Merchant Directory

Merchant directory may include:

- Store
- Country
- Categories
- Products
- Offers
- Verification
- Shipping markets

---

40. Merchant Page

Merchant page may show:

- Store profile
- Logo
- Description
- Markets
- Categories
- Current deals
- Products
- Coupons
- Trust indicators

---

41. Seller Onboarding

Frontend mein:

Add Your Store

CTA available ho sakta hai.

---

42. Add Your Store Flow

Add Your Store
 ↓
Application
 ↓
Website / Shopify
 ↓
Business Details
 ↓
Market
 ↓
Categories
 ↓
Payment
 ↓
Verification

---

43. Seller Status

Seller application states:

Draft
Submitted
Verification
Review
Approved
Rejected
Suspended

---

44. Seller Dashboard

Approved sellers ke liye:

- Store
- Products
- Feed
- Orders where applicable
- Analytics
- Promotions
- Billing
- Support

---

45. Earn Page

Main navigation mein:

Earn

available ho sakta hai.

---

46. Earn Dashboard

User ko show:

- Available tasks
- Reward
- Progress
- Completed tasks
- Pending rewards
- Wallet
- Goals

---

47. Task Card

Task card:

- Task title
- Category
- Estimated effort
- Reward
- Country eligibility
- Deadline
- Requirements

---

48. Reward Transparency

Reward completion se pehle clearly show hoga.

Example:

Estimated effort: 5 min
Reward: 25 points/eligible reward

Actual reward unit central Reward Engine decide karega.

---

49. Task Completion

Frontend:

Task
 ↓
Instructions
 ↓
Start
 ↓
Proof / Submission
 ↓
Validation
 ↓
Reward Status

---

50. Video Task

Video task may show:

- Duration
- Required watch conditions
- Reward
- Completion requirements

Anti-skip rules backend enforce karega.

---

51. Wallet

Wallet page:

- Available balance
- Pending balance
- Goal allocation
- Reward history
- Reversals
- Status

---

52. Wallet Authority

Frontend wallet balance calculate nahi karega.

Central Reward/Wallet Engine authority hai.

---

53. Goal Page

Goal page:

- Product
- Target amount
- Current progress
- Remaining
- Eligible offers
- Earn tasks

---

54. Goal Progress

Example:

Target: $500
Progress: $230
Remaining: $270

Data central API se aayega.

---

55. Wishlist

Wishlist may contain:

- Products
- Offers
- Merchants
- Price targets

---

56. Price Alert

User product ke liye target price set kar sakta hai.

Example:

Current: $300
Target: $250

---

57. Notifications

Frontend central Notification Engine se notifications receive karega.

Potential:

- Price drop
- Back in stock
- New deal
- Task available
- Goal progress
- Order update

---

58. Account

Account page:

- Profile
- Market
- Language
- Currency
- Notifications
- Wishlist
- Goals
- Security
- Privacy
- Support

---

59. Authentication

Support:

- Guest
- Email
- Password
- Telegram
- Future OAuth providers

Central Identity Engine authority hai.

---

60. Telegram Login

Telegram users website aur Mini App identity link kar sakte hain.

---

61. Session

Frontend secure session mechanism use karega.

Sensitive tokens browser mein unnecessarily expose nahi kiye jayenge.

---

62. Logout

Logout:

- Local session clear
- Server session revoke where applicable
- Sensitive cached state clear

---

63. Security

Frontend protection:

- XSS prevention
- CSRF protection where applicable
- CSP
- Secure cookies
- Input validation
- Dependency security
- Safe redirects

---

64. User Input

User input:

Frontend validation
 ↓
API validation
 ↓
Business validation

Backend validation mandatory hai.

---

65. Error Handling

Errors user-friendly honge.

Example:

Something went wrong.
Please try again.

Internal stack traces user ko nahi dikhaye jayenge.

---

66. Loading States

Use:

- Skeleton
- Spinner where appropriate
- Progressive loading

Blank screens avoid ki jayengi.

---

67. Empty States

Example:

No deals found
Try another search or country.

---

68. Offline State

PWA offline hone par:

- Cached shell
- Previously cached safe content
- Offline notice

show ho sakta hai.

---

69. Network Recovery

Connection restore hone par frontend:

- Retry safe requests
- Refresh stale data
- Sync permitted local state

---

70. API Client

Central API client handle karega:

- Base URL
- Authentication
- Headers
- Retries
- Errors
- Timeouts
- Request IDs

---

71. API Versioning

Frontend explicit API version use karega.

Example:

/api/v1/

---

72. State Management

State categories:

- UI state
- Session state
- Market state
- Search state
- User preferences
- Cached server state

---

73. Server State

Server data central API se aayega.

Frontend permanent source of truth nahi hoga.

---

74. Market State

Market changes par relevant data refresh hoga.

---

75. Cache

Frontend safe data temporarily cache kar sakta hai.

Sensitive data carefully handle hoga.

---

76. Cache Invalidation

Invalidate when:

- Market changes
- User logs out
- Offer expires
- Price changes
- Product changes

---

77. Performance

Target:

- Fast initial load
- Minimal JavaScript
- Lazy loading
- Image optimization
- CDN caching
- Code splitting

---

78. Core Web Vitals

Monitor:

- LCP
- INP
- CLS

---

79. Image Optimization

Product images:

- Responsive
- Compressed
- Proper dimensions
- Lazy loaded
- CDN served

---

80. Image Search

Future image search:

Upload Image
 ↓
Image Search API
 ↓
Product Matching
 ↓
Offers

---

81. Image Upload

Frontend upload must:

- Validate type
- Validate size
- Compress where appropriate
- Remove unsafe metadata where applicable
- Use secure upload endpoint

---

82. Visual Search

Visual search results must show confidence where applicable.

Exact and similar matches clearly distinguish honge.

---

83. SEO Architecture

Website SEO pages central PSEO system se generated/managed honge.

---

84. SEO URL

Examples:

/deals/
/products/
/stores/
/categories/
/countries/
/brands/

---

85. Country SEO

Country-aware pages:

/us/
/uk/
/ca/
/de/
/jp/

Actual country structure central SEO architecture decide karegi.

---

86. Canonical

Canonical URLs central SEO rules ke according generate honge.

---

87. Hreflang

Localized pages appropriate hreflang references use karengi.

---

88. Structured Data

Where valid:

- Product
- Offer
- Breadcrumb
- Organization
- WebSite

structured data use ki ja sakti hai.

---

89. Dynamic Content

Dynamic price/deal information API se load ho sakti hai.

SEO-critical information server-rendered/static-rendered where appropriate.

---

90. PSEO Integration

Frontend PSEO pages use:

- Central Product DB
- Deal DB
- Merchant DB
- Market DB
- Affiliate Engine

---

91. Thin Pages

Frontend must not generate thousands of low-value empty pages.

Page eligibility central PSEO system control karega.

---

92. Internal Linking

Website should connect:

Country
 ↓
Category
 ↓
Merchant
 ↓
Product
 ↓
Deal

---

93. Search Engine Crawl

Important pages should be:

- Crawlable
- Indexable where intended
- Canonical
- Fast

---

94. Robots

Robots rules centrally managed honge.

Private pages should not be indexed.

---

95. Sitemap

Sitemaps central SEO system generate karega.

---

96. Analytics

Frontend events central Analytics Engine ko send karega.

Examples:

- Page view
- Search
- Product click
- Offer click
- CTA click
- Task start
- Task completion
- Goal interaction

---

97. Analytics Privacy

Analytics collection privacy/consent architecture follow karegi.

---

98. Affiliate Tracking

Affiliate click:

Frontend CTA
 ↓
Central Redirect
 ↓
Analytics Event
 ↓
Affiliate Engine
 ↓
Merchant

---

99. Campaign Tracking

Campaign parameters centrally standardized honge.

Examples:

- Campaign ID
- Channel
- Placement
- Creative
- Market

---

100. A/B Testing

Future frontend experiments central experimentation system se controlled honge.

Examples:

- CTA
- Layout
- Search UI
- Deal cards

---

101. Feature Flags

Feature flags may control:

- New UI
- New market
- New payment method
- New search feature
- Earn features

---

102. Feature Flag Authority

Flags backend/admin-controlled honge.

Frontend hardcoded production switches avoid karega.

---

103. Country Rollout

New country:

Market Config
 ↓
Feature Flag
 ↓
Frontend Localization
 ↓
Merchant/Offer Availability
 ↓
Launch

---

104. Language Rollout

New language central translation system ke through add hogi.

---

105. RTL

Future RTL languages ke liye layout architecture prepared hoga.

---

106. Dark Mode

Dark mode future feature ho sakta hai.

Theme system centralized design tokens use karega.

---

107. Accessibility Preferences

User preferences may include:

- Reduced motion
- Font scaling
- Contrast preferences

---

108. Support

Frontend support entry points:

- Help
- FAQ
- Report Deal
- Report Merchant
- Purchase Help
- Task Dispute
- Reward Dispute

---

109. Trust Signals

Merchant/product pages may display verified trust indicators.

Trust data central Trust & Safety Engine se aayega.

---

110. Report Function

User report:

Report
 ↓
Reason
 ↓
Evidence
 ↓
Central Trust System

---

111. Seller Registration Payment

If seller registration fee applicable ho:

Application
 ↓
Payment Engine
 ↓
Payment Success
 ↓
Application Submission

Payment frontend direct financial ledger update nahi karega.

---

112. Checkout Boundary

Frontend clearly distinguish kare:

GDN interface

vs

Merchant checkout

---

113. Merchant Checkout Warning

External checkout par user ko appropriate context diya ja sakta hai:

You are being redirected to the merchant's website.

---

114. External Link Safety

External links:

- HTTPS
- Approved domain
- Valid merchant
- Safe destination

---

115. WebView

Telegram Mini App / WebView environment detect karte waqt security boundaries maintain hongi.

---

116. Telegram Mini App Integration

Mini App shared frontend components use kar sakta hai.

Lekin:

- Telegram authentication
- Telegram UI constraints
- Telegram payment mechanisms

platform-specific adapters mein rahenge.

---

117. Shared Frontend Core

Recommended:

Core UI
   +
Market System
   +
API Client
   +
Business Feature Modules
   ↓
Website / PWA / Mini App

---

118. Avoid Duplication

Website aur Mini App mein same business rules duplicate nahi hongi.

---

119. Frontend Feature Modules

Suggested:

features/
├── deals/
├── products/
├── search/
├── merchants/
├── earn/
├── wallet/
├── goals/
├── wishlist/
├── commerce/
├── notifications/
├── account/
└── support/

---

120. Commerce Module

Commerce frontend handles:

- Offer selection
- Purchase intent
- Redirect
- Order display
- Purchase support

---

121. Earn Module

Earn frontend handles:

- Task discovery
- Task details
- Submission
- Reward status
- Wallet navigation

---

122. Wallet Module

Wallet frontend handles display only.

Financial/reward calculations backend authority hain.

---

123. Merchant Module

Merchant frontend handles:

- Store discovery
- Store profile
- Seller application
- Seller dashboard

---

124. Search Module

Search frontend central Search API use karega.

No independent search database.

---

125. Recommendation Module

Recommendation cards central Recommendation Engine se data leti hain.

---

126. Notification Module

Notification preferences central Notification Engine se synchronized hongi.

---

127. User Preferences

Frontend user preferences API se read/write karega.

Examples:

- Country
- Language
- Currency
- Categories
- Brands
- Merchants
- Notifications

---

128. Frontend Security Boundary

Browser ko kabhi trust boundary nahi samjha jayega.

Important validation server-side hogi.

---

129. Build Pipeline

Frontend deployment:

GitHub
 ↓
CI
 ↓
Tests
 ↓
Build
 ↓
Preview
 ↓
Staging
 ↓
Production

---

130. Preview Deployments

Pull request ke liye preview environment create kiya ja sakta hai.

---

131. Production Deployment

Production deployment controlled CI/CD process se hoga.

---

132. Rollback

Failed release par previous known-good build restore kiya ja sakta hai.

---

133. Monitoring

Monitor:

- JavaScript errors
- API errors
- Page performance
- Search failures
- Checkout redirects
- PWA errors
- Core Web Vitals

---

134. Error Reporting

Errors mein:

- Request ID
- Release version
- Route
- Browser
- Market

include ho sakte hain, lekin sensitive user data nahi.

---

135. Browser Compatibility

Support target:

- Modern Chrome
- Safari
- Firefox
- Edge
- Mobile browsers

---

136. Graceful Fallback

Unsupported browser par:

- Core website
- Search
- Product pages
- Merchant links

functional rehne chahiye where possible.

---

137. Scalability

Frontend CDN/edge architecture use karega.

Static assets globally cached ho sakte hain.

---

138. Cloudflare Integration

Potential:

Cloudflare DNS
 ↓
CDN / Edge
 ↓
Frontend
 ↓
API

Cloudflare configuration existing TickmarkTools infrastructure ko affect nahi karegi.

---

139. Domain Separation

GDN deployment separate domain/subdomain architecture use karega.

Example:

deals.tickmarktools.com

temporary deployment ke liye use ho sakta hai.

Future dedicated GDN domain support rahega.

---

140. Final Architecture

                    GLOBAL DEALS NETWORK
                             │
                       Web / PWA
                             │
              ┌──────────────┼──────────────┐
              │              │              │
           Search          Deals          Earn
              │              │              │
              └──────────────┼──────────────┘
                             │
                     Central API Layer
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
     Identity             Market             Commerce
        │                    │                    │
     User Data          Localization       Affiliate
                                             │
        ┌────────────────────────────────────┘
        │
   Central Engines
        │
 ┌──────┼────────┬─────────┬─────────┐
 │      │        │         │         │
Search Deals  Rewards   Analytics Support
 │      │        │         │         │
 └──────┴────────┴─────────┴─────────┘
                 │
              Database

Core Principle

One Central Backend → Multiple Frontends → One User Identity → One Market System → One Commerce/Affiliate Layer → One Source of Truth

Website/PWA sirf interface hai; GDN ki actual business intelligence aur data central engines mein rahegi.
