import { readFile } from 'fs/promises'
import path from 'path'
import { env } from './env'
import { normalizePath, notFoundPage, pages, siteUrl } from '../../shared/seo'

function escapeHtml(value: string) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

let indexHtml: Promise<string> | undefined
function readIndexHtml() {
	if (env.dev) {
		return readFile(path.join(env.frontendDir, 'index.html'), 'utf8')
	}
	indexHtml ??= readFile(path.join(env.frontendDir, 'index.html'), 'utf8')
	return indexHtml
}

export async function renderPage(pathname: string) {
	const normalized = normalizePath(pathname)
	const page = pages[normalized]
	const meta = page ?? notFoundPage
	const url = `${siteUrl}${normalized}`
	const title = escapeHtml(meta.title)
	const description = escapeHtml(meta.description)

	const head = [
		`<title>${title}</title>`,
		`<meta name="description" content="${description}">`,
		`<meta property="og:title" content="${title}">`,
		`<meta property="og:description" content="${description}">`,
		...(meta.indexable
			? [`<link rel="canonical" href="${url}">`, `<meta property="og:url" content="${url}">`]
			: ['<meta name="robots" content="noindex">']),
	].join('')

	return {
		status: page ? 200 : 404,
		indexable: meta.indexable,
		html: (await readIndexHtml()).replace('</head>', `${head}</head>`),
	}
}

export function sitemapXml() {
	const urls = Object.entries(pages)
		.filter(([, meta]) => meta.indexable)
		.map(([pathname]) => `<url><loc>${siteUrl}${pathname}</loc></url>`)
		.join('')
	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}
