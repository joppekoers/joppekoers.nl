<!-- From: https://github.com/berkinakkaya/svelte-image-gallery#readme -->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte'

	const {
		items,
		item,
		gap = 10,
		maxColumnCount = 4,
		maxColumnWidth = 300,
	}: {
		items: T[]
		item: Snippet<[T]>
		gap?: number
		maxColumnCount?: number
		maxColumnWidth?: number
	} = $props()

	let galleryWidth = $state(0)

	const columnCount = $derived(Math.min(Math.floor(galleryWidth / maxColumnWidth) || 1, maxColumnCount))
	const columns = $derived(
		Array.from({ length: columnCount }, (_, column) => items.filter((_, i) => i % columnCount === column)),
	)
</script>

<div
	id="gallery"
	bind:clientWidth={galleryWidth}
	style="grid-template-columns: repeat({columnCount}, 1fr); --gap: {gap}px">
	{#each columns as column, c (c)}
		<div class="column">
			{#each column as entry, i (i)}
				{@render item(entry)}
			{/each}
		</div>
	{/each}
</div>

<style>
	#gallery {
		width: 100%;
		display: grid;
		gap: var(--gap);
	}

	#gallery .column {
		display: flex;
		flex-direction: column;
		gap: var(--gap);
	}
</style>
