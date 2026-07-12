function capabilityKey({ provider, baseUrl, model }) {
    return `llm_vision_support_${encodeURIComponent([provider || '', baseUrl || '', model || ''].join('|'))}`;
}

export function getVisionSupport(config) {
    return localStorage.getItem(capabilityKey(config)) || 'unknown';
}

export function setVisionSupport(config, support) {
    localStorage.setItem(capabilityKey(config), support);
}

export function getActiveVisionSupport() {
    return getVisionSupport({
        provider: localStorage.getItem('llm_provider') || 'gemini',
        baseUrl: localStorage.getItem('llm_base_url') || '',
        model: localStorage.getItem('llm_model') || ''
    });
}
