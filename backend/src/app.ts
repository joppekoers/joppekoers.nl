import express, { Response } from 'express'
import { createIPX, ipxFSStorage } from 'ipx'
import path from 'path'
import { env } from './env'
import { generateIndex } from './middlewares/generateIndex'
import { resizeImage } from './middlewares/resize'
import { Project } from './project'
import memoize from 'memoizee'
import { ensureDir } from './util'
import { drop } from './drop'
import { cacheControl } from './cacheControl'
import { syncCdnRouter } from './syncCdn'
import { renderPage, sitemapXml } from './seo'
import type { ApiRoutes } from '../../shared/api'

export function sendError(err: Error, res: Response) {
	console.error(err)
	res.set('Cache-Control', cacheControl.noStore)
	res.status(500)
	res.send(err.message)
}

ensureDir(env.cacheDir)
ensureDir(env.mediaDir)

const ipx = createIPX({
	storage: ipxFSStorage({ dir: env.projects }),
})

const app = express()
app.use('/projects', (req, res) => {
	resizeImage(ipx, req, res)
})

const memoizedIndex = memoize(generateIndex, { promise: true, maxAge: 1000 * 60 })
const generateIndexMemoized = env.dev ? generateIndex : memoizedIndex
const loadProjects = () =>
	generateIndexMemoized(env.projects).catch((err: Error) => {
		console.error('could not read projects:', err.message)
		return [] as Project[]
	})
let projects: Promise<Project[]> | Project[] = loadProjects()
app.get<never, ApiRoutes['/projects-list']>('/projects-list', async (_, res) => {
	if (projects instanceof Promise) {
		projects = await projects
	}
	res.set('Cache-Control', cacheControl.projectsList)
	res.json(projects)
	projects = await loadProjects()
})

app.use(
	syncCdnRouter(() => {
		memoizedIndex.clear()
		projects = loadProjects()
	}),
)

app.use(
	'/media',
	express.static(env.mediaDir, {
		setHeaders: res => res.set('Cache-Control', cacheControl.revalidate),
	}),
)
app.use('/drop', (_, res, next) => {
	res.set('Cache-Control', cacheControl.privateNoStore)
	next()
})
app.use(drop)
app.get('/cv', (_, res) => {
	res.set('Cache-Control', cacheControl.revalidate)
	res.redirect(302, '/media/CV Joppe Koers.pdf')
})

// Apple Pay domain verification for Adyen, see
// https://docs.adyen.com/payment-methods/apple-pay/web-component/
app.get('/.well-known/apple-developer-merchantid-domain-association', (_, res) => {
	res.set('Cache-Control', cacheControl.static)
	res.type('text/plain').sendFile(path.join(__dirname, '../assets/apple-developer-merchantid-domain-association.txt'))
})

app.use(
	express.static(env.frontendDir, {
		index: false,
		setHeaders: (res, filePath) => {
			const relative = path.relative(env.frontendDir, filePath)
			if (relative.startsWith(`assets${path.sep}`)) {
				res.set('Cache-Control', cacheControl.immutable)
			} else {
				res.set('Cache-Control', cacheControl.static)
			}
		},
	}),
)
app.use('/assets', (_, res) => {
	res.set('Cache-Control', cacheControl.notFound)
	res.sendStatus(404)
})
app.get('/sitemap.xml', (_, res) => {
	res.set('Cache-Control', cacheControl.static)
	res.type('application/xml').send(sitemapXml())
})
app.get('/{*splat}', async (req, res) => {
	let page
	try {
		page = await renderPage(req.path)
	} catch (err) {
		sendError(err as Error, res)
		return
	}
	res.set('Cache-Control', page.status === 404 ? cacheControl.notFound : cacheControl.html)
	if (!page.indexable) {
		res.set('X-Robots-Tag', 'noindex')
	}
	res.status(page.status).type('html').send(page.html)
})

app.listen(env.port, () => {
	console.log(`listening on: http://localhost:${env.port}`)
	console.log(`reading projects from: ${path.normalize(env.projects)}`)
})
