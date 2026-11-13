import { Router } from 'express'
import fs from 'fs/promises'
import multer from 'multer'
import path from 'path'
import { env } from './env'
import { ensureDir } from './util'

const storePath = env.uploadsDir
ensureDir(storePath)

const fileExists = async (path: string) => !!(await fs.stat(path).catch(() => false))

async function getFileById(id: string) {
	const files = await fs.readdir(storePath)
	const file = files.find(file => file.startsWith(`${id}-`))
	if (!file) {
		return undefined
	}
	return {
		path: path.join(storePath, file),
		name: file.substring(id.length + 1),
		id,
	}
}

async function canUploadFile(size: number) {
	const maxSize = 10 * 1000 * 1000 * 1000
	// Early return if file is too big
	if (size > maxSize) {
		return false
	}

	const files = await fs.readdir(storePath)
	const stats = await Promise.all(files.map(file => fs.stat(path.join(storePath, file))))
	const totalSize = stats.reduce((acc, current) => acc + current.size, 0)
	return totalSize + size < maxSize
}

async function getStorePath(file: string, idLength = 4) {
	for (let i = 0; i < 100; i++) {
		const id = Math.random()
			.toString()
			.substring(2, 2 + idLength)
		const filename = `${id}-${file}`
		const filePath = path.join(storePath, filename)
		if (!(await fileExists(filePath))) {
			return {
				path: filePath,
				name: filename,
				id,
			}
		}
	}
	return getStorePath(file, idLength + 1)
}

export const drop = Router()

drop.get('/drop/:id', async (req, res) => {
	const file = await getFileById(req.params.id)
	if (!file) {
		return res.status(404).send('File not found')
	}
	res.download(file.path, file.name)
})

drop.post('/drop/up', multer().single('file'), async (req, res) => {
	try {
		const file = req.file
		if (!file) {
			return res.status(400).send('Invalid form data, expected file')
		}
		if (file.size <= 0) {
			return res.status(400).send('Will not upload empty file')
		}
		if (!(await canUploadFile(file.size))) {
			return res.status(400).send('No room on disk or file too big')
		}

		const storedFile = await getStorePath(path.basename(file.originalname))
		await fs.writeFile(storedFile.path, file.buffer)

		const origin = req.header('origin') || 'https://joppekoers.nl'
		res.send(`${origin.replace(/\/*$/, '')}/drop/${storedFile.id}`)
	} catch (err) {
		res.status(500).send(`Internal server error: ${err}`)
	}
})
