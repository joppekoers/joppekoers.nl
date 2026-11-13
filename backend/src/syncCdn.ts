import { execFile } from 'child_process'
import { timingSafeEqual } from 'crypto'
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import type { SyncCdnResult } from '../../shared/api'
import { cacheControl } from './cacheControl'
import { env } from './env'
import { ensureDir } from './util'

const execFileAsync = promisify(execFile)
const gitTimeoutMs = 5 * 60 * 1000

async function git(args: string[]): Promise<string> {
	try {
		const { stdout } = await execFileAsync('git', args, { cwd: env.cdnRepoDir, timeout: gitTimeoutMs })
		return stdout.trim()
	} catch (err) {
		const stderr = (err as { stderr?: string }).stderr?.trim()
		throw new Error(`git ${args.join(' ')} failed: ${stderr || (err as Error).message}`, { cause: err })
	}
}

async function sync(): Promise<SyncCdnResult> {
	if (!fs.existsSync(path.join(env.cdnRepoDir, '.git'))) {
		ensureDir(env.cdnRepoDir)
		await git(['clone', '--branch', 'main', env.cdnRepoUrl, '.'])
		return { from: null, to: await git(['rev-parse', 'HEAD']) }
	}
	const from = await git(['rev-parse', 'HEAD'])
	await git(['fetch', 'origin', 'main'])
	await git(['reset', '--hard', 'origin/main'])
	return { from, to: await git(['rev-parse', 'HEAD']) }
}

function isAuthorized(header: string | undefined): boolean {
	if (!env.syncToken || !header) {
		return false
	}
	const expected = Buffer.from(`Bearer ${env.syncToken}`)
	const actual = Buffer.from(header)
	return actual.length === expected.length && timingSafeEqual(actual, expected)
}

let running = false

export function syncCdnRouter(onSynced: () => void): Router {
	const router = Router()
	router.post('/api/sync-cdn', async (req, res) => {
		res.set('Cache-Control', cacheControl.privateNoStore)
		if (!env.syncToken) {
			return res.status(503).send('Sync is not configured')
		}
		if (!isAuthorized(req.header('authorization'))) {
			return res.status(401).send('Unauthorized')
		}
		if (running) {
			return res.status(409).send('Sync already running')
		}
		running = true
		try {
			const result = await sync()
			onSynced()
			console.log('cdn synced', result)
			res.json(result)
		} catch (err) {
			console.error(err)
			res.status(500).send((err as Error).message)
		} finally {
			running = false
		}
	})
	return router
}
