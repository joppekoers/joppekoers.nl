import { z } from 'zod'

const Env = z.object({
	dev: z.boolean(),
	port: z.number().min(0).max(65535),
	projects: z.string().nonempty(),
	cacheDir: z.string().nonempty(),
	mediaDir: z.string().nonempty(),
	uploadsDir: z.string().nonempty(),
	frontendDir: z.string().nonempty(),
	cdnRepoDir: z.string().nonempty(),
	cdnRepoUrl: z.string().nonempty(),
	syncToken: z.string().min(32).optional(),
})
export type Env = z.infer<typeof Env>

const dev = process.env['NODE_ENV'] === 'development'
const port = Number(process.env['PORT']) || 8080
export const env = {
	dev,
	port,
	projects: process.env['PROJECTS_DIR'] || `${__dirname}/../projects`,
	cacheDir: process.env['CACHE_DIR'] || `${__dirname}/../projects/.cache`,
	mediaDir: `${__dirname}/../media`,
	uploadsDir: `${__dirname}/../uploads`,
	frontendDir: `${__dirname}/../../frontend/dist`,
	cdnRepoDir: process.env['CDN_REPO_DIR'] || `${__dirname}/../../cdn`,
	cdnRepoUrl: process.env['CDN_REPO_URL'] || 'https://github.com/joppekoers/cdn.joppekoers.nl.git',
	syncToken: process.env['SYNC_TOKEN'] || undefined,
} as const satisfies Env

Env.parse(env)
