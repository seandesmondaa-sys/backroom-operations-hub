const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AIRTABLE_BASE = "https://api.airtable.com/v0";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function fetchAirtableTable(
  apiKey: string,
  baseId: string,
  table: string
): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_BASE}/${baseId}/${encodeURIComponent(table)}`);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Airtable fetch error for ${table}:`, err);
      return all; // return partial results
    }

    const data = await res.json();
    all.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return all;
}

function summarizeRecords(table: string, records: AirtableRecord[]): string {
  if (records.length === 0) return `${table}: No records found.`;

  const rows = records.map((r) => {
    const fields = Object.entries(r.fields)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${k}: [${v.length} items]`;
        if (typeof v === "object") return `${k}: (object)`;
        const s = String(v);
        return `${k}: ${s.length > 80 ? s.slice(0, 80) + "…" : s}`;
      })
      .join(" | ");
    return `- ${fields}`;
  });

  return `## ${table} (${records.length} records)\n${rows.join("\n")}`;
}

const TABLE_NAMES = [
  "Projects",
  "Sponsors / Clients",
  "Investors",
  "Investor Contacts",
  "Outreach",
  "Tasks",
  "Documents",
  "Term Sheet Tracker",
  "KPIs / Monitoring",
  "Team",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, includeCrmData, tables } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build system prompt
    let systemContent = `You are OpsDesk AI, an intelligent assistant for a backroom operations CRM. You help users with:
- Understanding their deal pipeline, projects, clients, and investors
- Drafting outreach emails and follow-ups
- Summarizing tasks and priorities
- Answering questions about CRM workflows and best practices
- Providing actionable advice on deal structuring, due diligence, and closing

Keep answers clear, concise, and professional. Use markdown formatting when helpful.`;

    // Optionally fetch live CRM data
    if (includeCrmData) {
      const airtableKey = Deno.env.get("AIRTABLE_API_KEY");
      const baseId = Deno.env.get("AIRTABLE_BASE_ID");

      if (airtableKey && baseId) {
        const tablesToFetch: string[] =
          Array.isArray(tables) && tables.length > 0 ? tables : TABLE_NAMES;

        console.log("Fetching Airtable data for tables:", tablesToFetch);

        const results = await Promise.all(
          tablesToFetch.map(async (t) => {
            const records = await fetchAirtableTable(airtableKey, baseId, t);
            return summarizeRecords(t, records);
          })
        );

        const crmSnapshot = results.join("\n\n");
        systemContent += `\n\n---\n\nBelow is a live snapshot of the CRM data. Use this to answer the user's questions with specific, data-backed insights. Reference actual names, amounts, dates, and statuses when possible.\n\n${crmSnapshot}`;
      } else {
        systemContent += "\n\n(Note: Airtable connection is not configured. Answering with general guidance only.)";
      }
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemContent },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
