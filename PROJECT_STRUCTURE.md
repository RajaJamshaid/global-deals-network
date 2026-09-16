# Global Deals Network — Project Structure

## Core Directories

- `docs/` — Architecture, planning and documentation
- `src/` — Core application code
- `database/` — Database schema and migrations
- `telegram/` — Telegram Bot and Mini App
- `affiliate/` — Affiliate integrations and tracking
- `web/` — Website and SEO system
- `config/` — Non-secret configuration
- `scripts/` — Automation and maintenance scripts

## Future Core Systems

- Deal Database
- Merchant Database
- Affiliate Engine
- User Preference Engine
- Analytics & Tracking
- Recommendation Engine
- Deal Expiry System
- SEO / pSEO Engine

## Security Rule

Never commit:

- API keys
- Bot tokens
- Passwords
- Affiliate secrets
- Database credentials
- `.env` files containing secrets

Secrets will later be stored using secure environment variables.

## Development Principle

Mobile-first development until the first revenue milestone.

Initial market:

**USA + Amazon**

Then gradually expand to additional merchants, countries and categories.
