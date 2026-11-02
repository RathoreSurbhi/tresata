// Test cases. All people, folios, receipts and banks are made up. Corporate events for
// Tata Steel and HDFC are real and cited in data/lineage.json; the other companies are synthetic.
//
// `confirmed` holds the fields as the heir would confirm them at the human gate. The planner
// only ever sees confirmed fields. `transcript` is what the LLM reads when run with --llm.

const MH = { state: 'Maharashtra', heirs: 2, nominee_registered: false, iepf_status: 'not_transferred', heir_has_demat: true };

export const cases = [
  {
    id: '1',
    title: 'Renamed company plus a stock split (TISCO to Tata Steel)',
    facts: { ...MH, deceased_pan_name: 'Ramesh Kumar Sharma' },
    documents: [
      {
        type: 'share_certificate',
        transcript:
          'THE TATA IRON AND STEEL COMPANY LIMITED. Registered Office: Bombay House, Mumbai. Certificate No. 448812. Folio No. T/0091. This is to certify that RAMESH KUMAR SHARMA is the registered holder of 200 (Two Hundred) Ordinary Shares of Rs. 10 each fully paid. Given under the Common Seal on 15th September 2004.',
        confirmed: { holder_name: 'Ramesh Kumar Sharma', company_name: 'The Tata Iron and Steel Company Limited', shares: 200, certificate_date: '2004-09-15', folio: 'T/0091' },
      },
    ],
    expect: {
      assets: [{ status: 'live', company: 'tata_steel', shares: '2000', route: 'simplified' }],
      no_flags: ['name_variance_affidavit'],
    },
  },
  {
    id: '2',
    title: 'Merger plus a later bonus (HDFC Ltd into HDFC Bank, then 1:1 bonus in 2025)',
    facts: { ...MH, deceased_pan_name: 'Sunita Arvind Deshpande', nominee_registered: true },
    documents: [
      {
        type: 'share_certificate',
        transcript:
          'HOUSING DEVELOPMENT FINANCE CORPORATION LIMITED. Share Certificate. Folio: H-220417. Name of holder: SUNITA ARVIND DESHPANDE. Number of equity shares of Rs. 2 each: 100 (One hundred). Date: 10/06/2015.',
        confirmed: { holder_name: 'Sunita Arvind Deshpande', company_name: 'Housing Development Finance Corporation Limited', shares: 100, certificate_date: '2015-06-10', folio: 'H-220417' },
      },
    ],
    expect: {
      assets: [{ status: 'live', company: 'hdfc_bank', shares: '336', route: 'nominee', fractions: [] }],
    },
  },
  {
    id: '3',
    title: 'Three-step chain: bonus 2004, rename 2005, split 2022',
    facts: { ...MH, deceased_pan_name: 'Ramesh Kumar Sharma' },
    documents: [
      {
        type: 'share_certificate',
        transcript:
          'THE TATA IRON AND STEEL COMPANY LIMITED. Certificate No. 201377. Folio No. T/0091. RAMESH KUMAR SHARMA is the registered holder of 100 (One Hundred) Ordinary Shares of Rs. 10 each. Dated 10th March 1994.',
        confirmed: { holder_name: 'Ramesh Kumar Sharma', company_name: 'The Tata Iron and Steel Company Limited', shares: 100, certificate_date: '1994-03-10', folio: 'T/0091' },
      },
    ],
    expect: {
      assets: [{ status: 'live', company: 'tata_steel', shares: '1500', trail_events: ['tisco-bonus-2004', 'tisco-rename-2005', 'tata-steel-split-2022'] }],
    },
  },
  {
    id: '4',
    title: 'Struck-off company: expect "doubtful", not a value',
    facts: { ...MH, deceased_pan_name: 'Prakash Shankar Bhonsle' },
    documents: [
      {
        type: 'share_certificate',
        transcript:
          'DECCAN TEXTILE MILLS LIMITED. Share Certificate No. 0098. Folio D-311. PRAKASH SHANKAR BHONSLE, 500 equity shares of Rs. 10 each. 20 January 1991.',
        confirmed: { holder_name: 'Prakash Shankar Bhonsle', company_name: 'Deccan Textile Mills Limited', shares: 500, certificate_date: '1991-01-20', folio: 'D-311' },
      },
    ],
    expect: {
      assets: [{ status: 'struck_off', shares: null, route: undefined }],
      flags: ['struck_off:a1'],
    },
  },
  {
    id: '5',
    title: 'Initials on the certificate, full name on PAN ("R. G. Wankhede"); shares already in IEPF',
    facts: { ...MH, deceased_pan_name: 'Ramesh Govind Wankhede', iepf_status: 'transferred' },
    documents: [
      {
        type: 'share_certificate',
        transcript:
          'VIDARBHA COTTON PROCESSORS LIMITED, Nagpur. Certificate No. 7730. Folio V/1182. Registered holder: R. G. WANKHEDE, 14 Dhantoli, Nagpur. 250 equity shares of Rs. 10 each. Dated 1st July 1996.',
        confirmed: { holder_name: 'R. G. Wankhede', company_name: 'Vidarbha Cotton Processors Limited', shares: 250, certificate_date: '1996-07-01', folio: 'V/1182' },
      },
    ],
    expect: {
      assets: [{ status: 'live', company: 'central_india_agro', shares: '150', route: 'simplified' }],
      flags: ['name_variance_affidavit', 'arrange_surety', 'confirm_identity'],
      person_needs_human: true,
      order: [['transmission:a1', 'iepf5:a1']],
    },
  },
  {
    id: '6',
    title: 'Fractional entitlement after a merger, paid as cash',
    facts: { ...MH, deceased_pan_name: 'Anil Prakash Joshi' },
    documents: [
      {
        type: 'share_certificate',
        transcript:
          'HOUSING DEVELOPMENT FINANCE CORPORATION LIMITED. Folio H-300815. ANIL PRAKASH JOSHI. 10 (Ten) equity shares of Rs. 2 each. 01/02/2016.',
        confirmed: { holder_name: 'Anil Prakash Joshi', company_name: 'Housing Development Finance Corporation Limited', shares: 10, certificate_date: '2016-02-01', folio: 'H-300815' },
      },
    ],
    expect: {
      assets: [{ status: 'live', company: 'hdfc_bank', shares: '32', fractions: [{ company: 'hdfc_bank', shares: '4/5' }] }],
    },
  },
  {
    id: '7a',
    title: 'Threshold boundary: about ₹4.9 lakh in physical shares',
    facts: { ...MH, deceased_pan_name: 'Meena Dattatray Kulkarni' },
    documents: [
      {
        type: 'share_certificate',
        transcript: 'TATA STEEL LIMITED. Folio TS-55021. MEENA DATTATRAY KULKARNI. 306 Ordinary Shares of Rs. 10 each. 05 May 2010.',
        confirmed: { holder_name: 'Meena Dattatray Kulkarni', company_name: 'Tata Steel Limited', shares: 306, certificate_date: '2010-05-05', folio: 'TS-55021' },
      },
    ],
    expect: { assets: [{ shares: '3060', route: 'borderline' }], flags: ['borderline:a1'] },
  },
  {
    id: '7b',
    title: 'Threshold boundary: about ₹5.1 lakh in physical shares',
    facts: { ...MH, deceased_pan_name: 'Meena Dattatray Kulkarni' },
    documents: [
      {
        type: 'share_certificate',
        transcript: 'TATA STEEL LIMITED. Folio TS-55022. MEENA DATTATRAY KULKARNI. 319 Ordinary Shares of Rs. 10 each. 05 May 2010.',
        confirmed: { holder_name: 'Meena Dattatray Kulkarni', company_name: 'Tata Steel Limited', shares: 319, certificate_date: '2010-05-05', folio: 'TS-55022' },
      },
    ],
    expect: { assets: [{ shares: '3190', route: 'borderline' }], flags: ['borderline:a1'] },
  },
  {
    id: '8',
    title: 'Heir already filed IEPF-5 before transmission (the sequencer must catch it)',
    facts: { ...MH, deceased_pan_name: 'Vijay Madhukar Patil', iepf_status: 'transferred' },
    actions_taken: ['iepf5_filed'],
    documents: [
      {
        type: 'share_certificate',
        transcript: 'CENTRAL INDIA AGRO INDUSTRIES LIMITED. Folio C/4471. VIJAY MADHUKAR PATIL. 300 equity shares of Rs. 10 each. 1 January 2010.',
        confirmed: { holder_name: 'Vijay Madhukar Patil', company_name: 'Central India Agro Industries Limited', shares: 300, certificate_date: '2010-01-01', folio: 'C/4471' },
      },
    ],
    expect: {
      assets: [{ status: 'live', company: 'central_india_agro', shares: '300' }],
      flags: ['iepf5_before_transmission'],
      order: [['transmission:a1', 'iepf5:a1']],
    },
  },
  {
    id: '9',
    title: 'Fixed deposit in the DEA Fund that a branch says does not exist',
    facts: { ...MH, deceased_pan_name: 'Vijay Madhukar Patil' },
    documents: [
      {
        type: 'fd_receipt',
        transcript:
          'SITABULDI COMMERCIAL BANK LTD. (synthetic). Fixed Deposit Receipt No. FD/0457/2006. Received from VIJAY MADHUKAR PATIL the sum of Rs. 25,000/- (Rupees Twenty Five Thousand only) for 3 years. Date of maturity: 15-03-2009.',
        confirmed: { depositor_name: 'Vijay Madhukar Patil', bank_name: 'Sitabuldi Commercial Bank Ltd', amount: 25000, maturity_date: '2009-03-15', receipt_no: 'FD/0457/2006' },
      },
    ],
    expect: {
      assets: [{ status: 'likely_dea' }],
      flags: ['dea_printout:a1'],
      order: [['udgam:a1', 'bank_claim:a1']],
    },
  },
  {
    id: '10',
    title: 'Faded certificate text and a Hindi-language FD receipt (tests the LLM reader)',
    facts: { ...MH, deceased_pan_name: 'Ramesh Kumar Sharma' },
    documents: [
      {
        type: 'share_certificate',
        transcript:
          'TH E TATA lRON AND ST EEL C0MPANY LlMITED ... Certif1cate No. 45?901 ... Fol io No. T/0O91 ... RAMESH KUM AR SH ARMA ... 5O (Fifty) Ordinary Shares of Rs. 1O each ... Given under the Common Seal on 1st October 2OO4',
        confirmed: { holder_name: 'Ramesh Kumar Sharma', company_name: 'The Tata Iron and Steel Company Limited', shares: 50, certificate_date: '2004-10-01', folio: 'T/0091' },
      },
      {
        type: 'fd_receipt',
        transcript:
          'सीताबर्डी कमर्शियल बैंक लि. सावधि जमा रसीद क्रमांक: FD/1120/2009. जमाकर्ता का नाम: रमेश कुमार शर्मा. राशि: ₹15,000/- (पंद्रह हज़ार रुपये मात्र). परिपक्वता तिथि: 10/01/2012.',
        confirmed: { depositor_name: 'Ramesh Kumar Sharma', bank_name: 'Sitabuldi Commercial Bank Ltd', amount: 15000, maturity_date: '2012-01-10', receipt_no: 'FD/1120/2009' },
      },
    ],
    expect: {
      assets: [{ status: 'live', company: 'tata_steel', shares: '500' }, { status: 'likely_dea' }],
    },
  },
  {
    id: '11',
    title: 'Extra: same initials and surname, different person (mother vs father)',
    facts: { ...MH, deceased_pan_name: 'Rekha Ganesh Wankhede' },
    documents: [
      {
        type: 'share_certificate',
        transcript: 'CENTRAL INDIA AGRO INDUSTRIES LIMITED. Folio C/5120. R. G. WANKHEDE. 100 equity shares of Rs. 10 each. 12 March 2010.',
        confirmed: { holder_name: 'R. G. Wankhede', company_name: 'Central India Agro Industries Limited', shares: 100, certificate_date: '2010-03-12', folio: 'C/5120' },
      },
    ],
    expect: { person_needs_human: true, flags: ['confirm_identity'] },
  },
  {
    id: '12a',
    title: 'Extra: rule changed mid-claim. ₹3 lakh holding, claim made in 2021 (old ₹2 lakh limit)',
    claim_date: '2021-06-01',
    facts: { ...MH, deceased_pan_name: 'Suresh Narayan Kale' },
    documents: [
      {
        type: 'share_certificate',
        transcript: 'VIDARBHA COTTON PROCESSORS LIMITED. Folio V/0907. SURESH NARAYAN KALE. 1192 equity shares of Rs. 10 each. 3 June 1996.',
        confirmed: { holder_name: 'Suresh Narayan Kale', company_name: 'Vidarbha Cotton Processors Limited', shares: 1192, certificate_date: '1996-06-03', folio: 'V/0907' },
      },
    ],
    expect: { assets: [{ shares: '715', route: 'succession_certificate', threshold_version: 1 }] },
  },
  {
    id: '12b',
    title: 'Extra: same ₹3 lakh holding, claim made in 2026 (current ₹5 lakh limit)',
    facts: { ...MH, deceased_pan_name: 'Suresh Narayan Kale' },
    documents: [
      {
        type: 'share_certificate',
        transcript: 'VIDARBHA COTTON PROCESSORS LIMITED. Folio V/0907. SURESH NARAYAN KALE. 1192 equity shares of Rs. 10 each. 3 June 1996.',
        confirmed: { holder_name: 'Suresh Narayan Kale', company_name: 'Vidarbha Cotton Processors Limited', shares: 1192, certificate_date: '1996-06-03', folio: 'V/0907' },
      },
    ],
    expect: {
      assets: [{ shares: '715', route: 'simplified', threshold_version: 2 }],
      flags: ['overdue:heir_certificate_issuer'],
    },
  },
  {
    id: '13',
    title: 'Extra: company not in the lineage graph (must say "unknown", not guess)',
    facts: { ...MH, deceased_pan_name: 'Ganesh Rao Pawar' },
    documents: [
      {
        type: 'share_certificate',
        transcript: 'MARATHWADA PAPER UDYOG LIMITED, Aurangabad. Folio M-77. GANESH RAO PAWAR. 200 shares of Rs. 10 each. 1989.',
        confirmed: { holder_name: 'Ganesh Rao Pawar', company_name: 'Marathwada Paper Udyog Limited', shares: 200, certificate_date: '1989-01-01', folio: 'M-77' },
      },
    ],
    expect: { assets: [{ status: 'lineage_unknown' }], flags: ['lineage_unknown'] },
  },
  {
    id: '14',
    title: "Extra: Rajesh's case end to end (merged company in IEPF + FD in DEA + initials)",
    facts: { ...MH, deceased_pan_name: 'Ramesh Govind Wankhede', iepf_status: 'transferred' },
    documents: [
      {
        type: 'share_certificate',
        transcript:
          'VIDARBHA COTTON PROCESSORS LIMITED, Nagpur. Certificate No. 7730. Folio V/1182. Registered holder: R. G. WANKHEDE, 14 Dhantoli, Nagpur. 250 equity shares of Rs. 10 each. Dated 1st July 1996.',
        confirmed: { holder_name: 'R. G. Wankhede', company_name: 'Vidarbha Cotton Processors Limited', shares: 250, certificate_date: '1996-07-01', folio: 'V/1182' },
      },
      {
        type: 'fd_receipt',
        transcript:
          'SITABULDI COMMERCIAL BANK LTD. Fixed Deposit Receipt No. FD/0311/2006. Received from R. G. WANKHEDE the sum of Rs. 25,000/- for 3 years. Date of maturity: 15-03-2009.',
        confirmed: { depositor_name: 'R. G. Wankhede', bank_name: 'Sitabuldi Commercial Bank Ltd', amount: 25000, maturity_date: '2009-03-15', receipt_no: 'FD/0311/2006' },
      },
    ],
    expect: {
      assets: [{ company: 'central_india_agro', shares: '150' }, { status: 'likely_dea' }],
      flags: ['name_variance_affidavit', 'arrange_surety', 'dea_printout:a2'],
      order: [['transmission:a1', 'iepf5:a1'], ['udgam:a2', 'bank_claim:a2']],
      trips_at_most: 6,
    },
  },
  {
    id: '15',
    title: 'Extra: two certificates of the same company (threshold applies per company, not per certificate)',
    facts: { ...MH, deceased_pan_name: 'Meena Dattatray Kulkarni' },
    documents: [
      {
        type: 'share_certificate',
        transcript: 'TATA STEEL LIMITED. Folio TS-60001. MEENA DATTATRAY KULKARNI. 200 Ordinary Shares of Rs. 10 each. 05 May 2010.',
        confirmed: { holder_name: 'Meena Dattatray Kulkarni', company_name: 'Tata Steel Limited', shares: 200, certificate_date: '2010-05-05', folio: 'TS-60001' },
      },
      {
        type: 'share_certificate',
        transcript: 'TATA STEEL LIMITED. Folio TS-60002. MEENA DATTATRAY KULKARNI. 200 Ordinary Shares of Rs. 10 each. 05 May 2010.',
        confirmed: { holder_name: 'Meena Dattatray Kulkarni', company_name: 'Tata Steel Limited', shares: 200, certificate_date: '2010-05-05', folio: 'TS-60002' },
      },
    ],
    expect: {
      assets: [{ shares: '2000', route: 'succession_certificate' }, { shares: '2000', route: 'succession_certificate' }],
    },
  },
];
