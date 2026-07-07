import { useEffect, useState } from 'react';

export function useSpeechVoices(languagePrefix = 'zh') {
    const [voiceList, setVoiceList] = useState([]);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis
                .getVoices()
                .filter(voice => voice.lang.includes(languagePrefix));
            setVoiceList(voices);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            if (window.speechSynthesis.onvoiceschanged === loadVoices) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, [languagePrefix]);

    return voiceList;
}
