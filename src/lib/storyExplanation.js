const SUBJECT_RULES = {
    语文: `语文讲解规则：
1. 重点讲字形、偏旁、词义、读音、语感或句子意思。
2. 如果是错别字，要说清楚两个字哪里不一样。
3. 如果是多音字，要给孩子一个生活里的使用场景。
4. 不要讲复杂术语，用 5-8 岁孩子能听懂的话。`,
    数学: `数学讲解规则：
1. 不能只讲故事，必须把解题步骤讲清楚。
2. 先说题目问什么，再说题目给了什么。
3. 如果是计算题，讲计算顺序、进位退位或验算。
4. 如果是应用题，讲数量关系。
5. 如果是单位题，提醒单位要一致。
6. 如果是图形题，讲边、角、长宽高等图形特征。
7. steps 数组必须有 2-5 个步骤。`,
    英语: `英语讲解规则：
1. 用中英结合的小故事，但英文必须简单。
2. 重点讲单词拼写、发音记忆、句型、时态或表达习惯。
3. 不要大段英文。
4. 给一个同类型的小练习。`
};

const fallbackStory = {
    storyTitle: '小小错题侦探',
    whyWrong: '这道题需要再看一看关键地方。',
    story: '我们把错题当成小线索，找到哪里想错了，再用正确方法走一遍。',
    steps: [],
    memoryTip: '先看题目，再想方法，最后检查答案。',
    miniPractice: '请再做一道同类型的小题。',
    answer: '',
    parentTip: '让孩子先说出自己的想法，再一起纠正关键一步。'
};

function normalizeDiagram(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const type = String(value.type || '').trim();
    const supported = ['grouping', 'bar', 'compare', 'numberLine', 'rectangle', 'triangle', 'circle', 'angle', 'cuboid', 'cube', 'cylinder', 'cone', 'sphere'];
    if (!supported.includes(type)) return null;
    return { ...value, type };
}

function inferSubject(mistake) {
    const text = [mistake.subject, mistake.category, mistake.originalQuestion, mistake.wrongAnswer, mistake.correctAnswer, mistake.analysis].join(' ');
    if (/平均分|一共|每人|几颗|几只|多少|[\d+\-*/=]|单位|应用题|方程|几何|计算|厘米|米|千克|kg|cm|m\b/i.test(text)) return '数学';
    if (/[A-Za-z]{3,}|because|grammar|word|sentence|拼写|句型|语法|时态/i.test(text)) return '英语';
    return mistake.subject || '语文';
}

export function buildStoryPrompt(mistake) {
    const subject = inferSubject(mistake);
    const rules = SUBJECT_RULES[subject] || SUBJECT_RULES.语文;

    return `你是一个有耐心的小学启蒙老师，正在给 5-8 岁小朋友讲错题。

孩子错题信息：
学科：${subject}
原始记录学科：${mistake.subject || '（空）'}
分类：${mistake.category || '未分类'}
原题：${mistake.originalQuestion || '（空）'}
孩子错答：${mistake.wrongAnswer || '（空）'}
正确答案：${mistake.correctAnswer || '（空）'}
已有错因：${mistake.analysis || '（空）'}

${rules}

数学 diagram 规则：
- 如果是数学题，请尽量返回 diagram 字段。
- diagram.type 只能是：grouping, bar, compare, numberLine, rectangle, triangle, circle, angle, cuboid, cube, cylinder, cone, sphere。
- 平均分/除法用 grouping。
- 加减应用题用 bar。
- 比多少用 compare。
- 跳数/加减移动用 numberLine。
- 平面几何用 rectangle/triangle/circle/angle。
- 立体几何用 cuboid/cube/cylinder/cone/sphere。
- diagram 只放结构数据，不要放 SVG，不要放 Markdown。

通用要求：
1. 用故事讲清楚，不要训斥孩子。
2. 每句话短一点，像家长讲给小朋友听。
3. 必须指出为什么错，以及正确方法怎么记。
4. 给一个同类型小练习和答案。
5. parentTip 写给家长，简短具体。
6. 不要输出 Markdown，不要输出代码块。
7. 必须返回严格 JSON。

JSON 字段：
{
  "storyTitle": "故事标题",
  "whyWrong": "为什么错，用小朋友能懂的话",
  "story": "故事讲解",
  "steps": ["步骤1", "步骤2"],
  "diagram": {
    "type": "grouping",
    "title": "示意图标题",
    "groups": [["🍬","🍬"],["🍬","🍬"]],
    "labels": ["第1份","第2份"],
    "formula": "可选公式",
    "question": "可选问题"
  },
  "memoryTip": "记忆口诀或小窍门",
  "miniPractice": "同类小练习",
  "answer": "小练习答案",
  "parentTip": "给家长的一句话提醒"
}`;
}

export function normalizeStoryExplanation(value) {
    const raw = value && typeof value === 'object' ? value : {};
    const steps = Array.isArray(raw.steps)
        ? raw.steps.map(item => String(item || '').trim()).filter(Boolean)
        : [];
    return {
        storyTitle: String(raw.storyTitle || fallbackStory.storyTitle).trim(),
        whyWrong: String(raw.whyWrong || fallbackStory.whyWrong).trim(),
        story: String(raw.story || fallbackStory.story).trim(),
        steps,
        diagram: normalizeDiagram(raw.diagram),
        memoryTip: String(raw.memoryTip || fallbackStory.memoryTip).trim(),
        miniPractice: String(raw.miniPractice || fallbackStory.miniPractice).trim(),
        answer: String(raw.answer || '').trim(),
        parentTip: String(raw.parentTip || fallbackStory.parentTip).trim(),
        createdAt: raw.createdAt || new Date().toISOString()
    };
}

export function parseStoryExplanation(text) {
    const clean = String(text || '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return normalizeStoryExplanation(parsed);
}

export function formatStoryForSpeech(story) {
    const normalized = normalizeStoryExplanation(story);
    const parts = [
        `故事标题：${normalized.storyTitle}。`,
        `为什么错：${normalized.whyWrong}。`,
        `故事开始：${normalized.story}。`
    ];
    if (normalized.steps.length) {
        parts.push('我们一步一步来。');
        normalized.steps.forEach((step, index) => {
            parts.push(`第${index + 1}步，${step}。`);
        });
    }
    parts.push(`记忆小窍门：${normalized.memoryTip}。`);
    parts.push(`小练习：${normalized.miniPractice}。`);
    if (normalized.answer) parts.push(`答案是：${normalized.answer}。`);
    return parts.join('\n');
}
