import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LMSApp from './LMSApp.jsx'

// Switch between apps based on environment variable or URL param
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || import.meta.env.VITE_APP_MODE || 'lms';

const AppComponent = mode === 'study-room' ? App : LMSApp;

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AppComponent />
    </StrictMode>,
)

