/**
 * Runs before every test file (see vitest.config.ts), i.e. before
 * src/config/env.ts is first imported. Provides a FIXTURE internal API
 * key when none is configured (CI sets its own fixture; local runs
 * fall back to this one). It is not a real credential and protects
 * nothing outside the test process.
 */
process.env.GDN_INTERNAL_API_KEY ??= "gdn-test-fixture-internal-api-key-0123456789";
