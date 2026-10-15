import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { desktopDeviceService } from './desktopDeviceService.js'
import { createUser, cleanupFixtures } from '../test/fixtures.js'
import { db } from '../db/database.js'

after(cleanupFixtures)

test('create inserts a row with null last_seen_at, findById returns it', async () => {
  const user = await createUser('desktop-svc-create')
  const device = await desktopDeviceService.create(user.id, 'laptop')
  assert.equal(device.user_id, user.id)
  assert.equal(device.name, 'laptop')
  assert.equal(device.last_seen_at, null)
  const found = await desktopDeviceService.findById(device.id)
  assert.equal(found?.id, device.id)
})

test('findById returns undefined for a deleted device', async () => {
  const user = await createUser('desktop-svc-deleted')
  const device = await desktopDeviceService.create(user.id, 'gone')
  await db.deleteFrom('desktop_devices').where('id', '=', device.id).execute()
  assert.equal(await desktopDeviceService.findById(device.id), undefined)
})

test('touchIfStale writes when last_seen_at is null', async () => {
  const user = await createUser('desktop-svc-touch-null')
  const device = await desktopDeviceService.create(user.id, 'd')
  const now = new Date('2026-10-14T12:00:00Z')
  assert.equal(await desktopDeviceService.touchIfStale(device.id, null, now), true)
  const row = await desktopDeviceService.findById(device.id)
  assert.equal(row?.last_seen_at?.toISOString(), now.toISOString())
})

test('touchIfStale skips when last seen under an hour ago, writes when over', async () => {
  const user = await createUser('desktop-svc-touch-stale')
  const device = await desktopDeviceService.create(user.id, 'd')
  const now = new Date('2026-10-14T12:00:00Z')
  assert.equal(await desktopDeviceService.touchIfStale(device.id, new Date('2026-10-14T11:30:00Z'), now), false)
  assert.equal(await desktopDeviceService.touchIfStale(device.id, new Date('2026-10-14T10:59:00Z'), now), true)
})
