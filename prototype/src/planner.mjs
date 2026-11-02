import { resolveHolding } from './lineage.mjs';
import { getRule, isOverdue } from './rules.mjs';
import { matchCompany, matchPerson } from './match.mjs';

export const TRIP_PLACES = new Set(['notary', 'tehsil', 'court', 'bank_branch', 'post_office']);
export const PLACE_LABEL = {
  notary: 'Notary and stamp vendor',
  tehsil: 'Tehsil office',
  court: 'Civil court (through an advocate)',
  bank_branch: 'Bank branch',
  post_office: 'Post office / courier',
  online: 'Online',
  wait: 'Wait for the institution',
  family: 'Within the family',
};

// Market prices move between the estimate and the day the registrar values the claim.
const VALUE_BAND = 0.1;

const addYears = (isoDate, years) => `${Number(isoDate.slice(0, 4)) + years}${isoDate.slice(4)}`;

export function buildPlan(c, data, today) {
  const claimDate = c.claim_date ?? today;
  const facts = c.facts;
  const steps = new Map();
  const flags = [];
  const assets = [];

  const addStep = (step) => {
    if (!steps.has(step.key)) steps.set(step.key, { deps: [], ...step });
    return step.key;
  };
  const flag = (code, message, cite) => {
    if (!flags.some((f) => f.code === code)) flags.push({ code, message, cite });
  };
  const rule = (id) => {
    const r = getRule(data.rules, id, claimDate, facts.state);
    if (isOverdue(r, today)) {
      flag(`overdue:${id}`, `Rule "${id}" passed its review date (${r.review_by}). Check it before relying on it.`, r.source);
    }
    return r;
  };

  const attest = addStep({
    key: 'attest_death_cert',
    title: 'Get copies of the death certificate attested',
    place: 'notary',
    cite: 'SEBI transmission documents: attested copy of the death certificate',
  });

  let nameAffidavit = null;
  const checkHolderName = (holderName) => {
    const m = matchPerson(holderName, facts.deceased_pan_name);
    if (m.needsHuman) {
      flag(
        'confirm_identity',
        `"${holderName}" may not be the same person as "${facts.deceased_pan_name}" (${m.kind}, score ${m.score.toFixed(2)}). The heir must confirm, using a second identifier such as the address or folio record.`,
        'Entity matcher',
      );
    }
    if (m.kind !== 'exact') {
      const r = rule('name_variance_affidavit');
      nameAffidavit = addStep({
        key: 'name_affidavit',
        title: `Name-variance affidavit: "${holderName}" and "${facts.deceased_pan_name}" are the same person`,
        place: 'notary',
        cite: r.source,
      });
      flag('name_variance_affidavit', `Name on the document ("${holderName}") differs from PAN. Prepare a name-variance affidavit before posting anything.`, r.source);
    }
    return m;
  };

  let heirCert = null;
  const legalHeirCertificate = () => {
    const issuer = rule('heir_certificate_issuer');
    heirCert ??= addStep({
      key: 'legal_heir_cert',
      title: `Legal heir certificate (${issuer.value}, ${facts.state})`,
      place: 'tehsil',
      deps: [attest],
      cite: issuer.source,
    });
    return heirCert;
  };

  const liveShares = [];
  c.documents.forEach((doc, index) => {
    const id = `a${index + 1}`;
    const fields = doc.confirmed;
    if (doc.type === 'share_certificate') {
      const asset = resolveShare(id, fields);
      assets.push(asset);
      if (asset.status === 'live') liveShares.push({ asset, fields });
    } else if (doc.type === 'fd_receipt') {
      assets.push(depositAsset(id, fields));
    } else {
      throw new Error(`Unsupported document type "${doc.type}"`);
    }
  });

  // SEBI's limit applies to the total value held in one company, not to each certificate.
  const companyTotals = new Map();
  for (const { asset } of liveShares) companyTotals.set(asset.company, (companyTotals.get(asset.company) ?? 0) + asset.value.estimate);
  for (const { asset, fields } of liveShares) planShare(asset, fields, companyTotals.get(asset.company));

  function resolveShare(id, fields) {
    const asset = { id, kind: 'shares', document_company: fields.company_name };
    asset.person = checkHolderName(fields.holder_name);

    const cm = matchCompany(fields.company_name, data.lineage);
    asset.company_match = cm;
    if (cm.decision === 'unknown') {
      asset.status = 'lineage_unknown';
      addStep({
        key: `mca_search:${id}`,
        title: `Search MCA company master data for "${fields.company_name}" to find its current name or status`,
        place: 'online',
        cite: 'MCA21 company master data',
      });
      flag('lineage_unknown', `"${fields.company_name}" is not in the lineage graph. No value or route is given until its history is verified.`, 'Lineage graph');
      return asset;
    }
    if (cm.decision === 'needs_human') {
      flag('confirm_company', `"${fields.company_name}" best matches "${data.lineage.companies[cm.best.id].name}" (score ${cm.best.score.toFixed(2)}). The heir must confirm.`, 'Entity matcher');
    }

    const holding = resolveHolding(data.lineage, cm.best.id, fields.shares, fields.certificate_date);
    Object.assign(asset, {
      status: holding.status,
      company: holding.company,
      company_name: data.lineage.companies[holding.company].name,
      shares: holding.shares?.toString() ?? null,
      fractions: holding.fractions,
      trail: holding.trail,
    });

    if (holding.status === 'struck_off') {
      const event = holding.trail.at(-1).event;
      flag(
        `struck_off:${id}`,
        `${asset.company_name} was struck off on ${event.date}. Value is doubtful. Restoration through the NCLT (Companies Act 2013, section 252) is a legal route; consult an advocate.`,
        event.source,
      );
      return asset;
    }

    const price = data.prices[holding.company];
    const value = holding.shares.toNumber() * price.price;
    asset.value = { estimate: value, low: value * (1 - VALUE_BAND), high: value * (1 + VALUE_BAND), price };
    return asset;
  }

  function planShare(asset, fields, companyTotal) {
    const { id } = asset;
    const low = companyTotal * (1 - VALUE_BAND);
    const high = companyTotal * (1 + VALUE_BAND);
    asset.company_total = companyTotal;

    const threshold = rule('transmission_threshold_physical');
    asset.threshold = { value: threshold.value, version: threshold.version, source: threshold.source };
    if (facts.nominee_registered) asset.route = 'nominee';
    else if (high <= threshold.value) asset.route = 'simplified';
    else if (low > threshold.value) asset.route = 'succession_certificate';
    else asset.route = 'borderline';

    const heirDocs = [attest];
    if (nameAffidavit) heirDocs.push(nameAffidavit);

    if (asset.route === 'borderline') {
      flag(
        `borderline:${id}`,
        `Estimated value of all shares in ${asset.company_name} ₹${Math.round(low).toLocaleString('en-IN')}–₹${Math.round(high).toLocaleString('en-IN')} straddles the ₹${threshold.value.toLocaleString('en-IN')} limit. Ask the registrar to confirm the value before choosing between the simplified route and a succession certificate.`,
        threshold.source,
      );
      heirDocs.push(
        addStep({ key: `confirm_value:${id}`, title: `Ask the registrar of ${asset.company_name} for the current holding and value`, place: 'post_office', cite: threshold.source }),
      );
      heirDocs.push(addStep({ key: `decide_route:${id}`, title: 'Choose the document route once the value is confirmed', place: 'wait', deps: [`confirm_value:${id}`] }));
    } else if (asset.route === 'simplified') {
      if (rule('legal_heir_certificate_accepted').value) heirDocs.push(legalHeirCertificate());
      heirDocs.push(addStep({ key: `heir_affidavit:${id}`, title: `Affidavit of legal heirs on stamp paper (${asset.company_name})`, place: 'notary', cite: threshold.source }));
      heirDocs.push(addStep({ key: `indemnity:${id}`, title: `Indemnity bond on stamp paper for the registrar (${asset.company_name})`, place: 'notary', cite: threshold.source }));
      if (facts.heirs > 1) {
        heirDocs.push(addStep({ key: `noc:${id}`, title: `No-objection certificate from the other legal heirs (${asset.company_name})`, place: 'notary', cite: threshold.source }));
      }
    } else if (asset.route === 'succession_certificate') {
      heirDocs.push(
        addStep({ key: 'succession_cert', title: 'Succession certificate from the civil court', place: 'court', deps: [attest], cite: threshold.source }),
      );
      heirDocs.push(addStep({ key: `heir_affidavit:${id}`, title: `Affidavit of the claimant named in the succession certificate (${asset.company_name})`, place: 'notary', cite: threshold.source }));
    }

    const merged = asset.trail.some((t) => t.event.type === 'merger');
    const transmission = addStep({
      key: `transmission:${id}`,
      title:
        `Send transmission request (Form ISR-5) with KYC (Form ISR-1) to the registrar of ${asset.company_name}` +
        (merged ? ', and ask for the old certificate to be exchanged for successor shares (Form ISR-4)' : ''),
      place: 'post_office',
      deps: heirDocs,
      cite: 'SEBI FAQ Jan 2026, transmission of physical securities',
    });

    if (facts.iepf_status === 'transferred') {
      const order = rule('iepf_transmission_first');
      const surety = rule('surety_for_indemnity');
      addStep({ key: `entitlement:${id}`, title: `${asset.company_name} completes transmission and issues an entitlement letter`, place: 'wait', deps: [transmission], cite: order.source });
      addStep({ key: `iepf5:${id}`, title: 'File Form IEPF-5 online (note the SRN)', place: 'online', deps: [`entitlement:${id}`], cite: order.source });
      addStep({ key: 'surety', title: 'Find a person willing to sign as surety', place: 'family', cite: surety.source });
      addStep({
        key: `iepf_indemnity:${id}`,
        title: 'IEPF indemnity bond and advance receipt, quoting the SRN',
        place: 'notary',
        deps: [`iepf5:${id}`, 'surety'],
        cite: 'IEPF-5 FAQ Q4-Q7',
      });
      addStep({ key: `iepf_docs:${id}`, title: `Post the signed IEPF-5 and originals to the nodal officer of ${asset.company_name}`, place: 'post_office', deps: [`iepf_indemnity:${id}`], cite: 'IEPF-5 FAQ Q4' });
      addStep({ key: `iepf_refund:${id}`, title: 'Company sends its verification report; IEPF Authority credits the shares', place: 'wait', deps: [`iepf_docs:${id}`], cite: 'IEPF-5 FAQ Q6' });
      flag('arrange_surety', 'Ask someone to act as surety now. A relative may refuse, and the claim stalls until someone agrees.', surety.source);
      if (c.actions_taken?.includes('iepf5_filed')) {
        flag(
          'iepf5_before_transmission',
          'IEPF-5 was filed before transmission. The company cannot verify the claim until transmission is complete. Complete transmission first, then ask the nodal officer whether the existing SRN can still be used.',
          order.source,
        );
      }
    } else if (facts.iepf_status === 'unknown') {
      const years = rule('iepf_transfer_years');
      addStep({ key: `iepf_search:${id}`, title: `Search IEPF for "${fields.holder_name}" under ${asset.company_name}`, place: 'online', cite: years.source });
      flag(`check_iepf:${id}`, `If dividends went unclaimed for ${years.value} years, the shares may already be with IEPF. Search before posting anything.`, years.source);
    } else {
      if (!facts.heir_has_demat) {
        steps.get(transmission).deps.push(addStep({ key: 'open_demat', title: "Open a demat account in the heir's name", place: 'online', cite: 'SEBI: transmitted physical shares are credited in demat form' }));
      }
      addStep({ key: `demat_credit:${id}`, title: `Registrar credits ${asset.shares} shares of ${asset.company_name} to the heir's demat account`, place: 'wait', deps: [transmission] });
    }
  }

  function depositAsset(id, fields) {
    const asset = { id, kind: 'deposit', bank: fields.bank_name, amount: fields.amount };
    asset.person = checkHolderName(fields.depositor_name);
    const years = rule('dea_transfer_years');
    const route = rule('dea_claim_route');
    const transferDue = addYears(fields.maturity_date, years.value);
    asset.status = transferDue <= claimDate ? 'likely_dea' : 'with_bank';
    asset.dea_transfer_due = transferDue;

    if (asset.status === 'likely_dea') {
      addStep({
        key: `udgam:${id}`,
        title: `Search UDGAM: name "${fields.depositor_name}", bank "${fields.bank_name}", plus the deceased's PAN or date of birth`,
        place: 'online',
        cite: 'RBI UDGAM FAQ Q4',
      });
      flag(
        `dea_printout:${id}`,
        `Deposit matured ${fields.maturity_date}; it was due to move to the DEA Fund by ${transferDue}. If the branch says the account does not exist, show the printed DEA rule: the money is still payable.`,
        route.source,
      );
    }
    const deps = [attest, ...(nameAffidavit ? [nameAffidavit] : []), ...(asset.status === 'likely_dea' ? [`udgam:${id}`] : [])];
    addStep({
      key: `bank_claim:${id}`,
      title: `Submit the claim at ${fields.bank_name} with the common claim form, and ask for the bank's document list in writing`,
      place: 'bank_branch',
      deps,
      cite: route.source,
    });
    return asset;
  }

  const { trips, order } = planTrips(steps);
  const naiveVisits = [...steps.values()].filter((s) => TRIP_PLACES.has(s.place)).length;
  return { claimDate, assets, steps, flags, trips, order, naiveVisits };
}

// Batches every ready task at the same place into one visit. Online and waiting steps run
// first so that they unlock as much as possible before the next trip.
export function planTrips(steps) {
  const done = new Set();
  const order = [];
  const trips = [];
  let remaining = [...steps.values()];

  while (remaining.length) {
    const ready = remaining.filter((s) => s.deps.every((d) => done.has(d)));
    if (!ready.length) throw new Error(`Dependency cycle among: ${remaining.map((s) => s.key).join(', ')}`);

    const nonTrip = ready.filter((s) => !TRIP_PLACES.has(s.place));
    const batch = nonTrip.length ? nonTrip : ready;
    if (!nonTrip.length) {
      const byPlace = Map.groupBy(batch, (s) => s.place);
      for (const [place, group] of byPlace) trips.push({ place, steps: group.map((s) => s.key) });
    }
    for (const s of batch) {
      done.add(s.key);
      order.push(s.key);
    }
    remaining = remaining.filter((s) => !done.has(s.key));
  }
  return { trips, order };
}
