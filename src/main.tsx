import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Register service worker for offline support and installation
registerSW({
  immediate: true,
  onNeedRefresh() {
    // Automatically reloads on update
  },
  onOfflineReady() {
    // App is ready for offline usage
  },
});

createRoot(document.getElementById('root')!).render(<App />);
