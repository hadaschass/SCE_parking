// Runs before the test framework/modules are loaded. Provides safe,
// non-production test values so tests never depend on a real .env file.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '4'; // low cost factor keeps tests fast
process.env.PERMIT_VALIDITY_DAYS = '365';
process.env.CORS_ORIGIN = '*';
