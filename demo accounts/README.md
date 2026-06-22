# Demo account setup

This folder contains SQL for adding demo data to a store that you create from the app.

## Before running the SQL

1. Create a real demo user in Clerk.
   - Use the same Clerk environment as the mobile/backend app.
   - Suggested email: `demo.owner@example.com`.
   - Set any password you want for testing.

2. Sign in as that user and create the store from the app.

3. Copy the Clerk user ID from Clerk Dashboard > Users.
   - It should look like `user_...`.

4. Copy the Supabase store ID for the store you created.
   - You can find it in the `stores.id` column or through the admin store detail view if exposed there.

5. Open `create_demo_account.sql`.
   - Replace `REPLACE_WITH_CLERK_USER_ID` with the Clerk user ID.
   - Replace `REPLACE_WITH_STORE_ID` with the Supabase store ID.
   - Optionally change `demo.owner@example.com` if your Clerk demo user uses a different email.

6. Run the SQL after the main Supabase schema and migrations are already applied.
   - The script assumes the tables in `supabase/schema.sql` exist.
   - Run it with the Supabase SQL editor or any SQL client using a privileged/service-role connection.

## What the SQL creates

- Demo data attached to the store you created from the app
- A validation check that the Clerk user is an active owner of that store
- Active business subscription for the owner
- Account credits, onboarding response, notification preferences, and sample notifications
- Store settings with bank transfer, flat-rate delivery, couriers, and social links
- Two store locations
- Five products, including images and variants
- Two promo codes
- One permanent order link and one temporary order link
- Six sample orders across common statuses, with order items and one promo-code usage
- A small amount of analytics demo data, if the analytics tables exist

The SQL is designed to be re-runnable. It updates fixed demo rows where possible and only inserts child rows when they do not already exist. It does not create the store or the primary owner membership. Analytics rows are skipped automatically when `analytics_pageviews` or `analytics_events` are not present.
