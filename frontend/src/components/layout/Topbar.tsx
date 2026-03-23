import { useLocation } from 'react-router-dom'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/applications': 'Applications',
  '/applications/new': 'New Application',
  '/recruiters': 'Recruiters',
  '/clients': 'Clients',
  '/cv-library': 'CV Library',
  '/prep-notes': 'Prep Notes Library',
}

function getTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname]
  if (pathname.startsWith('/applications/') && pathname.endsWith('/edit')) return 'Edit Application'
  if (pathname.startsWith('/applications/')) return 'Application Details'
  if (pathname.startsWith('/recruiters/')) return 'Recruiter Details'
  if (pathname.startsWith('/clients/')) return 'Client Details'
  return 'AppTracker'
}

export function Topbar() {
  const { pathname } = useLocation()
  const title = getTitle(pathname)

  return (
    <header className="flex h-16 items-center border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  )
}
