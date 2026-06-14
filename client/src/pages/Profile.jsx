import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import api, { getDemoUserId } from '../lib/api'

export default function Profile() {
  const [analysis, setAnalysis] = useState(null)
  const [outfits, setOutfits] = useState([])
  const [loading, setLoading] = useState(true)
  const userId = getDemoUserId()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [aRes, oRes] = await Promise.all([
          api.getLatestAnalysis(),
          api.getSavedOutfits(),
        ])
        if (aRes?.success && aRes.analysis) setAnalysis(aRes.analysis)
        if (oRes?.success) setOutfits(oRes.outfits || [])
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-semibold tracking-tight mb-6">Your Profile</h1>

      <div className="rounded-2xl border border-white/10 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-zinc-400" />
          </div>
          <div>
            <div className="font-medium">Demo User</div>
            <div className="text-sm text-zinc-500 font-mono break-all">{userId}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Latest Analysis */}
        <div className="rounded-2xl border border-white/10 p-6">
          <div className="text-sm uppercase tracking-widest text-emerald-400 mb-3">Latest Analysis</div>
          {loading ? (
            <div className="text-sm text-zinc-500">Loading...</div>
          ) : analysis ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-zinc-400">Body Shape:</span> <span className="font-medium">{analysis.bodyType}</span></div>
              <div><span className="text-zinc-400">Skin Tone:</span> <span className="font-medium">{analysis.skinTone}</span></div>
              <div><span className="text-zinc-400">Category:</span> <span className="font-medium">{analysis.skinToneCategory}</span></div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">No analysis saved yet. Go to Virtual Try-On.</div>
          )}
        </div>

        {/* Saved Looks */}
        <div className="rounded-2xl border border-white/10 p-6">
          <div className="text-sm uppercase tracking-widest text-emerald-400 mb-3">Saved Looks</div>
          {loading ? (
            <div className="text-sm text-zinc-500">Loading...</div>
          ) : outfits.length > 0 ? (
            <div>
              <div className="text-3xl font-semibold">{outfits.length}</div>
              <div className="text-sm text-zinc-400">outfit{outfits.length === 1 ? '' : 's'} saved</div>
              <a href="/outfits" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">Manage in Outfit Builder →</a>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">No saved looks yet. Build and save outfits in the Outfit Builder.</div>
          )}
        </div>
      </div>

      <div className="mt-8 text-xs text-zinc-500">
        Your data is now persisted in MongoDB (tied to your demo user ID). This will survive page refreshes and different browsers on the same machine when using the same userId.
      </div>
    </div>
  )
}
