import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'
import { db } from '../db/database.js'
import type { Variables } from '../types.js'

const JWT_SECRET = process.env.BEMUSED_JWT_SECRET || 'default-secret-change-me'

interface JWTPayload {
  id: number
  username: string
  admin: boolean
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
    decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    // Invalid or expired token — proceed without user
    await next()
    return
  }

  // DB errors propagate rather than silently clearing the user context
  const user = await db
    .selectFrom('users')
    .select(['id', 'username', 'email', 'admin', 'default_tag'])
    .where('id', '=', decoded.id)
    .executeTakeFirst()

  if (user) {
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
