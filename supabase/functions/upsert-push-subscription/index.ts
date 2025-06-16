import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS 헤더 설정: 실제 프로덕션 환경에서는 VERCEL_URL을 사용하는 것이 좋습니다.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // OPTIONS 요청(preflight) 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. 표준 환경변수와 자동 인증을 사용하도록 클라이언트 생성 로직 수정
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. 인증된 사용자 정보 가져오기 (더 간결해진 방식)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User not found or error fetching user:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { subscription } = await req.json();
    if (!subscription || !subscription.endpoint) {
      throw new Error('Subscription data with an endpoint is required.');
    }
    
    const { endpoint } = subscription;
    
    // 3. 중복 구독 확인 및 처리 (이제 user.id를 직접 사용)
    const { data: existingSub, error: selectError } = await supabaseClient
      .from('push_subscriptions')
      .select('id, user_id')
      .eq('subscription_data->>endpoint', endpoint)
      .limit(1)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (existingSub) {
      if (existingSub.user_id !== user.id) {
        const { error: updateError } = await supabaseClient
          .from('push_subscriptions')
          .update({ 
            user_id: user.id,
            subscription_data: subscription
          })
          .eq('id', existingSub.id);
        if (updateError) throw updateError;
      }
    } else {
      const { error: insertError } = await supabaseClient
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          subscription_data: subscription,
        });
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 