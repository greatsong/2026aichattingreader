/**
 * 평가 결과 종합 모듈
 * K-run 및 앙상블 결과 합성
 */
import { calculateGrade } from '../constants'

/**
 * K-run 평가 결과 종합
 */
export function synthesizeKRunResults(results) {
    const n = results.length

    // Calculate average score
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / n)
    const scores = results.map(r => r.totalScore)
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)

    // Calculate grade based on average
    const grade = calculateGrade(avgScore)

    // Synthesize criteria scores (average each)
    const criteriaScoresMap = {}
    results.forEach(result => {
        result.criteriaScores?.forEach(cs => {
            if (!criteriaScoresMap[cs.name]) {
                criteriaScoresMap[cs.name] = {
                    ...cs,
                    scoreSum: 0,
                    count: 0,
                    allDetails: []
                }
            }
            criteriaScoresMap[cs.name].scoreSum += cs.score
            criteriaScoresMap[cs.name].count++
            if (cs.details) {
                criteriaScoresMap[cs.name].allDetails.push(cs.details)
            }
        })
    })

    const criteriaScores = Object.values(criteriaScoresMap).map(cs => {
        // Collect all details directly from criteria scores (fallback to details object if needed)
        const allStrengths = cs.allDetails.flatMap(d => d.strengths || d?.details?.strengths || [])
        const allWeaknesses = cs.allDetails.flatMap(d => d.weaknesses || d?.details?.weaknesses || [])
        const allImprovements = cs.allDetails.flatMap(d => d.improvement || d?.details?.improvement || [])
        const allEvidence = cs.allDetails.map(d => d.evidence || d?.details?.evidence).filter(Boolean)

        // Select unique and representative feedback
        const strengths = [...new Set(allStrengths)].slice(0, 2).join('\n')
        const weaknesses = [...new Set(allWeaknesses)].slice(0, 2).join('\n')
        const improvement = [...new Set(allImprovements)].slice(0, 2).join('\n')

        // Select the longest evidence description
        const evidence = allEvidence.sort((a, b) => b.length - a.length)[0] || ''

        return {
            name: cs.name,
            score: Math.round(cs.scoreSum / cs.count),
            maxScore: cs.maxScore,
            evidence,
            strengths,
            weaknesses,
            improvement,
            details: cs.allDetails[0]
        }
    })

    // Merge characteristics (unique values)
    const allCharacteristics = results.flatMap(r => r.characteristics || [])
    const characteristics = [...new Set(allCharacteristics)].slice(0, 5)

    // Use first qualitative feedback (they should be similar)
    const qualitative = results[0]?.qualitative || []

    // Merge suggestions (unique values)
    const allSuggestions = results.flatMap(r => r.suggestions || [])
    const suggestions = [...new Set(allSuggestions)].slice(0, 4)

    // Pick the longest student record draft
    const studentRecordDraft = results
        .map(r => r.studentRecordDraft || '')
        .sort((a, b) => b.length - a.length)[0] || ''

    return {
        totalScore: avgScore,
        grade,
        criteriaScores,
        characteristics,
        qualitative,
        suggestions,
        studentRecordDraft,
        evaluationMeta: {
            runs: n,
            scoreRange: { min: minScore, max: maxScore },
            variance: maxScore - minScore
        }
    }
}

/**
 * 앙상블 결과 종합 (Client-side version)
 */
export function synthesizeResults(texts) {
    const validResults = []

    // Parse each result
    texts.forEach(text => {
        try {
            const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
            const jsonStr = match[1].trim()
            const obj = JSON.parse(jsonStr)
            if (obj.totalScore !== undefined) {
                validResults.push(obj)
            }
        } catch (e) {
            console.warn('Failed to parse result in ensemble:', e)
        }
    })

    if (validResults.length === 0) {
        return texts[0] || "{}"
    }

    const count = validResults.length
    const base = validResults[0]

    const finalResult = {
        ...base,
        totalScore: Math.round(validResults.reduce((acc, r) => acc + (r.totalScore || 0), 0) / count),
        qualitativeEvaluation: validResults.map((r, i) => `[의견 ${i + 1}]\n${r.qualitativeEvaluation}`).join('\n\n---\n\n'),
        characteristics: [...new Set(validResults.flatMap(r => r.characteristics || []))],
        suggestions: [...new Set(validResults.flatMap(r => r.suggestions || []))],
        criteriaScores: base.criteriaScores.map((criterion, idx) => {
            const sum = validResults.reduce((acc, r) => {
                const c = r.criteriaScores[idx]
                return acc + (c ? (c.score || 0) : 0)
            }, 0)
            const avgScore = Math.round(sum / count)

            const combinedStrengths = validResults.map(r => r.criteriaScores[idx]?.strengths).filter(Boolean).join(' / ')
            const combinedWeaknesses = validResults.map(r => r.criteriaScores[idx]?.weaknesses).filter(Boolean).join('\n')
            const combinedImprovement = validResults.map(r => r.criteriaScores[idx]?.improvement).filter(Boolean).join('\n')
            const combinedEvidence = validResults.map(r => r.criteriaScores[idx]?.evidence).filter(Boolean).join('\n')

            return {
                ...criterion,
                score: avgScore,
                strengths: combinedStrengths,
                weaknesses: combinedWeaknesses,
                improvement: combinedImprovement,
                evidence: combinedEvidence
            }
        })
    }

    return JSON.stringify(finalResult, null, 2)
}
