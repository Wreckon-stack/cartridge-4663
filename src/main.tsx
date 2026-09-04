import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { PrefsProvider } from './ui/PrefsProvider'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Every query in this app is a public read; nothing is user-specific,
      // so refetching on window focus just burns RPC quota.
      refetchOnWindowFocus: false,
      gcTime: 5 * 60_000,
    },
  },
})

const container = document.getElementById('root')
if (!container) throw new Error('#root is missing from index.html')

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrefsProvider>
        <App />
      </PrefsProvider>
    </QueryClientProvider>
  </StrictMode>,
)
