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
import type { ApiRoutes } from '../../shared/api'

export function sendError(err: Error, res: Response) {
	console.error(err)
	res.status(500)
	res.send(err.message)
}

ensureDir(env.cacheDir)
ensureDir(env.mediaDir)

const ipx = createIPX({
	storage: ipxFSStorage({ dir: env.projects }),
	maxAge: env.maxAge,
})

const app = express()
app.use('/projects', (req, res) => {
	resizeImage(ipx, req, res)
})

const generateIndexMemoized = env.dev ? generateIndex : memoize(generateIndex, { promise: true, maxAge: 1000 * 60 })
let projects: Promise<Project[]> | Project[] = generateIndexMemoized(env.projects)
app.get<never, ApiRoutes['/projects-list']>('/projects-list', async (_, res) => {
	if (projects instanceof Promise) {
		projects = await projects
	}
	res.json(projects)
	projects = await generateIndexMemoized(env.projects)
})

app.use('/media', express.static(env.mediaDir))
app.use(drop)
app.get('/cv', (_, res) => res.redirect(302, '/media/CV Joppe Koers.pdf'))

// Apple Pay domain verification for Adyen, see
// https://docs.adyen.com/payment-methods/apple-pay/web-component/
app.get('/.well-known/apple-developer-merchantid-domain-association', (_, res) => {
	res.type('text/plain').sendFile(path.join(__dirname, '../assets/apple-developer-merchantid-domain-association.txt'))
})

app.use(express.static(env.frontendDir))
app.get('/{*splat}', (_, res) => res.sendFile(path.join(env.frontendDir, 'index.html')))

app.listen(env.port, () => {
	console.log(`listening on: http://localhost:${env.port}`)
	console.log(`reading projects from: ${path.normalize(env.projects)}`)
})
