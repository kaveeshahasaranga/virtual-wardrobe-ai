import { useState } from 'react'
import { Shirt, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function OutfitBuilder() {
  const [analysis, setAnalysis] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const runAnalysisAndRecommend = async () => {
    setIsLoading(true)
    try {
      // In a real flow, this would come from the user's saved profile photo or last wardrobe upload.
      // For demo we use a placeholder image or ask user to imagine previous analysis.
      const mockUserData = {
        body_type: "Rectangle / Balanced",
        skin_tone_category: "Warm"
      }

      const res = await fetch('http://localhost:5000/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUserData)
      })
      const data = await res.json()

      if (data.success) {
        setAnalysis(mockUserData)
        setRecommendations(data.recommendations)
        toast.success('Personalized recommendations generated')
      } else {
        throw new Error(data.message)
      }
    } catch (e) {
      toast.error('Could not fetch recommendations (is AI service running?)')
      // Fallback demo data
      setAnalysis({ body_type: 'Rectangle / Balanced', skin_tone_category: 'Warm' })
      setRecommendations([
        { id: 101, name: "Oversized Linen Shirt", reason: "Flattering for Rectangle / Balanced with Warm undertones", score: 0.92 },
        { id: 102, name: "High-waist Wide Leg Pants", reason: "Balances proportions and current seasonal trend", score: 0.87 },
        { id: 103, name: "Soft Structured Blazer", reason: "Adds structure recommended for your body shape", score: 0.81 },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Outfit Builder &amp; Recommendations</h1>
          <p className="text-zinc-400">Body shape + skin tone + preference aware suggestions (powered by FashionCLIP-style matching + hybrid scoring)</p>
        </div>
        <button 
          onClick={runAnalysisAndRecommend}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-2xl font-medium disabled:opacity-70"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Analyze &amp; Recommend
        </button>
      </div>

      {analysis && (
        <div className="mb-6 p-4 rounded-2xl bg-zinc-900 border border-white/10 text-sm">
          <span className="text-emerald-400">Analysis used:</span> Body type <strong>{analysis.body_type}</strong> • Skin undertone <strong>{analysis.skin_tone_category}</strong>
        </div>
      )}

      {recommendations.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-5">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rounded-3xl border border-white/10 p-5 bg-zinc-900/50">
              <div className="font-semibold text-lg mb-1">{rec.name}</div>
              <div className="text-sm text-zinc-400 mb-3">{rec.reason}</div>
              <div className="text-xs text-emerald-400">Match score: {(rec.score * 100).toFixed(0)}%</div>
              <button className="mt-4 text-xs border border-white/20 hover:bg-white/5 px-4 py-1.5 rounded-xl">Add to virtual wardrobe →</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 p-12 bg-zinc-900/40 text-center">
          <Shirt className="w-16 h-16 mx-auto text-zinc-700 mb-6" />
          <div className="text-xl font-medium mb-2">Get AI-powered outfit ideas</div>
          <p className="text-zinc-500 max-w-sm mx-auto mb-6">
            Click the button above to run a demo analysis using body shape + skin tone (from research report requirements).
            In the full system this pulls from your profile photo and saved preferences.
          </p>
          <button 
            onClick={runAnalysisAndRecommend}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-2xl font-medium"
          >
            <Sparkles className="w-4 h-4" /> Generate Recommendations
          </button>
        </div>
      )}

      <div className="mt-10 text-xs text-zinc-500">
        Future: Real FashionCLIP embeddings, compatibility Transformer, trend reranking, and XAI explanations for each suggestion.
      </div>
    </div>
  )
}
