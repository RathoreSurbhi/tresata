# Virasat: helping families claim the money a parent left behind

Take-home assignment for Tresata, by Surbhi Rathore (IIT Delhi).

**Brief (4 pages + appendix):** [Virasat_Brief_Surbhi_Rathore.pdf](Virasat_Brief_Surbhi_Rathore.pdf)

## The problem

When a parent dies in India, their shares and bank deposits often sit unclaimed. About ₹73,241 crore was unclaimed in bank deposits, insurance and mutual funds as of February 2026. The money is not lost; it moves. Shares of a merged company pass to a successor company, then to the IEPF fund if dividends go unpaid for 7 years. Dormant deposits move to RBI's DEA Fund after 10 years.

Search portals exist, but heirs still lose months or years working out which institution now holds each asset, which claim form applies, and in what order to file.

## The idea

Virasat reads the family's old papers with an LLM, then passes only human-confirmed facts to deterministic code. The code traces company renames and mergers through a cited lineage graph, applies versioned claim rules, and returns an ordered claim plan in which every step cites its source.

- The AI only reads documents and suggests name matches. A human confirms both.
- Share counts, thresholds and step order come from code and cited data, never from the model.
- The heir confirms facts, a CA or advocate handles succession documents, and the registrar or bank makes the final decision.

Jurisdiction: India (heir documents shown for Maharashtra).

## Repository contents

| Path | What it is |
|---|---|
| `Virasat_Brief_Surbhi_Rathore.pdf` | The written brief, with the appendix on what I added beyond the AI |
| [`prototype/`](prototype/) | Working prototype (Node.js, no dependencies) with 17 test cases. See its [README](prototype/README.md) to run it, and [RESULTS.md](prototype/RESULTS.md) for results |

Quick start:

```bash
cd prototype
node run.mjs            # all test cases
node run.mjs --case 14  # full claim plan for the interview case
```

## Data

No real client or personal financial data is used. The practitioner interview in the brief uses a changed name. Prototype test cases use made-up people and real, publicly documented corporate events.
