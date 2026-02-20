import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AIRTABLE_BASE = 'https://api.airtable.com/v0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('AIRTABLE_API_KEY');
  const baseId = Deno.env.get('AIRTABLE_BASE_ID');

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AIRTABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!baseId) {
    return new Response(JSON.stringify({ error: 'AIRTABLE_BASE_ID not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const table = url.searchParams.get('table');
    const recordId = url.searchParams.get('recordId');
    const view = url.searchParams.get('view');
    const filterFormula = url.searchParams.get('filterByFormula');
    const sortField = url.searchParams.get('sortField');
    const sortDirection = url.searchParams.get('sortDirection') || 'asc';
    const offset = url.searchParams.get('offset');

    if (!table) {
      return new Response(JSON.stringify({ error: 'Missing "table" query parameter' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const airtableHeaders: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    let airtableUrl = `${AIRTABLE_BASE}/${baseId}/${encodeURIComponent(table)}`;
    if (recordId && (req.method === 'GET' || req.method === 'PATCH' || req.method === 'DELETE')) {
      airtableUrl += `/${recordId}`;
    }

    // Build query params for GET (list)
    if (req.method === 'GET' && !recordId) {
      const params = new URLSearchParams();
      if (view) params.set('view', view);
      if (filterFormula) params.set('filterByFormula', filterFormula);
      if (sortField) {
        params.set('sort[0][field]', sortField);
        params.set('sort[0][direction]', sortDirection);
      }
      if (offset) params.set('offset', offset);
      const qs = params.toString();
      if (qs) airtableUrl += `?${qs}`;
    }

    let body: string | undefined;
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
      body = await req.text();
    }

    const airtableRes = await fetch(airtableUrl, {
      method: req.method === 'PUT' ? 'PATCH' : req.method,
      headers: airtableHeaders,
      body,
    });

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      return new Response(JSON.stringify({ error: 'Airtable API error', details: data }), {
        status: airtableRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
