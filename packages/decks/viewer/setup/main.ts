import { defineAppSetup } from '@slidev/types'
import { installViewer } from '../interaction'

export default defineAppSetup(({ router }) => {
  const dispose = installViewer(router)
  if (import.meta.hot) import.meta.hot.dispose(dispose)
})
