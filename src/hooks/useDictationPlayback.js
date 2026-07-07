import { useCallback, useEffect, useRef } from 'react';
import { playAudio } from '../lib/audio.js';

export function useDictationPlayback({ words, idx, idxRef, recognitionRef, voiceURI, setStatus, setShowHint, setHintCount }) {
    const autoPlayRef = useRef(false);
    const timerRef = useRef(null);
    const hintTimerRef = useRef(null);

    const stopEverything = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (hintTimerRef.current) {
            clearTimeout(hintTimerRef.current);
            hintTimerRef.current = null;
        }
        if (window.responsiveVoice) window.responsiveVoice.cancel();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }, []);

    const speakLoop = useCallback((text, count) => {
        if (count > 3) {
            setStatus('listening');
            setTimeout(() => {
                try {
                    if (recognitionRef.current) recognitionRef.current.start();
                } catch(e) {}
            }, 1000);
            return;
        }

        playAudio(text, voiceURI);
        timerRef.current = setTimeout(() => speakLoop(text, count + 1), 2500);
    }, [recognitionRef, setStatus, voiceURI]);

    const startPlay = useCallback((wordToPlay) => {
        stopEverything();
        setStatus('playing');
        setShowHint(false);

        let delay = 100;
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch(e) {}
            delay = 1200;
        }

        setTimeout(() => speakLoop(wordToPlay || words[idxRef.current], 1), delay);
    }, [idxRef, recognitionRef, setShowHint, setStatus, speakLoop, stopEverything, words]);

    const requestAutoPlay = useCallback(() => {
        autoPlayRef.current = true;
    }, []);

    const toggleHint = useCallback((showHint, hintCount) => {
        if (showHint) {
            setShowHint(false);
            if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
            return;
        }

        setShowHint(true);
        const duration = hintCount === 0 ? 3000 : 1000;
        hintTimerRef.current = setTimeout(() => setShowHint(false), duration);
        setHintCount(count => count + 1);
    }, [setHintCount, setShowHint]);

    useEffect(() => {
        setHintCount(0);
        if (autoPlayRef.current) {
            autoPlayRef.current = false;
            timerRef.current = setTimeout(() => startPlay(words[idx]), 500);
        }
    }, [idx, setHintCount, startPlay, words]);

    return {
        stopEverything,
        startPlay,
        requestAutoPlay,
        toggleHint
    };
}
