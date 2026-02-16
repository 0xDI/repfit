-- Fix existing subscriptions to match their plan's training count
-- Calculate: remaining = plan_training_count - (total_trainings - remaining_trainings)
-- This preserves how many trainings were already used

UPDATE user_subscriptions us
SET total_trainings = sp.training_count,
    remaining_trainings = sp.training_count - (us.total_trainings - us.remaining_trainings)
FROM subscription_plans sp
WHERE us.plan_id = sp.id
  AND us.status = 'active';

-- Also update the profiles table workout_tokens to match
UPDATE profiles p
SET workout_tokens = us.remaining_trainings
FROM user_subscriptions us
WHERE us.user_id = p.id
  AND us.status = 'active';
