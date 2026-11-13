import { z } from 'zod'

const Env = z.object({
	dev: z.boolean(),
	port: z.number().min(0).max(65535),
	projects: z.string().nonempty(),
	cacheDir: z.string().nonempty(),
	mediaDir: z.string().nonempty(),
	uploadsDir: z.string().nonempty(),
	frontendDir: z.string().nonempty(),
})
export type Env = z.infer<typeof Env>

const dev = process.env['NODE_ENV'] === 'development'
const port = Number(process.env['PORT']) || 8080
export const env = {
	dev,
	port,
	projects: `${__dirname}/../projects`,
	cacheDir: `${__dirname}/../projects/.cache`,
	mediaDir: `${__dirname}/../media`,
	uploadsDir: `${__dirname}/../uploads`,
	frontendDir: `${__dirname}/../../frontend/dist`,
} as const satisfies Env

Env.parse(env)
