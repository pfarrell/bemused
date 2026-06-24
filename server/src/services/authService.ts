import { Kysely } from 'kysely'
import { db, Database } from '../db/database.js'

export function createAuthService(db: Kysely<Database>) {
  return {
    async findUserById(id: number) {
      return db
        .selectFrom('users')
        .select(['id', 'username', 'email', 'admin', 'default_tag'])
        .where('id', '=', id)
        .executeTakeFirst()
    },

    async findUserByUsername(username: string) {
      return db
        .selectFrom('users')
        .selectAll()
        .where(db.fn('LOWER', ['username']), '=', username.toLowerCase())
        .executeTakeFirst()
    },

    async createUser({ username, password, email }: { username: string; password: string; email: string | null }) {
      return db
        .insertInto('users')
        .values({
          username,
          password,
          email,
          admin: false,
        })
        .returningAll()
        .executeTakeFirst()
    },

    async updateDefaultTag(userId: number, tag: string | null) {
      await db
        .updateTable('users')
        .set({ default_tag: tag, updated_at: new Date().toISOString() })
        .where('id', '=', userId)
        .execute()
    },
  }
}

export const authService = createAuthService(db)
