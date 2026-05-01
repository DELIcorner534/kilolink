# SQL Test Checklist (RLS + Business Rules)

This checklist helps validate that the schema, RLS policies, and triggers work as expected.

## 1) Preparation

- Create three users in Supabase Auth:
  - `traveler_user`
  - `sender_user`
  - `admin_user`
- Ensure each user has a row in `profiles`.
- Promote admin:
  - `update profiles set role = 'admin' where user_id = '<admin_user_uuid>';`
- Apply `docs/database/migration_up.sql`.

## 2) Seed Minimal Data

- As `traveler_user`, create one trip with status `active`.
- As `sender_user`, create one booking on that trip.
- Store IDs for:
  - `trip_id`
  - `booking_id`
  - `traveler_id`
  - `sender_id`

## 3) RLS Tests - Profiles

- As `sender_user`:
  - Can `select` own profile.
  - Cannot `select` traveler profile directly.
  - Can `update` own profile.
  - Cannot `update` traveler profile.

Expected: only own profile is readable/updatable.

## 4) RLS Tests - Trips

- As anonymous or any authenticated user:
  - Can read trips (`trips_public_read`).
- As `sender_user`:
  - Cannot insert trip with `traveler_id != auth.uid()`.
- As `traveler_user`:
  - Can insert and update own trip.
  - Cannot update a trip owned by another user.

Expected: public read, owner write only.

## 5) Booking Trigger + RLS

- As `sender_user`, insert valid booking:
  - `sender_id = auth.uid()`
  - `kilos_requested <= kilos_available`
  - trip status is `active`
- Negative cases:
  - Try booking own trip as `traveler_user` -> must fail.
  - Try `kilos_requested > kilos_available` -> must fail.
  - Change trip status to `cancelled`, try insert -> must fail.
- RLS read test:
  - `sender_user` can read own booking.
  - `traveler_user` can read booking for own trip.
  - unrelated user cannot read booking.

Expected: trigger/business rules enforced and read visibility limited to participants.

## 6) Messages

- As `sender_user`, insert message on the booking -> success.
- As `traveler_user`, insert message on same booking -> success.
- As unrelated user, insert message on same booking -> fail.
- As unrelated user, read messages -> fail.

Expected: only booking participants can read/write messages.

## 7) Reviews + Rating Recalculation

- Set booking status to `completed`.
- As `sender_user`, insert review for `traveler_user` -> success.
- Try duplicate `(booking_id, reviewer_id)` -> fail (unique constraint).
- As unrelated user, insert review -> fail.
- Verify `profiles.rating` for reviewed user updates automatically.
- Update review rating and verify `profiles.rating` changes.
- Delete review and verify `profiles.rating` reverts/defaults correctly.

Expected: review permissions and rating trigger work.

## 8) Payments

- Create payment row tied to booking.
- As participant (`sender_user` or `traveler_user`), read payment -> success.
- As unrelated user, read payment -> fail.
- As non-admin, try update payment status -> fail.
- As `admin_user`, update payment status -> success.

Expected: participants can read, admin manages.

## 9) Disputes

- As participant, insert dispute for booking -> success.
- As unrelated user, insert dispute -> fail.
- As participant, read dispute -> success.
- As `admin_user`, read and update dispute status -> success.
- As non-admin participant, update dispute status -> fail.

Expected: participants open/read, admin can resolve.

## 10) Notifications

- Insert notifications for both traveler and sender.
- Each user can read/update only their own notifications.
- Cross-user read/update should fail.

Expected: strict per-user isolation.

## 11) Admin Logs

- As non-admin, read/insert into `admin_logs` -> fail.
- As `admin_user`, read/insert -> success.

Expected: admin-only access.

## 12) Constraint Validation

Try invalid writes and expect failures:

- `trips.kilos_available <= 0`
- `trips.price_per_kg < 0`
- `bookings.kilos_requested <= 0`
- `bookings.parcel_value < 0`
- `payments.amount < 0`
- `payments.commission < 0`
- invalid `status` value for `trips`, `bookings`, `payments`, `disputes`

Expected: check constraints reject invalid data.

## 13) Performance Smoke Check

- Run representative queries with `explain analyze`:
  - list trips by route/date
  - list bookings by sender
  - list messages by booking ordered by date
  - list unread notifications by user

Expected: indexes are used on major access paths.

## 14) Regression/Idempotency

- Re-run `migration_up.sql`.
- Confirm no duplicate policy/trigger/index errors.
- Confirm app still reads/writes as expected after rerun.

Expected: migration remains safe on repeated execution.
