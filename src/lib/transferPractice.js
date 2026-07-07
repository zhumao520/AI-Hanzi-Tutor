const SUBJECT_RULES = {
    语文: `语文同类题规则：
1. 错别字要换一个相似但不完全一样的字词。
2. 多音字要换一个生活场景。
3. 词义或句子题要换一个简单句子。
4. 题目要短，适合 5-8 岁孩子。`,
    数学: `数学同类题规则：
1. 保留同一种数量关系或同一种计算方法。
2. 换数字、换场景，但难度不要突然增加。
3. 必须给出标准答案和 2-5 个解题步骤。
4. 题目要让孩子能在纸上或平板上完成。`,
    英语: `英语同类题规则：
1. 保留同类拼写、句型或语法点。
2. 英文句子要短。
3. 给中文提示，避免大段英文。
4. 标准答案要明确。`
};

function inferSubject(mistake) {
    const text = [mistake.subject, mistake.category, mistake.originalQuestion, mistake.wrongAnswer, mistake.correctAnswer, mistake.analysis].join(' ');
    if (/平均分|一共|每人|多少|[\d+\-*/=]|单位|应用题|方程|几何|计算|厘米|米|千克|kg|cm|m\b/i.test(text)) return '数学';
    if (/[A-Za-z]{3,}|because|grammar|word|sentence|拼写|句型|语法|时态/i.test(text)) return '英语';
    return mistake.subject || '语文';
}

function normalizeDiagram(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const type = String(value.type || '').trim();
    const supported = ['grouping', 'bar', 'compare', 'numberLine', 'rectangle', 'triangle', 'circle', 'angle', 'cuboid', 'cube', 'cylinder', 'cone', 'sphere'];
    if (!supported.includes(type)) return null;
    return { ...value, type };
}

export function buildPracticePrompt(mistake, count = 1) {
    const subject = inferSubject(mistake);
    const rules = SUBJECT_RULES[subject] || SUBJECT_RULES.语文;
    const safeCount = Math.min(Math.max(Number(count) || 1, 1), 3);

    return `你是小学启蒙老师。请根据错题生成 ${safeCount} 道同类练习，让孩子举一反三。

错题信息：
学科：${subject}
分类：${mistake.category || '未分类'}
原题：${mistake.originalQuestion || '（空）'}
孩子错答：${mistake.wrongAnswer || '（空）'}
正确答案：${mistake.correctAnswer || '（空）'}
错因：${mistake.analysis || '（空）'}

${rules}

数学 diagram 规则：
- 如果是数学题，请尽量给每道练习返回 diagram。
- diagram.type 只能是：grouping, bar, compare, numberLine, rectangle, triangle, circle, angle, cuboid, cube, cylinder, cone, sphere。
- 平均分/除法用 grouping；加减应用题用 bar；比较题用 compare；数轴题用 numberLine；平面几何用 rectangle/triangle/circle/angle；立体几何用 cuboid/cube/cylinder/cone/sphere。
- diagram 只放结构化数据，不要放 SVG，不要放 Markdown。

要求：
1. 不要重复原题。
2. 难度与原题接近或略简单。
3. 每道题要有 hint、answer、steps、parentTip。
4. 不要输出 Markdown，不要输出代码块。
5. 必须返回严格 JSON。

JSON 格式：
{
  "items": [
    {
      "practiceTitle": "再试一题",
      "question": "题目",
      "hint": "给孩子的一句话提示",
      "answer": "标准答案",
      "steps": ["步骤1", "步骤2"],
      "diagram": {
        "type": "grouping",
        "title": "示意图标题",
        "groups": [["🍬","🍬"],["🍬","🍬"]],
        "labels": ["第1份","第2份"],
        "formula": "可选公式",
        "question": "可选问题"
      },
      "parentTip": "给家长的观察提醒"
    }
  ]
}`;
}

export function normalizePracticeItem(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
        id: raw.id || `practice_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        practiceTitle: String(raw.practiceTitle || '再试一题').trim(),
        question: String(raw.question || '').trim(),
        hint: String(raw.hint || '').trim(),
        answer: String(raw.answer || '').trim(),
        steps: Array.isArray(raw.steps) ? raw.steps.map(item => String(item || '').trim()).filter(Boolean) : [],
        diagram: normalizeDiagram(raw.diagram),
        parentTip: String(raw.parentTip || '').trim(),
        result: raw.result || 'pending',
        childAnswer: String(raw.childAnswer || '').trim(),
        feedback: String(raw.feedback || '').trim(),
        createdAt: raw.createdAt || new Date().toISOString(),
        checkedAt: raw.checkedAt || null
    };
}

export function parsePracticeResponse(text) {
    const clean = String(text || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const list = Array.isArray(parsed) ? parsed : parsed.items;
    return (Array.isArray(list) ? list : []).map(normalizePracticeItem).filter(item => item.question && item.answer);
}

export function formatPracticeForSpeech(item) {
    const practice = normalizePracticeItem(item);
    return [
        practice.practiceTitle,
        `题目：${practice.question}`,
        practice.hint ? `小提示：${practice.hint}` : ''
    ].filter(Boolean).join('\n');
}

export function buildTextCheckPrompt(practice, childAnswer) {
    return `请判断孩子是否正确完成这道同类练习。

练习题：${practice.question}
标准答案：${practice.answer}
参考步骤：${(practice.steps || []).join('；') || '无'}
孩子答案：${childAnswer || '（空）'}

判断规则：
- 答案正确或表达等价，result 为 correct。
- 明显算错、写错、漏写，result 为 wrong。
- 无法判断，result 为 uncertain。

只返回 JSON：
{
  "result": "correct|wrong|uncertain",
  "feedback": "给小朋友的一句话反馈",
  "shouldMaster": true
}`;
}

export function buildPhotoCheckPrompt(practice) {
    return `请判断孩子是否正确完成这道同类练习。

练习题：${practice.question}
标准答案：${practice.answer}
参考步骤：${(practice.steps || []).join('；') || '无'}

判断规则：
- 答案正确或步骤合理，result 为 correct。
- 明显算错、写错、漏写，result 为 wrong。
- 图片模糊、遮挡、无法判断，result 为 uncertain。

只返回 JSON：
{
  "result": "correct|wrong|uncertain",
  "feedback": "给小朋友的一句话反馈",
  "shouldMaster": true
}`;
}

export function parsePracticeCheck(text) {
    const clean = String(text || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const result = ['correct', 'wrong', 'uncertain'].includes(parsed.result) ? parsed.result : 'uncertain';
    return {
        result,
        feedback: String(parsed.feedback || '').trim() || (result === 'correct' ? '做对了。' : result === 'wrong' ? '再试一次。' : '这次看不清。'),
        shouldMaster: Boolean(parsed.shouldMaster) && result === 'correct'
    };
}
