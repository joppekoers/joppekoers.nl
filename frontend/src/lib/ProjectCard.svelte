<script lang="ts" module>
	const largestRequestedWidth = new Map<string, number>()
</script>

<script lang="ts">
	export let project: Project
	export let priority = false

	import { imageUrl, type Project } from '$root/server/cms'

	let containerWidth = 0
	let requestedWidth = largestRequestedWidth.get(project.header.url) ?? 0
	$: if (containerWidth > requestedWidth) {
		requestedWidth = containerWidth
		largestRequestedWidth.set(project.header.url, requestedWidth)
	}
	$: src = requestedWidth ? imageUrl(project.header, requestedWidth) : undefined

	async function openPhotoSwhipe() {
		const [{ default: PhotoSwipe }] = await Promise.all([import('photoswipe'), import('photoswipe/style.css')])
		const gallery = new PhotoSwipe({
			gallery: '#pswp-gallery-id',
			dataSource: project.content.map(image => ({
				src: imageUrl(image, window.innerWidth),
				alt: image.alt,
				width: image.width,
				height: image.height,
			})),
			loop: false,
			bgOpacity: 0.9,
			showAnimationDuration: 100,
			hideAnimationDuration: 100,
			pinchToClose: false,
		})
		gallery.init()
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:clientWidth={containerWidth} on:keydown={() => null} on:click={() => openPhotoSwhipe()}>
	<img
		loading={priority ? 'eager' : 'lazy'}
		fetchpriority={priority ? 'high' : 'auto'}
		decoding="auto"
		class="h-auto w-full rounded-lg project"
		{src}
		width={project.header.width}
		height={project.header.height}
		alt={project.header.alt} />
</div>

<style>
	div {
		transition: all 0.08s ease-in-out;
	}
	div:hover {
		cursor: pointer;
		transform: scale(1.04);
	}
</style>
