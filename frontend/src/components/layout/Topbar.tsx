import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { pathname } = useLocation()
  const title = getTitle(pathname)

  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="mr-3 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  )
}
