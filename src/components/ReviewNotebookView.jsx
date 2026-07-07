import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import MathDiagram from './MathDiagram.jsx';
import { playAudio } from '../lib/audio.js';
import { compressImage } from '../lib/image.js';
import { buildStoryPrompt, formatStoryForSpeech, parseStoryExplanation } from '../lib/storyExplanation.js';
import { buildPhotoCheckPrompt, buildPracticePrompt, buildTextCheckPrompt, formatPracticeForSpeech, parsePracticeCheck, parsePracticeResponse } from '../lib/transferPractice.js';
import {
    CATEGORY_MAP,
    STATUSES,
    SUBJECTS,
    buildExportPayload,
    createMistake,
    deleteMistake,
    detectDuplicates,
    downloadText,
    filterMistakes,
    generateMarkdown,
    generateText,
    getDateRangeByCycle,
    getReviewProgress,
    getTodayReviewMistakeIds,
    loadNotebook,
    openPrintableReview,
    parseAiMistakeDraft,
    saveNotebook,
    startReviewSession,
    submitReviewAnswer,
    summarizeReviewSession,
    summarizeWeakPoints,
    updateMistake
} from '../lib/reviewNotebook.js';

const emptyDraft = {
    recordDate: '',
    subject: '语文',
    category: '错别字',
    originalQuestion: '',
    wrongAnswer: '',
    correctAnswer: '',
    analysis: '',
    reviewTip: '',
    source: 'manual',
    status: '未复习',
    tags: ''
};

function today() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseTags(tags) {
    return Array.isArray(tags) ? tags.join('、') : tags || '';
}

function toForm(record) {
    return { ...emptyDraft, ...record, tags: parseTags(record?.tags), recordDate: record?.recordDate || today() };
}

