export function buildPrompt(transcript: string): string {
  return `You are an expert interview evaluator. Analyze the following interview transcript and provide a detailed candidate assessment.

Evaluate the candidate across these dimensions:

## 1. Technical Competency
- Depth of technical knowledge
- Accuracy of answers
- Problem-solving approach
- Technology stack familiarity

## 2. Communication Skills
- Clarity of expression
- Structure of answers
- Active listening indicators
- Ability to explain complex concepts

## 3. Ownership & Accountability
- Examples of taking initiative
- Responsibility for past outcomes
- Growth mindset indicators

## 4. Cultural Fit Signals
- Collaboration examples
- Values alignment
- Adaptability indicators

## 5. Seniority Calibration
- Experience depth vs. claimed level
- Leadership indicators
- Strategic thinking evidence

## 6. Red Flags & Exaggeration Detection
- Inconsistencies in responses
- Vague or evasive answers
- Over-claiming detection

## 7. Overall Scoring (1-10)
Score each dimension and provide an overall hire recommendation.

## 8. Hiring Recommendation
Clear: STRONG HIRE | HIRE | BORDERLINE | NO HIRE

Format your response with clear headers, bullet points, and a structured summary. Be specific, citing exact quotes from the transcript where possible.

TRANSCRIPT:
${transcript}`;
}
