# Virasat prototype

This prototype checks the core claim of the brief: once a human has confirmed what the old papers say, plain code can work out what the family owns today, which documents it needs, and in what order to file, with a source for every step.

It takes the fields from a share certificate or a fixed-deposit receipt and produces:

- today's holding, traced through every rename, merger, split and bonus, each with its source filing;
- a value range, and the document route (nominee, simplified, succession certificate, or "borderline: ask the registrar first");
- warnings to fix before posting anything (name mismatch, surety, IEPF-5 filed too early, overdue rules);
- an ordered plan that groups tasks into as few visits as possible.

## How to run

You need Node.js 18 or later. There are no dependencies to install.

```bash
cd prototype
node run.mjs              # runs all test cases and writes RESULTS.md
node run.mjs --case 14    # prints the full plan for one case (14 is Rajesh's case)
```

The LLM document reader is optional. It needs a free [OpenRouter](https://openrouter.ai) API key:

```bash
# PowerShell
$env:OPENROUTER_API_KEY = "sk-or-..."
$env:OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"   # optional; any free model works
node run.mjs --llm
```

Without `--llm`, the planner uses the human-confirmed fields stored with each case. That is the human gate from the brief: nothing the model reads reaches the calculator unconfirmed.

## How the code maps to the brief's architecture

| Brief (Figure 3) | File | Type |
|---|---|---|
| 2. Read documents | `src/extract.mjs` | LLM. Each field must quote the source text; a quote that is not in the document sets confidence to 0 |
| 3. Human confirms | `confirmed` fields in `cases/cases.mjs` | Human |
| 4. Match names and companies | `src/match.mjs` | Scored matching. Initials-only matches always go to the heir |
| 5. Lineage and exact shares | `src/lineage.mjs`, `src/rational.mjs`, `data/lineage.json` | Exact. BigInt fractions; every event cites a filing |
| 6. Sequencer and rules | `src/planner.mjs`, `src/rules.mjs`, `data/rules.json` | Exact. Rules carry version, effective dates, source, owner and review date |
| 7. Pre-check and trip planner | `src/planner.mjs` | Exact |

The LLM never produces a share count, ratio, amount or threshold.

## Test cases

The 10 cases from the brief, plus 7 extras. All people, folios, receipts and banks are made up. Corporate events for Tata Steel and HDFC are real and cited in `data/lineage.json`; Vidarbha Cotton, Central India Agro and Deccan Textile are synthetic.

| Case | What it tests | Expected result |
|---|---|---|
| 1 | TISCO certificate, 2004: rename to Tata Steel, then 1:10 split | 200 shares become 2,000 Tata Steel shares |
| 2 | HDFC Ltd certificate: 42:25 merger into HDFC Bank, then 1:1 bonus in 2025 | 100 shares become 336 HDFC Bank shares; nominee route |
| 3 | TISCO certificate, 1994: bonus 2004, rename 2005, split 2022 | 100 shares become 1,500, with all three events cited |
| 4 | Struck-off company | "Doubtful", no value; points to an advocate |
| 5 | "R. G. Wankhede" vs PAN "Ramesh Govind Wankhede"; shares in IEPF | Heir must confirm identity; name-variance affidavit; surety warning; transmission before IEPF-5 |
| 6 | 10 HDFC Ltd shares | 16 HDFC Bank shares plus 4/5 of a share paid in cash, then 32 after the bonus |
| 7a, 7b | Holdings near the ₹5 lakh limit (about ₹4.9 and ₹5.1 lakh) | Both "borderline": the registrar must confirm value before the route is chosen |
| 8 | Heir filed IEPF-5 before transmission | Flagged; plan puts transmission first |
| 9 | FD matured 2009, branch says "no such account" | Likely in the DEA Fund; UDGAM search, then a branch claim with the cited rule |
| 10 | OCR-damaged certificate text and a Hindi FD receipt | Planner works on confirmed fields; the LLM reader is scored with `--llm` |
| 11 | Same initials and surname, different person (mother vs father) | Heir must confirm identity |
| 12a, 12b | Same ₹3 lakh holding, claimed in 2021 vs 2026 | 2021: succession certificate (old ₹2 lakh rule). 2026: simplified route (₹5 lakh rule) |
| 13 | Company not in the lineage graph | "Lineage unknown"; no value, no guess |
| 14 | Rajesh's case end to end | 6 visits instead of 10; all of his failure points flagged |
| 15 | Two certificates of the same company, ₹3.2 lakh each | Succession certificate, because the limit applies to the ₹6.4 lakh total per company |

Current results are in [RESULTS.md](RESULTS.md).

## Where it failed

**Found by the tests and fixed:**

- **Case 11: same initials, different person.** The first matcher scored "R. G. Wankhede" against "Rekha Ganesh Wankhede" at 0.90 and accepted it automatically, even though the certificate could belong to her husband. Initials cannot separate two people in one family, so initials-only matches now always go to the heir with a request for a second identifier (address or folio record). Case 5's expectation changed with it.
- **Case 15: the limit is per company, not per certificate.** The first planner judged each certificate on its own, so two ₹3.2 lakh certificates of one company each got the simplified route. SEBI's limit applies to the total per listed company (₹6.4 lakh here), which needs a succession certificate. The planner now adds up all certificates of a company before choosing the route.

**Found while building the data:** HDFC Bank issued a 1:1 bonus in August 2025. The brief's hand example (100 HDFC Ltd shares × 42/25 = 168) is right at the merger, but the family holds 336 shares today. A lineage graph that misses a single event halves the answer, which is the brief's weakest point in practice.

**Known limits, not fixed:**

- The LLM reader has not been scored yet; `RESULTS.md` says so until `node run.mjs --llm` is run with a key.
- Documents are text transcripts, not photos. The prototype tests reading messy text, not optical character recognition.
- The lineage graph has 7 companies. Coverage of old, unlisted and struck-off companies is the main open problem.
- Prices are illustrative, not live, and the ±10% value band is a fixed assumption.
- Bank rules for deceased claims vary by bank and are not modelled. The plan tells the heir to ask for the bank's list in writing.
- The IEPF indemnity bond is assumed to need the SRN from the IEPF-5 filing, so it cannot share the first notary visit. This is cautious and should be checked with a registrar.
- "Visits if every task were done separately" is a simple baseline, not a measured one. Rajesh's real count was higher because papers came back for corrections.
- The 2022 SEBI effective date comes from a news report of the notification and needs checking against the Gazette. The Maharashtra legal heir certificate rule comes from one interview, so it is deliberately marked past its review date and shows a warning.
- Stamp duty amounts are not given.

## Built with

Code written with Claude (in Cursor) from my design in the brief. Test cases, expected results and the failure analysis above were reviewed by me.
