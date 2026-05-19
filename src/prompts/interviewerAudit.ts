export function buildPrompt(transcript: string): string {
  return `You are an expert interview quality auditor conducting a comprehensive review of an interviewer's performance across MULTIPLE interviews.

Analyze the following combined transcripts to assess interviewer consistency, capability, and patterns.

## 1. Consistency Analysis
- Question consistency across interviews
- Evaluation standard consistency
- Structural consistency

## 2. Recurring Strengths
- Consistent strong practices
- Areas of reliable expertise

## 3. Recurring Weaknesses
- Repeated poor practices
- Systematic gaps in evaluation approach

## 4. Interview Maturity Assessment
- Sophistication of question design
- Ability to adapt to different candidate levels
- Behavioral vs. technical balance

## 5. Bias Pattern Detection
- Consistent bias patterns across interviews
- Demographic or background assumptions
- Question fairness consistency

## 6. Technical Depth Consistency
- Consistent technical probing quality
- Areas of technical comfort vs. avoidance
- Missed technical validation opportunities

## 7. Panel Readiness Assessment
Is this interviewer ready to:
- Lead technical panels? YES/NO with justification
- Conduct independent evaluations? YES/NO with justification
- Train other interviewers? YES/NO with justification

## 8. Overall Interviewer Capability Score (1-10)

## 9. Development Plan
Specific training and improvement recommendations.

## 10. Audit Verdict
PANEL READY | NEEDS DEVELOPMENT | REQUIRES TRAINING | NOT RECOMMENDED FOR PANEL

Cite specific examples from the transcripts. Reference patterns across interviews, not just single instances.

COMBINED TRANSCRIPTS:
${transcript}`;
}
