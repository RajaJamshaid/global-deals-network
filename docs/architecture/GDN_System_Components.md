# GDN System Components

## 1. System Overview

Global Deals Network (GDN) ek centralized global deals, affiliate, media aur commerce platform hoga.

Core principle:

All distribution channels connect to one centralized GDN backend and Deal Database.

Main components:

- GDN Website
- Telegram Bot
- Telegram Mini App
- Central API
- Central Deal Database
- Affiliate Engine
- User & Preference Engine
- Search & Recommendation Engine
- Analytics & Tracking Engine
- Content & PSEO Engine
- Admin Dashboard
- Notification Engine
- AI Layer

---

## 2. GDN Website

The website will provide:

- Global deal discovery
- Country-specific deals
- Category-specific deals
- Merchant pages
- Product pages
- Deal detail pages
- Search
- Filters
- Personalized recommendations
- Affiliate links
- SEO/PSEO landing pages
- Editorial/content pages

The website must consume centralized data through the GDN API instead of maintaining separate deal databases.

---

## 3. Telegram Bot

The Telegram Bot will provide:

- Deal alerts
- Deal discovery
- Search
- Category selection
- Country selection
- User preference collection
- Personalized notifications
- Links to relevant deals
- Links to the Telegram Mini App

The Bot will use the same central backend and database as the website and Mini App.

---

## 4. Telegram Mini App

The Telegram Mini App will function as a full shopping/deal-discovery interface inside Telegram.

Core features:

- Home
- Search
- Categories
- Countries
- Deal listings
- Deal detail pages
- Merchant pages
- Product pages
- Personalized deals
- User preferences
- Affiliate redirects
- Saved/favorite deals
- Notifications/preferences

The Mini App must not maintain an independent deal database.

---

## 5. Central API

The API is the communication layer between all GDN applications and the backend.

Primary consumers:

- Website
- Telegram Bot
- Telegram Mini App
- Admin Dashboard
- Future mobile applications
- Future partner integrations

Core API areas:

- Deals
- Products
- Merchants
- Categories
- Countries
- Users
- Preferences
- Search
- Recommendations
- Affiliate tracking
- Analytics
- Notifications
- Content

The API must use versioning from the beginning.

Example:

`/api/v1/deals`

---

## 6. Central Deal Database

The Deal Database is the core data asset of GDN.

It will store:

- Deals
- Products
- Merchants
- Categories
- Countries
- Regions
- Prices
- Discount information
- Coupon codes
- Start dates
- Expiry dates
- Deal status
- Affiliate URLs
- Tracking information
- Source information
- Verification status

All channels must use this centralized source of truth.

---

## 7. Affiliate Engine

The Affiliate Engine manages affiliate relationships and outbound monetization.

Responsibilities:

- Affiliate network identification
- Merchant identification
- Affiliate link management
- Tracking parameters
- Click tracking
- Redirect handling
- Campaign attribution
- Conversion attribution
- Commission data
- Revenue reporting

Affiliate links must be centrally managed so that links can be updated without rebuilding every frontend page.

---

## 8. User & Preference Engine

The User Engine manages user profiles and preferences.

Possible data:

- User ID
- Country/region
- Preferred categories
- Preferred merchants
- Preferred products
- Price preferences
- Deal preferences
- Saved deals
- Notification preferences
- Interaction history

Telegram users and website users should eventually be connectable through a unified user identity system where technically and legally appropriate.

---

## 9. Search & Discovery Engine

The Search Engine will allow users to discover:

- Deals
- Products
- Merchants
- Categories
- Countries
- Coupons
- Content

Search should support:

- Keyword search
- Filters
- Sorting
- Category filtering
- Country filtering
- Merchant filtering
- Price filtering
- Discount filtering
- Availability/status filtering

The architecture should allow a dedicated search engine to be added later if database search becomes insufficient.

---

## 10. Recommendation Engine

The Recommendation Engine will generate relevant deals based on:

