Global Deals Network

Repository & Environment Setup

File: "docs/implementation/GDN_Repository_And_Environment_Setup.md"
Version: 1.0
Stage: Stage 1 — Small MVP
Status: Implementation Specification

---

1. Objective

Is stage ka goal sirf GDN ki basic technical foundation ready karna hai.

Abhi poora architecture implement nahi karna.

Lekin foundation aisi hogi ke future mein:

- Database
- API
- Affiliate Engine
- Search
- Telegram
- Mini App
- Earn & Rewards
- Seller Marketplace
- Payments
- PSEO
- AI

isi foundation par gradually add kiye ja saken.

---

2. Current Repository

GitHub repository:

https://github.com/RajaJamshaid/global-deals-network

Current branch:

main

Production/staging branches future requirement ke mutabiq add ki jayengi.

---

3. Current Cloudflare Deployment

Current GDN deployment:

https://deals.tickmarktools.com

Important

Existing website:

tickmarktools.com

ko GDN setup se modify nahi karna.

GDN ke liye:

deals.tickmarktools.com

separate deployment boundary maintain karni hai.

Future mein dedicated GDN domain connect kiya ja sakta hai.

---

4. Stage 1 Principle

Stage 1 mein sirf required files create hongi.

Initial structure:

global-deals-network/
│
├── docs/
│   ├── architecture/
│   └── implementation/
│
├── src/
│
├── public/
│
├── database/
│
├── tests/
│
├── scripts/
│
├── config/
│
├── .github/
│   └── workflows/
│
├── .gitignore
├── .env.example
└── README.md

Future modules gradually add honge.

---

5. Stage 1 Technology Principle

Initial implementation mein unnecessary technologies add nahi karni.

Primary requirements:

GitHub
Cloudflare
PostgreSQL-compatible Database
Backend API
Frontend
Telegram
Affiliate Integration
Analytics

Future services provider-independent interfaces ke through add kiye jayenge.

---

6. Environment Separation

GDN ke minimum 3 environments define honge:

development
staging
production

Development

Local testing.

Staging

Production se pehle complete testing.

Production

Real users aur real revenue.

---

7. Environment Variables

Actual secrets repository mein nahi honge.

".env.example" sirf variable names contain karegi.

Example categories:

APP_ENV
APP_URL
API_URL

DATABASE_URL

TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET

AFFILIATE_NETWORK
AFFILIATE_TRACKING_ID

ANALYTICS_ID

Future:

SEARCH_API_KEY
STORAGE_API_KEY
PAYMENT_API_KEY
AI_API_KEY
EMAIL_API_KEY

add kiye ja sakte hain.

---

8. Secret Rules

Kabhi bhi commit nahi karna:

.env
.env.local
.env.production
API keys
Database passwords
Telegram Bot Token
Affiliate secrets
Payment secrets
Cloudflare secrets
Private certificates

Repository mein sirf:

.env.example

rahegi.

---

9. Git Ignore

".gitignore" mein minimum:

node_modules/
.env
.env.*
!.env.example

dist/
build/
.cache/
.tmp/

coverage/

.DS_Store
Thumbs.db

*.log

.vscode/
.idea/

Production secrets kabhi repository mein nahi jayenge.

---

10. README Purpose

Root "README.md" mein initially:

# Global Deals Network

Global Deals Network is a centralized global deals, commerce,
affiliate, rewards and marketplace platform.

Core principle:

One Core
One Source of Truth
Multiple Distribution Channels

Current Stage:
Stage 1 — Small MVP

Current Market:
USA

Initial Affiliate Focus:
Amazon

Detailed architecture "docs/architecture/" mein rahegi.

---

11. Documentation Separation

Architecture

docs/architecture/

Yahan final system blueprint rahega.

Implementation

docs/implementation/

Yahan actual build steps rahenge.

API Documentation

Future:

docs/api/

Database Documentation

Future:

docs/database/

Operations

Future:

docs/operations/

---

12. Initial Source Structure

Stage 1 mein:

src/
├── api/
├── config/
├── market/
├── catalog/
├── merchant/
├── offer/
├── deal/
├── affiliate/
└── analytics/

Abhi empty folders ko unnecessary code se fill nahi karna.

Module tab implement hoga jab uski stage aaye.

---

13. Initial Database Structure

Stage 1 mein complete 27+ migration system implement nahi karna.

Pehle minimum:

users
markets
categories
products
merchants
offers
deals
affiliate_programs
affiliate_links
click_events

Future stages mein:

earn
wallet
commerce
payments
seller
notifications
campaigns
support
trust
ai

add honge.

---

14. Initial Market

Stage 1:

Country:
USA

Currency:
USD

Language:
English

Timezone:
America/New_York

Market architecture future countries ke liye ready rahegi.

---

15. Initial Merchant

Stage 1 mein primary merchant:

Amazon

Future:

Walmart
eBay
Target

aur additional merchants add kiye jayenge.

---

16. Initial Affiliate System

Stage 1 mein sirf basic Affiliate Engine implement hoga.

Flow:

Product
 ↓
Offer
 ↓
Affiliate Program
 ↓
Affiliate Link
 ↓
Tracked Redirect
 ↓
Merchant

Affiliate system ko future multi-network architecture ke compatible rakha jayega.

---

17. Initial Tracking

Minimum events:

page_view
product_view
deal_view
affiliate_click

Future:

conversion
commission
revenue
purchase

add honge.

---

18. Initial API

Stage 1 API minimum:

GET /api/v1/health

GET /api/v1/markets

GET /api/v1/categories

GET /api/v1/products

