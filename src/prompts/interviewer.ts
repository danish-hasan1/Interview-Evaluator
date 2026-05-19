export function buildPrompt(transcript: string): string {
  return `You are an expert interview quality assessor. Analyze the INTERVIEWER's performance in this transcript.

Evaluate the interviewer across:

## 1. Question Quality
- Relevance to role requirements
- Open-ended vs. closed question ratio
- Behavioral question usage (STAR format elicitation)
- Technical validation depth

## 2. Probing & Follow-up Effectiveness
- Did they drill into vague answers?
- Follow-up question quality
- Ability to detect knowledge gaps

## 3. Technical Validation Quality
- Did technical questions actually test depth?
- Were answers properly challenged?
- Architecture and system design probing
- Coding/problem-solving assessment quality

## 4. Structural Consistency
- Interview flow and organization
- Time management signals
- Coverage of key competency areas

## 5. Bias Indicators
- Leading questions
- Assumptions about candidate background
- Consistency of standards

## 6. Candidate Experience Quality
- Welcoming opening
- Clear explanations of process
- Respectful interaction style

## 7. Interviewer Scoring (1-10)
Score each dimension.

## 8. Training Recommendations
Specific, actionable improvements for this interviewer.

## 9. Overall Interviewer Rating
EXPERT | PROFICIENT | DEVELOPING | NEEDS TRAINING

Be specific. Cite exact quotes from the transcript.

TRANSCRIPT:
${transcript}`;
}