- User preferences
- Country
- Category
- Previous interactions
- Saved deals
- Search behavior
- Merchant interests
- Product interests
- Current trends

Initial version can use rule-based recommendations.

Future versions can introduce machine-learning/AI recommendations.

---

## 11. Analytics & Tracking Engine

The Analytics Engine will track important events.

Examples:

- Page view
- Search
- Deal view
- Product view
- Merchant view
- Click
- Affiliate click
- Save/favorite
- Telegram interaction
- Notification interaction
- Conversion
- Revenue

All important events should use a standardized event structure.

---

## 12. Content & PSEO Engine

The Content Engine will support scalable SEO pages.

Potential page types:

- Country pages
- City/region pages
- Category pages
- Merchant pages
- Product pages
- Deal pages
- Country + category pages
- Merchant + category pages
- Product-related pages

Dynamic content should be generated from structured database data.

Pages must avoid thin, duplicate or low-value content.

---

## 13. Admin Dashboard

The Admin Dashboard will provide centralized management.

Main modules:

- Deals
- Products
- Merchants
- Categories
- Countries
- Affiliate networks
- Affiliate links
- Users
- Notifications
- Content
- SEO/PSEO
- Analytics
- Revenue
- System settings

Admin permissions should support role-based access.

---

## 14. Deal Data Pipeline

Deal data can enter GDN through:

- Manual entry
- Affiliate feeds
- Merchant feeds
- APIs
- Approved data integrations
- Other permitted sources

Pipeline stages:

Source
→ Import
→ Normalize
→ Validate
→ Deduplicate
→ Enrich
→ Verify
→ Publish
→ Monitor
→ Expire/Archive

The pipeline should prevent duplicate and expired deals from being unnecessarily published.

---

## 15. Notification Engine

The Notification Engine will manage:

- Telegram notifications
- Deal alerts
- Personalized alerts
- Category alerts
- Merchant alerts
- Price/deal alerts
- Expiry reminders

Users must be able to control notification preferences.

The system should support rate limits and notification frequency controls.

---

## 16. Authentication & Identity

The system should support multiple identity sources.

Potential identity methods:

- Telegram identity
- Email
- Website account
- Future social/login providers

User identity must be securely handled.

Sensitive credentials and secrets must never be stored in frontend code.

---

## 17. Security Layer

Security responsibilities include:

- HTTPS
- API authentication
- Authorization
- Input validation
- Rate limiting
- Bot protection
- Abuse prevention
- Secure secret management
- Admin access control
- Affiliate click abuse protection
- Logging
- Monitoring

All production secrets must be stored using secure environment/secret management.

---

## 18. Infrastructure Layer

Initial infrastructure should prioritize low-cost and scalable services.

Primary components:

- GitHub
- Cloudflare DNS
- Cloudflare CDN
- Cloudflare Pages/Workers
- Backend/API infrastructure
- Database
- Object storage where required
- Cache
- Scheduled jobs/queues where required

Architecture should allow individual components to scale independently.

---

## 19. AI Layer

The AI Layer is a future expansion layer.

Potential functions:

- Natural-language deal search
- Deal summarization
- Personalized recommendations
- Shopping/deal assistant
- Product comparison
- Deal explanation
- User preference understanding
- Automated content assistance

AI must operate on approved GDN data and should not replace core deterministic business logic.

---

## 20. Single Source of Truth Principle

The Central GDN Database and backend services are the primary source of truth.

Architecture rule:

Website
→ GDN API
→ Central Database

Telegram Bot
→ GDN API
→ Central Database

Telegram Mini App
→ GDN API
→ Central Database

Admin Dashboard
→ GDN API
→ Central Database

Future applications
→ GDN API
→ Central Database

No frontend or distribution channel should create an independent deal database.

This architecture ensures that:

- One deal can appear across multiple channels.
- Affiliate links can be updated centrally.
- Deal status can be updated centrally.
- Analytics can be centralized.
- User preferences can be shared across supported channels.
- The system can scale without rebuilding each channel independently.
