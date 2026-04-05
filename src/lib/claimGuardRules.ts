// ─── CARC RULES ENGINE ────────────────────────────────────────────────────────
// CARC = Claim Adjustment Reason Code — standardized codes on every health EOB
// Source: x12.org/codes/claim-adjustment-reason-codes (federal HIPAA mandate)

export interface CARCRule {
  code: string;
  plainEnglish: string;
  wrongfulFlag: 'always' | 'conditional' | 'rarely';
  winRate: number; // appeal success rate, 0–100
  lawCitation: string;
  actionSummary: string;
  checkQuestion?: string; // yes/no to confirm wrongful
}

export const CARC_RULES: Record<string, CARCRule> = {
  'CO-50': {
    code: 'CO-50',
    plainEnglish: 'Denied as "not medically necessary" by the insurance company.',
    wrongfulFlag: 'conditional',
    winRate: 68,
    checkQuestion: 'Was this a routine preventive care visit, screening, or vaccination?',
    lawCitation: '45 CFR 147.130 (ACA §2713)',
    actionSummary: 'If preventive care: must be covered at $0 by federal law. If diagnostic: request the clinical criteria used and appeal citing your physician\'s medical necessity documentation.',
  },
  'CO-97': {
    code: 'CO-97',
    plainEnglish: 'Denied: this service was "bundled" into another service already paid.',
    wrongfulFlag: 'conditional',
    winRate: 58,
    checkQuestion: 'Were these services performed by different providers, or on different dates?',
    lawCitation: 'CMS NCCI Edits Manual §4',
    actionSummary: 'If different providers or different dates, services cannot be bundled. Appeal citing NCCI unbundling rules and the separate service dates/providers.',
  },
  'OA-23': {
    code: 'OA-23',
    plainEnglish: 'Denied: the insurance company has no record of your insurance information.',
    wrongfulFlag: 'always',
    winRate: 82,
    lawCitation: 'HIPAA Administrative Simplification (45 CFR Part 162)',
    actionSummary: 'This is always an administrative data error — not a coverage issue. Contact your provider and ask them to resubmit with your correct insurance ID.',
  },
  'PR-204': {
    code: 'PR-204',
    plainEnglish: 'Denied: the service is listed as not covered by your plan.',
    wrongfulFlag: 'conditional',
    winRate: 45,
    checkQuestion: 'Is this a preventive care service (screening, vaccination, annual exam)?',
    lawCitation: 'ACA §2713, ERISA §502(a)',
    actionSummary: 'Many "not covered" denials violate the ACA preventive care mandate. Check the ACA §2713 list. If the service is on it, appeal citing federal law — insurers must cover it at $0.',
  },
  'PR-1': {
    code: 'PR-1',
    plainEnglish: 'Your annual deductible has not been met yet — you owe this amount.',
    wrongfulFlag: 'conditional',
    winRate: 40,
    checkQuestion: 'Does your EOB deductible tracker show $0 remaining (fully met)?',
    lawCitation: 'ACA §1302(c)',
    actionSummary: 'If your deductible tracker on this EOB shows $0 remaining, this code was applied after your deductible was already met. Appeal with your deductible tracker showing the year-to-date amounts.',
  },
  'CO-4': {
    code: 'CO-4',
    plainEnglish: 'Denied: a billing modifier code was required but missing.',
    wrongfulFlag: 'conditional',
    winRate: 65,
    lawCitation: 'CMS Claims Processing Manual §12',
    actionSummary: 'Contact your provider and ask them to resubmit with the correct modifier. This is a provider billing error with a very high success rate when corrected.',
  },
  'CO-11': {
    code: 'CO-11',
    plainEnglish: 'Denied: the diagnosis code does not match the procedure billed.',
    wrongfulFlag: 'conditional',
    winRate: 55,
    lawCitation: 'CMS ICD-10 Coding Guidelines',
    actionSummary: 'This is typically a provider coding error. Ask them to review the diagnosis code against the procedure and resubmit with the corrected diagnosis.',
  },
  'CO-16': {
    code: 'CO-16',
    plainEnglish: 'Denied: required information is missing from the claim submission.',
    wrongfulFlag: 'always',
    winRate: 78,
    lawCitation: 'HIPAA 5010 Transaction Standards',
    actionSummary: 'Administrative error — ask your provider to identify what information is missing and resubmit the complete claim.',
  },
  'CO-18': {
    code: 'CO-18',
    plainEnglish: 'Denied: this claim appears to be a duplicate of one already submitted.',
    wrongfulFlag: 'conditional',
    winRate: 50,
    checkQuestion: 'Did you have only one visit on this date, not two?',
    lawCitation: 'CMS Claims Processing Manual §1',
    actionSummary: 'If you only had one visit, contact your provider — they may have submitted the claim twice. Ask them to resolve with the insurance company.',
  },
  'CO-45': {
    code: 'CO-45',
    plainEnglish: 'Amount reduced: the charge exceeds what your plan\'s fee schedule allows.',
    wrongfulFlag: 'rarely',
    winRate: 20,
    lawCitation: 'Plan contract terms (in-network rate agreement)',
    actionSummary: 'Usually a legitimate adjustment for in-network providers. Only appeal if the provider was in-network and charges were pre-authorized at a specific rate.',
  },
  'CO-22': {
    code: 'CO-22',
    plainEnglish: 'Denied: the insurance company believes this is covered by another insurance plan.',
    wrongfulFlag: 'conditional',
    winRate: 60,
    checkQuestion: 'Do you have only one insurance plan (no secondary coverage)?',
    lawCitation: 'COB regulations, 45 CFR §156.230',
    actionSummary: 'If you have only one insurance plan, this is an error. File an appeal with a written statement confirming you have no secondary coverage.',
  },
  'CO-29': {
    code: 'CO-29',
    plainEnglish: 'Denied: the claim was not submitted within the plan\'s required time limit.',
    wrongfulFlag: 'conditional',
    winRate: 35,
    checkQuestion: 'Was the claim submitted within 90 days of the service date?',
    lawCitation: 'Plan contract terms; state prompt pay laws',
    actionSummary: 'If the provider submitted late, this may be the provider\'s liability, not yours. Ask your provider to appeal citing any exceptions (delayed medical records, emergency circumstances).',
  },
  'CO-15': {
    code: 'CO-15',
    plainEnglish: 'Denied: the service required prior authorization that was not obtained.',
    wrongfulFlag: 'conditional',
    winRate: 38,
    checkQuestion: 'Was this an emergency or urgent care situation?',
    lawCitation: 'ACA §2719A, state prior auth laws',
    actionSummary: 'Emergency services cannot be denied for lack of prior auth. For non-emergencies, request retroactive authorization citing medical necessity. Some states (IL, CA, TX) have strict prior auth reform laws.',
  },
  'PR-2': {
    code: 'PR-2',
    plainEnglish: 'This is your coinsurance — the percentage of costs you owe after your deductible.',
    wrongfulFlag: 'conditional',
    winRate: 35,
    checkQuestion: 'Does the coinsurance percentage match your plan\'s Summary of Benefits?',
    lawCitation: 'ACA §1302(c)',
    actionSummary: 'Compare to your plan\'s Summary of Benefits and Coverage document. If the percentage charged is higher than listed, file an appeal with your SBC as evidence.',
  },
  'PR-3': {
    code: 'PR-3',
    plainEnglish: 'This is your copay — the flat fee required for this type of service.',
    wrongfulFlag: 'conditional',
    winRate: 30,
    checkQuestion: 'Is the copay amount higher than what your plan states for this service type?',
    lawCitation: 'ACA §1302(c)',
    actionSummary: 'Check your plan\'s Summary of Benefits. If the copay is higher than listed, appeal with a copy of your SBC showing the correct copay.',
  },
};

