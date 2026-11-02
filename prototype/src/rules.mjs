// Returns the single rule version in force on `date`. Zero or two matches is a data error,
// not something to guess around.
export function getRule(rules, id, date, state) {
  const matches = rules.filter(
    (r) =>
      r.id === id &&
      (!r.state || r.state === state) &&
      r.effective_from <= date &&
      (!r.effective_to || date <= r.effective_to),
  );
  if (matches.length !== 1) {
    throw new Error(`Expected one version of rule "${id}" on ${date}${state ? ` in ${state}` : ''}, found ${matches.length}`);
  }
  return matches[0];
}

export const isOverdue = (rule, today) => Boolean(rule.review_by) && rule.review_by < today;
