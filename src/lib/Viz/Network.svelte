<script lang="ts">
	import type { Brain } from '$lib/KAN/Brain'
	import Dag from '$lib/Dag.svelte'

	export let network: Brain
</script>

<Dag dag={network.dag}></Dag>
