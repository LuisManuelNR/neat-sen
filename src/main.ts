import '@chasi/ui/styles/app.scss'
import '@chasi/ui/styles/defaultTheme.scss'

import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
