import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

export const maxDuration = 60 // Allow longer timeout for evaluation

export async function POST(req: Request) {
    const { chatLog, rubric } = await req.json()

    if (!chatLog || !rubric) {
        return new Response('Missing chatLog or rubric', { status: 400 })
    }

    const result = await generateObject({
        model: google('gemini-1.5-pro'),
        schema: z.object({
            criteriaScores: z.array(z.object({
                criterionId: z.string(),
                score: z.number(),
                evidence: z.string(),
                reasoning: z.string().describe("Explanation of WHY this score was given based on the levels. Connect the evidence to the rubric level description."),
                feedback: z.string()
            })),
            overallFeedback: z.string(),
            grade: z.string()
        }),
        system: `You are an expert evaluator. Your job is to grade a student's performance in a chat session based STRICTLY on the provided rubric.

[RUBRIC]
${JSON.stringify(rubric, null, 2)}

[CRITICAL INSTRUCTION: ROLE AWARENESS]
- **Target**: Evaluate ONLY the messages from the 'user' (Student).
- **Context**: Use 'assistant' (AI/Teacher) messages ONLY to understand the context.
  - DO NOT give credit to the student for good things the AI said.
  - DO check if the student correctly understood or ignored the AI's guidance.

[INSTRUCTIONS]
1. Read the chat log carefully.
2. For EACH criterion in the rubric:
   - Determine the score based on the levels.
   - Quote specific "evidence" from the 'user' messages.
   - Provide "reasoning": "Why does this evidence match the chosen score level?" (Be specific)
   - Provide "feedback": Constructive advice for the student.
3. Generate an "overallFeedback" summarizing the student's performance.
4. Assign a final "grade" (e.g., A, B, C, Pass/Fail).`,
        prompt: `[CHAT LOG]
${JSON.stringify(chatLog, null, 2)}

Evaluate this session.`
    })

    // Calculate total score manually to ensure accuracy
    const totalScore = result.object.criteriaScores.reduce((sum, item) => sum + item.score, 0)

    const report = {
        ...result.object,
        totalScore,
        // Ensure maxScore is included for context (mapping back from rubric)
        criteriaScores: result.object.criteriaScores.map(scoreItem => {
            const criterion = rubric.criteria.find((c: any) => c.id === scoreItem.criterionId || c.name === scoreItem.criterionId)
            return {
                ...scoreItem,
                maxScore: criterion ? Math.max(...criterion.levels.map((l: any) => l.score)) : 10
            }
        })
    }

    return Response.json(report)
}
