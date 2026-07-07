import { useEffect, useState } from 'react';
import { playAudio } from '../lib/audio.js';
import { useSpeechVoices } from '../hooks/useSpeechVoices.js';

export default function SettingsView({ provider, setProvider, baseUrl, setBaseUrl, apiKey, setApiKey, model, setModel, voiceURI, setVoiceURI, profiles, activeProfileId, setActiveProfileId, addProfile, renameProfile, deleteProfile, exportActiveChildData, importActiveChildData, onBack }) {
    const [p, setP] = useState(provider);
    const [url, setUrl] = useState(baseUrl);
    const [k, setK] = useState(apiKey);
    const [m, setM] = useState(model);
    const [vURI, setVURI] = useState(voiceURI);
    const [isCustom, setIsCustom] = useState(false);
    const [customModel, setCustomModel] = useState('');
    const voiceList = useSpeechVoices('zh');

    useEffect(() => {
        const defaults = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.0-flash-exp', 'gpt-4o-mini', 'gpt-4o', 'deepseek-chat'];
        if (defaults.includes(model)) { setIsCustom(false); }
        else { setIsCustom(true); setCustomModel(model); setM('custom'); }
    }, []);

    const handleProviderChange = (nextProvider) => {
        setP(nextProvider);
        if (nextProvider === 'gemini' && m !== 'custom' && !m.startsWith('gemini-')) {
            setM('gemini-3-flash-preview');
            setIsCustom(false);
        }
        if (nextProvider === 'openai' && m !== 'custom' && m.startsWith('gemini-')) {
            setM('gpt-4o-mini');
            setIsCustom(false);
        }
    };

    const save = () => {
        const finalModel = isCustom ? customModel.trim() : m;
        if (!finalModel) { alert("模型名称不能为空"); return; }
        const finalUrl = url.trim() || 'https://api.openai.com/v1/chat/completions';
        setProvider(p); setBaseUrl(finalUrl); setApiKey(k); setModel(finalModel); setVoiceURI(vURI);
        localStorage.setItem('llm_provider', p);
        localStorage.setItem('llm_base_url', finalUrl);
        localStorage.setItem('llm_api_key', k);
        localStorage.setItem('llm_model', finalModel);
        alert("保存成功 ✅"); onBack();
    };

    return (
        <div className="p-6 h-full bg-white animate-in slide-in-from-right overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-slate-700">系统设置</h2>
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-bold text-slate-600 mb-2 block">孩子档案</label>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3">
                        <select value={activeProfileId} onChange={e => setActiveProfileId(e.target.value)} className="w-full p-3 bg-white border rounded-xl focus:border-orange-500 outline-none text-slate-700 font-medium shadow-sm">
                            {profiles.map(profile => (
                                <option key={profile.id} value={profile.id}>{profile.name}</option>
                            ))}
                        </select>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => {
                                const name = prompt('新孩子名字：');
                                if (name) addProfile(name);
                            }} className="py-2 bg-orange-500 text-white rounded-xl text-sm font-bold">新增</button>
                            <button onClick={() => {
                                const current = profiles.find(profile => profile.id === activeProfileId);
                                const name = prompt('修改名字：', current?.name || '');
                                if (name) renameProfile(activeProfileId, name);
                            }} className="py-2 bg-white border border-orange-100 text-orange-500 rounded-xl text-sm font-bold">改名</button>
                            <button onClick={() => deleteProfile(activeProfileId)} className="py-2 bg-white border border-red-100 text-red-500 rounded-xl text-sm font-bold">删除</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={exportActiveChildData} className="py-2 bg-white border border-green-100 text-green-600 rounded-xl text-sm font-bold">导出这个孩子</button>
                            <label className="py-2 bg-white border border-blue-100 text-blue-600 rounded-xl text-sm font-bold text-center cursor-pointer">
                                导入恢复
                                <input type="file" className="hidden" accept=".json,application/json" onChange={async e => { await importActiveChildData(e.target.files[0]); e.target.value = ''; }} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-slate-600">LLM 接口类型</label>
                        <select value={p} onChange={e => handleProviderChange(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl mt-1 focus:border-orange-500 outline-none">
                            <option value="gemini">Gemini</option>
                            <option value="openai">OpenAI 兼容接口</option>
                        </select>
                    </div>
                    {p === 'openai' && <div><label className="text-sm font-bold text-slate-600">API 地址</label><input type="url" value={url} onChange={e=>setUrl(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl mt-1 text-sm font-mono focus:border-orange-500 outline-none" placeholder="https://api.openai.com/v1/chat/completions"/></div>}
                    <div><label className="text-sm font-bold text-slate-600">API Key</label><input type="password" value={k} onChange={e=>setK(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl mt-1 text-sm font-mono focus:border-orange-500 outline-none" placeholder={p === 'gemini' ? 'AIzaSy...' : 'sk-...'}/></div>
                    <div><label className="text-sm font-bold text-slate-600">AI 模型 <span className="text-[10px] bg-red-500 text-white px-1 rounded ml-1">NEW</span></label>
                        <select value={m} onChange={e => { setM(e.target.value); setIsCustom(e.target.value === 'custom'); }} className="w-full p-3 bg-slate-50 border rounded-xl mt-1 focus:border-orange-500 outline-none">
                            {p === 'gemini' ? <>
                                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (极速)</option>
                                <option value="gemini-3-pro-preview">Gemini 3 Pro Preview (超强)</option>
                                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                            </> : <>
                                <option value="gpt-4o-mini">gpt-4o-mini</option>
                                <option value="gpt-4o">gpt-4o</option>
                                <option value="deepseek-chat">deepseek-chat</option>
                            </>}
                            <option value="custom">自定义 (输入模型ID)</option>
                        </select>
                        {isCustom && <input type="text" value={customModel} onChange={e => setCustomModel(e.target.value)} className="w-full p-3 mt-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-mono placeholder-indigo-300" placeholder={p === 'gemini' ? '例如: gemini-2.0-flash-lite' : '例如: qwen-vl-plus / deepseek-chat'}/>}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-bold text-slate-600 mb-2 block">听写/朗读语音</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <select value={vURI} onChange={e => { setVURI(e.target.value); playAudio("语音已切换", e.target.value); }} className="w-full p-3 bg-white border rounded-xl focus:border-orange-500 outline-none mb-3 text-slate-700 font-medium shadow-sm">
                            <option value="auto">✨ 智能推荐 (Auto)</option>
                            {voiceList.map((v, i) => (
                                <option key={i} value={v.voiceURI}>{v.name} {v.localService?'[本地]':''}</option>
                            ))}
                        </select>
                        <div className="text-xs text-slate-400 leading-relaxed">
                            {vURI === 'auto'
                                ? "当前模式：自动优先使用 Siri、Ting-Ting 或 Google 高质量语音。"
                                : "当前模式：已锁定为你选择的特定语音。"}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-8 pb-8"><button onClick={onBack} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500">取消</button><button onClick={save} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200">保存</button></div>
        </div>
    );
}
