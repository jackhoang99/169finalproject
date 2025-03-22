/*
  # Add email reminders to tasks

  1. Changes
    - Add `reminder_email` column to tasks table to store if email reminders are enabled
    - Add `reminder_date` column to tasks table to store when to send the reminder
  
  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'reminder_email'
  ) THEN
    ALTER TABLE tasks ADD COLUMN reminder_email boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'reminder_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN reminder_date timestamptz;
  END IF;
END $$;