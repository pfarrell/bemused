import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createCollection, createCollectionLog, cleanupFixtures } from '../test/fixtures.js'
import { recentCollectionsService } from './recentCollectionsService.js'
import { lastActivityByIds } from './listActivityService.js'
import { logService } from './logService.js'

after(cleanupFixtures)

const DAY = 86400000
const ago = (days: number) => new Date(Date.now() - days * DAY)

test('orders collections by most recent play, each once; unplayed are excluded', async () => {
  const a = await createCollection('recent-co-a')
  const b = await createCollection('recent-co-b')
  const never = await createCollection('recent-co-never')
  await createCollectionLog(a.id, ago(3))
  await createCollectionLog(b.id, ago(1))
  await createCollectionLog(a.id, ago(2))

  const ids = (await recentCollectionsService.recentlyPlayed(200)).map((r) => r.id)
  assert.deepEqual(ids.filter((id) => id === a.id || id === b.id), [b.id, a.id])
  assert.ok(!ids.includes(never.id))
})

test('resolveCollectionId accepts real ids only', async () => {
  const c = await createCollection('log-resolve-co')
  assert.equal(await logService.resolveCollectionId(String(c.id)), c.id)
  for (const raw of [undefined, '', 'abc', '-1', '0', '1.5', '99999999999999999999']) {
    assert.equal(await logService.resolveCollectionId(raw), null)
  }
})

test('lastActivityByIds takes the later of edit and play', async () => {
  const played = await createCollection('activity-played')
  const edited = await createCollection('activity-edited')
  await createCollectionLog(played.id, ago(1))
  const rows = [
    { id: played.id, updated_at: ago(10) },
    { id: edited.id, updated_at: ago(2) },
  ]
  const out = await lastActivityByIds('collection', rows)
  assert.equal(Math.abs(new Date(out.get(played.id)!).getTime() - ago(1).getTime()) < 5000, true)
  assert.equal(Math.abs(new Date(out.get(edited.id)!).getTime() - ago(2).getTime()) < 5000, true)
})
