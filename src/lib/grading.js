const RESULTS = ['correct', 'wrong', 'uncertain'];
const CONFIDENCE = ['high', 'medium', 'low'];

function cleanJson(text) {
    return String(text || '').replace(/```json|```/g, '').trim();
}

function validateString(value, key, allowEmpty = false) {
    if (typeof value !== 'string' || (!allowEmpty && !value.trim())) throw new Error(`${key} 缺失`);
    return value.trim();
}

export function parseGradingResult(text) {
    const parsed = JSON.parse(cleanJson(text));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('批改结果不是对象');
    if (parsed.schemaVersion !== 1) throw new Error('批改结果版本不匹配');
    if (!RESULTS.includes(parsed.result)) throw new Error('批改结论不合法');
    if (!CONFIDENCE.includes(parsed.confidence)) throw new Error('批改置信度不合法');
    if (!Array.isArray(parsed.errorDetails) || parsed.errorDetails.some(item => typeof item !== 'string')) throw new Error('错误明细格式不合法');
    const errorDetails = parsed.errorDetails.map(item => item.trim()).filter(Boolean);
    if (parsed.result === 'wrong' && !errorDetails.length) throw new Error('错误结论缺少错误明细');
    return {
        schemaVersion: 1,
        result: parsed.result,
        confidence: parsed.confidence,
        transcription: validateString(parsed.transcription, '识别文本', true),
        evidence: validateString(parsed.evidence, '判断依据'),
        errorDetails,
        feedback: validateString(parsed.feedback, '儿童反馈')
    };
}

export async function requestStructuredGrading(callLLM, parts) {
    const first = await callLLM({ contents: [{ parts }] });
    if (first.error) return first;
    try {
        return { grading: parseGradingResult(first.text) };
    } catch {
        const repairParts = [
            ...parts,
            { text: `你刚才的结果无法被系统保存。请只返回一个合法 JSON 对象，不要 Markdown、解释或代码块。必须完全符合 schemaVersion=1、result、confidence、transcription、evidence、errorDetails、feedback 这七个字段；wrong 时 errorDetails 至少一项。` }
        ];
        const repaired = await callLLM({ contents: [{ parts: repairParts }] });
        if (repaired.error) return repaired;
        try {
            return { grading: parseGradingResult(repaired.text) };
        } catch {
            return { error: 'AI 批改结果格式不正确，本次结果没有保存，请重试。' };
        }
    }
}

export function getResultLabel(result) {
    if (result === 'correct') return '通过';
    if (result === 'wrong') return '需复习';
    return '需确认';
}
