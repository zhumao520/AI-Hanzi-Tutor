export function parseGradingResult(text) {
    const fallback = { result: 'uncertain', feedback: text || '没有收到批改结果' };
    if (!text) return fallback;

    try {
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        const result = ['correct', 'wrong', 'uncertain'].includes(parsed.result) ? parsed.result : 'uncertain';
        return {
            result,
            feedback: parsed.feedback || text
        };
    } catch(e) {
        return fallback;
    }
}

export function getResultLabel(result) {
    if (result === 'correct') return '通过';
    if (result === 'wrong') return '需复习';
    return '需确认';
}
