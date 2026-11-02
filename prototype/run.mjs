import { readFileSync, writeFileSync } from 'node:fs';
import { cases } from './cases/cases.mjs';
import { buildPlan, PLACE_LABEL, TRIP_PLACES } from './src/planner.mjs';
import { extractFields, FIELDS, sameValue } from './src/extract.mjs';

const TODAY = process.env.VIRASAT_TODAY ?? '2026-11-02';
const args = process.argv.slice(2);
const useLlm = args.includes('--llm');
const onlyCase = args.includes('--case') ? args[args.indexOf('--case') + 1] : null;

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = { lineage: load('./data/lineage.json'), rules: load('./data/rules.json'), prices: load('./data/prices.json') };

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function evaluate(c, plan) {
  const checks = [];
  const check = (name, actual, expected) => checks.push({ name, actual, expected, pass: same(actual, expected) });
  const e = c.expect;

  (e.assets ?? []).forEach((want, i) => {
    const got = plan.assets[i] ?? {};
    for (const [key, value] of Object.entries(want)) {
      if (key === 'trail_events') check(`a${i + 1}.trail`, (got.trail ?? []).map((t) => t.event.id), value);
      else if (key === 'threshold_version') check(`a${i + 1}.threshold_version`, got.threshold?.version, value);
      else if (key === 'fractions') check(`a${i + 1}.fractions`, (got.fractions ?? []).map(({ company, shares }) => ({ company, shares })), value);
      else check(`a${i + 1}.${key}`, got[key], value);
    }
  });
  const codes = plan.flags.map((f) => f.code);
  for (const code of e.flags ?? []) check(`flag ${code}`, codes.includes(code), true);
  for (const code of e.no_flags ?? []) check(`no flag ${code}`, codes.includes(code), false);
  if ('person_needs_human' in e) check('a1.person.needsHuman', plan.assets[0].person.needsHuman, e.person_needs_human);
  for (const [first, second] of e.order ?? []) {
    const i = plan.order.indexOf(first);
    const j = plan.order.indexOf(second);
    check(`${first} before ${second}`, i >= 0 && j >= 0 && i < j, true);
  }
  if ('trips_at_most' in e) check(`visits <= ${e.trips_at_most}`, plan.trips.length <= e.trips_at_most, true);
  return checks;
}

function renderPlan(c, plan) {
  const lines = [`Case ${c.id}: ${c.title}`, `Claim date: ${plan.claimDate}`, '', 'Assets:'];
  for (const a of plan.assets) {
    if (a.kind === 'shares') {
      const doc = c.documents[Number(a.id.slice(1)) - 1].confirmed;
      lines.push(`  ${a.id}. ${doc.shares} shares of ${doc.company_name} (certificate dated ${doc.certificate_date})`);
      for (const t of a.trail ?? []) {
        const after = t.after ? `${t.after.shares} shares of ${data.lineage.companies[t.after.company].name}` : 'company no longer exists';
        lines.push(`      ${t.event.date}  ${t.event.type}${t.event.ratio ? ` (${t.event.ratio})` : ''}: ${after}`);
        lines.push(`          source: ${t.event.source}`);
      }
      if (a.status === 'live') {
        lines.push(`      Today: ${a.shares} shares of ${a.company_name}`);
        for (const f of a.fractions) lines.push(`      Fractional entitlement: ${f.shares} share of ${data.lineage.companies[f.company].name}, settled in cash (event ${f.event})`);
        lines.push(`      Estimated value: ${rupees(a.value.estimate)} (range ${rupees(a.value.low)} to ${rupees(a.value.high)}; reference price ${a.value.price.as_of}; the registrar confirms)`);
        if (a.company_total !== a.value.estimate) lines.push(`      All certificates of this company together: ${rupees(a.company_total)}`);
        lines.push(`      Document route: ${a.route} (limit ${rupees(a.threshold.value)} per company, rule version ${a.threshold.version})`);
      } else {
        lines.push(`      Status: ${a.status}`);
      }
    } else {
      lines.push(`  ${a.id}. Deposit of ${rupees(a.amount)} at ${a.bank}: ${a.status === 'likely_dea' ? `likely in the RBI DEA Fund (due by ${a.dea_transfer_due}); still payable` : 'still with the bank'}. Interest is computed by the bank.`);
    }
  }
  lines.push('', 'Check before posting anything:');
  for (const f of plan.flags) lines.push(`  - ${f.message}`, `      source: ${f.cite}`);
  if (!plan.flags.length) lines.push('  (nothing flagged)');

  lines.push('', `Plan: ${plan.trips.length} visits instead of ${plan.naiveVisits} if every task were done separately.`);
  let visit = 0;
  const tripOf = new Map(plan.trips.flatMap((t, i) => t.steps.map((k) => [k, i])));
  const printed = new Set();
  for (const key of plan.order) {
    const s = plan.steps.get(key);
    if (TRIP_PLACES.has(s.place)) {
      const i = tripOf.get(key);
      if (printed.has(i)) continue;
      printed.add(i);
      visit += 1;
      lines.push(`  Visit ${visit}: ${PLACE_LABEL[s.place]}`);
      for (const k of plan.trips[i].steps) lines.push(`      - ${plan.steps.get(k).title}`);
    } else {
      lines.push(`  [${PLACE_LABEL[s.place]}] ${s.title}`);
    }
  }
  return lines.join('\n');
}

