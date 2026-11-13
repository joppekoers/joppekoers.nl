<script lang="ts">
	import type { Component } from 'svelte'
	import { normalizePath } from '@shared/seo'
	import Home from './routes/+page.svelte'
	import Contact from './routes/contact/+page.svelte'
	import Drop from './routes/drop/+page.svelte'
	import TicketsEmbeddedProduction from './routes/tickets-embedded-production/+page.svelte'
	import TicketsIframeStaging from './routes/tickets-iframe-staging/+page.svelte'
	import NotFound from './routes/+error.svelte'

	const routes: Record<string, Component> = {
		'/': Home,
		'/contact': Contact,
		'/drop': Drop,
		'/tickets-embedded-production': TicketsEmbeddedProduction,
		'/tickets-iframe-staging': TicketsIframeStaging,
	}

	const Page = routes[normalizePath(window.location.pathname)] ?? NotFound
</script>

<Page />
