import { useEffect, useState } from 'react';

export function useLocalStorageState(key, initialValue) {
    const [value, setValue] = useState(() => localStorage.getItem(key) ?? initialValue);

    useEffect(() => {
        localStorage.setItem(key, value);
    }, [key, value]);

    return [value, setValue];
}
