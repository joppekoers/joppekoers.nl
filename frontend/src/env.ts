import { z } from 'zod'

export const env = {
	cmsUrl: window.location.origin,
} as const satisfies Env

const Env = z.object({
	cmsUrl: z.string().url(),
})
export type Env = z.infer<typeof Env>
Env.parse(env)
