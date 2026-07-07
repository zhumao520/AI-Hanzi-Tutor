import { useEffect, useState } from 'react';
import { callLLM as requestLLM } from './lib/llm.js';
import Icon from './components/Icon.jsx';
import HomeView from './components/HomeView.jsx';
import SettingsView from './components/SettingsView.jsx';
import LearnMode from './components/LearnMode.jsx';
import DictationMode from './components/DictationMode.jsx';
import { useLocalStorageState } from './hooks/useLocalStorageState.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import { collectChildData, downloadJson, restoreChildData } from './lib/childData.js';

export default function App() {
    const [mode, setMode] = useState('home');
    const [profiles, setProfiles] = useState(() => {
        const saved = localStorage.getItem('child_profiles');
        if (saved) return JSON.parse(saved);
        return [{ id: 'default', name: '默认孩子' }];
    });
    const [activeProfileId, setActiveProfileId] = useLocalStorageState('active_child_profile', 'default');
    const [stars, setStars] = useState('0');
    const [provider, setProvider] = useLocalStorageState('llm_provider', 'gemini');
    const [baseUrl, setBaseUrl] = useLocalStorageState('llm_base_url', 'https://api.openai.com/v1/chat/completions');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('llm_api_key') || localStorage.getItem('gemini_key') || '');
    const [model, setModel] = useState(() => localStorage.getItem('llm_model') || localStorage.getItem('gemini_model') || 'gemini-3-flash-preview');
    const [voiceURI, setVoiceURI] = useLocalStorageState('app_voice_uri', 'auto');

    useWakeLock();

    const activeProfile = profiles.find(profile => profile.id === activeProfileId) || profiles[0];
    const profileId = activeProfile?.id || 'default';

    useEffect(() => {
        localStorage.setItem('child_profiles', JSON.stringify(profiles));
    }, [profiles]);

    useEffect(() => {
        if (!profiles.some(profile => profile.id === activeProfileId)) {
            setActiveProfileId(profiles[0]?.id || 'default');
        }
    }, [activeProfileId, profiles, setActiveProfileId]);

    useEffect(() => {
        setStars(localStorage.getItem(`app_stars_${profileId}`) || localStorage.getItem('app_stars') || '0');
    }, [profileId]);

    useEffect(() => {
        localStorage.setItem(`app_stars_${profileId}`, stars);
    }, [profileId, stars]);

    useEffect(() => localStorage.setItem('llm_api_key', apiKey), [apiKey]);
    useEffect(() => localStorage.setItem('llm_model', model), [model]);

    const addStar = () => setStars(s => String(parseInt(s || '0') + 1));
    const callLLM = (payload) => requestLLM({ provider, baseUrl, apiKey, model, payload });
    const addProfile = (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        const profile = { id: `child_${Date.now()}`, name: trimmedName };
        setProfiles(prev => [...prev, profile]);
        setActiveProfileId(profile.id);
    };
    const renameProfile = (profileIdToRename, name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;
        setProfiles(prev => prev.map(profile => profile.id === profileIdToRename ? { ...profile, name: trimmedName } : profile));
    };
    const deleteProfile = (profileIdToDelete) => {
        if (profiles.length <= 1) {
            alert('至少保留一个孩子档案');
            return;
        }
        if (!confirm('删除这个孩子档案？对应的星星、词库、错题和听写历史也会保留在本机，但不会再显示。')) return;
        const nextProfiles = profiles.filter(profile => profile.id !== profileIdToDelete);
        setProfiles(nextProfiles);
        if (activeProfileId === profileIdToDelete) setActiveProfileId(nextProfiles[0].id);
    };
    const exportActiveChildData = () => {
        const backup = collectChildData(activeProfile);
        downloadJson(`ai-hanzi-${activeProfile.name}-${profileId}.json`, backup);
    };
    const importActiveChildData = async (file) => {
        if (!file) return;
        const text = await file.text();
        const backup = JSON.parse(text);
        if (!backup.data) {
            alert('备份文件格式不正确');
            return;
        }
        restoreChildData(profileId, backup);
        setStars(localStorage.getItem(`app_stars_${profileId}`) || '0');
        alert(`已恢复 ${activeProfile.name} 的数据`);
    };

    return (
        <div className="min-h-screen flex flex-col w-full md:max-w-5xl mx-auto bg-orange-50 shadow-2xl relative overflow-hidden transition-all duration-300">
            <header className="bg-white/90 backdrop-blur p-4 md:px-8 shadow-sm flex justify-between items-center z-50 sticky top-0">
                <div className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform" onClick={() => setMode('home')}>
                    <div className="bg-orange-500 p-2 rounded-xl text-white shadow-orange-200 shadow-md"><Icon name="home" size={24} /></div>
                    <span className="font-bold text-slate-700 text-lg md:text-xl tracking-tight">AI全能识字</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm border border-yellow-200">
                        <Icon name="star" size={16} className="fill-yellow-500 text-yellow-500"/> <span className="pt-0.5">{parseInt(stars || '0')}</span>
                    </div>
                    <button onClick={() => setMode('settings')} className="text-slate-400 hover:text-orange-500 p-2 hover:bg-orange-50 rounded-full transition-all"><Icon name="settings" size={24} /></button>
                </div>
            </header>
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {mode === 'home' && <HomeView setMode={setMode} profiles={profiles} activeProfileId={profileId} setActiveProfileId={setActiveProfileId} />}
                {mode === 'settings' && <SettingsView provider={provider} setProvider={setProvider} baseUrl={baseUrl} setBaseUrl={setBaseUrl} apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} voiceURI={voiceURI} setVoiceURI={setVoiceURI} profiles={profiles} activeProfileId={profileId} setActiveProfileId={setActiveProfileId} addProfile={addProfile} renameProfile={renameProfile} deleteProfile={deleteProfile} exportActiveChildData={exportActiveChildData} importActiveChildData={importActiveChildData} onBack={() => setMode('home')} />}
                {mode === 'learn' && <LearnMode callLLM={callLLM} addStar={addStar} voiceURI={voiceURI} profileId={profileId} onBack={() => setMode('home')} />}
                {mode === 'dictation' && <DictationMode callLLM={callLLM} addStar={addStar} voiceURI={voiceURI} profileId={profileId} onBack={() => setMode('home')} />}
            </div>
        </div>
    );
}
