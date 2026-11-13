<script lang="ts" module>
	const largestRequestedWidth = new Map<string, number>()
</script>

<script lang="ts">
	export let project: Project
	export let priority = false

	import { mount, unmount } from 'svelte'
	import { imageUrl, type Project } from '$root/server/cms'

	let containerWidth = 0
	let requestedWidth = largestRequestedWidth.get(project.header.url) ?? 0
	$: if (containerWidth > requestedWidth) {
		requestedWidth = containerWidth
		largestRequestedWidth.set(project.header.url, requestedWidth)
	}
	$: avifUrl = requestedWidth ? imageUrl(project.header, requestedWidth, 'avif') : undefined
	$: webpUrl = requestedWidth ? imageUrl(project.header, requestedWidth, 'webp') : undefined
	$: jpgUrl = requestedWidth ? imageUrl(project.header, requestedWidth, 'jpg') : undefined

	let thumbnail: HTMLImageElement | undefined

	async function openViewer() {
		const { default: Lightbox } = await import('./Lightbox.svelte')
		const viewer = mount(Lightbox, {
			target: document.body,
			props: {
				images: project.content,
				thumbnailSrc: thumbnail?.currentSrc || undefined,
				onclose: () => unmount(viewer),
			},
		})
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:clientWidth={containerWidth} on:keydown={() => null} on:click={() => openViewer()}>
	<picture>
		<source type="image/avif" srcset={avifUrl} />
		<source type="image/webp" srcset={webpUrl} />
		<img
			bind:this={thumbnail}
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
