import { dev } from '$app/environment'
import { env as runtimeEnv } from '$env/dynamic/private'
import { z } from 'zod'

const Env = z.object({
	cmsUrl: z.string().url(),
	cmsInternalUrl: z.string().url(),
})
export type Env = z.infer<typeof Env>

const cmsUrl = runtimeEnv['CMS_URL'] || (dev ? 'http://127.0.0.1:8080' : 'https://cms.joppekoers.nl')

export const env: Env = Env.parse({
	cmsUrl,
	// The browser can't reach Docker network hostnames, so server-side fetches may need a different address.
	cmsInternalUrl: runtimeEnv['CMS_INTERNAL_URL'] || cmsUrl,
})
