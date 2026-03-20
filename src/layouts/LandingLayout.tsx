import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export function LandingLayout() {
  return (
    <div className="min-h-screen bg-kavach">
      <Navbar />
      <Outlet />
    </div>
  )
}
