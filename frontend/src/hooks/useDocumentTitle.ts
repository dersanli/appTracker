import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `AppTracker | ${title}` : 'AppTracker'
    return () => {
      document.title = 'AppTracker'
    }
  }, [title])
}
