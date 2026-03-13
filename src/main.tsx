import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const CLIENT_RESET_FLAG = 'orderuz-client-reset-20260313';

if (typeof window !== 'undefined' && !localStorage.getItem(CLIENT_RESET_FLAG)) {
	// Clear legacy local auth/session cache once to start from a clean state.
	localStorage.removeItem('uzbite-user-storage-v4');
	indexedDB.deleteDatabase('orderuz-videos');
	localStorage.setItem(CLIENT_RESET_FLAG, 'done');
}

createRoot(document.getElementById("root")!).render(<App />);
