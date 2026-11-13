<script lang="ts" module>
	const largestRequestedWidth = new Map<string, number>()
</script>

<script lang="ts">
	export let project: Project
	export let priority = false

	import { bestFormat, imageUrl, type Project } from '$root/server/cms'

	let containerWidth = 0
	let requestedWidth = largestRequestedWidth.get(project.header.url) ?? 0
	$: if (containerWidth > requestedWidth) {
		requestedWidth = containerWidth
		largestRequestedWidth.set(project.header.url, requestedWidth)
	}
	$: avifUrl = requestedWidth ? imageUrl(project.header, requestedWidth, 'avif') : undefined
	$: webpUrl = requestedWidth ? imageUrl(project.header, requestedWidth, 'webp') : undefined
	$: jpgUrl = requestedWidth ? imageUrl(project.header, requestedWidth, 'jpg') : undefined

	async function openPhotoSwhipe() {
		const [{ default: PhotoSwipe }, , format] = await Promise.all([
			import('photoswipe'),
			import('photoswipe/style.css'),
			bestFormat(),
		])
		const gallery = new PhotoSwipe({
			gallery: '#pswp-gallery-id',
			dataSource: project.content.map(image => ({
				src: imageUrl(image, window.innerWidth, format),
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
	<picture>
		<source type="image/avif" srcset={avifUrl} />
		<source type="image/webp" srcset={webpUrl} />
		<img
			loading={priority ? 'eager' : 'lazy'}
			fetchpriority={priority ? 'high' : 'auto'}
			decoding="auto"
			class="h-auto w-full rounded-lg project"
			src={jpgUrl}
			width={project.header.width}
			height={project.header.height}
			alt={project.header.alt} />
	</picture>
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
