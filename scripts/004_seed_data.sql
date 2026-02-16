-- REPFIT Seed Data

-- Insert default subscription plans for members
INSERT INTO subscription_plans (id, name, description, price, tokens, duration_days, is_active)
VALUES
  (gen_random_uuid(), 'Basic', 'Basic membership with 10 sessions per month', 49.99, 10, 30, true),
  (gen_random_uuid(), 'Standard', 'Standard membership with 20 sessions per month', 89.99, 20, 30, true),
  (gen_random_uuid(), 'Premium', 'Unlimited sessions', 129.99, 999, 30, true)
ON CONFLICT DO NOTHING;
