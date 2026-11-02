import { Frac } from './rational.mjs';

// Walks every corporate event after the certificate date and returns today's holding,
// with one trail entry per event so each number can be traced to its source filing.
export function resolveHolding(lineage, companyId, shares, certificateDate) {
  let company = companyId;
  let qty = new Frac(shares);
  let after = certificateDate;
  const trail = [];
  const fractions = [];

  for (;;) {
    const event = lineage.events
      .filter((e) => (e.company === company || e.from === company) && e.date > after)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!event) break;

    const before = { company, shares: qty.toString() };

    if (event.type === 'struck_off') {
      trail.push({ event, before, after: null });
      return { status: 'struck_off', company, shares: null, fractions, trail };
    }

    if (event.type === 'rename') {
      company = event.to;
    } else if (event.type === 'split') {
      qty = qty.mul(Frac.parse(event.ratio));
    } else if (event.type === 'bonus' || event.type === 'merger') {
      const ratio = Frac.parse(event.ratio);
      const raw = event.type === 'bonus' ? qty.add(qty.mul(ratio)) : qty.mul(ratio);
      const whole = raw.floor();
      const part = raw.sub(whole);
      if (event.type === 'merger') company = event.to;
      if (!part.isZero()) fractions.push({ company, shares: part.toString(), event: event.id });
      qty = whole;
    } else {
      throw new Error(`Unknown corporate event type "${event.type}" in ${event.id}`);
    }

    trail.push({ event, before, after: { company, shares: qty.toString() } });
    after = event.date;
  }

  return { status: 'live', company, shares: qty, fractions, trail };
}
