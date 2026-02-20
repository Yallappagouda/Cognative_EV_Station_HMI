import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CognitiveProvider } from './hooks/useCognitiveEngine'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CognitiveProvider>
      <App />
    </CognitiveProvider>
  </StrictMode>,
)
