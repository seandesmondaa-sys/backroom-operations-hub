const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AIRTABLE_BASE = "https://api.airtable.com/v0";

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('AIRTABLE_TOKEN') || Deno.env.get('AIRTABLE_API_KEY');
  const baseId = Deno.env.get('AIRTABLE_BASE_ID');

  console.log('airtable-proxy called, baseId:', baseId?.substring(0, 6), 'hasKey:', !!apiKey);

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AIRTABLE_TOKEN or AIRTABLE_API_KEY not configured' }), {
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
    const maxRecords = url.searchParams.get('maxRecords');
    const offset = url.searchParams.get('offset');

    const sorts: { field: string; direction: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const sf = url.searchParams.get(`sortField${i}`) || (i === 0 ? url.searchParams.get('sortField') : null);
      if (sf) {
        const sd = url.searchParams.get(`sortDirection${i}`) || url.searchParams.get('sortDirection') || 'asc';
        sorts.push({ field: sf, direction: sd });
      }
    }

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

    if (req.method === 'GET' && !recordId) {
      const params = new URLSearchParams();
      if (view) params.set('view', view);
      if (filterFormula) params.set('filterByFormula', filterFormula);
      if (maxRecords) params.set('maxRecords', maxRecords);
      sorts.forEach((s, i) => {
        params.set(`sort[${i}][field]`, s.field);
        params.set(`sort[${i}][direction]`, s.direction);
      });
      if (offset) params.set('offset', offset);
      const qs = params.toString();
      if (qs) airtableUrl += `?${qs}`;
    }

    let body: string | undefined;
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
      body = await req.text();
    }

    console.log('Fetching:', airtableUrl);

    const airtableRes = await fetch(airtableUrl, {
      method: req.method === 'PUT' ? 'PATCH' : req.method,
      headers: airtableHeaders,
      body,
    });

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      console.error('Airtable error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'Airtable API error', details: data, status: airtableRes.status }), {
        status: airtableRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Proxy error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
