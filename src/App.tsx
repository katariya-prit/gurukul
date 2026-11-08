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
    const handleFirstClick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log("Error attempting to enable fullscreen:", err);
        });
      }
    };

    window.addEventListener('click', handleFirstClick, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstClick);
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