import './axiosSetup'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { StatusBar } from '@capacitor/status-bar';

// એન્ડ્રોઇડ એપ ખુલે એટલે તરત જ સ્ટેટસ બાર (રેડ લાઇન) હાઇડ કરવા માટે
try {
  StatusBar.hide().catch(() => {
    // જો વેબ બ્રાઉઝર હશે તો આ ઇગ્નોર થઈ જશે
  });
} catch (e) {
  // Catch error if running in browser
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)