import { User } from 'lucide-react'

export default function Profile() {
  return (
    <div className="max-w-md">
      <h1 className="text-4xl font-semibold tracking-tight mb-6">Your Profile</h1>
      
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-zinc-400" />
            </div>
            <div>
              <div className="font-medium">Demo User</div>
              <div className="text-sm text-zinc-500">demo@wardrobe.ai</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-zinc-400">
          Future features: Body shape &amp; skin tone analysis results, style preferences, saved wardrobes, and cultural context settings.
        </div>
      </div>
    </div>
  )
}