// ─── ACA §2713 PREVENTIVE CARE LIST ──────────────────────────────────────────
// These services must be covered at $0 cost-sharing by all ACA-compliant plans.
// Denying them as "not medically necessary" (CO-50) is a federal violation.
export const ACA_PREVENTIVE_KEYWORDS: string[] = [
  'annual physical', 'annual wellness', 'preventive care', 'preventive visit',
  'immunization', 'vaccination', 'flu shot', 'flu vaccine',
  'mammogram', 'breast cancer screening',
  'colonoscopy', 'colorectal cancer screening', 'colon cancer screening',
  'pap smear', 'pap test', 'cervical cancer screening',
  'blood pressure screening', 'hypertension screening',
  'cholesterol screening', 'lipid panel', 'lipid screening',
  'diabetes screening', 'glucose screening', 'prediabetes screening',
  'depression screening', 'mental health screening',
  'tobacco cessation', 'smoking cessation',
  'contraception', 'birth control', 'contraceptive',
  'well-woman visit', 'well woman visit',
  'BRCA testing', 'breast cancer gene',
  'STI screening', 'HIV screening', 'hepatitis screening', 'hepatitis B',
  'obesity screening', 'BMI screening',
  'alcohol screening', 'alcohol misuse',
  'urinalysis', 'routine urinalysis',
  'well-child visit', 'pediatric visit',
];

// ─── STATE DOI LOOKUP ─────────────────────────────────────────────────────────
export interface StateDOI {
  state: string;
  code: string;
  doiName: string;
  doiUrl: string;
  phone: string;
  healthAppealDays: number;
  autoAppealDays: number;
  appealStatute: string;
  complaintUrl: string;
}

