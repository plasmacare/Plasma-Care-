import React from 'react'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './lib/i18n.jsx'

export default function AppRoot() {
  return (
    <React.StrictMode>
      <LanguageProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </LanguageProvider>
    </React.StrictMode>
  )
}