export default function ReviewNotebookView({ callLLM, profile, voiceURI, onBack }) {
    const profileId = profile?.id || 'default';
    const childName = profile?.name || '孩子';
    const [state, setState] = useState(() => loadNotebook(profileId));
    const [tab, setTab] = useState('records');
    const [draft, setDraft] = useState(() => ({ ...emptyDraft, recordDate: today() }));
    const [editingId, setEditingId] = useState('');
    const [filters, setFilters] = useState({ keyword: '', subject: 'all', status: 'all', startDate: '', endDate: '' });
    const [selectedId, setSelectedId] = useState('');
    const [aiStatus, setAiStatus] = useState('');
    const [storyStatus, setStoryStatus] = useState('');
    const [practiceStatus, setPracticeStatus] = useState('');
    const [practiceAnswers, setPracticeAnswers] = useState({});
    const [duplicates, setDuplicates] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState('');
    const [answer, setAnswer] = useState('');
    const [exportOptions, setExportOptions] = useState({
        cycle: 'custom',
        template: 'detailed',
        excludeMastered: false,
        prioritizeNeedReview: true,
        includeStories: true,
        includePractices: true
    });

    useEffect(() => {
        const next = loadNotebook(profileId);
        setState(next);
        setDraft({ ...emptyDraft, recordDate: today() });
        setEditingId('');
        setSelectedId('');
        setActiveSessionId('');
    }, [profileId]);

    useEffect(() => {
        saveNotebook(profileId, state);
    }, [profileId, state]);

    const mistakes = useMemo(() => filterMistakes(state, filters), [state, filters]);
    const selected = state.mistakes.find(item => item.id === selectedId) || mistakes[0] || null;
    const weak = useMemo(() => summarizeWeakPoints(state.mistakes), [state.mistakes]);
    const activeSession = state.reviewSessions.find(item => item.id === activeSessionId) || null;
    const progress = getReviewProgress(activeSession);
    const reviewSummary = summarizeReviewSession(state, activeSessionId);
    const currentReviewMistake = state.mistakes.find(item => item.id === progress.pendingMistakeIds[0]) || null;

    const setField = (key, value) => {
        setDraft(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'subject') next.category = CATEGORY_MAP[value]?.[0] || '';
            return next;
        });
    };

    const resetForm = () => {
        setDraft({ ...emptyDraft, recordDate: today() });
        setEditingId('');
        setDuplicates([]);
    };

    const saveRecord = () => {
        const duplicateList = editingId ? [] : detectDuplicates(state, draft);
        setDuplicates(duplicateList);
        if (duplicateList.length && !confirm(`发现 ${duplicateList.length} 条相似错题，仍然保存吗？`)) return;
        const result = editingId ? updateMistake(state, editingId, draft) : createMistake(state, draft);
        if (!result.ok) {
            alert(result.error);
            return;
        }
        setState(result.state);
        setSelectedId(result.record.id);
        resetForm();
        setTab('records');
    };

    const editRecord = (record) => {
        setDraft(toForm(record));
        setEditingId(record.id);
        setTab('new');
    };

    const removeRecord = (record) => {
        if (!confirm('删除这条错题？')) return;
        const result = deleteMistake(state, record.id);
        if (result.ok) {
            setState(result.state);
            setSelectedId('');
        }
    };

    const setStatus = (record, status) => {
        const result = updateMistake(state, record.id, { ...record, status });
        if (result.ok) setState(result.state);
    };

    const saveStoryExplanation = (record, story) => {
        const result = updateMistake(state, record.id, { ...record, storyExplanation: story });
        if (result.ok) {
            setState(result.state);
            setSelectedId(result.record.id);
        }
    };

    const generateStoryExplanation = async (record) => {
        setStoryStatus('AI 正在给小朋友编故事讲解...');
        const res = await callLLM({ contents: [{ parts: [{ text: buildStoryPrompt(record) }] }] });
        if (res.error) {
            setStoryStatus('');
            alert(res.error);
            return;
        }
        try {
            const story = parseStoryExplanation(res.text);
            saveStoryExplanation(record, story);
            setStoryStatus('');
            playAudio(formatStoryForSpeech(story), voiceURI);
        } catch {
            setStoryStatus('');
            alert('AI 讲解格式不正确，请重试。');
        }
    };

    const playStoryExplanation = (story) => {
        playAudio(formatStoryForSpeech(story), voiceURI);
    };

    const saveTransferPractices = (record, practices) => {
        const result = updateMistake(state, record.id, { ...record, transferPractices: practices });
        if (result.ok) {
            setState(result.state);
            setSelectedId(result.record.id);
        }
    };

    const generateTransferPractice = async (record, count = 1) => {
        setPracticeStatus(`AI 正在生成 ${count} 道同类练习...`);
        const res = await callLLM({ contents: [{ parts: [{ text: buildPracticePrompt(record, count) }] }] });
        if (res.error) {
            setPracticeStatus('');
            alert(res.error);
            return;
        }
        try {
            const items = parsePracticeResponse(res.text);
            if (!items.length) {
                alert('AI 没有生成可用练习，请重试。');
                setPracticeStatus('');
                return;
            }
            saveTransferPractices(record, [...items, ...(record.transferPractices || [])].slice(0, 12));
            setPracticeStatus('');
            playAudio(formatPracticeForSpeech(items[0]), voiceURI);
        } catch {
            setPracticeStatus('');
            alert('AI 练习题格式不正确，请重试。');
        }
    };

    const applyPracticeCheck = (record, practice, check, childAnswer = '') => {
        const practices = (record.transferPractices || []).map(item => item.id === practice.id ? { ...item,
            result: check.result,
            childAnswer,
            feedback: check.feedback,
            checkedAt: new Date().toISOString()
        } : item);
        const nextStatus = check.shouldMaster ? '已掌握' : check.result === 'wrong' ? '需再次复习' : record.status;
        const result = updateMistake(state, record.id, { ...record, transferPractices: practices, status: nextStatus });
        if (result.ok) {
            setState(result.state);
            setSelectedId(result.record.id);
        }
        playAudio(check.feedback, voiceURI);
    };

    const checkPracticeText = async (record, practice) => {
        const childAnswer = practiceAnswers[practice.id] || '';
        if (!childAnswer.trim()) {
            alert('请先输入孩子答案');
            return;
        }
        setPracticeStatus('AI 正在批改答案...');
        const res = await callLLM({ contents: [{ parts: [{ text: buildTextCheckPrompt(practice, childAnswer) }] }] });
        if (res.error) {
            setPracticeStatus('');
            alert(res.error);
            return;
        }
        try {
            const check = parsePracticeCheck(res.text);
            setPracticeStatus('');
            applyPracticeCheck(record, practice, check, childAnswer);
        } catch {
            setPracticeStatus('');
            alert('AI 批改格式不正确，请重试。');
        }
    };

    const checkPracticePhoto = async (record, practice, event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        setPracticeStatus('AI 正在看孩子的作答照片...');
        const base64 = await compressImage(file);
        const res = await callLLM({ contents: [{ parts: [{ text: buildPhotoCheckPrompt(practice) }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }] }] });
        if (res.error) {
            setPracticeStatus('');
            alert(res.error);
            return;
        }
        try {
            const check = parsePracticeCheck(res.text);
            setPracticeStatus('');
            applyPracticeCheck(record, practice, check, '拍照作答');
        } catch {
            setPracticeStatus('');
            alert('AI 批改格式不正确，请重试。');
        }
    };

    const markPractice = (record, practice, mastered) => {
        const check = {
            result: mastered ? 'correct' : 'wrong',
            feedback: mastered ? '太好了，这次真的掌握了。' : '没关系，我们把它放回复习里。',
            shouldMaster: mastered
        };
        applyPracticeCheck(record, practice, check, practiceAnswers[practice.id] || '');
    };

    const handleAiPhoto = async (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        setAiStatus('AI 正在整理错题...');
        const base64 = await compressImage(file);
        const prompt = `请从图片中提取儿童作业错题，并返回严格 JSON，不要 Markdown。
字段：
{
  "recordDate":"YYYY-MM-DD或空",
  "subject":"语文|数学|英语",
  "category":"错题分类",
  "originalQuestion":"原题或题目要求",
  "wrongAnswer":"孩子的错答或错误表现，没有则空",
  "correctAnswer":"正确答案，没有把握则空",
  "analysis":"错因简析，一句话",
  "reviewTip":"给家长的复习建议，一句话",
  "tags":["标签1","标签2"]
}
如果图片看不清，也尽量返回能判断的字段。`;
        const res = await callLLM({ contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }] }] });
        if (res.error) {
            setAiStatus('');
            alert(res.error);
            return;
        }
        try {
            const parsed = parseAiMistakeDraft(res.text);
            setDraft(toForm({ ...parsed, source: 'photo' }));
            setDuplicates(detectDuplicates(state, parsed));
            setTab('new');
            setAiStatus('');
        } catch {
            setAiStatus('');
            alert('AI 返回格式不正确，请换个支持视觉的模型或重试。');
        }
    };

    const startReview = (scope) => {
        const ids = scope === 'today'
            ? getTodayReviewMistakeIds(state)
            : (scope === 'all' ? state.mistakes : state.mistakes.filter(item => item.status !== '已掌握')).map(item => item.id);
        const result = startReviewSession(state, ids);
        if (!result.ok) {
            alert(result.error);
            return;
        }
        setState(result.state);
        setActiveSessionId(result.session.id);
        setAnswer('');
        setTab('review');
    };

    const submitAnswer = () => {
        if (!activeSession || !currentReviewMistake) return;
        const result = submitReviewAnswer(state, activeSession.id, currentReviewMistake.id, answer);
        if (!result.ok) {
            alert(result.error);
            return;
        }
        setState(result.state);
        setAnswer('');
        if (result.session.completedAt) alert('本轮复习完成');
    };

    const buildCurrentExportPayload = () => buildExportPayload(state, { ...filters, ...exportOptions });

    const exportMarkdown = () => {
        const payload = buildCurrentExportPayload();
        downloadText(`错题本-${childName}.md`, generateMarkdown(payload, childName), 'text/markdown;charset=utf-8');
        setState(prev => ({
            ...prev,
            exports: [{ id: Date.now(), format: 'markdown', count: payload.mistakes.length, createdAt: new Date().toISOString() }, ...prev.exports].slice(0, 20)
        }));
    };

    const exportTxt = () => {
        const payload = buildCurrentExportPayload();
        downloadText(`错题本-${childName}.txt`, generateText(payload, childName));
        setState(prev => ({
            ...prev,
            exports: [{ id: Date.now(), format: 'txt', count: payload.mistakes.length, createdAt: new Date().toISOString() }, ...prev.exports].slice(0, 20)
        }));
    };

    const exportPdf = () => {
        const payload = buildCurrentExportPayload();
        if (openPrintableReview(payload, childName)) {
            setState(prev => ({
                ...prev,
                exports: [{ id: Date.now(), format: 'print-pdf', count: payload.mistakes.length, createdAt: new Date().toISOString() }, ...prev.exports].slice(0, 20)
            }));
        }
    };

    const setExportCycle = (cycle) => {
        const range = getDateRangeByCycle(cycle);
        setExportOptions(prev => ({ ...prev, cycle }));
        setFilters(prev => ({ ...prev, ...range }));
    };

    const exportJson = () => {
        const payload = { version: 1, childName, exportedAt: new Date().toISOString(), state };
        downloadText(`错题本-${childName}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    };

    const importJson = async (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed.state?.mistakes) {
            alert('备份格式不正确');
            return;
        }
        if (!confirm('导入会覆盖当前孩子的错题本，继续吗？')) return;
        setState(parsed.state);
    };

    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between">
                <button onClick={onBack} className="text-slate-400 font-bold flex items-center gap-1"><Icon name="arrowLeft" size={18}/> 返回</button>
                <div className="font-bold text-slate-700">{childName}的错题本</div>
                <label className="text-orange-500 font-bold text-sm cursor-pointer">
                    拍照录入
                    <input type="file" className="hidden" accept="image/*" onChange={handleAiPhoto} />
                </label>
            </div>

            <div className="bg-white px-4 py-2 flex gap-2 overflow-x-auto border-b border-slate-100">
                {[
                    ['records', '错题'],
                    ['new', editingId ? '编辑' : '录入'],
                    ['review', '复习'],
                    ['weak', '薄弱点'],
                    ['export', '导出']
                ].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold ${tab === key ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{label}</button>
                ))}
            </div>

            {aiStatus && <div className="mx-4 mt-3 bg-indigo-50 text-indigo-600 p-3 rounded-xl text-sm font-bold">{aiStatus}</div>}
            {storyStatus && <div className="mx-4 mt-3 bg-green-50 text-green-600 p-3 rounded-xl text-sm font-bold">{storyStatus}</div>}
            {practiceStatus && <div className="mx-4 mt-3 bg-blue-50 text-blue-600 p-3 rounded-xl text-sm font-bold">{practiceStatus}</div>}

            <div className="flex-1 overflow-y-auto p-4">
                {tab === 'records' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <input value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} className="col-span-2 md:col-span-1 p-3 rounded-xl border text-sm" placeholder="搜索题目/标签" />
                            <select value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })} className="p-3 rounded-xl border text-sm">
                                <option value="all">全部学科</option>
                                {SUBJECTS.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="p-3 rounded-xl border text-sm">
                                <option value="all">全部状态</option>
                                {STATUSES.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="p-3 rounded-xl border text-sm" />
                            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="p-3 rounded-xl border text-sm" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-4">
                            <div className="space-y-2">
                                {mistakes.map(item => (
                                    <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full text-left bg-white rounded-2xl border p-4 ${selected?.id === item.id ? 'border-orange-300 shadow' : 'border-slate-100'}`}>
                                        <div className="flex justify-between gap-2">
                                            <div className="font-bold text-slate-700 line-clamp-1">{item.originalQuestion}</div>
                                            <span className="shrink-0 text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{item.status}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">{item.recordDate} · {item.subject} · {item.category}</div>
                                    </button>
                                ))}
                                {!mistakes.length && <div className="bg-white rounded-2xl p-8 text-center text-slate-400">暂无错题</div>}
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 p-4 h-fit">
                                {selected ? (
                                    <div className="space-y-3 text-sm">
                                        <div className="font-bold text-lg text-slate-700">{selected.originalQuestion}</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <span className="bg-slate-50 p-2 rounded-lg">学科：{selected.subject}</span>
                                            <span className="bg-slate-50 p-2 rounded-lg">分类：{selected.category}</span>
                                            <span className="bg-slate-50 p-2 rounded-lg">日期：{selected.recordDate}</span>
                                            <span className="bg-slate-50 p-2 rounded-lg">复习：{selected.reviewCount || 0} 次</span>
                                        </div>
                                        <p><b>错答：</b>{selected.wrongAnswer || '（空）'}</p>
                                        <p><b>正答：</b>{selected.correctAnswer || '（空）'}</p>
                                        <p><b>解析：</b>{selected.analysis || '（空）'}</p>
                                        <p><b>建议：</b>{selected.reviewTip || '（空）'}</p>
                                        {selected.storyExplanation && (
                                            <div className="bg-green-50 rounded-xl p-3 border border-green-100 space-y-2">
                                                <div className="font-bold text-green-700">{selected.storyExplanation.storyTitle}</div>
                                                <p><b>为什么错：</b>{selected.storyExplanation.whyWrong}</p>
                                                <p><b>故事：</b>{selected.storyExplanation.story}</p>
                                                {selected.storyExplanation.steps?.length > 0 && (
                                                    <ol className="list-decimal pl-5 space-y-1">
                                                        {selected.storyExplanation.steps.map((step, index) => <li key={index}>{step}</li>)}
                                                    </ol>
                                                )}
                                                <MathDiagram diagram={selected.storyExplanation.diagram} />
                                                <p><b>小窍门：</b>{selected.storyExplanation.memoryTip}</p>
                                                <p><b>小练习：</b>{selected.storyExplanation.miniPractice}</p>
                                                <p><b>答案：</b>{selected.storyExplanation.answer || '（空）'}</p>
                                                <p><b>家长提醒：</b>{selected.storyExplanation.parentTip}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {STATUSES.map(status => <button key={status} onClick={() => setStatus(selected, status)} className={`px-3 py-2 rounded-lg text-xs font-bold ${selected.status === status ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{status}</button>)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => generateStoryExplanation(selected)} className="py-2 rounded-xl bg-green-500 text-white font-bold">{selected.storyExplanation ? '重新生成故事' : '故事讲解'}</button>
                                            <button onClick={() => selected.storyExplanation ? playStoryExplanation(selected.storyExplanation) : generateStoryExplanation(selected)} className="py-2 rounded-xl bg-blue-50 text-blue-600 font-bold">播放讲解</button>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-bold text-blue-700">举一反三练习</div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => generateTransferPractice(selected, 1)} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold">再练一道</button>
                                                    <button onClick={() => generateTransferPractice(selected, 3)} className="px-3 py-1.5 rounded-lg bg-white text-blue-600 text-xs font-bold border border-blue-200">再练3道</button>
                                                </div>
                                            </div>
                                            {(selected.transferPractices || []).slice(0, 3).map(practice => (
                                                <div key={practice.id} className="bg-white rounded-xl border border-blue-100 p-3 space-y-2">
                                                    <div className="flex justify-between gap-2">
                                                        <div className="font-bold text-slate-700">{practice.practiceTitle}</div>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${practice.result === 'correct' ? 'bg-green-50 text-green-600' : practice.result === 'wrong' ? 'bg-red-50 text-red-500' : practice.result === 'uncertain' ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-50 text-slate-400'}`}>
                                                            {practice.result === 'correct' ? '已掌握' : practice.result === 'wrong' ? '还需练' : practice.result === 'uncertain' ? '待确认' : '未作答'}
                                                        </span>
                                                    </div>
                                                    <p>{practice.question}</p>
                                                    {practice.hint && <p className="text-slate-400">提示：{practice.hint}</p>}
                                                    {practice.steps?.length > 0 && <details className="text-slate-500"><summary className="cursor-pointer font-bold">查看步骤</summary><ol className="list-decimal pl-5 mt-2">{practice.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></details>}
                                                    <MathDiagram diagram={practice.diagram} />
                                                    <input value={practiceAnswers[practice.id] || ''} onChange={e => setPracticeAnswers(prev => ({ ...prev, [practice.id]: e.target.value }))} className="w-full p-2 rounded-lg border text-sm" placeholder="孩子可以直接输入答案" />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button onClick={() => playAudio(formatPracticeForSpeech(practice), voiceURI)} className="py-2 rounded-lg bg-slate-100 text-slate-500 font-bold">播放题目</button>
                                                        <button onClick={() => checkPracticeText(selected, practice)} className="py-2 rounded-lg bg-blue-500 text-white font-bold">AI 批改文字</button>
                                                        <label className="py-2 rounded-lg bg-indigo-500 text-white font-bold text-center cursor-pointer">
                                                            拍照批改
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => checkPracticePhoto(selected, practice, e)} />
                                                        </label>
                                                        <button onClick={() => alert(`答案：${practice.answer}`)} className="py-2 rounded-lg bg-white border text-slate-500 font-bold">显示答案</button>
                                                        <button onClick={() => markPractice(selected, practice, true)} className="py-2 rounded-lg bg-green-50 text-green-600 font-bold">做对了</button>
                                                        <button onClick={() => markPractice(selected, practice, false)} className="py-2 rounded-lg bg-red-50 text-red-500 font-bold">还没掌握</button>
                                                    </div>
                                                    {practice.feedback && <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-2">{practice.feedback}</div>}
                                                </div>
                                            ))}
                                            {!selected.transferPractices?.length && <div className="text-sm text-blue-400">讲明白后，点“再练一道”生成同类题。</div>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <button onClick={() => editRecord(selected)} className="py-2 rounded-xl bg-orange-50 text-orange-500 font-bold">编辑</button>
                                            <button onClick={() => removeRecord(selected)} className="py-2 rounded-xl bg-red-50 text-red-500 font-bold">删除</button>
                                        </div>
                                    </div>
                                ) : <div className="text-slate-400 text-sm">选择一条错题查看详情</div>}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'new' && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 max-w-2xl mx-auto">
                        {duplicates.length > 0 && <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl text-sm">发现相似错题：{duplicates.map(item => item.record.originalQuestion).join('、')}</div>}
                        <div className="grid grid-cols-2 gap-3">
                            <input type="date" value={draft.recordDate} onChange={e => setField('recordDate', e.target.value)} className="p-3 rounded-xl border" />
                            <select value={draft.status} onChange={e => setField('status', e.target.value)} className="p-3 rounded-xl border">
                                {STATUSES.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <select value={draft.subject} onChange={e => setField('subject', e.target.value)} className="p-3 rounded-xl border">
                                {SUBJECTS.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <select value={draft.category} onChange={e => setField('category', e.target.value)} className="p-3 rounded-xl border">
                                {(CATEGORY_MAP[draft.subject] || []).map(item => <option key={item} value={item}>{item}</option>)}
                                {!CATEGORY_MAP[draft.subject]?.includes(draft.category) && <option value={draft.category}>{draft.category}</option>}
                            </select>
                        </div>
                        <textarea value={draft.originalQuestion} onChange={e => setField('originalQuestion', e.target.value)} className="w-full p-3 rounded-xl border h-24" placeholder="原题内容" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <textarea value={draft.wrongAnswer} onChange={e => setField('wrongAnswer', e.target.value)} className="p-3 rounded-xl border h-20" placeholder="错答/错误表现" />
                            <textarea value={draft.correctAnswer} onChange={e => setField('correctAnswer', e.target.value)} className="p-3 rounded-xl border h-20" placeholder="正确答案" />
                        </div>
                        <textarea value={draft.analysis} onChange={e => setField('analysis', e.target.value)} className="w-full p-3 rounded-xl border h-20" placeholder="错因解析" />
                        <textarea value={draft.reviewTip} onChange={e => setField('reviewTip', e.target.value)} className="w-full p-3 rounded-xl border h-20" placeholder="复习建议" />
                        <input value={draft.tags} onChange={e => setField('tags', e.target.value)} className="w-full p-3 rounded-xl border" placeholder="标签，用空格或顿号分隔" />
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={resetForm} className="py-3 rounded-xl bg-slate-100 text-slate-500 font-bold">清空</button>
                            <button onClick={saveRecord} className="py-3 rounded-xl bg-orange-500 text-white font-bold">{editingId ? '保存修改' : '保存错题'}</button>
                        </div>
                    </div>
                )}

                {tab === 'review' && (
                    <div className="space-y-4 max-w-2xl mx-auto">
                        {!activeSession && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button onClick={() => startReview('today')} className="bg-green-500 text-white p-4 rounded-2xl font-bold">开始今日复习</button>
                                <button onClick={() => startReview('need')} className="bg-orange-500 text-white p-4 rounded-2xl font-bold">复习未掌握</button>
                                <button onClick={() => startReview('all')} className="bg-white text-slate-600 p-4 rounded-2xl font-bold border">复习全部</button>
                            </div>
                        )}
                        {activeSession && (
                            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                                <div className="text-sm text-slate-400">进度：{progress.reviewedCount}/{progress.totalCount}</div>
                                {currentReviewMistake ? (
                                    <>
                                        <div className="text-xl font-bold text-slate-700">{currentReviewMistake.originalQuestion}</div>
                                        <textarea value={answer} onChange={e => setAnswer(e.target.value)} className="w-full p-3 rounded-xl border h-24" placeholder="输入孩子复习答案" />
                                        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-500">参考答案：{currentReviewMistake.correctAnswer || currentReviewMistake.originalQuestion}</div>
                                        <button onClick={submitAnswer} className="w-full py-3 rounded-xl bg-green-500 text-white font-bold">提交本题</button>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-center text-green-600 font-bold text-xl">本轮复习完成</div>
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="bg-green-50 rounded-xl p-3"><div className="text-2xl font-bold text-green-600">{reviewSummary.correctCount}</div><div className="text-xs text-slate-400">答对</div></div>
                                            <div className="bg-red-50 rounded-xl p-3"><div className="text-2xl font-bold text-red-500">{reviewSummary.wrongCount}</div><div className="text-xs text-slate-400">还需练</div></div>
                                            <div className="bg-blue-50 rounded-xl p-3"><div className="text-2xl font-bold text-blue-600">{reviewSummary.masteredCount}</div><div className="text-xs text-slate-400">已掌握</div></div>
                                            <div className="bg-orange-50 rounded-xl p-3"><div className="text-2xl font-bold text-orange-500">{reviewSummary.needReviewCount}</div><div className="text-xs text-slate-400">待复习</div></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => { setActiveSessionId(''); startReview('today'); }} className="py-3 rounded-xl bg-green-500 text-white font-bold">再来一轮</button>
                                            <button onClick={() => { setActiveSessionId(''); setTab('records'); }} className="py-3 rounded-xl bg-slate-100 text-slate-500 font-bold">回到错题</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'weak' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100">
                            <div className="font-bold text-slate-700">样本：{weak.sampleCount} 条</div>
                            {!weak.sufficient && <div className="text-sm text-yellow-600 mt-2">样本偏少，继续积累后结论更准。</div>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl p-4 border border-slate-100">
                                <div className="font-bold mb-3">高频错误</div>
                                {weak.highFrequency.map(item => <div key={`${item.subject}-${item.category}`} className="flex justify-between py-2 border-b text-sm"><span>{item.subject} · {item.category}</span><b>{item.count}</b></div>)}
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100">
                                <div className="font-bold mb-3">优先复习</div>
                                {weak.needReview.map(item => <div key={item.id} className="py-2 border-b text-sm text-slate-600">{item.originalQuestion}</div>)}
                                {!weak.needReview.length && <div className="text-slate-400 text-sm">暂无需再次复习</div>}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'export' && (
                    <div className="space-y-4 max-w-xl mx-auto">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                            <div className="font-bold text-slate-700">导出选项</div>
                            <div className="grid grid-cols-2 gap-2">
                                <select value={exportOptions.cycle} onChange={e => setExportCycle(e.target.value)} className="p-3 rounded-xl border text-sm">
                                    <option value="custom">自定义日期</option>
                                    <option value="day">今日</option>
                                    <option value="week">最近7天</option>
                                    <option value="month">本月</option>
                                </select>
                                <select value={exportOptions.template} onChange={e => setExportOptions(prev => ({ ...prev, template: e.target.value }))} className="p-3 rounded-xl border text-sm">
                                    <option value="detailed">详细讲解版</option>
                                    <option value="compact">简洁打印版</option>
                                </select>
                                <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="p-3 rounded-xl border text-sm" />
                                <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="p-3 rounded-xl border text-sm" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <label className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                                    <input type="checkbox" checked={exportOptions.excludeMastered} onChange={e => setExportOptions(prev => ({ ...prev, excludeMastered: e.target.checked }))} />
                                    排除已掌握
                                </label>
                                <label className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                                    <input type="checkbox" checked={exportOptions.prioritizeNeedReview} onChange={e => setExportOptions(prev => ({ ...prev, prioritizeNeedReview: e.target.checked }))} />
                                    需再次复习优先
                                </label>
                                <label className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                                    <input type="checkbox" checked={exportOptions.includeStories} onChange={e => setExportOptions(prev => ({ ...prev, includeStories: e.target.checked }))} />
                                    包含故事讲解
                                </label>
                                <label className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                                    <input type="checkbox" checked={exportOptions.includePractices} onChange={e => setExportOptions(prev => ({ ...prev, includePractices: e.target.checked }))} />
                                    包含举一反三
                                </label>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-3">
                            <button onClick={exportMarkdown} className="py-3 rounded-xl bg-orange-500 text-white font-bold">导出 Markdown</button>
                            <button onClick={exportTxt} className="py-3 rounded-xl bg-slate-700 text-white font-bold">导出 TXT</button>
                            <button onClick={exportPdf} className="py-3 rounded-xl bg-purple-500 text-white font-bold">打印/PDF</button>
                            <button onClick={exportJson} className="py-3 rounded-xl bg-green-500 text-white font-bold">备份 JSON</button>
                            <label className="col-span-2 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold text-center cursor-pointer">
                                导入恢复
                                <input type="file" className="hidden" accept=".json,application/json" onChange={importJson} />
                            </label>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-slate-100">
                            <div className="font-bold mb-3">导出记录</div>
                            {state.exports.map(item => <div key={item.id} className="flex justify-between py-2 border-b text-sm"><span>{item.format}</span><span>{item.count} 条</span></div>)}
                            {!state.exports.length && <div className="text-slate-400 text-sm">暂无导出记录</div>}
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-slate-100">
                            <div className="font-bold mb-3">审计日志</div>
                            {state.auditLogs.slice(0, 10).map(item => <div key={item.id} className="py-2 border-b text-sm text-slate-500">{item.action} · {new Date(item.createdAt).toLocaleString()}</div>)}
                            {!state.auditLogs.length && <div className="text-slate-400 text-sm">暂无日志</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
