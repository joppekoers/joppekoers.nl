import etag from 'etag'
import { Request, Response } from 'express'
import fs from 'fs'
import { IPX } from 'ipx'
import { hash } from 'ohash'
import path from 'path'
import { cacheControl } from '../cacheControl'
import { env } from '../env'
import { exceptionAsValue, fsExists } from '../util'

function logReq(cache: boolean, start: [number, number], path: string, modifiers: unknown) {
	const [s, ns] = process.hrtime(start)
	const now = new Date().toISOString()
	const time = `${(s + ns / 1e6).toFixed(0).padStart(4, ' ')}ms`
	const cacheStr = cache ? 'HIT ' : 'MISS'
	console.log(now, time, cacheStr, path, modifiers)
}

function sendImageError(err: Error, res: Response) {
	const status = 'statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 500
	if (status >= 500) {
		console.error(err)
	}
	res.set('Cache-Control', status === 404 ? cacheControl.notFound : cacheControl.noStore)
	res.status(status).send(err.message)
}

export async function resizeImage(ipx: IPX, req: Request, res: Response) {
	if (req.path === '/') {
		res.set('Cache-Control', cacheControl.notFound)
		res.sendStatus(404)
		return
	}
	const start = process.hrtime()
	const { v: version, ...modifiers } = req.query as Record<string, string>
	const successCacheControl = version ? cacheControl.immutable : cacheControl.unversionedImage
	const imageHash = hash({ id: req.path, ...req.query })
	const imgPath = path.join(env.cacheDir, `${imageHash}.raw`)
	const typePath = path.join(env.cacheDir, `${imageHash}.mime`)
	const etagPath = path.join(env.cacheDir, `${imageHash}.etag`)

	if (await fsExists(imgPath)) {
		const [type, etag] = await Promise.all([
			fs.promises.readFile(typePath, 'utf-8').catch(e => e as Error),
			fs.promises.readFile(etagPath, 'utf-8').catch(e => e as Error),
		])
		if (!(type instanceof Error) && !(etag instanceof Error)) {
			res.set('Cache-Control', successCacheControl)
			res.set('ETag', etag)
			if (etag && req.header('if-none-match') === etag) {
				return res.sendStatus(304)
			}
			res.set('Content-Type', type)

			const stream = fs.createReadStream(imgPath)
			stream.pipe(res)
			stream.on('close', () => logReq(true, start, req.path, req.query))
			return
		}
		console.error('Could not read cached image meta, regenerating', type instanceof Error ? type : etag)
	}

	const img = exceptionAsValue(() => ipx(req.path, modifiers))
	if (img instanceof Error) {
		return sendImageError(img, res)
	}
	const src = await exceptionAsValue(() => img.getSourceMeta())
	if (src instanceof Error) {
		return sendImageError(src, res)
	}

	if (src.mtime) {
		res.set('Last-Modified', src.mtime.toUTCString())
	}

	const data = await exceptionAsValue(() => img.process())
	if (data instanceof Error) {
		return sendImageError(data, res)
	}
	const etagV = etag(data.data)
	res.set('Cache-Control', successCacheControl)
	res.set('ETag', etagV)
	if (req.header('if-none-match') === etagV) {
		res.sendStatus(304)
		return
	}
	res.set('Content-Type', `image/${data.format}`)
	res.send(data.data)
	logReq(false, start, req.path, req.query)

	void Promise.all([
		fs.promises.writeFile(typePath, `image/${data.format}`, 'utf-8'),
		fs.promises.writeFile(etagPath, etagV, 'utf-8'),
		fs.promises.writeFile(imgPath, data.data),
	]).catch(error => {
		console.error(new Error(error))
	})
}
