import { Toaster } from 'sonner'
import './App.css'
import { ThemeProvider } from './components/theme/ThemeContext'
import Routers from './Routes/Routes'
import { LoadingProvider } from './context/LoadingContext'
import { BackgroundTasksProvider } from './components/background/BackgroundTasksContext.tsx'
import OverlayRoot from './components/overlay/OverlayRoot'

function App() {
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
