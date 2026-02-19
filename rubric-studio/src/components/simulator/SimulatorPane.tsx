'use client'

import Link from 'next/link'
import { MessagesSquare, FileJson, Settings, History, ChevronRight, Upload, X, ClipboardType } from 'lucide-react'
import { useRubricStore } from '@/store/rubricStore'
import { parseChatLog, parseRawText } from '@/utils/fileImport'
import clsx from 'clsx'
import { useRef, useState } from 'react'

export default function SimulatorPane() {
    const { history, simulation, setSimulation, saveLog } = useRubricStore()
    const rubric = useRubricStore(state => state.rubrics.find(r => r.id === state.activeRubricId))

    // Safety check for rubric
    if (!rubric) {
        return <div className="p-6 text-center text-gray-500">Active rubric not found. Please select one in Management Mode.</div>
    }

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [pasteText, setPasteText] = useState('')

    // Batch Processing State
    const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // Single file mode (legacy behavior preserved for drag/drop single or consistent UX if 1 file)
        if (files.length === 1) {
            try {
                const chatLog = await parseChatLog(files[0])
                setSimulation({
                    chatLog,
                    report: null,
                    isSimulating: false
                })
                e.target.value = ''
            } catch (error) {
                console.error('Import Error:', error)
                alert('Failed to import file. Please check expected JSON/CSV format.')
            }
            return
        }

        // Batch Mode
        setBatchProgress({ current: 0, total: files.length })

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            try {
                const chatLog = await parseChatLog(file)

                // Run Evaluation
                const response = await fetch('/api/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatLog, rubric })
                })

                if (response.ok) {
                    const report = await response.json()
                    saveLog({
                        rubricVersion: rubric.meta.version,
                        rubricSnapshot: JSON.parse(JSON.stringify(rubric)),
                        chatContent: chatLog,
                        evaluationResult: report,
                        coachReasoning: `Batch Import: ${file.name}`
                    })
                } else {
                    console.error(`Evaluation failed for ${file.name}:`, response.statusText)
                }
            } catch (err) {
                console.error(`Failed to process ${file.name}`, err)
            }

            // Update Progress
            setBatchProgress({ current: i + 1, total: files.length })
        }

        // Finish
        setBatchProgress(null)
        alert(`Batch processing complete. ${files.length} records processed.`)
        e.target.value = ''
    }

    const handleTextImport = () => {
        if (!pasteText.trim()) return
        try {
            const chatLog = parseRawText(pasteText)
            setSimulation({
                chatLog,
                report: null,
                isSimulating: false
            })
            setIsImportModalOpen(false)
            setPasteText('')
        } catch (e) {
            alert('Could not parse text. Use format "User: Hello"')
        }
    }

    const handleRunEvaluation = async () => {
        if (simulation.chatLog.length === 0) return

        setSimulation({ isSimulating: true })
        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatLog: simulation.chatLog,
                    rubric: rubric
                })
            })

            if (!response.ok) throw new Error('Evaluation failed')

            const report = await response.json()

            // Update Simulation State
            setSimulation({
                report,
                isSimulating: false
            })

            // Save to History
            saveLog({
                rubricVersion: rubric.meta.version,
                rubricSnapshot: JSON.parse(JSON.stringify(rubric)), // Deep copy
                chatContent: simulation.chatLog,
                evaluationResult: report,
                coachReasoning: "Evaluation run via Simulator"
            })

        } catch (error) {
            console.error('Evaluation Error:', error)
            setSimulation({ isSimulating: false })
            alert('Failed to run evaluation. See console.')
        }
    }

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    🧪 Simulation Lab
                </h2>
                <div className="flex space-x-2">
                    {batchProgress && (
                        <div className="flex items-center gap-2 mr-2 bg-blue-50 px-3 py-1 rounded text-xs text-blue-700 font-medium animate-pulse">
                            Processing {batchProgress.current}/{batchProgress.total}
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".json,.csv"
                        className="hidden"
                        multiple
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
                    >
                        <Upload className="w-3 h-3" /> File
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
                    >
                        <ClipboardType className="w-3 h-3" /> Paste
                    </button>
                    <button
                        onClick={() => setSimulation({ chatLog: [], report: null })}
                        className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Clear
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* History Sidebar (Left) */}
                <div className="w-64 bg-gray-50 border-r border-gray-100 overflow-y-auto hidden md:block flex-shrink-0">
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <History className="w-3 h-3" /> Evaluation History
                        </h3>

                        {history.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No logs yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {history.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-all group"
                                        onClick={() => setSimulation({ chatLog: log.chatContent, report: log.evaluationResult })}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-medium text-gray-600">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className={clsx(
                                                "text-xs px-1.5 py-0.5 rounded-full",
                                                log.evaluationResult?.grade.startsWith('A') ? "bg-green-100 text-green-700" :
                                                    log.evaluationResult?.grade.startsWith('B') ? "bg-blue-100 text-blue-700" :
                                                        "bg-gray-100 text-gray-600"
                                            )}>
                                                {log.evaluationResult?.grade || 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {log.evaluationResult?.overallFeedback || 'No feedback'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area (Right) */}
                <div className="flex-1 overflow-y-auto p-6 bg-white relative">

                    {/* Empty State */}
                    {!simulation.chatLog.length ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                            <MessagesSquare className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-gray-600">Ready to Test</h3>
                            <p className="max-w-xs mt-2 text-sm text-gray-400">
                                Ask the AI coach to "Generate a scenario" to start testing.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-20">
                            {/* Chat Log Display */}
                            <div className="space-y-4">
                                {simulation.chatLog.map((msg, i) => (
                                    <div key={i} className={clsx(
                                        "flex",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}>
                                        <div className={clsx(
                                            "max-w-[80%] p-3 rounded-2xl text-sm",
                                            msg.role === 'user'
                                                ? "bg-indigo-100 text-indigo-900 rounded-tr-none"
                                                : "bg-gray-100 text-gray-800 rounded-tl-none"
                                        )}>
                                            <span className="text-xs font-bold block mb-1 opacity-50 uppercase">
                                                {msg.role === 'user' ? 'Student' : 'Teacher'}
                                            </span>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Evaluation Report (Result) */}
                            {simulation.report && (
                                <div className="mt-8 border-t border-gray-200 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-gray-800">Evaluation Report</h3>
                                        <span className="text-2xl font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                                            Grade: {simulation.report.grade}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                                        <p className="text-gray-700 italic">"{simulation.report.overallFeedback}"</p>
                                    </div>

                                    <div className="space-y-4">
                                        {simulation.report.criteriaScores.map((score, i) => (
                                            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-gray-700">{score.criterionId}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">Score:</span>
                                                        <span className="font-bold text-blue-600">{score.score}/{score.maxScore}</span>
                                                    </div>
                                                </div>

                                                {/* Reasoning Section (New) */}
                                                {score.reasoning && (
                                                    <div className="mb-3 text-sm bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-100">
                                                        <strong className="block text-xs uppercase tracking-wide opacity-70 mb-1">Coach's Reasoning</strong>
                                                        {score.reasoning}
                                                    </div>
                                                )}

                                                <p className="text-sm text-gray-600 mb-2">
                                                    <strong className="text-gray-500 text-xs uppercase tracking-wide mr-1">Feedback:</strong>
                                                    {score.feedback}
                                                </p>
                                                {score.evidence && (
                                                    <div className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100">
                                                        <strong>Evidence:</strong> "{score.evidence}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Floating Action Button for Evaluation */}
                    {simulation.chatLog.length > 0 && (
                        <div className="absolute bottom-6 right-6 sticky">
                            <button
                                onClick={handleRunEvaluation}
                                disabled={simulation.isSimulating}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                            >
                                {simulation.isSimulating ? (
                                    <>Simulating...</>
                                ) : (
                                    <>{simulation.report ? 'Re-Evaluate' : 'Run Evaluation'}</>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 flex justify-between bg-white flex-shrink-0">
                <span>Rubric v{rubric.meta.version}</span>
                <span>{history.length} records stored</span>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <ClipboardType className="w-4 h-4 text-blue-600" />
                                Paste Chat Log
                            </h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-hidden flex flex-col">
                            <textarea
                                className="w-full flex-1 p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                                placeholder={`Student: Hello!\nAI: Hi there.\nStudent: Can you help me?`}
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Supported formats: "Student/User: message" and "AI/Teacher: message"
                            </p>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTextImport}
                                disabled={!pasteText.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                            >
                                Import Text
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
