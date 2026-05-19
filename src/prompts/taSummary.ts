export function buildPrompt(transcript: string): string {
  return `You are a senior talent acquisition specialist. Convert this interview transcript into a concise, professional recruiter-ready summary. Be objective, evidence-based, and actionable. Treat candidate quality and interviewer quality as separate assessments.

Output format (use exactly):

## TA Interview Summary

### Candidate Summary
(5–7 concise bullets: key strengths, notable gaps, communication quality, role alignment, overall impression)

### Interviewer Assessment
(5 bullets: question quality, probing depth, structure, differentiation capability, any concerns)

### Risks Identified
- **Candidate Risk:** (technical gaps, ownership signals, inconsistencies)
- **Process Risk:** (interviewer did not probe claims, incomplete coverage, bias signals)

### Recommended Next Step
**[PROCEED TO NEXT ROUND / ADDITIONAL TECHNICAL ROUND / HOLD PENDING REVIEW / REJECT]**
(1–2 sentence justification)

### Suggested Areas to Probe in Next Round
(Specific topics or gaps the next interviewer must address)

### TA Notes
(Candidate expectations, role calibration concerns, interviewer quality flags, process recommendations)

---
TRANSCRIPT:
${transcript}`;
}
