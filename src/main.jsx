import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('Service worker 注册失败:', err));
    });
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
