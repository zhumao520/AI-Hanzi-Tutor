function currentPlatform() {
    if (typeof navigator === 'undefined') return 'other';

    const userAgent = navigator.userAgent || '';
    const platform = navigator.userAgentData?.platform || navigator.platform || '';
    const isIPad = /iPad/.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIPad || /iPhone|iPod/.test(userAgent)) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    if (/Win/i.test(platform) || /Windows/i.test(userAgent)) return 'windows';
    if (/Mac/i.test(platform) || /Macintosh/i.test(userAgent)) return 'macos';
    return 'other';
}

export function getVoiceDownloadGuide() {
    const platform = currentPlatform();

    if (platform === 'ios') {
        return {
            platform,
            deviceName: 'iPhone 或 iPad',
            steps: ['打开“设置”', '进入“辅助功能”→“朗读内容”→“声音”', '选择“中文”或“英语”，下载喜欢的声音']
        };
    }

    if (platform === 'android') {
        return {
            platform,
            deviceName: 'Android 设备',
            steps: ['打开“设置”', '搜索“文字转语音”或进入“辅助功能”→“文字转语音输出”', '选择语音引擎后，下载中文或英文语音数据']
        };
    }

    if (platform === 'windows') {
        return {
            platform,
            deviceName: 'Windows 电脑',
            steps: ['打开“设置”', '进入“时间和语言”→“语音”', '在“管理语音”中添加中文或英文语音包']
        };
    }

    if (platform === 'macos') {
        return {
            platform,
            deviceName: 'Mac',
            steps: ['打开“系统设置”', '进入“辅助功能”→“朗读内容”', '在“系统语音”中管理并下载中文或英文声音']
        };
    }

    return {
        platform,
        deviceName: '当前设备',
        steps: ['打开设备系统设置', '搜索“文字转语音”“朗读内容”或“语音”', '下载中文或英文语音包后，返回本页刷新选择']
    };
}

export function supportsSpeechSynthesis() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
