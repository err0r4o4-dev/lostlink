import { ApiError } from './client'

export function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}
