const day = 60 * 60 * 24
const year = day * 365

export const cacheControl = {
	immutable: `public, max-age=${year}, immutable`,
	unversionedImage: `public, max-age=${day}, stale-while-revalidate=${7 * day}`,
	html: `public, max-age=0, s-maxage=10, stale-while-revalidate=${day}`,
	projectsList: 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
	static: `public, max-age=${7 * day}`,
	revalidate: 'no-cache',
	notFound: 'public, max-age=0, s-maxage=60',
	noStore: 'no-store',
	privateNoStore: 'private, no-store',
} as const
