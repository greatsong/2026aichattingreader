/**
 * 평가 프롬프트 생성 모듈
 */

/**
 * 평가 프롬프트 생성
 */
export function buildEvaluationPrompt(chatContent, rubric, reflection) {
    const criteriaDescription = rubric.criteria.map(c => {
        const levelsDesc = c.levels
            .map(l => `  - ${l.score}점: ${l.description}`)
            .join('\n')
        return `### ${c.name} (가중치: ${c.weight}%)
설명: ${c.description}
평가 수준:
${levelsDesc}`
    }).join('\n\n')

    // Generate criteria list for clearer instruction
    const criteriaNamesList = rubric.criteria.map((c, i) => `${i + 1}. ${c.name}`).join('\n')

    return `당신은 AI 채팅 활용 능력을 평가하는 교육 전문가입니다.
학생들이 AI를 더 효과적으로 활용할 수 있도록 구체적이고 교육적인 피드백을 제공해주세요.

# 평가 루브릭: ${rubric.name}

${criteriaDescription}

# 학생 자기평가 / 추가 맥락 (Additional Context)
${reflection ? reflection : "(없음)"}

⚠️ 주의: 위 '학생 자기평가' 내용은 **정성 평가(의견, 생활기록부)**에만 반영하고, **점수(Quantitative Score)** 산정에는 절대 반영하지 마세요. 점수는 오직 채팅 내용의 품질로만 평가하세요.

# 평가할 채팅 기록 (⚠️ 중요 지침)
본 내용은 사용자가 브라우저에서 직접 복사하여 붙여넣은 것입니다. 따라서 사이드바의 채팅 목록, 설정 메뉴, 버튼 텍스트 등 불필요한 노이즈가 포함되어 있을 수 있습니다.

**평가 시 반드시 다음 지침을 따르세요:**
1. 채팅 화면의 **주요 대화 내용(사용자 질문과 AI 응답)**만 추출하여 평가에 반영하세요.
2. 사이드바의 다른 채팅 제목이나 메뉴 버튼 등 대화 외적인 텍스트는 **완전한 무시(Ignore)** 대상으로 처리하세요.
3. 만약 복사된 내용 중 여러 대화가 섞여 있다면, 가장 마지막에 진행된 주요 주제를 중심으로 평가하세요.

---
${chatContent}
---

# 평가 결과 형식

⚠️ 중요: 아래 ${rubric.criteria.length}개 평가 항목을 **모두** 평가해야 합니다:
${criteriaNamesList}

반드시 다음 JSON 형식으로만 응답해주세요. 다른 텍스트 없이 JSON만 출력하세요.
criteriaScores 배열에는 반드시 **${rubric.criteria.length}개 항목**이 포함되어야 하며, **각 항목마다 evidence, strengths, weaknesses, improvement 필드가 비어있지 않아야 합니다**.

\`\`\`json
{
  "totalScore": 85,
  "grade": "B+",
  "criteriaScores": [
    {
      "criterionId": "criterion_1",
      "name": "첫 번째 평가 항목명",
      "score": 4,
      "maxScore": 5,
      "percentage": 80,
      "evidence": "채팅에서 직접 인용: 「학생이 실제로 입력한 문장」 ← 반드시 원문 인용 포함",
      "strengths": "잘한 점을 구체적으로 칭찬",
      "weaknesses": "부족한 점 지적",
      "improvement": "구체적 개선 예시 (Before → After 형식으로 작성)",
      "nextSteps": "이 항목 점수가 3점 이하일 때, 다음 번에 시도해볼 구체적인 행동 1가지"
    },
    {
      "criterionId": "criterion_2",
      "name": "두 번째 평가 항목명",
      "score": 3,
      "maxScore": 5,
      "percentage": 60,
      "evidence": "...",
      "strengths": "...",
      "weaknesses": "...",
      "improvement": "..."
    }
    // ... 나머지 평가 항목도 동일한 형식으로 모두 포함
  ],
  "characteristics": [
    "이 학생의 AI 활용 특징 1",
    "특징 2",
    "특징 3"
  ],
  "qualitativeEvaluation": "전반적인 정성 평가. 학생의 강점과 성장 가능성을 중심으로 작성. (학생의 자기평가 내용도 참고하여 격려)",
  "suggestions": [
    "구체적인 실천 방안 1",
    "구체적인 실천 방안 2"
  ],
  "studentRecordDraft": "생활기록부 작성용 초안 (학생의 자기평가 내용이 있다면 이를 포함하여, 구체적인 활동 맥락이 드러나도록 3-4문장으로 작성)"
}
\`\`\`

# 필수 지침 (반드시 따르세요!)

1. **criteriaScores는 반드시 ${rubric.criteria.length}개**여야 합니다. 하나라도 빠지면 안 됩니다.
2. **evidence 필드 작성법 (가장 중요!)**:
   - 반드시 학생 채팅의 **원문을 「」(꺾쇠인용부호)로 직접 인용**해야 합니다.
   - 예시: "학생이 「구체적으로 고등학생 수준에서 설명해줘」라고 요청하여 명확성이 높음"
   - 인용 없이 "잘했습니다"만 쓰면 안 됩니다. 반드시 채팅 원문 근거를 포함하세요.
   - 학생이 "내 흐름도를 반영해달라"고 했다면, 그 노력을 정성 평가에 언급해주세요.
3. **improvement 필드**: Before → After 형식으로 구체적인 수정 예시를 보여주세요.
4. **nextSteps 필드**: 해당 항목 점수가 3점 이하인 경우, 학생이 다음에 실천할 수 있는 **구체적인 행동 1가지**를 제안하세요. 4점 이상이면 빈 문자열로 두세요.
5. totalScore는 각 항목 점수에 가중치를 적용한 100점 만점 환산 점수입니다.
6. evidence, strengths, weaknesses, improvement 필드는 **빈 문자열("")이면 안 됩니다**. 반드시 내용을 채워주세요.
7. nextSteps는 해당 항목 점수가 3점 이하일 때만 채우고, 4점 이상이면 빈 문자열("")로 두세요.
8. 반드시 유효한 JSON 형식으로 응답해주세요. 주석은 포함하지 마세요.`
}
