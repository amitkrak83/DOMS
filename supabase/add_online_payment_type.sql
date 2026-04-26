-- Run this in: Supabase Dashboard → SQL Editor
-- Adds 'online' as an allowed payment_type value

DO $$
BEGIN
  -- Drop existing check constraint if it exists
  BEGIN
    ALTER TABLE payments DROP CONSTRAINT payments_payment_type_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  -- Add updated constraint that includes 'online'
  ALTER TABLE payments
    ADD CONSTRAINT payments_payment_type_check
    CHECK (payment_type IN ('cash', 'credit', 'online'));
END $$;
