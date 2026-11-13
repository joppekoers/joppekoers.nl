export type ProjectListItem = {
	name: string
	images: {
		url: string
		width: number
		height: number
	}[]
}

export type SyncCdnResult = {
	from: string | null
	to: string
}

export type ApiRoutes = {
	'/projects-list': ProjectListItem[]
}