async function runExtraction(c) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free';
  const out = [];
  for (const doc of c.documents) {
    try {
      const fields = await extractFields(doc, { apiKey, model });
      for (const name of FIELDS[doc.type]) {
        const f = fields[name] ?? {};
        out.push({ field: name, value: f.value ?? null, expected: doc.confirmed[name], correct: sameValue(f.value, doc.confirmed[name]), grounded: Boolean(f.grounded) });
      }
    } catch (err) {
      out.push({ field: '(request failed)', value: err.message, expected: null, correct: false, grounded: false });
    }
  }
  return { model, fields: out };
}

const selected = onlyCase ? cases.filter((c) => c.id === onlyCase) : cases;
if (!selected.length) throw new Error(`No case with id "${onlyCase}"`);
if (useLlm && !process.env.OPENROUTER_API_KEY) throw new Error('Set OPENROUTER_API_KEY to run the LLM reader (--llm).');

const results = [];
for (const c of selected) {
  const plan = buildPlan(c, data, TODAY);
  const checks = evaluate(c, plan);
  const extraction = useLlm ? await runExtraction(c) : null;
  results.push({ c, plan, checks, extraction });
}

if (onlyCase) {
  const { c, plan, checks, extraction } = results[0];
  console.log(renderPlan(c, plan));
  console.log('\nChecks:');
  for (const k of checks) console.log(`  ${k.pass ? 'PASS' : 'FAIL'}  ${k.name}${k.pass ? '' : `  (expected ${JSON.stringify(k.expected)}, got ${JSON.stringify(k.actual)})`}`);
  if (extraction) console.log('\nLLM reader:', JSON.stringify(extraction, null, 2));
} else {
  let passed = 0;
  let total = 0;
  const rows = [];
  for (const { c, checks, plan } of results) {
    const ok = checks.filter((k) => k.pass).length;
    passed += ok;
    total += checks.length;
    const status = ok === checks.length ? 'PASS' : 'FAIL';
    rows.push({ c, ok, n: checks.length, status, plan, checks });
    console.log(`${status}  case ${c.id.padEnd(3)} ${ok}/${checks.length}  ${c.title}`);
    for (const k of checks.filter((k) => !k.pass)) console.log(`        FAIL ${k.name}: expected ${JSON.stringify(k.expected)}, got ${JSON.stringify(k.actual)}`);
  }
  console.log(`\n${passed}/${total} checks passed across ${results.length} cases.`);
  writeResults(rows, passed, total);
  console.log('Wrote RESULTS.md');
}

function writeResults(rows, passed, total) {
  const md = [
    '# Test results',
    '',
    `Generated by \`node run.mjs\` on ${new Date().toISOString().slice(0, 10)}, with today's date set to ${TODAY}. ${passed}/${total} checks passed across ${rows.length} cases.`,
    '',
    '| Case | What it tests | Checks | Result |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.c.id} | ${r.c.title} | ${r.ok}/${r.n} | ${r.status} |`),
    '',
    '## Failed checks',
    '',
  ];
  const failed = rows.flatMap((r) => r.checks.filter((k) => !k.pass).map((k) => `- Case ${r.c.id}, \`${k.name}\`: expected \`${JSON.stringify(k.expected)}\`, got \`${JSON.stringify(k.actual)}\``));
  md.push(...(failed.length ? failed : ['None.']), '');

  const llmRows = results.filter((r) => r.extraction);
  md.push('## LLM reader', '');
  if (llmRows.length) {
    const all = llmRows.flatMap((r) => r.extraction.fields.map((f) => ({ ...f, case: r.c.id })));
    md.push(
      `Model: \`${llmRows[0].extraction.model}\`. ${all.filter((f) => f.correct).length}/${all.length} fields correct; ${all.filter((f) => f.grounded).length}/${all.length} fields quoted text that exists in the document.`,
      '',
      '| Case | Field | Extracted | Expected | Correct | Quote found |',
      '|---|---|---|---|---|---|',
      ...all.map((f) => `| ${f.case} | ${f.field} | ${String(f.value).replace(/\|/g, '/')} | ${f.expected} | ${f.correct ? 'yes' : 'no'} | ${f.grounded ? 'yes' : 'no'} |`),
      '',
    );
  } else {
    md.push('Not run. Run `node run.mjs --llm` with `OPENROUTER_API_KEY` set to test the document reader.', '');
  }

  const showcase = rows.find((r) => r.c.id === '14');
  if (showcase) md.push("## Example output: Rajesh's case (case 14)", '', '```text', renderPlan(showcase.c, showcase.plan), '```', '');
  writeFileSync(new URL('./RESULTS.md', import.meta.url), md.join('\n'));
}
