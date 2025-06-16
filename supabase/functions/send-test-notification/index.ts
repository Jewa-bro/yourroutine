import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as webpush from "jsr:@negrel/webpush";
import { corsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const vapidKeys = {
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight();
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_data')
      .eq('user_id', userId);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found for this user.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payloadData = {
      title: '✅ 테스트 알림',
      body: '이 알림이 보이면 푸시 설정이 정상적으로 동작하는 것입니다!',
      icon: '/logo192.svg',
      url: '/dashboard',
    };
    const payload = JSON.stringify(payloadData);

    // Create ApplicationServer instance per request
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: 'mailto:your-email@example.com',
      vapidKeys,
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const subscription = sub.subscription_data as PushSubscription;
      try {
        const subscriber = appServer.subscribe(subscription);
        await subscriber.pushTextMessage(payload, {});
      } catch (e: any) {
        const errMsg = e?.message || '';
        if (errMsg.includes('410')) {
          console.log(`Subscription ${subscription.endpoint} is gone. Deleting.`);
          await supabaseAdmin.from('push_subscriptions').delete().eq('subscription_data->>endpoint', subscription.endpoint);
        } else {
          console.error(`Failed to send to ${subscription.endpoint}:`, e);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ message: `${subscriptions.length} test notifications sent.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending test notifications:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 