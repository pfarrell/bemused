import { Kysely } from 'kysely'
import { db, Database } from '../db/database.js'

interface NewSignupLogEntry {
  username: string
  email?: string | null
  method: 'password' | 'google'
}

export function createSignupLogService(db: Kysely<Database>) {
  return {
    // Never throws — a notification-logging failure must not break signup itself.
    async record(entry: NewSignupLogEntry): Promise<void> {
      try {
        await db
          .insertInto('signup_log')
          .values({
            username: entry.username,
            email: entry.email ?? null,
            method: entry.method,
          })
          .execute()
      } catch (err) {
        console.error('Failed to write to signup_log:', err)
      }
    },

    async countUnseen() {
      const result = await db
        .selectFrom('signup_log')
        .select(db.fn.count('id').as('count'))
        .where('seen_at', 'is', null)
        .executeTakeFirst()
      return Number(result?.count ?? 0)
    },

    async listPage(limit: number, offset: number) {
      return db
        .selectFrom('signup_log')
        .selectAll()
        .orderBy('id', 'desc')
        .limit(limit)
        .offset(offset)
        .execute()
    },

    async countAll() {
      const result = await db
        .selectFrom('signup_log')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst()
      return Number(result?.count ?? 0)
    },

    async markAllSeen(): Promise<void> {
      await db
        .updateTable('signup_log')
        .set({ seen_at: new Date() })
        .where('seen_at', 'is', null)
        .execute()
    },
  }
}

export const signupLogService = createSignupLogService(db)
