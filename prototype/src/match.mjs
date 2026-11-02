const HONORIFICS = new Set(['SHRI', 'SRI', 'SMT', 'MR', 'MRS', 'MS', 'LATE', 'KUMARI', 'DR']);
const COMPANY_NOISE = new Set(['THE', 'LIMITED', 'LTD', 'CO', 'COMPANY', 'PVT', 'PRIVATE', 'AND', 'OF']);

export const PERSON_AUTO_ACCEPT = 0.85;
export const COMPANY_AUTO_ACCEPT = 0.92;
export const COMPANY_UNKNOWN_BELOW = 0.7;

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

const similarity = (a, b) => (a || b ? 1 - levenshtein(a, b) / Math.max(a.length, b.length) : 1);

const personTokens = (name) =>
  name.toUpperCase().replace(/[.,]/g, ' ').split(/\s+/).filter((t) => t && !HONORIFICS.has(t));

export const normalizeCompany = (name) =>
  name
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !COMPANY_NOISE.has(t))
    .join(' ');

// Compares the holder name on an old document with the deceased person's PAN name.
export function matchPerson(documentName, panName) {
  const a = personTokens(documentName);
  const b = personTokens(panName);
  if (a.join(' ') === b.join(' ')) return { kind: 'exact', score: 1, needsHuman: false };

  const sameSurname = a.at(-1) === b.at(-1);
  const restA = a.slice(0, -1);
  const restB = b.slice(0, -1);
  const initialsFit =
    sameSurname &&
    restA.length === restB.length &&
    restA.every((t, i) => (t.length === 1 ? restB[i].startsWith(t) : t === restB[i]));

  // Initials cannot tell "Ramesh G." from "Rekha G." in the same family, so a consistent
  // initials match is never accepted without the heir confirming it.
  if (initialsFit) return { kind: 'initials_consistent', score: 0.9, needsHuman: true };
  const score = similarity(a.join(' '), b.join(' '));
  return { kind: 'fuzzy', score, needsHuman: score < PERSON_AUTO_ACCEPT };
}

// Finds the company in the lineage graph by its name or any known alias.
export function matchCompany(name, lineage) {
  const query = normalizeCompany(name);
  const ranked = Object.entries(lineage.companies)
    .map(([id, c]) => ({
      id,
      score: Math.max(...[c.name, ...(c.aliases ?? [])].map((n) => similarity(query, normalizeCompany(n)))),
    }))
    .sort((x, y) => y.score - x.score);
  const best = ranked[0];
  const decision =
    best.score >= COMPANY_AUTO_ACCEPT ? 'accept' : best.score >= COMPANY_UNKNOWN_BELOW ? 'needs_human' : 'unknown';
  return { decision, best, candidates: ranked.slice(0, 3) };
}
