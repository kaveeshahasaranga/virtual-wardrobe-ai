import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Shirt, User, TrendingUp, Home, Camera } from 'lucide-react'

import HomePage from './pages/HomePage'
import VirtualWardrobe from './pages/VirtualWardrobe'
import OutfitBuilder from './pages/OutfitBuilder'
import Trends from './pages/Trends'
import Profile from './pages/Profile'

function App() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/wardrobe', label: 'Virtual Try-On', icon: Camera },
    { path: '/outfits', label: 'Outfit Builder', icon: Shirt },
    { path: '/trends', label: 'Trends', icon: TrendingUp },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Navigation */}
      <nav className="border-b border-white/10 bg-zinc-900/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-xl tracking-tight">WardrobeAI</div>
              <div className="text-[10px] text-zinc-500 -mt-1">Personal Fashion AI</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                    isActive 
                      ? 'bg-white text-black' 
                      : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-emerald-400 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Connected
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wardrobe" element={<VirtualWardrobe />} />
          <Route path="/outfits" element={<OutfitBuilder />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        Built from the AI Virtual Wardrobe Research Report • 2026
      </footer>
    </div>
  )
}

export default App
