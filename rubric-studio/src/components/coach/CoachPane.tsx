// @ts-nocheck
'use client'

import { useChat } from '@ai-sdk/react'
import { Send, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useRubricStore } from '@/store/rubricStore'
import { RubricCriterion } from '@/types'

export default function CoachPane() {
    const rubric = useRubricStore(state => state.rubrics.find(r => r.id === state.activeRubricId))
    const { updateRubric, setSimulation } = useRubricStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        // 🧠 Context Injection: 항상 최신 루브릭 상태를 AI에게 전송
        body: { rubric },

        // 🛠️ Client-side Tool Execution
        onToolCall: async ({ toolCall }) => {
            if (!rubric) return

            if (toolCall.toolName === 'update_rubric') {
                const { criteria } = toolCall.args as any
                // console.log('🤖 AI Updating Rubric:', criteria)

                // Create a deep copy of current criteria
                const newCriteria = [...rubric.criteria]

                criteria.forEach((update: any) => {
                    // Find existing criterion by ID or Name (fuzzy match)
                    const index = newCriteria.findIndex(c =>
                        (update.id && c.id === update.id) ||
                        (c.name === update.name)
                    )

                    if (index !== -1) {
                        // Update existing
                        newCriteria[index] = { ...newCriteria[index], ...update }
                    } else {
                        // Create new
                        const newCriterion: RubricCriterion = {
                            id: update.id || `criterion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            name: update.name,
                            description: update.description || '새로운 평가 기준',
                            weight: update.weight || 10,
                            levels: update.levels || [
                                { score: 5, description: "탁월함" },
                                { score: 3, description: "보통" },
                                { score: 1, description: "미흡함" }
                            ],
                            tuning_instructions: []
                        }
                        newCriteria.push(newCriterion)
                    }
                })

                // Apply to global store
                updateRubric(rubric.id, { criteria: newCriteria })
            } else if (toolCall.toolName === 'preview_scenario') {
                const { chat_log, scenario_title } = toolCall.args as any
                // console.log('🤖 AI Generated Scenario:', scenario_title)

                // Update Simulator State
                setSimulation({
                    chatLog: chat_log,
                    isSimulating: false, // Ready to evaluation (or edit)
                    report: null // Clear previous report
                })
            }
        },
        onFinish: () => {
            // console.log('Chat finished!');
        },
        onError: (error) => {
            // console.log('Chat error!', error);
        }
    } as any) as any

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (!rubric) {
        return (
            <div className="flex flex-col h-full bg-slate-50 items-center justify-center text-slate-400">
                <p>No active rubric selected.</p>
                <p className="text-sm">Go to Management Mode to select one.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                    🤖 AI Coach
                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Online</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                    Discuss your rubric philosophy and fine-tune evaluation criteria.
                </p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* Welcome Message */}
                {messages.length === 0 && (
                    <div className="flex justify-start">
                        <div className="max-w-[90%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-slate-700 text-sm">
                            <p>안녕하세요, 선생님! <strong>Rubric Studio</strong>에 오신 것을 환영합니다.</p>
                            <p className="mt-2">
                                어떤 평가 기준을 만들고 싶으신가요? "창의적인 학생을 찾고 싶어" 또는 "비판적 사고 점수를 조정하고 싶어" 처럼 편하게 말씀해 주세요.
                            </p>
                        </div>
                    </div>
                )}

                {/* Message List */}
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={clsx(
                            "flex w-full",
                            m.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={clsx(
                                "max-w-[90%] p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap",
                                m.role === 'user'
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : "bg-white text-slate-700 border border-gray-100 rounded-tl-none",
                                // Tool invocations styling
                                m.toolInvocations && "bg-slate-100 border-none italic text-slate-500"
                            )}
                        >
                            {m.content}
                            {m.toolInvocations?.map(toolInvocation => {
                                const { toolName, toolCallId, state } = toolInvocation;
                                return (
                                    <div key={toolCallId} className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-200">
                                        {toolName === 'update_rubric' && (
                                            <div className="flex items-center gap-2">
                                                <span>🛠️ 루브릭 수정 중...</span>
                                                {state === 'result' && <span className="text-green-600 font-bold">완료</span>}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input?.trim()}
                        className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    )
}
