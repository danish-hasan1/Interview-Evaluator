export function buildPrompt(transcript: string): string {
  return `You are a senior interview quality auditor conducting a capability assessment of an interviewer across MULTIPLE interview transcripts.

Your objective: determine whether this interviewer can reliably evaluate candidates — not just in one interview, but consistently across different candidates and contexts.

---

## AUDIT MANDATE

You are NOT evaluating individual candidates.
You are evaluating the INTERVIEWER'S CAPABILITY PATTERNS across all provided transcripts.

Analyze across these 10 dimensions:

1. **Structural Consistency** — Does the interviewer maintain a consistent, organized interview structure across sessions, or is it ad hoc and variable?
2. **Technical Questioning Quality** — Are technical questions genuinely evaluative? Do they test depth and application, or repeat the same surface-level questions?
3. **Probing Depth Pattern** — Does the interviewer consistently push beyond first answers, or do they routinely accept responses without challenge?
4. **Vagueness Challenge Rate** — When candidates give vague or evasive answers, does the interviewer detect and push back, or let it pass consistently?
5. **Question Relevance Consistency** — Are questions consistently role-relevant, or do they rely on generic "interview question banks" that don't differentiate?
6. **Adaptability** — Does the interviewer adjust question depth based on candidate responses, or rigidly follow a script regardless of what the candidate says?
7. **Bias Pattern Detection** — Are there recurring bias signals across interviews? Preference patterns, leading questions, or inconsistent standards across different candidates?
8. **Differentiation Effectiveness** — Across the transcripts, did the interviews actually help distinguish strong from weak candidates, or did they fail to surface meaningful signal?
9. **Domain Knowledge Consistency** — Is the interviewer's subject matter knowledge reliably sufficient to challenge and validate responses, or does it vary or fall short?
10. **Interviewer Maturity** — Does the interviewer demonstrate growth and sophistication in how they run interviews, or do patterns suggest stagnation?

---

## CRITICAL INSTRUCTIONS

- Focus on PATTERNS, not isolated moments. One bad question matters less than consistently bad questioning.
- Identify repeated weaknesses across transcripts — these indicate systemic issues, not one-off mistakes.
- Identify where strong candidates were challenged vs coasted through unchecked.
- Identify where weak candidates were let through vs properly surfaced.
- Detect whether the interviewer relies too heavily on surface-level discussion across all sessions.
- Quote examples from across multiple transcripts when identifying patterns.
- If only one transcript is provided, note the limitation and assess what patterns are visible.

---

## SCORING ANCHORS

- **9–10**: Highly consistent, deeply evaluative, adapts well, zero meaningful bias signals. Trusted panel leader.
- **7–8**: Reliable with minor gaps. Consistent structure, good depth in known areas. Ready for independent evaluation with light coaching.
- **5–6**: Inconsistent quality. Some strong moments but recurring shallow sections. Needs targeted coaching.
- **3–4**: Systemic weaknesses. Repeated pattern of poor probing, missed validation, reliance on generic questions. Hiring quality risk.
- **1–2**: High risk. Patterns suggest inability to reliably evaluate candidates. Should not independently assess.

---

## OUTPUT FORMAT

## Interviewer Capability Audit

### Overall Capability Rating
**[STRONG / COMPETENT / INCONSISTENT / WEAK / HIGH RISK]**
_(2–3 sentence summary of what the pattern of transcripts reveals about this interviewer)_

---

### Capability Score: /10

---

### Pattern Observations
_(Bullet points — observations that appear consistently across multiple transcripts, both positive and negative)_

---

### Consistent Strengths
_(What the interviewer reliably does well — with examples from multiple transcripts)_

---

### Consistent Weaknesses
_(Repeated failure patterns — with specific examples from multiple transcripts)_

---

### Technical Evaluation Maturity
_(Detailed assessment: Does the interviewer have sufficient domain knowledge? Do their technical questions genuinely test depth? Do they know enough to challenge wrong or shallow answers?)_

---

### Interview Design Quality
_(Detailed assessment: Are interviews well-structured? Do questions build on each other? Is there progression from surface to depth, or is it flat throughout?)_

---

### Differentiation Effectiveness
_(Across the transcripts, did this interviewer's process reliably separate strong from weak candidates? Provide specific analysis.)_

---

### Risk to Hiring Quality
**[LOW / MODERATE / HIGH]**
_(What is the likely impact on hiring decisions if this interviewer continues operating independently?)_

---

### Recommended Action
**Choose one:**
- Continue independently — no intervention needed
- Minor coaching recommended — specific areas only
- Structured interviewer enablement required — formal training program
- Shadow interviews required — must be paired with senior interviewer
- Remove from interviewer panel temporarily — pending reassessment

_(Include clear reasoning for the recommendation)_

---

### Suggested Training Areas
_(Specific, actionable development focus areas ranked by priority)_

---

COMBINED TRANSCRIPTS:
${transcript}`;
}
