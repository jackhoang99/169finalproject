/*
  # Add reminder fields to tasks table

  1. Changes
    - Add `reminder` column (boolean) for enabling/disabling reminders
    - Add `reminder_date` column (timestamptz) for storing reminder timestamps

  2. Security
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'reminder'
  ) THEN
    ALTER TABLE tasks ADD COLUMN reminder boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'reminder_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN reminder_date timestamptz;
  END IF;
END $$;