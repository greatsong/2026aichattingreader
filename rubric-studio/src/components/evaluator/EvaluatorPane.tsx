'use client'

import { useState } from 'react'
import { useRubricStore } from '@/store/rubricStore'
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2, FileText, ArrowRight } from 'lucide-react'
import { ScrapedResult } from '@/types/extractor'
import { ChatMessage, EvaluationResult } from '@/types'

export default function EvaluatorPane() {
    const rubric = useRubricStore(state => state.getActiveRubric())
    const { saveLog } = useRubricStore()

    const [url, setUrl] = useState('')
    const [isScraping, setIsScraping] = useState(false)
    const [scrapedData, setScrapedData] = useState<ScrapedResult | null>(null)
    const [chatLog, setChatLog] = useState<ChatMessage[]>([])

    const [isEvaluating, setIsEvaluating] = useState(false)
    const [report, setReport] = useState<EvaluationResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url.trim()) return

        setIsScraping(true)
        setError(null)
        setScrapedData(null)
        setReport(null)

        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.details || 'Failed to scrape URL')
            }

            const data: ScrapedResult = await res.json()
            setScrapedData(data)

            // Transform ScrapedResult to ChatMessage[]
            const transformedLog: ChatMessage[] = data.messages.map((msg, i) => ({
                id: `scraped_${i}`,
                role: msg.role === 'unknown' ? 'user' : msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: msg.timestamp || new Date().toISOString()
            }))

            setChatLog(transformedLog)

        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setIsScraping(false)
        }
    }

    const handleEvaluate = async () => {
        if (!rubric) {
            alert('Please select an active rubric from the Management tab first.')
            return
        }
        if (chatLog.length === 0) return

        setIsEvaluating(true)
        try {
            const res = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatLog, rubric })
            })

            if (!res.ok) throw new Error('Evaluation failed')

            const result: EvaluationResult = await res.json()
            setReport(result)

            // Save to history
            saveLog({
                rubricVersion: rubric.meta.version,
                rubricSnapshot: JSON.parse(JSON.stringify(rubric)),
                chatContent: chatLog,
                evaluationResult: result,
                coachReasoning: `Scraped from: ${url}`
            })

        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsEvaluating(false)
        }
    }

    if (!rubric) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-500">
                <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                <p>No active rubric selected.</p>
                <p className="text-sm">Please select a rubric in Management Mode to start evaluating.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* 1. Header & Input Section */}
            <div className="p-8 border-b border-gray-100 bg-gradient-to-b from-white to-slate-50/50">
                <div className="max-w-3xl mx-auto text-center space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">AI Chat Evaluator</h2>
                        <p className="text-slate-500 mt-2">
                            Analyzing chat logs against <strong>{rubric.meta.title}</strong>
                        </p>
                    </div>

                    <form onSubmit={handleScrape} className="relative max-w-xl mx-auto">
                        <div className="relative flex items-center">
                            <LinkIcon className="absolute left-4 w-5 h-5 text-slate-400" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste ChatGPT, Claude, or Gemini shared link..."
                                className="w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isScraping || !url}
                                className="absolute right-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
                            </button>
                        </div>
                        {error && (
                            <div className="absolute -bottom-8 left-0 right-0 text-center text-red-500 text-xs flex items-center justify-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {error}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

                    {/* Left: Chat Preview */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px] lg:h-auto">
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Source Chat
                            </span>
                            {scrapedData && (
                                <span className="text-xs text-slate-400 truncate max-w-[150px]">
                                    {scrapedData.title}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {!scrapedData ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3">
                                    <ArrowRight className="w-8 h-8 opacity-20" />
                                    <p className="text-sm">Enter a URL to load chat content</p>
                                </div>
                            ) : (
                                chatLog.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-blue-50 text-blue-900 rounded-tr-none'
                                                : 'bg-white border border-gray-100 text-slate-700 rounded-tl-none shadow-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Action Bar */}
                        {scrapedData && !report && (
                            <div className="p-4 border-t border-gray-100 bg-white">
                                <button
                                    onClick={handleEvaluate}
                                    disabled={isEvaluating}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Evaluation'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Evaluation Report */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px] lg:h-auto">
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Assessment Report
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {!report ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm">Ready to evaluate</p>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    {/* Overall Grade */}
                                    <div className="text-center space-y-2">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 text-indigo-700 text-3xl font-black border-4 border-white shadow-lg ring-1 ring-indigo-100">
                                            {report.grade}
                                        </div>
                                        <p className="text-lg font-medium text-slate-800">Overall Score: {report.totalScore}</p>
                                    </div>

                                    {/* Feedback */}
                                    <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 text-indigo-900 leading-relaxed text-sm">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-indigo-800">
                                            💡 Coach's Feedback
                                        </h4>
                                        {report.overallFeedback}
                                    </div>

                                    {/* Criteria Breakdown */}
                                    <div className="space-y-4">
                                        {report.criteriaScores.map((score, idx) => (
                                            <div key={idx} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-slate-700">{score.criterionId}</h4>
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                                                        {score.score} / {score.maxScore}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-3">{score.feedback}</p>

                                                {score.evidence && (
                                                    <div className="pl-3 border-l-2 border-yellow-300 text-xs text-slate-500 italic">
                                                        "{score.evidence}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
