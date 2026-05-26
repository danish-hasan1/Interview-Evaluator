import type { AnalysisType } from '@/types';

// Extraction prompts capture everything the evaluation phase needs.
// The transcript only flows through here — Phase 2 works from this output only.

const CANDIDATE_EXTRACT = `Extract only verifiable facts from this interview transcript. No opinions, no scores — raw data only.

**Role & Experience Claimed:**
- (role title, years of experience, company names, technologies mentioned)

**Interviewer Questions Asked:**
- (list every question the interviewer asked, verbatim or near-verbatim)

**Use Cases / Problem Statements Discussed:**
- (practical scenarios, debugging cases, architecture discussions, migrations, production issues, troubleshooting flows — with what the candidate said)

**Technical Topics Covered:**
- (each skill/technology + exactly what the candidate said about it, including depth of answer)

**Specific Projects & Examples Given:**
- (project name, candidate's claimed contribution, any metrics or outcomes mentioned)

**Strong Answer Moments:**
- (specific detail, clear ownership, concrete outcomes — with direct quotes)

**Weak / Vague Answer Moments:**
- (evasive, shallow, or inconsistent answers — with direct quotes)

**Red Flags:**
- (contradictions, unsupported claims, exaggeration, lack of ownership — with direct quotes)

**Communication Observations:**
- (notable moments of clarity, confusion, defensiveness, or inconsistency)

**Topics the Interviewer Did Not Cover:**
- (areas skipped or dropped without follow-up)

---
TRANSCRIPT:
`;

const INTERVIEWER_EXTRACT = `Extract only verifiable facts about the INTERVIEWER's behavior from this transcript. No opinions, no scores.

**Every Question Asked by Interviewer:**
- (list each question verbatim or near-verbatim, in order)

**Follow-up Questions Used:**
- (where the interviewer probed deeper — with quotes)

**Missed Follow-up Opportunities:**
- (candidate gave vague/shallow answer and interviewer moved on — quote both sides)

**Claim Validation Moments:**
- (where interviewer asked for evidence vs accepted claim at face value — with quotes)

**Leading or Biased Phrasing:**
- (questions that telegraphed expected answers — with quotes)

**Technical Depth Shown by Interviewer:**
- (did they challenge incorrect or shallow answers? did they demonstrate domain knowledge? examples)

**Interview Structure Observed:**
- (how interview opened, topic sequence, whether it progressed logically, how it closed)

**Generic or Repetitive Questions:**
- (non-evaluative or reused questions — with quotes)

---
TRANSCRIPT:
`;

const TA_SUMMARY_EXTRACT = `Extract only raw facts from this interview transcript for a TA briefing. No opinions.

**Candidate Profile:**
- (claimed role, level, experience, background)

**Key Questions Asked:**
- (list main questions the interviewer asked)

**Demonstrated Strengths:**
- (specific evidence of capability — with quotes)

**Observed Gaps:**
- (areas where candidate struggled, deflected, or lacked depth — with quotes)

**Communication Quality Samples:**
- (2–3 direct quotes showing how the candidate communicates)

**Interviewer Quality Observations:**
- (question quality, probing depth, any bias or weak coverage)

**Red Flags:**
- (candidate or process concerns — with direct quotes)

**Topics Not Assessed:**
- (skills or role-relevant areas that were not covered)

---
TRANSCRIPT:
`;

const AUDIT_EXTRACT = `Extract only verifiable facts about the INTERVIEWER's behavior across all provided transcripts. No opinions.

For each session/transcript, list:

**Session [N] — Questions Asked:**
- (each question verbatim or near-verbatim)

**Session [N] — Follow-ups Made vs Missed:**
- Made: (quote + context)
- Missed: (what candidate said that deserved probing + what interviewer did instead)

**Session [N] — Technical Depth Shown:**
- (did interviewer challenge wrong/shallow answers? examples)

**Session [N] — Bias or Leading Questions:**
- (examples with quotes)

**Session [N] — Interview Structure:**
- (opening, topic flow, closing — brief notes)

**Cross-Session Patterns in Raw Data:**
- (same question reused across sessions, same gaps, same behaviors repeated)

---
COMBINED TRANSCRIPTS:
`;

function jdBlock(jd?: string): string {
  if (!jd?.trim()) return '';
  return `JOB DESCRIPTION (use this to guide what role-specific skills and requirements to look for):\n${jd.trim()}\n\n`;
}

export function buildExtractionPrompt(type: AnalysisType, transcript: string, jd?: string): string {
  const jdPrefix = jdBlock(jd);
  switch (type) {
    case 'candidate':        return jdPrefix + CANDIDATE_EXTRACT + transcript;
    case 'interviewer':      return jdPrefix + INTERVIEWER_EXTRACT + transcript;
    case 'taSummary':        return jdPrefix + TA_SUMMARY_EXTRACT + transcript;
    case 'interviewerAudit': return jdPrefix + AUDIT_EXTRACT + transcript;
    default:                 return jdPrefix + CANDIDATE_EXTRACT + transcript;
  }
}
