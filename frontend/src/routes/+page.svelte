<script lang="ts">
	import ImageGallery from '$lib/ImageGallery.svelte'
	import Root from '$lib/Root.svelte'
	import ProjectCard from '$lib/ProjectCard.svelte'
	import Note from '$lib/Note.svelte'
	import { getProjects } from '$root/server/cms'

	const data = getProjects().then(projects => ({ projects }))
</script>

<Root>
	{#await data then data}
		<ImageGallery items={['note' as const, ...data.projects]}>
			{#snippet item(entry)}
				{#if entry === 'note'}
					<Note>
						Hello and welcome to Joppe Koers' website. This is where you'll find my portfolio, personal
						projects and a mix of programming related stuff. Since I can remember I've always wanted to make
						stuff. To accomplish this I acquired a number of skills of which you can see the result below.
						Do you want me to make you something? See the projects below to see what I'm capable of. You can
						contact me form the
						<a href="/contact" class="hover:underline">/contact</a> page.
					</Note>
				{:else}
					<ProjectCard project={entry} />
				{/if}
			{/snippet}
		</ImageGallery>
	{/await}
</Root>
