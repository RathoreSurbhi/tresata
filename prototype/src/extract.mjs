// The only LLM step: read a document transcript into fields. Every field must quote the
// source text; a quote that is not found in the document is treated as a hallucination.

export const FIELDS = {
  share_certificate: ['holder_name', 'company_name', 'shares', 'certificate_date', 'folio'],
  fd_receipt: ['depositor_name', 'bank_name', 'amount', 'maturity_date', 'receipt_no'],
};

const squash = (s) => String(s ?? '').toLowerCase().replace(/[\s.,'"’]/g, '');

export async function extractFields(doc, { apiKey, model }) {
  const prompt = `You read old Indian financial documents. Extract these fields from the ${doc.type} text below: ${FIELDS[doc.type].join(', ')}.
Return JSON only, in this shape:
{"fields": {"<field>": {"value": <string, number or null>, "quote": "<exact text copied from the document that supports the value>", "confidence": <number from 0 to 1>}}}
Rules: use null when a field is missing or unreadable. Do not guess. Dates as YYYY-MM-DD. Numbers without commas or currency symbols. Write values in English (transliterate names), but copy the quote exactly as it appears in the document.

DOCUMENT:
${doc.transcript}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, temperature: 0, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`OpenRouter returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const text = body.choices?.[0]?.message?.content ?? '';
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error(`Model returned no JSON: ${text.slice(0, 200)}`);
  const fields = JSON.parse(text.slice(start, end + 1)).fields ?? {};

  for (const f of Object.values(fields)) {
    f.grounded = Boolean(f.quote) && squash(doc.transcript).includes(squash(f.quote));
    if (!f.grounded) f.confidence = 0;
  }
  return fields;
}

export function sameValue(extracted, confirmed) {
  if (extracted == null || confirmed == null) return extracted == confirmed;
  if (typeof confirmed === 'number') return Number(String(extracted).replace(/[^\d.]/g, '')) === confirmed;
  return squash(extracted) === squash(confirmed);
}
