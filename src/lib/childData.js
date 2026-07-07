export function collectChildData(profile) {
    const profileId = profile.id;

    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        profile,
        data: {
            stars: localStorage.getItem(`app_stars_${profileId}`) || '0',
            hanziCards: JSON.parse(localStorage.getItem(`hanzi_cards_${profileId}`) || localStorage.getItem('hanzi_cards') || '[]'),
            dictationWords: JSON.parse(localStorage.getItem(`dictation_words_${profileId}`) || localStorage.getItem('dictation_words') || '[]'),
            dictationHistory: JSON.parse(localStorage.getItem(`dictation_history_${profileId}`) || '[]'),
            dictationWrong: JSON.parse(localStorage.getItem(`dictation_wrong_${profileId}`) || '[]'),
            reviewNotebook: JSON.parse(localStorage.getItem(`review_notebook_${profileId}`) || 'null')
        }
    };
}

export function restoreChildData(profileId, backup) {
    const data = backup.data || {};

    if (data.stars !== undefined) localStorage.setItem(`app_stars_${profileId}`, String(data.stars));
    if (Array.isArray(data.hanziCards)) localStorage.setItem(`hanzi_cards_${profileId}`, JSON.stringify(data.hanziCards));
    if (Array.isArray(data.dictationWords)) localStorage.setItem(`dictation_words_${profileId}`, JSON.stringify(data.dictationWords));
    if (Array.isArray(data.dictationHistory)) localStorage.setItem(`dictation_history_${profileId}`, JSON.stringify(data.dictationHistory));
    if (Array.isArray(data.dictationWrong)) localStorage.setItem(`dictation_wrong_${profileId}`, JSON.stringify(data.dictationWrong));
    if (data.reviewNotebook && typeof data.reviewNotebook === 'object') localStorage.setItem(`review_notebook_${profileId}`, JSON.stringify(data.reviewNotebook));
}

export function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
