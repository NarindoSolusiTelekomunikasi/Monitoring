import { startTransition, useEffect, useState } from 'react'

const DEFAULT_REFRESH_MS = Number(import.meta.env.VITE_AUTO_REFRESH_MS ?? 30000)

function useApiResource(loader, deps = [], options = {}) {
  const [state, setState] = useState({
    data: null,
    error: '',
    loading: true,
  })
  const refreshMs = options.refreshMs ?? DEFAULT_REFRESH_MS

  useEffect(() => {
    let isCancelled = false
    let intervalId = null

    const runLoader = ({ preserveData = false } = {}) => {
      setState((current) => ({
        data: preserveData ? current.data : null,
        error: '',
        loading: true,
      }))

      loader()
        .then((data) => {
          if (isCancelled) {
            return
          }
          startTransition(() => {
            setState({
              data,
              error: '',
              loading: false,
            })
          })
        })
        .catch((error) => {
          if (isCancelled) {
            return
          }
          startTransition(() => {
            setState((current) => ({
              data: preserveData ? current.data : null,
              error: error.message,
              loading: false,
            }))
          })
        })
    }

    runLoader()

    if (refreshMs > 0) {
      intervalId = window.setInterval(() => {
        runLoader({ preserveData: true })
      }, refreshMs)
    }

    return () => {
      isCancelled = true
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [...deps, refreshMs])

  return state
}

export default useApiResource
