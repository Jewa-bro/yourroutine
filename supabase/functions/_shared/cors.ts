// supabase/functions/_shared/cors.ts

// Standard CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pre-flight request handler
export function handleCorsPreflight() {
  return new Response(null, {
    status: 200, // OK
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Allow more methods
    },
  });
} 