# GDN Data Architecture

## 1. Data Architecture Principle

GDN ka complete ecosystem ek centralized data architecture par operate karega.

Core principle:

One Central Data Layer → Multiple Applications → Multiple Distribution Channels

Primary data source:

Central GDN Database

Consumers:

- Website
- Telegram Bot
- Telegram Mini App
- Admin Dashboard
- Future Mobile Apps
- Future Partner APIs

Kisi bhi frontend/channel mein independent deal database nahi hoga.

---

## 2. Core Data Entities

GDN ke primary entities:

- Users
- User Preferences
- Deals
- Products
- Merchants
- Categories
- Countries
- Regions
- Affiliate Networks
- Affiliate Programs
- Affiliate Links
- Coupons
- Deal Sources
- Deal Events
- Clicks
- Conversions
- Revenue
- Notifications
- Content Pages
- SEO Metadata
- Admin Users
- System Logs

---

## 3. Users

User record basic identity aur account information store karega.

Core fields:

- user_id
- email
- username
- display_name
- country_id
- language
- timezone
- account_status
- created_at
- updated_at
- last_active_at

Sensitive information minimum rakhi jayegi.

---

## 4. User Preferences

User preferences ko separate entity mein maintain kiya jayega.

Possible fields:

- user_id
- preferred_countries
- preferred_categories
- preferred_merchants
- preferred_products
- preferred_price_range
- preferred_discount_level
- notification_preferences
- marketing_preferences
- created_at
- updated_at

Preferences recommendation aur notification systems ke liye use hongi.

---

## 5. Deals

Deal GDN ka primary commercial data object hoga.

Core fields:

- deal_id
- title
- slug
- description
- merchant_id
- product_id
- category_id
- country_id
- region_id
- deal_type
- original_price
- sale_price
- discount_value
- discount_percentage
- currency
- coupon_code
- affiliate_link_id
- source_id
- start_at
- expires_at
- deal_status
- verification_status
- featured_status
- created_at
- updated_at

Deal status examples:

- draft
- pending
- active
- expired
- paused
- rejected
- archived

---

## 6. Products

Products ko deals se separate entity rakha jayega.

Possible fields:

- product_id
- merchant_id
- name
- slug
- description
- brand
- category_id
- image_url
- product_url
- current_price
- currency
- availability_status
- created_at
- updated_at

One product ke multiple deals ho sakte hain.

---

## 7. Merchants

Merchant entity businesses/retailers ko represent karegi.

Core fields:

- merchant_id
- name
- slug
- website_url
- logo_url
- description
- country_id
- merchant_type
- affiliate_status
- merchant_status
- created_at
- updated_at

Merchant ke multiple products aur deals ho sakte hain.

---

## 8. Categories

Categories hierarchical structure support karengi.

Example:

Shopping
- Fashion
- Electronics
- Home
- Beauty
- Sports

Travel
- Flights
- Hotels
- Car Rental
- Activities

Food
- Restaurants
- Delivery
- Grocery

Fields:

- category_id
- parent_category_id
- name
- slug
- description
- status
- created_at
- updated_at

Parent-child relationships must be supported.

---

## 9. Countries & Regions

GDN global architecture ke liye geographic hierarchy maintain karega.

Structure:

Country
→ Region/State
→ City (if required)

Country fields:

- country_id
- name
- ISO code
- currency
- language
- timezone
- status

Region fields:

- region_id
- country_id
- name
- code
- status

This structure PSEO, filtering, personalization aur deal targeting ke liye use hogi.

---

## 10. Affiliate Networks

Affiliate networks ka centralized record maintain hoga.

Fields:

- affiliate_network_id
- name
- website
- API/feed availability
- status
- created_at
- updated_at

Examples may include:

- Awin
- CJ
- Impact
- Rakuten Advertising
- ShareASale
- Amazon Associates
- Direct merchant programs

Actual integrations will depend on approved access and commercial terms.

---

## 11. Affiliate Programs

Affiliate network aur merchant relationship ko represent karega.

Fields:

- affiliate_program_id
- affiliate_network_id
- merchant_id
- program_id
- commission_type
- commission_value
- cookie_duration
- status
- created_at
- updated_at

One merchant may have multiple affiliate programs.

---

## 12. Affiliate Links

Affiliate links ko deals/products se separate centralized entity mein maintain kiya jayega.

Fields:

- affiliate_link_id
- merchant_id
- affiliate_program_id
- destination_url
- tracking_url
- campaign_id
- sub_id
- status
- created_at
- updated_at

Frontend directly hardcoded affiliate URLs par depend nahi karega.

---

## 13. Deal Sources

Har imported deal ka source record maintain hoga.

Possible source types:

- manual
- affiliate_feed
- merchant_api
- affiliate_api
- approved_partner
- internal
- other_permitted_source

Fields:

- source_id
- source_name
- source_type
- source_reference
- last_sync_at
- status

Source information auditability aur troubleshooting ke liye important hogi.

---

## 14. Coupons

Coupon codes ko optional separate entity rakha ja sakta hai.

Fields:

- coupon_id
- merchant_id
- code
- description
- discount_type
- discount_value
- minimum_purchase
- start_at
- expires_at
- usage_limit
- status

Coupons deals ke saath associate kiye ja sakte hain.

---

## 15. Deal Events

Deal lifecycle events maintain kiye jayenge.

