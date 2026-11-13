export type ProjectListItem = {
	name: string
	images: {
		url: string
		width: number
		height: number
	}[]
}

export type ApiRoutes = {
	'/projects-list': ProjectListItem[]
}
