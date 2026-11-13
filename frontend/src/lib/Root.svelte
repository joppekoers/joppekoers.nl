<script lang="ts">
	import Header from '$lib/Header.svelte'
	const title = import.meta.env.DEV ? 'DEV Joppe Koers.nl' : 'Joppe Koers.nl'
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content="This is a webside build, hosted and maintained by Joppe Koers" />
</svelte:head>

<div id="root">
	<Header />
	<div id="imported">
		<slot />
	</div>
	<!-- <div>Built, hosted and maintained by Joppe Koers</div> -->
</div>

<style>
	:root {
		all: revert;

		--main-dark: #242424;
		--main-light: #dddddd;

		font-family: Kadwa, Arial, sans-serif;
		font-size: 16px;
		line-height: 24px;
		font-weight: 400;

		color-scheme: dark;
		color: var(--main-light);
		background-color: var(--main-dark);

		font-synthesis: none;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		-webkit-text-size-adjust: 100%;
	}

	#root {
		width: 100%;
		max-width: 1300px;
		padding: 10px;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		margin: 0 auto;
	}
	#imported {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
	}

	#root * {
		max-width: 100%;
	}
</style>
