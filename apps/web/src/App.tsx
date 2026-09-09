import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { LanguageProvider } from './i18n/language'
import { AuthProvider } from './features/auth/auth-context'
import { queryClient } from './lib/query-client'
import { router } from './routes/router'

export function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  )
}
