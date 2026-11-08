import { useEffect } from 'react'
import { Toaster } from 'sonner'
import './App.css'
import { ThemeProvider } from './components/theme/ThemeContext'
import Routers from './Routes/Routes'
import { LoadingProvider } from './context/LoadingContext'
import { BackgroundTasksProvider } from './components/background/BackgroundTasksContext.tsx'
import OverlayRoot from './components/overlay/OverlayRoot'

function App() {
  useEffect(() => {
    const triggerFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          // Browser may block if not triggered by direct user gesture
        });
      }
    };

    // Listen to multiple events to catch the very first user interaction immediately
    window.addEventListener('click', triggerFullscreen, { once: true });
    window.addEventListener('touchstart', triggerFullscreen, { once: true });
    window.addEventListener('keydown', triggerFullscreen, { once: true });

    return () => {
      window.removeEventListener('click', triggerFullscreen);
      window.removeEventListener('touchstart', triggerFullscreen);
      window.removeEventListener('keydown', triggerFullscreen);
    };
  }, []);

  return (
    <ThemeProvider>
      <BackgroundTasksProvider>
        <OverlayRoot>
          <LoadingProvider>
            <Routers />
            <Toaster
              position="top-right"
              richColors
              closeButton
            />
          </LoadingProvider>
        </OverlayRoot>
      </BackgroundTasksProvider>
    </ThemeProvider>
  )
}

export default App