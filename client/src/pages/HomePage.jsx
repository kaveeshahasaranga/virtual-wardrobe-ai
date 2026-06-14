import { Link } from 'react-router-dom'
import { Camera, Shirt, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-16">
      <div className="text-center pt-12 pb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 text-sm mb-6">
          Research-backed AI Fashion System
        </div>
        <h1 className="text-6xl font-semibold tracking-tighter mb-4">
          Your AI-Powered<br />Virtual Wardrobe
        </h1>
        <p className="text-xl text-zinc-400 max-w-md mx-auto">
          Try on clothes virtually, get personalized recommendations, and discover trends — all powered by advanced computer vision and machine learning.
        </p>

        <div className="flex items-center justify-center gap-4 mt-8">
          <Link 
            to="/wardrobe" 
            className="flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-2xl font-medium hover:bg-zinc-100 transition-colors"
          >
            <Camera className="w-5 h-5" /> Start Virtual Try-On
          </Link>
          <Link 
            to="/outfits" 
            className="flex items-center gap-2 border border-white/20 hover:bg-white/5 px-8 py-3.5 rounded-2xl font-medium transition-colors"
          >
            Explore Recommendations
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Camera, title: "Virtual Try-On", desc: "Realistic clothing visualization using diffusion models + pose estimation" },
          { icon: Shirt, title: "Smart Recommendations", desc: "Body shape, skin tone, and preference-aware outfit suggestions" },
          { icon: TrendingUp, title: "Trend Forecasting", desc: "ML-powered predictions with Sri Lankan cultural context" },
        ].map((feature, i) => (
          <div key={i} className="rounded-3xl border border-white/10 p-8 bg-zinc-900/50">
            <feature.icon className="w-8 h-8 text-indigo-400 mb-6" />
            <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
            <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-zinc-500 pt-8">
        Based on comprehensive 2022–2026 literature review • Designed for inclusivity and real-world deployment
      </div>
    </div>
  )
}
