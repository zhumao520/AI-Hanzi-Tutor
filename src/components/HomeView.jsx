import { useEffect, useMemo, useState } from 'react';
import { getTodayReviewMistakeIds, loadNotebook } from '../lib/reviewNotebook.js';
import { getChildValue } from '../lib/childWorkspace.js';
import { getActiveAssignment } from '../lib/assignments.js';

export default function HomeView({ setMode, profiles, activeProfileId, setActiveProfileId }) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        setTick(value => value + 1);
    }, [activeProfileId]);

    const dashboard = useMemo(() => {
        const notebook = loadNotebook(activeProfileId);
        const pendingReview = getTodayReviewMistakeIds(notebook).length;
        const chineseWrong = getChildValue(activeProfileId, 'dictationWrong', []);
        const englishWrong = getChildValue(activeProfileId, 'englishWrongItems', []);
        const stars = getChildValue(activeProfileId, 'stars', '0');
        const assignment = getActiveAssignment(activeProfileId);
        return {
            pendingReview,
            chineseWrongCount: Array.isArray(chineseWrong) ? chineseWrong.length : 0,
            englishWrongCount: Array.isArray(englishWrong) ? englishWrong.length : 0,
            stars: parseInt(stars || '0', 10) || 0,
            assignment
        };
    }, [activeProfileId, tick]);

    const cards = [
        {
            title: '待复习错题',
            value: dashboard.pendingReview,
            actionLabel: '去复习',
            mode: 'review',
            tone: 'bg-green-50 text-green-600 border-green-100'
        },
        {
            title: '中文错词',
            value: dashboard.chineseWrongCount,
            actionLabel: '听写',
            mode: 'dictation',
            tone: 'bg-blue-50 text-blue-600 border-blue-100'
        },
        {
            title: '英文错词',
            value: dashboard.englishWrongCount,
            actionLabel: '英文听写',
            mode: 'englishDictation',
            tone: 'bg-sky-50 text-sky-600 border-sky-100'
        }
    ];

    return (
        <div className="flex flex-col h-full p-6 md:p-12 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {profiles.map(profile => {
                        const active = profile.id === activeProfileId;
                        return (
                            <button
                                key={profile.id}
                                onClick={() => setActiveProfileId(profile.id)}
                                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${active ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200' : 'bg-white text-slate-500 border-orange-100 hover:text-orange-500'}`}
                            >
                                {profile.name}
                            </button>
                        );
                    })}
                    <button onClick={() => setMode('settings')} className="shrink-0 px-4 py-2 rounded-full text-sm font-bold bg-orange-50 text-orange-500 border border-orange-100">
                        管理
                    </button>
                </div>
            </div>

            <div className="text-center mt-6 md:mt-10 mb-6 md:mb-10">
                <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3 md:mb-4 tracking-tight">学习时间到！</h1>
                <p className="text-slate-400 text-sm md:text-lg">今天也要做个棒棒的小朋友</p>
            </div>

            <div className="w-full max-w-5xl mx-auto mb-5">
                <button onClick={() => setMode('assignments')} className="w-full text-left bg-white border border-orange-100 shadow-sm rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div><div className="text-xs text-orange-500 font-bold mb-1">当前作业</div><div className="font-bold text-slate-700">{dashboard.assignment?.title || '还没有选择作业'}</div><div className="text-xs text-slate-400 mt-1">{dashboard.assignment ? `${dashboard.assignment.items.length} 项内容，进入学习模式后将逐步绑定。` : '先为这个孩子新建一份中文或英文听写作业。'}</div></div>
                    <span className="text-orange-500 font-bold text-sm shrink-0">管理 →</span>
                </button>
            </div>

            <div className="w-full max-w-5xl mx-auto mb-8">
                <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-lg font-bold text-slate-700">今日学习看板</div>
                            <div className="text-xs text-slate-400 mt-1">星星 {dashboard.stars} · 一眼看清今天该做什么</div>
                        </div>
                        <button onClick={() => setTick(value => value + 1)} className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full">刷新</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {cards.map(card => (
                            <button key={card.title} onClick={() => setMode(card.mode)} className={`text-left rounded-2xl border p-4 ${card.tone}`}>
                                <div className="text-xs font-bold opacity-70 mb-2">{card.title}</div>
                                <div className="text-3xl font-bold mb-3">{card.value}</div>
                                <div className="text-sm font-bold">{card.actionLabel} →</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl mx-auto">
                <button onClick={() => setMode('learn')} className="w-full relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl shadow-lg border-b-4 border-orange-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:border-b-0 active:shadow-md transition-all group flex md:flex-col md:items-start md:text-left items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">🎴</div>
                    <div className="text-left flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 mb-1">识字卡片</h3>
                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">认字 • 笔顺 • AI 严谨解说<br/>包含 趣味成语讲解</p>
                    </div>
                </button>
                <button onClick={() => setMode('dictation')} className="w-full relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl shadow-lg border-b-4 border-blue-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:border-b-0 active:shadow-md transition-all group flex md:flex-col md:items-start md:text-left items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">📝</div>
                    <div className="text-left flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 mb-1">听写练习</h3>
                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">语音报词 • 拍照智能批改<br/>支持 拍照一键导入词库</p>
                    </div>
                </button>
                <button onClick={() => setMode('review')} className="w-full relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl shadow-lg border-b-4 border-green-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:border-b-0 active:shadow-md transition-all group flex md:flex-col md:items-start md:text-left items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-400 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">📚</div>
                    <div className="text-left flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 mb-1">错题本</h3>
                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">AI 拍照整理 • 复习记录<br/>薄弱点统计和导出</p>
                    </div>
                </button>
                <button onClick={() => setMode('englishDictation')} className="w-full relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl shadow-lg border-b-4 border-sky-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:border-b-0 active:shadow-md transition-all group flex md:flex-col md:items-start md:text-left items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">🔤</div>
                    <div className="text-left flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 mb-1">英文听写</h3>
                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">单词 • 短句 • AI 拼写批改<br/>错词自动复习</p>
                    </div>
                </button>
                <button onClick={() => setMode('englishConversation')} className="w-full relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl shadow-lg border-b-4 border-purple-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:border-b-0 active:shadow-md transition-all group flex md:flex-col md:items-start md:text-left items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-400 to-fuchsia-400 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">🎙️</div>
                    <div className="text-left flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 mb-1">英文对话</h3>
                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">AI 提问 • 语音回答<br/>中文纠正和鼓励</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
