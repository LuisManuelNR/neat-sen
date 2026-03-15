<script lang="ts">
	import { page } from '$app/stores'
	import '@chasi/ui/styles/app.scss'
	import '@chasi/ui/styles/defaultTheme.scss'

	const links = [
		{ href: '/', text: 'Home' },
		{ href: '/bspline', text: 'BSpline' },
		{ href: '/rbf', text: 'RBF' },
		{ href: '/DAG', text: 'dag' },
		{ href: '/builder', text: 'Network Builder' },
		{ href: '/gym1', text: 'Gym 1' },
		{ href: '/gym2', text: 'Gym 2' },
		{ href: '/gym3', text: 'Gym 3' },
		{ href: '/playground', text: 'Playground' }
	]
</script>

<nav class="s-6 mb-4 py-2 px-4">
	{#each links as { href, text }}
		<a class="list-item row" {href} class:selected={$page.url.pathname === href}>{text}</a>
	{/each}
</nav>

<main class="container">
	<slot />
</main>
