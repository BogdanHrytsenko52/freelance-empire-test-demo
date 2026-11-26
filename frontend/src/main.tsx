import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './features/auth/AuthContext'
import { ToastProvider } from './components/Toast'
import { USE_MOCKS } from './api/client'
import { startMockTicker } from './mock/ticker'
import './index.css'

if (USE_MOCKS) {
  startMockTicker()
  console.info('[Freelance Empire] Працює на мокових даних (VITE_USE_MOCKS=true)')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
