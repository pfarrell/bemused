import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'
import { authService } from '../services/authService.js'
import type { Variables } from '../types.js'

const JWT_SECRET = process.env.BEMUSED_JWT_SECRET || 'default-secret-change-me'

interface JWTPayload {
  id: number
  username: string
  admin: boolean
  iat: number
}

type AppContext = Context<{ Variables: Variables }>

// Middleware to extract and verify JWT from cookie
export async function authMiddleware(c: AppContext, next: Next) {
  const token = getCookie(c, 'auth')

  if (!token) {
    await next()
    return
  }

  let decoded: JWTPayload
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload
  } catch {
    // Invalid or expired token — proceed without user
    await next()
    return
  }

  // DB errors propagate rather than silently clearing the user context
  const user = await authService.findUserById(decoded.id)

  // A password reset sets password_changed_at; any JWT issued before that
  // (decoded.iat is seconds since epoch, matching jsonwebtoken's own clock)
  // belongs to a session that predates the reset and must stop working —
  // this is what makes "invalidate other sessions" happen without a
  // server-side token blocklist.
  const passwordChangedAfterToken =
    user?.password_changed_at != null &&
    new Date(user.password_changed_at).getTime() > decoded.iat * 1000

  if (user && !passwordChangedAfterToken) {
    c.set('user', user)
  }

  await next()
}

// Middleware to require authentication
export async function requireAuth(c: AppContext, next: Next) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  await next()
}

// Middleware to require admin privileges
export async function requireAdmin(c: AppContext, next: Next) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  if (!user.admin) {
    return c.json({ error: 'Admin privileges required' }, 403)
  }

  await next()
}
