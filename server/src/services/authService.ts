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
  }
}

export const authService = createAuthService(db)
