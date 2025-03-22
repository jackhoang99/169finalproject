import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from 'https://deno.fresh.dev/std@v9.6.2/http/server.ts'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const smtpHost = Deno.env.get('SMTP_HOST')!
const smtpUsername = Deno.env.get('SMTP_USERNAME')!
const smtpPassword = Deno.env.get('SMTP_PASSWORD')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function sendEmail(to: string, subject: string, text: string) {
  const client = new SmtpClient();

  await client.connectTLS({
    hostname: smtpHost,
    port: 587,
    username: smtpUsername,
    password: smtpPassword,
  });

  await client.send({
    from: smtpUsername,
    to: to,
    subject: subject,
    content: text,
  });

  await client.close();
}

async function checkAndSendReminders() {
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

  // Get tasks with reminders due in the next 5 minutes
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      users:user_id (
        email
      )
    `)
    .eq('reminder_email', true)
    .gte('reminder_date', now.toISOString())
    .lte('reminder_date', fiveMinutesFromNow.toISOString())
    .eq('completed', false);

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  // Send reminders for each task
  for (const task of tasks) {
    try {
      await sendEmail(
        task.users.email,
        `Reminder: ${task.text}`,
        `This is a reminder for your task: ${task.text}\n\n` +
        `Priority: ${task.priority}\n` +
        `Due Date: ${task.due_date}\n` +
        `Category: ${task.category}\n\n` +
        `Task Manager Pro`
      );

      // Update task to mark reminder as sent
      await supabase
        .from('tasks')
        .update({ reminder_email: false })
        .eq('id', task.id);

    } catch (error) {
      console.error(`Error sending reminder for task ${task.id}:`, error);
    }
  }
}

serve(async (req) => {
  try {
    await checkAndSendReminders();
    return new Response('Reminders processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return new Response('Error processing reminders', { status: 500 });
  }
})