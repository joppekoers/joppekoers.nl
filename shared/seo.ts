export const siteUrl = 'https://joppekoers.nl'

type PageMeta = {
	title: string
	description: string
	indexable: boolean
}

const defaultDescription =
	'Portfolio of Joppe Koers: software projects, things I built and how to get in touch.'

export const pages: Readonly<Record<string, PageMeta>> = {
	'/': { title: 'Joppe Koers', description: defaultDescription, indexable: true },
	'/contact': {
		title: 'Contact | Joppe Koers',
		description: 'Get in touch with Joppe Koers by email, LinkedIn or GitHub.',
		indexable: true,
	},
	'/drop': { title: 'Drop | Joppe Koers', description: defaultDescription, indexable: false },
	'/tickets-embedded-production': {
		title: 'Tickets | Joppe Koers',
		description: defaultDescription,
		indexable: false,
	},
	'/tickets-iframe-staging': { title: 'Tickets | Joppe Koers', description: defaultDescription, indexable: false },
}

export const notFoundPage: PageMeta = {
	title: 'Page not found | Joppe Koers',
	description: defaultDescription,
	indexable: false,
}

export function normalizePath(pathname: string) {
	return pathname.replace(/(.)\/+$/, '$1')
}
