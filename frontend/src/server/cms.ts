import { env } from '$root/env'
import type { ApiRoutes } from '@shared/api'

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

export function imageUrl(image: ImageSource, cssWidth: number) {
	const width = Math.min(Math.max(bucket(cssWidth * Math.min(window.devicePixelRatio, 2)), 50), image.width)
	const url = new URL(image.url)
	url.searchParams.set('width', width.toString())
	return url.toString()
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