GET /api/v1/products/:id

GET /api/v1/deals

GET /api/v1/deals/:id

GET /api/v1/merchants

GET /api/v1/search

GET /api/v1/affiliate/redirect/:id

API future service modules ke liye base provide karegi.

---

19. Initial Website

Website par minimum:

Home
Deals
Search
Product Detail
Deal Detail
Merchant

Future:

Earn
Wallet
Goals
Seller
Profile
Notifications

add honge.

---

20. Initial Telegram

Stage 1 mein:

Telegram Channel
Telegram Bot
Basic Mini App

implement kiye jayenge.

Bot ka main purpose:

Deals
Search
Mini App Open

hoga.

---

21. Initial Mini App

Initial Mini App:

Home
Deals
Search
Product Detail
Deal Detail

Future navigation:

Earn
Wallet
Goals
Wishlist
Profile
Seller

add hogi.

---

22. Initial Search

Stage 1 search simple rakhi jayegi.

Support:

Product Name
Brand
Category
Merchant

Advanced:

Typo Tolerance
Semantic Search
Image Search
AI Search

later add honge.

---

23. Initial Product Comparison

Basic flow:

User Search
 ↓
Products
 ↓
Available Offers
 ↓
Price
 ↓
Merchant
 ↓
Affiliate CTA

Advanced:

Shipping
Tax
Coupon
Effective Price
Availability
Condition

later add honge.

---

24. Initial Deal Pipeline

Stage 1:

Amazon/Data Source
 ↓
Import
 ↓
Normalize
 ↓
Validate
 ↓
Product Match
 ↓
Offer
 ↓
Deal
 ↓
Database

Manual/import-based approach initially acceptable hai.

Full automated global ETL later implement hoga.

---

25. Initial Admin Requirement

Full Admin Dashboard abhi nahi banana.

Initial admin functionality minimum:

Add Product
Add Offer
Add Deal
Add Merchant
Manage Affiliate Link
View Clicks

Simple protected admin interface/API enough hai.

Full dashboard future stage mein.

---

26. Initial Security

Stage 1 mein minimum:

HTTPS
Environment Secrets
Input Validation
API Rate Limiting
Authentication Boundary
Admin Protection
Telegram Webhook Validation
Affiliate Redirect Validation

Future security architecture complete hoti jayegi.

---

27. Initial Testing

Stage 1 tests:

API Health
Database Connection
Product Creation
Offer Creation
Deal Creation
Search
Affiliate Redirect
Click Tracking
Telegram Bot
Mini App

Full QA architecture later expand hogi.

---

28. Initial Deployment

Deployment:

GitHub
 ↓
Cloudflare
 ↓
Staging
 ↓
Testing
 ↓
Production

Existing TickmarkTools deployment untouched rahegi.

---

29. Stage 1 Done Criteria

Stage 1 complete tab hogi jab:

✓ GitHub structure ready
✓ Environment setup ready
✓ Database connected
✓ Core tables ready
✓ API running
✓ Products working
✓ Offers working
✓ Deals working
✓ Amazon affiliate flow working
✓ Click tracking working
✓ Website working
✓ Telegram Channel working
✓ Telegram Bot working
✓ Mini App basic version working
✓ Basic search working
✓ Production deployment working

---

30. Stage 1 Revenue Goal

Stage 1 ka primary objective:

Revenue validation.

Focus:

Traffic
 ↓
Deal Discovery
 ↓
Product View
 ↓
Affiliate Click
 ↓
Purchase
 ↓
Commission

Agar revenue start hota hai to next stage mein investment aur functionality gradually increase ki jayegi.

---

31. Stage 2 Trigger

Stage 2 automatically start nahi hogi sirf is liye ke architecture mein feature exist karta hai.

Stage 2 ka trigger:

Working MVP
+
Real Users
+
Real Affiliate Clicks
+
Initial Revenue
+
Usage Data

Phir next modules priority ke according build honge.

---

32. Growth Model

Stage 1
Small MVP
     ↓
Initial Revenue
     ↓
Stage 2
Improve Core + Search
     ↓
More Revenue
     ↓
Stage 3
Earn + Rewards
     ↓
More Users
     ↓
Stage 4
Seller Marketplace
     ↓
More Revenue Streams
     ↓
Stage 5
More Merchants + Networks
     ↓
Stage 6
More Countries
     ↓
Stage 7
PSEO + Media
     ↓
Stage 8
AI + Advanced Intelligence
     ↓
Stage 9
Mobile + Global Channels
     ↓
FULL GDN ARCHITECTURE

---

33. Architecture Preservation Rule

Small MVP ka matlab architecture compromise karna nahi hai.

Implementation:

Small

hogi.

Architecture:

Full

rahegi.

Example:

Aaj:

1 Country
1 Merchant
1 Affiliate Network

Future:

100+ Countries
1000s Merchants
Multiple Affiliate Networks

Lekin same central architecture use hogi.

---

34. Do Not Rebuild Rule

Future expansion mein:

Existing Core

ko unnecessary replace nahi karna.

Instead:

Existing Module
      +
New Capability

add karni hai.

Example:

Amazon Affiliate
      ↓
Amazon + Walmart + eBay

na ke:

Old Affiliate System Delete
↓
New System

---

35. Final Rule

GDN ka complete architecture long-term target hai.

Implementation ka rule:

«Build Small → Launch → Earn → Learn → Expand → Reinvest → Scale → Complete the Full Architecture.»

Stage 1 mein sirf woh functionality build hogi jo GDN ko real users aur real revenue tak le ja sake, lekin har component future full GDN ke saath compatible hoga.
