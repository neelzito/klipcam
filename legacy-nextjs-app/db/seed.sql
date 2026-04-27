-- Seed a test user (replace clerk_id with your Clerk user id when available)
insert into users (clerk_id, email, plan, credit_balance)
values ('test_user_1', 'test@example.com', 'free', 100)
ON CONFLICT (clerk_id) DO NOTHING;


