<script lang="ts">
	import { onMount, untrack } from 'svelte'
	import { SvelteSet } from 'svelte/reactivity'
	import type { ImageFormat } from '@shared/api'
	import { bestFormat, imageUrl, type ImageSource } from '$root/server/cms'

	const {
		images,
		startIndex = 0,
		thumbnailSrc,
		onclose,
	}: {
		images: ImageSource[]
		startIndex?: number
		thumbnailSrc?: string
		onclose: () => void
	} = $props()

	let index = $state(untrack(() => startIndex))
	let viewport = $state({ width: window.innerWidth, height: window.innerHeight })
	let format = $state<ImageFormat>()
	const loaded = $state<Record<number, string>>({})
	const requested = new SvelteSet<number>()

	const image = $derived(images[index])
	const box = $derived(fitInViewport(image))
	const src = $derived(loaded[index] ?? (index === startIndex ? thumbnailSrc : undefined))

	function fitInViewport(img: ImageSource) {
		const scale = Math.min(viewport.width / img.width, viewport.height / img.height)
		return { width: Math.round(img.width * scale), height: Math.round(img.height * scale) }
	}

	function load(i: number) {
		if (!format || i < 0 || i >= images.length || requested.has(i)) {
			return
		}
		requested.add(i)
		const url = imageUrl(images[i], fitInViewport(images[i]).width, format)
		const preload = new Image()
		preload.onload = () => (loaded[i] = url)
		preload.onerror = () => requested.delete(i)
		preload.src = url
	}

	$effect(() => {
		const current = index
		if (format) {
			untrack(() => {
				load(current)
				load(current + 1)
			})
		}
	})

	function go(delta: number) {
		index = Math.min(Math.max(index + delta, 0), images.length - 1)
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose()
		} else if (event.key === 'ArrowLeft') {
			go(-1)
		} else if (event.key === 'ArrowRight') {
			go(1)
		}
	}

	let swipeStart: { x: number; y: number } | undefined
	let swiped = false

	function onpointerdown(event: PointerEvent) {
		swipeStart = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : undefined
		swiped = false
	}

	function onpointerup(event: PointerEvent) {
		if (!swipeStart) {
			return
		}
		const dx = event.clientX - swipeStart.x
		const dy = event.clientY - swipeStart.y
		swipeStart = undefined
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
			swiped = true
			go(dx < 0 ? 1 : -1)
		}
	}

	function onBackdropClick() {
		if (!swiped) {
			onclose()
		}
	}

	onMount(() => {
		void bestFormat().then(best => (format = best))
		const overflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => (document.body.style.overflow = overflow)
	})
</script>

<svelte:window
	{onkeydown}
	{onpointerdown}
	{onpointerup}
	onresize={() => (viewport = { width: window.innerWidth, height: window.innerHeight })} />

<div class="viewer" role="dialog" aria-modal="true" aria-label="Photo viewer">
	<button class="backdrop" aria-label="Close" onclick={onBackdropClick}></button>
	{#if src}
		<img {src} alt={image.alt} width={box.width} height={box.height} />
	{:else}
		<div class="placeholder" style:width="{box.width}px" style:height="{box.height}px"></div>
	{/if}

	<span class="counter">{index + 1} / {images.length}</span>
	<button class="control close" aria-label="Close" onclick={onclose}>✕</button>
	{#if index > 0}
		<button class="control prev" aria-label="Previous photo" onclick={() => go(-1)}>‹</button>
	{/if}
	{#if index < images.length - 1}
		<button class="control next" aria-label="Next photo" onclick={() => go(1)}>›</button>
	{/if}
</div>

<style>
	.viewer {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.9);
		touch-action: none;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		cursor: zoom-out;
	}

	img,
	.placeholder {
		position: relative;
		max-width: 100vw;
		max-height: 100vh;
		object-fit: contain;
	}

	.counter {
		position: absolute;
		top: 1rem;
		left: 1rem;
		color: #ddd;
	}

	.control {
		position: absolute;
		color: #ddd;
		font-size: 2rem;
		line-height: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.4);
	}

	.control:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	.close {
		top: 0.5rem;
		right: 0.5rem;
		font-size: 1.5rem;
	}

	.prev {
		left: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
	}

	.next {
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
	}
</style>
