import { env } from '$root/env'
import type { ApiRoutes, ImageFormat } from '@shared/api'

export type ImageSource = {
	alt: string
	url: string
	width: number
	height: number
}
export type Project = {
	id: number
	header: ImageSource
	content: ImageSource[]
}

function bucket(px: number) {
	return px < 200 ? Math.ceil(px / 50) * 50 : Math.ceil(px / 200) * 200
}

export function imageUrl(image: ImageSource, cssWidth: number, format: ImageFormat) {
	const width = Math.min(Math.max(bucket(cssWidth * Math.min(window.devicePixelRatio, 2)), 50), image.width)
	const url = new URL(image.url)
	url.searchParams.set('width', width.toString())
	url.searchParams.set('format', format)
	return url.toString()
}

const avifProbe =
	'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
const webpProbe = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='

function canDecode(src: string) {
	return new Promise<boolean>(resolve => {
		const img = new Image()
		img.onload = () => resolve(img.width > 0)
		img.onerror = () => resolve(false)
		img.src = src
	})
}

async function detectBestFormat() {
	if (await canDecode(avifProbe)) {
		return 'avif' as const
	}
	if (await canDecode(webpProbe)) {
		return 'webp' as const
	}
	return 'jpg' as const
}

let bestFormatPromise: Promise<ImageFormat> | undefined
export function bestFormat() {
	bestFormatPromise ??= detectBestFormat()
	return bestFormatPromise
}

async function fetch2<T>(input: URL | RequestInfo, init?: RequestInit) {
	let resp
	try {
		resp = await fetch(input, init)
	} catch (e) {
		return new Error(e)
	}
	if (!resp.ok) {
		return new Error(`Failed to fetch ${resp.url}: ${resp.statusText}`)
	}

	try {
		return (await resp.json()) as T
	} catch {
		return new Error('Failed to JSON parse response')
	}
}

export async function getProjects() {
	const data = await fetch2<ApiRoutes['/projects-list']>(new URL(`/projects-list`, env.cmsUrl))
	if (data instanceof Error) {
		console.error(data)
		return []
	}
	return data.map((data, i) => {
		const content = data.images.map(img => ({
			alt: img.url,
			url: new URL(img.url, env.cmsUrl).toString(),
			width: img.width,
			height: img.height,
		}))
		return { id: i, header: content[0], content }
	})
}
