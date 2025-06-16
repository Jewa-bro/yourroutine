import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as webpush from "jsr:@negrel/webpush";
import { corsHeaders } from '../_shared/cors.ts';

const vapidKeys = {
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
};

// The function is triggered by a cron job
serve(async (req) => {
  // This function doesn't need to handle preflight requests as it's not called from the client
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all routines that are due
    const { data: routines, error: routinesError } = await supabaseAdmin
      .from('routines')
      .select(`
        id,
        name,
        user_id,
        daysofweek,
        startTime
      `);

    if (routinesError) throw routinesError;

    const today = new Date();
    const currentDay = today.getDay(); // Sunday - 0, Monday - 1, etc.
    const currentTime = today.toTimeString().slice(0, 5); // HH:MM format

    const dueRoutines = routines.filter(routine => {
      const isDueDay = (routine.daysofweek || []).includes(currentDay.toString());
      const routineTimeStr = (routine.startTime ?? '').slice(0,5);
      const isDueTime = routineTimeStr === currentTime;
      return isDueDay && isDueTime;
    });

    if (dueRoutines.length === 0) {
      return new Response(JSON.stringify({ message: 'No routines due.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process each due routine
    for (const routine of dueRoutines) {
      const { data: subscriptions, error: subsError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription_data')
        .eq('user_id', routine.user_id);

      if (subsError) {
        console.error(`Error fetching subscriptions for user ${routine.user_id}:`, subsError);
        continue;
      }

      const payload = JSON.stringify({
        title: `🔔 루틴 알림: ${routine.name}`,
        body: '오늘의 루틴을 시작할 시간입니다!',
        icon: '/logo192.svg',
        url: `/routine/${routine.id}`,
      });
      
      // Prepare ApplicationServer once per routine
      const appServer = await webpush.ApplicationServer.new({
        contactInformation: 'mailto:your-email@example.com',
        vapidKeys,
      });

      for (const sub of subscriptions) {
        try {
          const subscriber = appServer.subscribe(sub.subscription_data);
          await subscriber.pushTextMessage(payload, {});
        } catch (e: any) {
          console.error(`Failed to send to ${sub.subscription_data.endpoint}:`, e?.message);
          const errMsg = e?.message || '';
          if (errMsg.includes('410')) {
            console.log(`Subscription ${sub.subscription_data.endpoint} is gone. Deleting.`);
            await supabaseAdmin.from('push_subscriptions').delete().eq('subscription_data->>endpoint', sub.subscription_data.endpoint);
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: `${dueRoutines.length} routines processed.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-routine-notifications:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});