export const STATE_DOI: Record<string, StateDOI> = {
  'AZ': {
    state: 'Arizona', code: 'AZ',
    doiName: 'AZ Dept. of Insurance & Financial Institutions (DIFI)',
    doiUrl: 'https://difi.az.gov',
    phone: '602-364-3100',
    healthAppealDays: 60, autoAppealDays: 30,
    appealStatute: 'ARS §20-2533',
    complaintUrl: 'https://difi.az.gov/consumer-complaint',
  },
  'IL': {
    state: 'Illinois', code: 'IL',
    doiName: 'Illinois Department of Insurance',
    doiUrl: 'https://insurance.illinois.gov',
    phone: '877-527-9431',
    healthAppealDays: 60, autoAppealDays: 30,
    appealStatute: '215 ILCS 5/155.04',
    complaintUrl: 'https://insurance.illinois.gov/Complaints/',
  },
  'CA': {
    state: 'California', code: 'CA',
    doiName: 'California Department of Insurance (CDI)',
    doiUrl: 'https://www.insurance.ca.gov',
    phone: '800-927-4357',
    healthAppealDays: 60, autoAppealDays: 30,
    appealStatute: 'California Insurance Code §10123.13',
    complaintUrl: 'https://www.insurance.ca.gov/01-consumers/101-help/',
  },
  'TX': {
    state: 'Texas', code: 'TX',
    doiName: 'Texas Department of Insurance (TDI)',
    doiUrl: 'https://www.tdi.texas.gov',
    phone: '800-252-3439',
    healthAppealDays: 60, autoAppealDays: 15,
    appealStatute: 'Texas Insurance Code §4201.352',
    complaintUrl: 'https://www.tdi.texas.gov/complaints/',
  },
  'FL': {
    state: 'Florida', code: 'FL',
    doiName: 'Florida Dept. of Financial Services',
    doiUrl: 'https://www.myfloridacfo.com',
    phone: '800-342-2762',
    healthAppealDays: 60, autoAppealDays: 30,
    appealStatute: 'Florida Statutes §627.613',
    complaintUrl: 'https://www.myfloridacfo.com/division/consumer/',
  },
  'NY': {
    state: 'New York', code: 'NY',
    doiName: 'NY Department of Financial Services (DFS)',
    doiUrl: 'https://www.dfs.ny.gov',
    phone: '800-342-3736',
    healthAppealDays: 60, autoAppealDays: 30,
    appealStatute: 'New York Insurance Law §4903',
    complaintUrl: 'https://myportal.dfs.ny.gov/web/guest-applications/file-a-complaint',
  },
  'WA': {
    state: 'Washington', code: 'WA',
    doiName: 'Washington Office of the Insurance Commissioner',
    doiUrl: 'https://www.insurance.wa.gov',
    phone: '800-562-6900',
    healthAppealDays: 60, autoAppealDays: 30,
    appealStatute: 'RCW §48.43.535',
    complaintUrl: 'https://www.insurance.wa.gov/file-complaint-about-insurance-company',
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Detect which US state is mentioned in the EOB text */
export function detectStateFromText(text: string): string | null {
  const upper = text.toUpperCase();
  // Check two-letter state codes in context (e.g. "Chicago IL", "IL 60601")
  for (const code of Object.keys(STATE_DOI)) {
    const re = new RegExp(`\\b${code}\\b`);
    if (re.test(upper)) return code;
  }
  // Full state names
  for (const [code, doi] of Object.entries(STATE_DOI)) {
    if (text.toLowerCase().includes(doi.state.toLowerCase())) return code;
  }
  return null;
}

/** Enrich an error list: attach win rate + law citation from CARC rules */
export function enrichWithCARCData(
  errors: { title: string; description: string; impact: string; carcCode?: string }[]
): Array<{
  title: string; description: string; impact: string; carcCode?: string;
  winRate?: number; lawCitation?: string; actionSummary?: string; isPreventiveCare?: boolean;
}> {
  return errors.map(err => {
    const code = (err.carcCode ?? '').toUpperCase().trim();
    const rule = code ? CARC_RULES[code] : undefined;
    // Check if description mentions preventive care (flags ACA §2713 violation)
    const descLower = err.description.toLowerCase();
    const isPreventiveCare = ACA_PREVENTIVE_KEYWORDS.some(k => descLower.includes(k.toLowerCase()));
    return {
      ...err,
      winRate: rule?.winRate,
      lawCitation: rule?.lawCitation ?? (isPreventiveCare ? '45 CFR 147.130 (ACA §2713)' : undefined),
      actionSummary: rule?.actionSummary,
      isPreventiveCare,
    };
  });
}
