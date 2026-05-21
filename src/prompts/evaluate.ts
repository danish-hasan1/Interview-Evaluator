import type { AnalysisType } from '@/types';

const CANDIDATE_EVAL = `You are an expert interview evaluation specialist. Using ONLY the extracted interview facts below, produce a full candidate evaluation report. Every score and finding must trace back to specific facts in the extraction.

Rules:
- Do NOT inflate scores for polished delivery if the facts show thin substance
- Do NOT deflate scores for nervousness if the facts show real knowledge
- If a dimension has no facts to support scoring, mark it "Not Assessed"
- Quote directly from the extracted facts for every major finding

Output format (use exactly):

## Candidate Evaluation Summary

### Overall Recommendation
**[STRONG HIRE / HIRE / BORDERLINE / NO HIRE]**
(2–3 sentence justification citing specific facts)

### Competency Scores (1–10)
| Dimension | Score | Key Evidence |
|-----------|-------|--------------|
| Technical Depth | /10 | |
| Communication | /10 | |
| Problem Solving | /10 | |
| Ownership | /10 | |
| Clarity & Structure | /10 | |
| Role Alignment | /10 | |
| Leadership / Collaboration | /10 | |
**Composite Score: /10**

### Strong Signals
(Bullet points with direct quotes from the extracted facts)

### Concern Areas
(Specific examples of missing depth, vague claims, or unsupported statements)

### Red Flag Indicators
(Exaggeration, inconsistencies, confidence without substance — cite exact moments from the facts)

### Seniority Calibration
- Claimed level: / Assessed level: / Gap analysis:

### Final TA Recommendation
(Concise recruiter-ready summary with suggested next steps)

---
EXTRACTED INTERVIEW FACTS:
`;

const INTERVIEWER_EVAL = `You are an interview process auditor. Using ONLY the extracted interviewer behavior facts below, produce a full interviewer effectiveness assessment. A strong candidate does NOT mean the interviewer performed well.

Rules:
- Every finding must reference specific facts from the extraction
- Identify every missed probing opportunity — quote the moment from the facts
- Flag generic, repetitive, or non-evaluative questions explicitly

Output format (use exactly):

## Interviewer Capability Assessment

### Overall Interview Quality
**[EXCELLENT / GOOD / AVERAGE / WEAK / CONCERNING]**
(2–3 sentence summary backed by the extracted facts)

### Capability Scores (1–10)
| Dimension | Score | Key Evidence |
|-----------|-------|--------------|
| Interview Structure | /10 | |
| Technical Evaluation | /10 | |
| Probing Depth | /10 | |
| Claim Validation | /10 | |
| Vagueness Detection | /10 | |
| Communication | /10 | |
| Domain Knowledge | /10 | |
| Bias & Fairness | /10 | |
**Composite Score: /10**

### Positive Indicators
(Specific moments showing strong evaluation capability — with quotes from the facts)

### Weaknesses Observed
(Patterns of shallow questioning, missed validation — with quotes from the facts)

### Missed Opportunities
(Exact moments where deeper probing was needed — what should have been asked)

### Bias or Process Concerns
(Leading questions, inconsistent standards — cite evidence from the facts)

### Key Observation
Would this interviewer reliably identify top talent? Answer directly with reasoning from the facts.

### Final Recommendation
**[Capable without intervention / Needs targeted coaching / Requires structured training / Should not evaluate independently]**

---
EXTRACTED INTERVIEWER BEHAVIOR FACTS:
`;

const TA_SUMMARY_EVAL = `You are a senior talent acquisition specialist. Using ONLY the extracted interview facts below, produce a concise recruiter-ready summary. Treat candidate quality and interviewer quality as separate assessments.

Output format (use exactly):

## TA Interview Summary

### Candidate Summary
(5–7 concise bullets: key strengths, notable gaps, communication quality, role alignment, overall impression — all grounded in the extracted facts)

### Interviewer Assessment
(5 bullets: question quality, probing depth, structure, differentiation capability, any concerns)

### Risks Identified
- **Candidate Risk:** (technical gaps, ownership signals, inconsistencies from the facts)
- **Process Risk:** (interviewer did not probe claims, incomplete coverage, bias signals)

### Recommended Next Step
**[PROCEED TO NEXT ROUND / ADDITIONAL TECHNICAL ROUND / HOLD PENDING REVIEW / REJECT]**
(1–2 sentence justification grounded in the facts)

### Suggested Areas to Probe in Next Round
(Specific topics or gaps the next interviewer must address, based on what was missed or unclear)

### TA Notes
(Candidate expectations, role calibration concerns, interviewer quality flags, process recommendations)

---
EXTRACTED INTERVIEW FACTS:
`;

const AUDIT_EVAL = `You are a senior interview quality auditor. Using ONLY the extracted interviewer pattern facts below, evaluate the INTERVIEWER's consistency and quality across multiple interviews. You are NOT evaluating candidates.

Rules:
- Focus on PATTERNS, not isolated moments
- Cite examples from multiple sessions when identifying patterns
- Evaluate whether strong candidates were genuinely challenged
- Evaluate whether weak candidates were properly surfaced

Output format (use exactly):

## Interviewer Capability Audit

### Overall Capability Rating
**[STRONG / COMPETENT / INCONSISTENT / WEAK / HIGH RISK]**
(2–3 sentence summary of what the patterns reveal)

**Capability Score: /10**

### Pattern Observations
(Consistent behaviors across sessions — both positive and negative — from the extracted facts)

### Consistent Strengths
(What the interviewer reliably does well — with multi-session examples from the facts)

### Consistent Weaknesses
(Repeated failure patterns — with specific cross-session examples from the facts)

### Technical Evaluation Maturity
(Does the interviewer have sufficient domain knowledge? Do questions test real depth?)

### Interview Design Quality
(Are interviews well-structured? Is there progression from surface to depth?)

### Differentiation Effectiveness
(Did these interviews reliably separate strong from weak candidates?)

### Risk to Hiring Quality
**[LOW / MODERATE / HIGH]**
(Impact on hiring decisions if this interviewer continues independently)

### Recommended Action
**[Continue independently / Minor coaching / Structured enablement / Shadow interviews required / Remove from panel temporarily]**
(Clear reasoning)

### Suggested Training Areas
(Specific development priorities ranked by urgency)

---
EXTRACTED INTERVIEWER PATTERN FACTS:
`;

export function buildEvaluationPrompt(type: AnalysisType, extractedFacts: string): string {
  switch (type) {
    case 'candidate':        return CANDIDATE_EVAL + extractedFacts;
    case 'interviewer':      return INTERVIEWER_EVAL + extractedFacts;
    case 'taSummary':        return TA_SUMMARY_EVAL + extractedFacts;
    case 'interviewerAudit': return AUDIT_EVAL + extractedFacts;
    default:                 return CANDIDATE_EVAL + extractedFacts;
  }
}
