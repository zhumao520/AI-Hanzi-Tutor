import { useEffect, useRef } from 'react';

export function useWakeLock() {
    const wakeLockRef = useRef(null);

    useEffect(() => {
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    console.log('✨ 屏幕常亮已激活');
                }
            } catch (err) {
                console.log('常亮失败:', err);
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') requestWakeLock();
        };

        requestWakeLock();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (wakeLockRef.current) wakeLockRef.current.release();
        };
    }, []);
}
