export function playAudio(text, targetVoiceURI = 'auto', retryCount = 0) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
      if (retryCount === 0) {
        window.speechSynthesis.onvoiceschanged = () => {};
      } else if (retryCount < 5) {
        setTimeout(() => playAudio(text, targetVoiceURI, retryCount + 1), 100);
        return;
      }
    }

    let selectedVoice = null;
    if (targetVoiceURI && targetVoiceURI !== 'auto') {
      selectedVoice = voices.find(v => v.voiceURI === targetVoiceURI);
    }

    if (!selectedVoice) {
      const zhVoices = voices.filter(v => v.lang.includes('zh'));
      selectedVoice = zhVoices.find(v => v.name.includes('Siri') || v.name.includes('Enhanced'));
      if (!selectedVoice) selectedVoice = zhVoices.find(v => v.name.includes('Ting-Ting') || v.name.includes('Google'));
      if (!selectedVoice) selectedVoice = zhVoices[0];
    }

    if (selectedVoice) {
      utter.voice = selectedVoice;
      console.log("🔊 使用语音:", selectedVoice.name);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      utter.rate = isIOS ? 0.85 : 0.9;
      utter.pitch = 1.05;
    }

    window.speechSynthesis.speak(utter);
  } else if (window.responsiveVoice) {
    window.responsiveVoice.speak(text, "Chinese Female", { rate: 0.85 });
  }
}
