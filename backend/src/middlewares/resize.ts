import etag from 'etag'
import { Request, Response } from 'express'
import fs from 'fs'
import { hash } from 'ohash'
import path from 'path'
import sharp from 'sharp'
import type { ImageFormat } from '../../../shared/api'
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

const allowedParams = new Set(['v', 'width', 'height', 'format'])
const positiveInt = /^[1-9]\d{0,4}$/
const mimeTypes = { avif: 'image/avif', webp: 'image/webp', jpg: 'image/jpeg' } as const satisfies Record<
	ImageFormat,
	string
>

function parseImageQuery(query: Request['query']) {
	const unknown = Object.keys(query).filter(key => !allowedParams.has(key))
	if (unknown.length > 0) {
		return new Error(`Unknown query parameter: ${unknown.join(', ')}. Use width, height or format.`)
	}
	const { v, width, height, format = 'webp' } = query
	if ([v, width, height, format].some(value => value !== undefined && typeof value !== 'string')) {
		return new Error('Query parameters must be given once')
	}
	if (width !== undefined && height !== undefined) {
		return new Error('Use either width or height, not both')
	}
	const size = (width ?? height) as string | undefined
	if (size !== undefined && !positiveInt.test(size)) {
		return new Error('width and height must be positive integers')
	}
	if (!Object.hasOwn(mimeTypes, format as string)) {
		return new Error(`format must be one of: ${Object.keys(mimeTypes).join(', ')}`)
	}
	return {
		version: v as string | undefined,
		mimeType: mimeTypes[format as ImageFormat],
		modifiers: {
			f: format as ImageFormat,
			...(width !== undefined ? { w: size } : {}),
			...(height !== undefined ? { h: size } : {}),
		},
	}
}

function resolveSource(requestPath: string) {
	const root = path.resolve(env.projects)
	const filePath = path.resolve(root, `.${decodeURIComponent(requestPath)}`)
	return filePath.startsWith(root + path.sep) ? filePath : undefined
}

async function renderImage(filePath: string, modifiers: { f: ImageFormat; w?: string; h?: string }) {
	// The stored pixels are upright but many files carry a stale EXIF orientation; raw output drops it so no encoder rotates.
	const { data, info } = await sharp(filePath)
		.resize({
			width: modifiers.w ? Number(modifiers.w) : undefined,
			height: modifiers.h ? Number(modifiers.h) : undefined,
			withoutEnlargement: true,
		})
		.raw()
		.toBuffer({ resolveWithObject: true })
	return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
		.toFormat(modifiers.f === 'jpg' ? 'jpeg' : modifiers.f)
		.toBuffer()
}

export async function resizeImage(req: Request, res: Response) {
	if (req.path === '/') {
		res.set('Cache-Control', cacheControl.notFound)
		res.sendStatus(404)
		return
	}
	const start = process.hrtime()
	const query = parseImageQuery(req.query)
	if (query instanceof Error) {
		res.set('Cache-Control', cacheControl.noStore)
		res.status(400).send(query.message)
		return
	}
	const { version, mimeType, modifiers } = query
	const successCacheControl = version ? cacheControl.immutable : cacheControl.unversionedImage
	const imageHash = hash({ id: req.path, version, renderer: 2, ...modifiers })
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

	const sourcePath = exceptionAsValue(() => resolveSource(req.path))
	const stat = typeof sourcePath === 'string' ? await fs.promises.stat(sourcePath).catch(() => undefined) : undefined
	if (typeof sourcePath !== 'string' || !stat?.isFile()) {
		res.set('Cache-Control', cacheControl.notFound)
		res.status(404).send('Image not found')
		return
	}
	res.set('Last-Modified', stat.mtime.toUTCString())

	const data = await exceptionAsValue(() => renderImage(sourcePath, modifiers))
	if (data instanceof Error) {
		return sendImageError(data, res)
	}
	const etagV = etag(data)
	res.set('Cache-Control', successCacheControl)
	res.set('ETag', etagV)
	if (req.header('if-none-match') === etagV) {
		res.sendStatus(304)
		return
	}
	res.set('Content-Type', mimeType)
	res.send(data)
	logReq(false, start, req.path, req.query)

	void Promise.all([
		fs.promises.writeFile(typePath, mimeType, 'utf-8'),
		fs.promises.writeFile(etagPath, etagV, 'utf-8'),
		fs.promises.writeFile(imgPath, data),
	]).catch(error => {
		console.error(new Error(error))
	})
}
