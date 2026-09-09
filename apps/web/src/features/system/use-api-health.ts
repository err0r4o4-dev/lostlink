import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '../../api/client'

interface HealthResponse {
  status: string
}

export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: () => apiRequest<HealthResponse>('/health'),
  })
}
