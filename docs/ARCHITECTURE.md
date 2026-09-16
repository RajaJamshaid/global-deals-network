# Global Deals Network — System Architecture

## 1. Core Principle

Global Deals Network will use one centralized platform as the core asset.

Distribution channels are connected to the same core system.

Core:

Deal Database
→ Affiliate Engine
→ User/Preference Engine
→ Analytics & Tracking

Distribution:

Telegram
→ Telegram Bot
→ Telegram Mini App
→ Website / SEO
→ Email / SMS
→ Social Channels

---

## 2. Main System Layers

### Data Layer

- Deals
- Products
- Merchants
- Categories
- Countries
- Affiliate programs
- Prices
- Discounts
- Availability
- Deal expiry
- User preferences

### Business Layer

- Deal management
- Affiliate link generation
- Tracking
- Deal validation
- Deal status
- Recommendations
- Personalization
- Cross-selling

### Application Layer

- Telegram Bot
- Telegram Mini App
- Web Platform
- SEO / pSEO pages
- Admin Dashboard

### Distribution Layer

- Telegram Channel
- Telegram Bot alerts
- Website / Google
- Email / SMS
- TikTok
- YouTube
- Reddit
- X
- Regional channels

---

## 3. Initial Revenue Engine

Initial market:

USA

Initial merchant:

Amazon

Initial flow:

Amazon / approved data source
→ Deal Database
→ Affiliate Engine
→ Deal Distribution
→ User
→ Merchant
→ Click / Conversion
→ Revenue
→ Analytics

After validation:

Walmart
→ eBay
→ UK
→ Canada
→ Germany
→ Japan
→ Middle East
→ Southeast Asia

---

## 4. Dynamic Deal Architecture

Products should not require manually created pages.

A product/deal record is stored in the central database.

Example:

- Product ID
- ASIN / Merchant ID
- Product name
- Brand
- Category
- Country
- Image
- Merchant URL
- Affiliate URL
- Current price
- Previous/reference price
- Discount
- Availability
- Deal status
- Start time
- End time
- Last checked

Deal status can change without deleting the product.

Example:

ACTIVE
→ EXPIRED
→ ACTIVE again

---

## 5. Web Architecture

Dynamic templates will generate:

- Deal pages
- Category pages
- Country pages
- Merchant pages
- Search pages
- SEO/pSEO pages

The system should avoid unnecessary manual page creation.

---

## 6. Telegram Architecture

Telegram Channel:

Public deal distribution.

Telegram Bot:

Commands, alerts, search and user interaction.

Telegram Mini App:

Full interactive platform inside Telegram.

All three connect to the central backend/database.

---

## 7. User System

Future user features:

- Preferences
- Favorite categories
- Favorite merchants
- Favorite countries
- Saved deals
- Personalized alerts
- Deal recommendations
- Related offers

---

## 8. Analytics

Track:

- Impressions
- Deal views
- Clicks
- Affiliate clicks
- Conversions
- Revenue
- User engagement
- Popular categories
- Popular merchants
- Country performance
- Telegram performance
- Website performance

---

## 9. Security

Never expose:

- API keys
- Telegram bot tokens
- Affiliate credentials
- Database credentials
- Payment secrets

Use environment variables and secure secret storage.

---

## 10. Scaling Principle

Build the smallest working system first.

Priority:

1. Foundation
2. USA + Amazon
3. First revenue
4. Optimization
5. More merchants
6. More countries
7. More categories
8. More distribution channels
9. Intelligence and personalization
10. Global scale
