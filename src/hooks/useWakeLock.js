import { useEffect, useRef } from 'react';

export function useWakeLock(enabled) {
    const wakeLockRef = useRef(null);

    useEffect(() => {
        const requestWakeLock = async () => {
            if (!enabled || document.visibilityState !== 'visible' || wakeLockRef.current) return;
            try {
                if ('wakeLock' in navigator) {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                }
            } catch (err) {
                console.warn('屏幕常亮不可用:', err);
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') requestWakeLock();
        };

        if (enabled) requestWakeLock();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        };
    }, [enabled]);
}
