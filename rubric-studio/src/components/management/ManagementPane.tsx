'use client'

import { useState } from 'react'
import { useRubricStore } from '@/store/rubricStore'
import { Rubric } from '@/types'
import { Plus, Check, Trash2, Upload, FileJson, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function ManagementPane() {
    const { rubrics, activeRubricId, addRubric, setActiveRubric, deleteRubric } = useRubricStore()
    const [importJson, setImportJson] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isImporting, setIsImporting] = useState(false)

    const activeRubric = rubrics.find(r => r.id === activeRubricId)

    const handleImport = () => {
        setError(null)
        if (!importJson.trim()) return

        try {
            let parsed: any = JSON.parse(importJson)

            // Handle flat JSON structure (User convenience)
            if (!parsed.meta && parsed.title) {
                parsed = {
                    id: parsed.id,
                    meta: {
                        title: parsed.title,
                        teacherIntent: parsed.teacherIntent || '',
                        targetGrade: parsed.targetGrade || '',
                        version: 1
                    },
                    criteria: parsed.criteria || [],
                    evaluation_system_prompt: parsed.evaluation_system_prompt || ''
                }
            }

            // Auto-format title with teacherIntent instructions
            if (parsed.meta?.title && parsed.meta?.teacherIntent) {
                // If title doesn't already contain the intent, append it
                if (!parsed.meta.title.includes(parsed.meta.teacherIntent)) {
                    parsed.meta.title = `${parsed.meta.title}(${parsed.meta.teacherIntent})`
                }
            }

            // Basic Validation
            if (!parsed.criteria || !Array.isArray(parsed.criteria)) {
                throw new Error("Invalid format: 'criteria' array is missing.")
            }
            if (!parsed.meta || !parsed.meta.title) {
                throw new Error("Invalid format: 'meta.title' is missing.")
            }

            // Ensure ID exists
            if (!parsed.id) {
                parsed.id = `rubric-${Date.now()}`
            }

            // Check for duplicate ID
            if (rubrics.some(r => r.id === parsed.id)) {
                if (!confirm(`Rubric with ID '${parsed.id}' already exists. Overwrite?`)) {
                    return
                }
                deleteRubric(parsed.id)
            }

            addRubric(parsed as Rubric)
            setActiveRubric(parsed.id)
            setImportJson('')
            setIsImporting(false)
            alert(`Successfully imported "${parsed.meta.title}"`)
        } catch (e: any) {
            setError(e.message || "Failed to parse JSON")
        }
    }

    const loadStreamlitTemplate = () => {
        const template = {
            id: "streamlit-rubric-v1",
            meta: {
                title: "스트림릿(Streamlit) 클라우드로 웹앱 만들기",
                teacherIntent: "증거 기반, 성장 지향, 맥락 인식 평가",
                targetGrade: "High School",
                version: 1
            },
            evaluation_system_prompt: "이 루브릭은 학생이 스트림릿을 사용하여 웹앱을 만드는 과정을 평가합니다. 특히 코드의 효율성과 디자인적 심미성, 그리고 AI 도구의 창의적 활용을 중점적으로 보십시오.",
            criteria: [
                {
                    id: "technical",
                    name: "기술적 구현",
                    description: "코드 완성도 및 효율성",
                    weight: 30,
                    levels: [
                        { score: 5, description: "완성도 높고 효율적임" },
                        { score: 3, description: "기본 기능 동작함" },
                        { score: 1, description: "기능 미구현" }
                    ]
                }
            ]
        }
        setImportJson(JSON.stringify(template, null, 2))
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
            <div className="max-w-6xl mx-auto w-full h-full flex gap-6">

                {/* Left: Rubric List */}
                <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <FileJson className="w-4 h-4 text-slate-500" />
                            Rubric Library
                        </h2>
                        <span className="text-xs text-slate-400">{rubrics.length} items</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {rubrics.map(rubric => (
                            <div
                                key={rubric.id}
                                onClick={() => setActiveRubric(rubric.id)}
                                className={clsx(
                                    "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md relative group",
                                    activeRubricId === rubric.id
                                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300"
                                        : "bg-white border-gray-100 hover:border-blue-100"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={clsx(
                                        "font-medium text-sm",
                                        activeRubricId === rubric.id ? "text-blue-800" : "text-slate-700"
                                    )}>
                                        {rubric.meta.title}
                                    </h3>
                                    {activeRubricId === rubric.id && (
                                        <span className="bg-blue-100 text-blue-600 p-1 rounded-full">
                                            <Check className="w-3 h-3" />
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{rubric.meta.teacherIntent}</p>

                                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">v{rubric.meta.version}</span>
                                    <span>{rubric.criteria.length} Criteria</span>
                                </div>

                                {/* Delete Button (Hover) */}
                                {rubrics.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm('Delete this rubric?')) deleteRubric(rubric.id)
                                        }}
                                        className="absolute right-2 bottom-2 p-1.5 text-red-400 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={() => setIsImporting(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add New Rubric
                        </button>
                    </div>
                </div>

                {/* Right: Detail or Import */}
                <div className="w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isImporting ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-semibold text-slate-800">Import Rubric JSON</h2>
                                <button onClick={() => setIsImporting(false)} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
                            </div>
                            <div className="flex-1 p-4 flex flex-col">
                                <p className="text-sm text-slate-500 mb-2">Paste your rubric JSON here. Use the button below to load a template.</p>
                                <textarea
                                    value={importJson}
                                    onChange={(e) => setImportJson(e.target.value)}
                                    className="flex-1 w-full p-4 font-mono text-xs bg-slate-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                    placeholder="{ ... }"
                                />
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                                <button
                                    onClick={loadStreamlitTemplate}
                                    className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                    Load Streamlit Template
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!importJson.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Upload className="w-4 h-4 inline-block mr-2" />
                                    Import Rubric
                                </button>
                            </div>
                        </div>
                    ) : (
                        activeRubric ? (
                            <div className="flex flex-col h-full overflow-y-auto">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase tracking-wide">Active</span>
                                        <h1 className="text-2xl font-bold text-slate-800">{activeRubric.meta.title}</h1>
                                    </div>
                                    <p className="text-slate-600">{activeRubric.meta.teacherIntent}</p>
                                    {activeRubric.evaluation_system_prompt && (
                                        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                            <h4 className="text-xs font-bold text-indigo-800 uppercase mb-1">Evaluation System Prompt</h4>
                                            <p className="text-xs text-indigo-700">{activeRubric.evaluation_system_prompt}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Criteria ({activeRubric.criteria.length})</h3>
                                    <div className="space-y-6">
                                        {activeRubric.criteria.map(criterion => (
                                            <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                            {criterion.name}
                                                            <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">ID: {criterion.id}</span>
                                                        </h4>
                                                        <p className="text-sm text-slate-600 mt-1">{criterion.description}</p>
                                                    </div>
                                                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">
                                                        Weight: {criterion.weight}%
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid gap-2">
                                                    {criterion.levels.map(level => (
                                                        <div key={level.score} className="flex gap-4 text-sm p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                                                            <span className={clsx(
                                                                "font-bold w-16 flex-shrink-0",
                                                                level.score >= 4 ? "text-green-600" : level.score >= 3 ? "text-amber-600" : "text-red-600"
                                                            )}>
                                                                {level.score} pts
                                                            </span>
                                                            <span className="text-slate-700">{level.description}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <p>Select a rubric to view details</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}
