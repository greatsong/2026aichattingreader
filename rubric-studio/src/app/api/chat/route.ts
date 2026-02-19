import { google } from '@ai-sdk/google'
import { streamText, tool } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

interface ToolCriteria {
    id?: string
    name: string
    description: string
    weight: number
    levels?: { score: number, description: string }[]
}

interface ToolScenario {
    scenario_title: string
    chat_log: { role: 'user' | 'assistant', content: string }[]
}

export async function POST(req: Request) {
    const { messages, rubric } = await req.json()

    // Switch to Google Gemini 1.5 Pro (Stable)
    const model = google('gemini-1.5-pro')

    const result = await streamText({
        model,
        system: `너는 'Rubric Studio'의 AI 평가 설계 코치야. 현재 선생님이 작성 중인 루브릭을 보고, 대화를 통해 이를 발전시키는 것이 임무야.

[현재 루브릭 컨텍스트]
${JSON.stringify(rubric, null, 2)}

역할 및 태도:
1. **소크라테스식 대화**: 사용자가 모호한 기준(예: "창의적인 학생")을 말하면, "선생님이 생각하시는 창의성이란 무엇인가요? 남다른 아이디어인가요, 아니면 배운 내용을 새로운 상황에 적용하는 능력인가요?" 같이 질문하여 구체화를 유도해.
2. **능동적 수정**: 사용자의 의도가 파악되면, \`update_rubric\` 도구를 사용하여 **직접 루브릭을 수정**해줘. "수정해드릴까요?"라고 묻기보다는, "말씀하신 내용을 바탕으로 창의성 항목을 이렇게 수정했습니다"라고 행동으로 보여주는 것이 좋아.
3. **가상 시뮬레이션 제안**: 선생님이 특정 학생 유형(예: "게으른 천재")에 대해 루브릭이 잘 작동할지 궁금해하면, \`preview_scenario\` 도구를 사용하여 가상 채팅을 만들어 보여줘. "이런 학생을 시물레이션 해볼까요?"라고 제안해.
4. **교육적 가치 중심**: 단순히 점수를 매기기 위한 기준보다는, 학생의 성장을 돕는 '과정 중심 평가' 관점을 유지해.

[도구 사용 가이드]
- **update_rubric**: 사용자가 특정 항목을 수정하길 원하거나, 새로운 항목을 추가하자고 합의가 되면 호출해.
- **preview_scenario**: 사용자가 "이런 학생 만들어봐"라고 하거나, 루브릭 검증을 위해 특정 상황을 시뮬레이션 해보고 싶어할 때 호출해. 이 도구를 호출하면 AI인 네가 직접 학생과 선생님(혹은 AI 튜터)의 대화 로그를 생성해서 넘겨줘야 해.`,
        messages,
        tools: {
            update_rubric: tool({
                description: 'Update the evaluation rubric criteria. Use this when the user wants to add, modify, or delete criteria.',
                parameters: z.object({
                    criteria: z.array(z.object({
                        id: z.string().optional(),
                        name: z.string(),
                        description: z.string(),
                        weight: z.number(),
                        levels: z.array(z.object({
                            score: z.number(),
                            description: z.string()
                        })).optional()
                    })).describe('List of criteria to update or add. Existing IDs will update, missing IDs will create new.')
                }),
                // @ts-ignore
                execute: async ({ criteria }) => {
                    // In a real server-side execution, we might save to DB here.
                    // Since we are using client-side state (Zustand), we return the intent
                    // and let the client intercept the tool invocation result to update the store.
                    return { message: 'Rubric updated successfully', updatedCriteriaCount: criteria.length, criteria }
                },
            }),
            preview_scenario: tool({
                description: 'Generate a student-teacher chat scenario based on the user request. The AI itself generates the full chat log in the arguments.',
                parameters: z.object({
                    scenario_title: z.string().describe('Short title for this scenario, e.g., "Creative but messy student"'),
                    chat_log: z.array(z.object({
                        role: z.enum(['user', 'assistant']).describe('user = student, assistant = teacher/AI'),
                        content: z.string().describe('The message content')
                    })).describe('The full conversation history to be simulated.')
                }),
                // @ts-ignore
                execute: async ({ scenario_title, chat_log }) => {
                    return { message: 'Scenario generated and loaded into simulator', scenario_title, chat_log_length: chat_log.length, chat_log }
                }
            })
        },
    })

    return result.toTextStreamResponse()
}
