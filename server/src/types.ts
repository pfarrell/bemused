// Type definitions for Hono context variables

export interface User {
  id: number
  username: string
  email: string | null
  admin: boolean
  default_tag: string | null
}

export type Variables = {
  user?: User
}
