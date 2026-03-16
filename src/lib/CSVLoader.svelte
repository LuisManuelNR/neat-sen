<script lang="ts">
	import { CDialog } from '@chasi/ui'

	export let onload: (d: number[]) => void = () => {}

	type CsvResult = Record<string, number[]>

	function loadCSV(callback: (result: CsvResult) => void) {
		return (e: Event) => {
			const input = e.target as HTMLInputElement

			if (!input.files || input.files.length === 0) {
				throw new Error('No file provided')
			}

			const file = input.files[0]
			const reader = new FileReader()
			const result: CsvResult = {}

			reader.onload = (event: ProgressEvent<FileReader>) => {
				const text = event.target?.result as string
				try {
					const t = JSON.parse(text)
					callback(t)
					return
				} catch (error) {}
				const rows = text.split('\n')
				const headers = rows[0].split(',')
				for (let h = 0; h < headers.length; h++) {
					result[headers[h]] = []
				}
				for (let v = 1; v < rows.length - 2; v++) {
					const values = rows[v].split(',')
					for (let i = 0; i < values.length; i++) {
						const val = Number(values[i])
						if (!Number.isNaN(val)) {
							result[headers[i]].push(val)
						}
					}
				}
				callback(result)
			}
			reader.readAsText(file)
		}
	}

	let fullData: CsvResult = {}
	let columns: string[] = []
	let open = false
	function openDialog(d: CsvResult) {
		fullData = d
		columns = Object.keys(d)
		open = true
	}

	function setData(col: string) {
		return () => {
			onload(fullData[col])
			open = false
		}
	}
</script>

<input type="file" on:change={loadCSV(openDialog)} />

<CDialog bind:active={open}>
	{#each columns as column}
		<button class="btn" on:click={setData(column)}>{column}</button>
	{/each}
</CDialog>
