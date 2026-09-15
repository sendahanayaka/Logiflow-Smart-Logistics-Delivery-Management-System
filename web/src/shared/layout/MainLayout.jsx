import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isSidebarOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isSidebarOpen])

  return (
    <div className="app-shell">
      <Sidebar
        id="app-sidebar"
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <div className="app-shell__main">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setSidebarOpen((isOpen) => !isOpen)}
        />
        <main className="app-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