Examples:

- created
- imported
- updated
- verified
- published
- paused
- expired
- archived

Fields:

- event_id
- deal_id
- event_type
- source
- actor_id
- metadata
- created_at

This provides an audit trail.

---

## 16. Click Tracking

Affiliate clicks aur important user interactions track kiye jayenge.

Fields:

- click_id
- user_id
- deal_id
- product_id
- merchant_id
- affiliate_link_id
- channel
- session_id
- device_type
- country
- timestamp

Examples of channel values:

- website
- telegram_bot
- telegram_mini_app
- email
- social
- partner

Only necessary analytics data should be retained.

---

## 17. Conversion & Revenue

Affiliate conversion records revenue attribution ke liye use honge.

Fields:

- conversion_id
- click_id
- affiliate_network_id
- merchant_id
- order_reference
- conversion_value
- commission_value
- currency
- conversion_status
- conversion_at
- confirmed_at

Conversion data network availability aur reporting capabilities par depend karega.

---

## 18. Notifications

Notification records centralized honge.

Fields:

- notification_id
- user_id
- channel
- notification_type
- title
- message
- related_deal_id
- status
- scheduled_at
- sent_at
- created_at

Possible channels:

- Telegram
- Email
- Push
- Future channels

---

## 19. Content & SEO Data

SEO/PSEO pages ke liye structured metadata maintain ki jayegi.

Possible fields:

- content_id
- page_type
- entity_type
- entity_id
- slug
- title
- meta_title
- meta_description
- canonical_url
- content_status
- index_status
- created_at
- updated_at

Dynamic pages must be generated from structured data.

---

## 20. Database Relationships

Core relationships:

User
→ User Preferences

Merchant
→ Products

Merchant
→ Deals

Merchant
→ Affiliate Programs

Affiliate Program
→ Affiliate Links

Product
→ Deals

Category
→ Products

Category
→ Deals

Country
→ Regions

Country
→ Deals

Deal
→ Affiliate Link

Deal
→ Source

Deal
→ Events

User
→ Clicks

Click
→ Conversion

User
→ Notifications

---

## 21. Unique IDs

All major entities should use stable unique identifiers.

Examples:

- user_id
- deal_id
- product_id
- merchant_id
- category_id
- country_id
- affiliate_link_id
- click_id
- conversion_id

Public URLs should normally use human-readable slugs while internal relationships use stable IDs.

---

## 22. Slugs & URLs

SEO-friendly slugs should be generated for public entities.

Examples:

/deals/black-friday-laptop-deal/

/merchant/amazon/

/product/apple-airpods-pro/

/category/electronics/

/country/united-states/

/united-states/electronics/

Slugs must be unique within their relevant URL namespace.

---

## 23. Data Normalization

Imported data must be normalized before publication.

Normalization should include:

- Merchant matching
- Product matching
- Category mapping
- Country mapping
- Currency normalization
- Price normalization
- Date/time normalization
- Discount calculation
- URL normalization
- Duplicate detection

The system must avoid creating multiple records for the same merchant/product/deal unnecessarily.

---

## 24. Deduplication

Duplicate detection should consider:

- Merchant
- Product
- Destination URL
- Coupon code
- Deal title
- Price
- Deal timeframe
- Source

Exact duplicate records should be merged or rejected.

Near-duplicate deals should be flagged for review where appropriate.

---

## 25. Deal Expiration

Every time-sensitive deal should have an expiry mechanism.

Possible expiry signals:

- expires_at reached
- source reports expiration
- merchant URL unavailable
- affiliate feed removes deal
- manual admin action

Expired deals should not remain active.

Historical records may be retained for analytics.

---

## 26. Data Quality

Important validation rules:

- Required fields cannot be empty.
- Prices must be valid numeric values.
- Currency must be recognized.
- Expiry dates must be valid.
- Affiliate links must be valid before publishing.
- Merchant must exist.
- Category must exist where required.
- Country must exist where geographic targeting is required.
- Duplicate detection must run before publication.

---

## 27. Database Indexing

Indexes should be created for high-frequency queries.

Potential indexes:

- deal_status
- expires_at
- merchant_id
- product_id
- category_id
- country_id
- region_id
- created_at
- updated_at
- slug
- affiliate_link_id

Composite indexes should be added based on actual query patterns.

---

## 28. Data Retention

Retention policies should differentiate between:

- Active deals
- Expired deals
- Historical deals
- Click events
- Conversion records
- Analytics events
- System logs

Personal data should not be retained longer than necessary for the intended purpose and applicable requirements.

---

## 29. Database Security

Database security requirements:

- No public database access
- Strong authentication
- Least-privilege permissions
- Encrypted connections
- Secure backups
- Secret management
- Admin access control
- Audit logging
- Regular backup verification

Database credentials must never be exposed in frontend code or public repositories.

---

## 30. Scalability Principle

The data architecture must support growth from an initial small dataset to a large global database.

Expected growth areas:

- Millions of deals
- Large merchant catalog
- Large product catalog
- Large user base
- High click volume
- High analytics volume

Scaling mechanisms may include:

- Database indexing
- Caching
- Read optimization
- Queues
- Background jobs
- Data partitioning where required
- Dedicated search infrastructure
- Analytics warehouse when scale requires it

Architecture decisions should be based on actual system requirements rather than premature complexity.
