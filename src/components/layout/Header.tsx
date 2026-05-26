import { ThemeToggle } from './ThemeToggle'
import { MobileSidebar } from './Sidebar'

interface HeaderProps {
  title: string
  actions?: React.ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
      <MobileSidebar />
      <h1 className="text-lg font-semibold flex-1">{title}</h1>
      {actions}
      <ThemeToggle />
    </header>
  )
}
