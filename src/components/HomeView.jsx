export default function HomeView({ setMode, profiles, activeProfileId, setActiveProfileId }) {
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

            <div className="text-center mt-6 md:mt-12 mb-10 md:mb-16">
                <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3 md:mb-4 tracking-tight">学习时间到！</h1>
                <p className="text-slate-400 text-sm md:text-lg">今天也要做个棒棒的小朋友 🎈</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl mx-auto">
                <button onClick={() => setMode('learn')} className="w-full relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl shadow-lg border-b-4 border-orange-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:border-b-0 active:shadow-md transition-all group flex md:flex-col md:items-start md:text-left items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">🎴</div>
                    <div className="text-left flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 mb-1">识字卡片</h3>
                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">认字 • 笔顺 • AI 严谨解说<br/>包含 💡 趣味成语讲解</p>
                    </div>
                </button>
                <button onClick={() => setMode('dictation')} className="w-full relative overflow-hidden bg-white p-6 md:p-8 rounded-3xl shadow-lg border-b-4 border-blue-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:border-b-0 active:shadow-md transition-all group flex md:flex-col md:items-start md:text-left items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">📝</div>
                    <div className="text-left flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-700 mb-1">听写练习</h3>
                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">语音报词 • 拍照智能批改<br/>支持 📸 拍照一键导入词库</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
