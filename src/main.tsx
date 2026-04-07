import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'
import * as process from 'process'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import App from './App.tsx'

// Global Date Configuration for IST
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Kolkata');

// Capture PWA install prompt globally as early as possible
(window as any).__deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__deferredPrompt = e;
  console.log('PWA: Global beforeinstallprompt captured');
  // Dispatch a custom event so hooks can react if they're already mounted
  window.dispatchEvent(new CustomEvent('pwa-prompt-captured'));
});

import { Font } from '@react-pdf/renderer';

// Polyfills for react-pdf/renderer
(window as any).Buffer = Buffer;
(window as any).process = process;

// Register Telugu Font for PDF generation natively using local TrueType fonts
Font.register({
  family: 'NotoSansTelugu',
  fonts: [
    { src: '/fonts/NotoSansTelugu-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/NotoSansTelugu-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/NotoSansTelugu-Regular.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: '/fonts/NotoSansTelugu-Bold.ttf', fontWeight: 700, fontStyle: 'italic' }
  ]
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
