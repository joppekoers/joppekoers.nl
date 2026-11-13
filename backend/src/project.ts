import { imageSizeFromFile } from 'image-size/fromFile'
import { z } from 'zod'
import { isIgnored, safeParseJSON } from './util'
import fs from 'fs'
import path from 'path'
import { env } from './env'

async function sizeOf(path: string) {
	const dimensions = await imageSizeFromFile(path).catch((err: Error) => err)
	if (dimensions instanceof Error) {
		return dimensions
	}
	if (!dimensions.width || !dimensions.height || !dimensions.type) {
		return new Error(`No dimensions or type: ${JSON.stringify(dimensions)}`)
	}
	return { width: dimensions.width, height: dimensions.height, type: dimensions.type }
}

import type { ProjectListItem } from '../../shared/api'

export type Project = ProjectListItem

async function getImageMetaData(path: string) {
	const size = await sizeOf(path)
	if (size instanceof Error) {
		return { width: 0, height: 0 }
	}
	return { width: size.width, height: size.height }
}

const Metadata = z.strictObject({
	name: z.string().nonempty(),
})
type Metadata = z.infer<typeof Metadata>

async function readMetadata(path: string) {
	const data = await fs.promises.readFile(path, 'utf-8').catch(error => error)
	if (data instanceof Error) {
		return data
	}
	const json = safeParseJSON<Metadata>(data)
	if (json instanceof Error) {
		return json
	}
	const parse = await Metadata.safeParseAsync(json)
	return parse.success ? parse.data : parse.error
}

export async function dirToProject(dir: string) {
	const paths = (await fs.promises.readdir(path.join(env.projects, dir), { withFileTypes: true }))
		.filter(entry => entry.isFile())
		.map(entry => entry.name)
		.sort()
	const imagePaths = paths.filter(file => file !== 'metadata.json' && !isIgnored(file))

	const images = await Promise.all(
		imagePaths.map(async (image: string) => {
			const imagePath = path.join(env.projects, dir, image)
			const { mtimeMs } = await fs.promises.stat(imagePath)
			return {
				url: `/projects/${dir}/${image}?v=${Math.floor(mtimeMs).toString(36)}`,
				...(await getImageMetaData(imagePath)),
			}
		}),
	)
	const metadataPath = paths.find(file => file === 'metadata.json')
	const metadata = metadataPath ? await readMetadata(path.join(env.projects, dir, metadataPath)) : {}
	if (metadata instanceof Error) {
		console.error('project', dir, 'has incorrect metadata:', metadata.message)
	}
	return {
		name: dir,
		images,
		...(metadata instanceof Error ? {} : metadata),
	}
}
