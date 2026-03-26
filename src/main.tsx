import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'
import * as process from 'process'
import App from './App.tsx'

// Polyfills for react-pdf/renderer
(window as any).Buffer = Buffer;
(window as any).process = process;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
