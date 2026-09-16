process.env.DATABASE_URL??="postgresql://test:test@localhost:5432/test";
process.env.AUTH_SECRET??="test-auth-secret-at-least-thirty-two-characters";
process.env.REDIS_URL??="redis://localhost:6379";
process.env.BILLING_WEBHOOK_SECRET??="test-billing-secret-long-enough";
process.env.ANALYTICS_SALT??="test-analytics-salt-long-enough";
