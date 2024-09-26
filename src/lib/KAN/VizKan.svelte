<script lang="ts">
	import { Brain } from './KAN'

	export let brain: Brain
</script>

<svg viewBox="0 0 400 400" width="500" height="500">
	<!-- Inputs (X1, X2, X3, X4) -->
	{#each Array(brain.inputDim) as _, index}
		<circle cx={index * 80 + 40} cy="320" r="10" fill="black" />
		<text x={index * 80 + 40} y="340" text-anchor="middle" fill="#000">X{index + 1}</text>
	{/each}

	<!-- Hidden layer nodes (numFunctions) -->
	{#each Array(brain.numFunctions) as _, index}
		<circle cx={index * 120 + 60} cy="180" r="10" fill="black" />

		<!-- Draw splines visualized as small square icons -->
		<rect x={index * 120 + 50} y="160" width="20" height="20" fill="none" stroke="black" />
		<!-- Placeholder for spline visualization, can replace with an actual spline icon or SVG -->
		<line x1={index * 120 + 50} y1="170" x2={index * 120 + 70} y2="170" stroke="black" />
		<line x1={index * 120 + 50} y1="175" x2={index * 120 + 70} y2="165" stroke="black" />

		<!-- Draw connections from inputs to hidden layer -->
		{#each Array(brain.inputDim) as __, inputIdx}
			<line x1={inputIdx * 80 + 40} y1="310" x2={index * 120 + 60} y2="190" stroke="gray" />
		{/each}
	{/each}

	<!-- Output layer node -->
	{#each Array(brain.outputDim) as _, index}
		<circle cx="200" cy="60" r="10" fill="black" />

		<!-- Output spline visualization -->
		<rect x="190" y="40" width="20" height="20" fill="none" stroke="black" />
		<!-- Placeholder for output spline icon -->
		<line x1="190" y1="50" x2="210" y2="50" stroke="black" />
		<line x1="190" y1="55" x2="210" y2="45" stroke="black" />

		<!-- Draw connections from hidden layer to output -->
		{#each Array(brain.numFunctions) as funcIdx}
			<line x1={funcIdx * 120 + 60} y1="170" x2="200" y2="70" stroke="black" />
		{/each}
	{/each}
</svg>

<style>
	svg {
		border: 1px solid #ccc;
	}
	text {
		font-family: sans-serif;
		font-size: 12px;
	}
</style>
