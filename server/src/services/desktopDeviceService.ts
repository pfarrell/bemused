import { Kysely } from 'kysely'
import { db, Database } from '../db/database.js'

const TOUCH_INTERVAL_MS = 60 * 60 * 1000

export function createDesktopDeviceService(db: Kysely<Database>) {
  return {
    async create(userId: number, name: string) {
      return db
        .insertInto('desktop_devices')
        .values({ user_id: userId, name })
        .returningAll()
        .executeTakeFirstOrThrow()
    },

    async findById(id: number) {
      return db
        .selectFrom('desktop_devices')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()
    },

    // Called on every authenticated desktop request, so it only writes when
    // the stored timestamp is missing or over an hour old.
    async touchIfStale(id: number, lastSeenAt: Date | null, now: Date = new Date()) {
      if (lastSeenAt && now.getTime() - lastSeenAt.getTime() < TOUCH_INTERVAL_MS) return false
      await db.updateTable('desktop_devices').set({ last_seen_at: now }).where('id', '=', id).execute()
      return true
    },
  }
}

export const desktopDeviceService = createDesktopDeviceService(db)
