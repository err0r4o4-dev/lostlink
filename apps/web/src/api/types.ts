export interface Pagination {
  limit: number
  offset: number
}

export interface PageOptions {
  limit?: number
  offset?: number
}

export function pageQuery(options: PageOptions = {}) {
  const params = new URLSearchParams()
  if (options.limit) params.set('limit', String(options.limit))
  if (options.offset) params.set('offset', String(options.offset))
  const query = params.toString()
  return query ? `?${query}` : ''
}
