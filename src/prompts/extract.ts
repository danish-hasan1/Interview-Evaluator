import type { AnalysisType } from '@/types';

const CANDIDATE_EXTRACT = `Extract only verifiable facts from this interview transcript. No opinions, no scores — raw data only.

Output structured bullet points covering:

**Role & Experience Claimed:**
- (role title, years of experience, company names mentioned)

**Technical Skills & Topics Discussed:**
- (each skill or technology + exactly what the candidate said about it)

**Specific Projects & Examples Given:**
- (project name, what they described, their claimed contribution, any metrics mentioned)

**Question-by-Question Log:**
- Q: [interviewer's question] → Candidate's key answer + direct quotes

**Strong Signal Moments:**
- (specific detail, clear ownership, concrete outcomes — with direct quotes)

**Red Flag Moments:**
- (vague answers, evasion, contradiction, inconsistency — with direct quotes)

**Topics Not Covered or Dropped Without Follow-up:**
- (areas the interviewer skipped or abandoned)

---
TRANSCRIPT:
`;

const INTERVIEWER_EXTRACT = `Extract only verifiable facts about the INTERVIEWER's behavior from this transcript. No opinions, no scores.

Output structured bullet points covering:

**Interview Structure Observed:**
- (how the interview opened, order of topics, closing)

**Every Question Asked by Interviewer:**
- (list each question verbatim or near-verbatim)

**Follow-up Questions Used:**
- (where the interviewer probed deeper — with quotes)

**Missed Follow-up Opportunities:**
- (candidate gave a vague/shallow answer and interviewer moved on — with quotes)

**Leading or Biased Phrasing:**
- (questions that telegraphed the expected answer — with quotes)

**Technical Depth Shown by Interviewer:**
- (did they challenge incorrect or shallow answers? quote examples)

**Candidate Claim Validation:**
- (moments interviewer asked for evidence vs accepted claim at face value)

---
TRANSCRIPT:
`;

const TA_SUMMARY_EXTRACT = `Extract only raw facts from this interview transcript for a TA briefing. No opinions.

Output structured bullet points covering:

**Candidate Profile:**
- (claimed role, level, experience, background)

**Demonstrated Strengths:**
- (specific evidence of capability — with quotes)

**Observed Gaps:**
- (areas where candidate struggled, deflected, or lacked depth — with quotes)

**Communication Quality Samples:**
- (2–3 direct quotes showing how the candidate communicates)

**Interviewer Process Observations:**
- (question quality, probing depth, any bias or weak coverage)

**Red Flags:**
- (any candidate or process concerns — with direct quotes)

**Topics Not Assessed:**
- (skills or areas relevant to the role that weren't covered)

---
TRANSCRIPT:
`;

const AUDIT_EXTRACT = `Extract only verifiable facts about the INTERVIEWER's patterns across the provided transcripts. No opinions.

For each distinct session or transcript section, list:

**Session [N] — Questions Asked:**
- (each question verbatim or near-verbatim)

**Session [N] — Follow-ups Made vs Missed:**
- Made: (quote)
- Missed: (candidate answer that deserved probing + what was asked next instead)

**Session [N] — Technical Depth:**
- (did interviewer challenge wrong/shallow answers? quote examples)

**Session [N] — Bias or Leading Phrasing:**
- (examples with quotes)

**Cross-Session Patterns Visible in Raw Data:**
- (same question reused, same gaps, same evasions accepted)

---
COMBINED TRANSCRIPTS:
`;

export function buildExtractionPrompt(type: AnalysisType, transcript: string): string {
  switch (type) {
    case 'candidate':        return CANDIDATE_EXTRACT + transcript;
    case 'interviewer':      return INTERVIEWER_EXTRACT + transcript;
    case 'taSummary':        return TA_SUMMARY_EXTRACT + transcript;
    case 'interviewerAudit': return AUDIT_EXTRACT + transcript;
    default:                 return CANDIDATE_EXTRACT + transcript;
  }
}
