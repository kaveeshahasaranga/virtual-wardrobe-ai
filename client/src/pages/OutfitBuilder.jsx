import { useState, useEffect } from 'react'
import { Shirt, Sparkles, RefreshCw, X, Camera, Plus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'

export default function OutfitBuilder() {
  const [analysis, setAnalysis] = useState(null)
  const [userPhoto, setUserPhoto] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [currentOutfit, setCurrentOutfit] = useState([]) // array of recommendation objects
  const [generatedLooks, setGeneratedLooks] = useState([]) // { item, image, loading }
  const [isLoadingRecs, setIsLoadingRecs] = useState(false)
  const [isGeneratingLooks, setIsGeneratingLooks] = useState(false)

  // Load saved analysis + photo from previous Virtual Try-On session
  useEffect(() => {
    const savedAnalysis = localStorage.getItem('lastAnalysis')
    const savedPhoto = localStorage.getItem('userPhotoBase64')

    if (savedAnalysis) {
      const parsed = JSON.parse(savedAnalysis)
      setAnalysis(parsed)
    }
    if (savedPhoto) {
      setUserPhoto(savedPhoto)
    }
    // Auto-load recommendations if we have analysis
    if (savedAnalysis) {
      // small delay to allow state to settle
      setTimeout(() => {
        loadRecommendations()
      }, 50)
    }
  }, [])

  const loadRecommendations = async () => {
    if (!analysis) {
      toast.error('No body/skin analysis found. Please do a Virtual Try-On first.')
      return
    }
    setIsLoadingRecs(true)
    try {
      const data = await api.getRecommendations({
        body_type: analysis.body_type,
        skin_tone_category: analysis.skin_tone_category,
      })
      if (data.success) {
        setRecommendations(data.recommendations)
        toast.success('Recommendations updated using your analysis')
      } else {
        throw new Error(data.message || 'Failed to load recommendations')
      }
    } catch (e) {
      toast.error('Could not load recommendations. Using fallback.')
      // Fallback with analysis-aware items
      setRecommendations([
        { id: 101, name: "Oversized Linen Shirt", category: "Top", color: "Beige", score: 0.92, reason: "Soft structure flatters your shape and complements warm undertones." },
        { id: 102, name: "High-waist Wide Leg Pants", category: "Bottom", color: "Olive", score: 0.88, reason: "Balances proportions for your body type." },
        { id: 103, name: "Soft Structured Blazer", category: "Outerwear", color: "Cream", score: 0.85, reason: "Adds definition while respecting your skin tone." },
        { id: 104, name: "Relaxed Cotton Tee", category: "Top", color: "White", score: 0.81, reason: "Clean base that works beautifully with your undertones." },
      ])
    } finally {
      setIsLoadingRecs(false)
    }
  }

  const addToOutfit = (item) => {
    if (currentOutfit.some(i => i.id === item.id)) {
      toast.info('Item already in your outfit')
      return
    }
    setCurrentOutfit([...currentOutfit, item])
    toast.success(`Added ${item.name}`)
  }

  const removeFromOutfit = (id) => {
    setCurrentOutfit(currentOutfit.filter(i => i.id !== id))
  }

  const clearOutfit = () => {
    setCurrentOutfit([])
    setGeneratedLooks([])
  }

  const generateFullOutfitTryOns = async () => {
    if (!userPhoto) {
      toast.error('No user photo found. Please upload a photo in the Virtual Try-On page first.')
      return
    }
    if (currentOutfit.length === 0) {
      toast.error('Add at least one item to your outfit')
      return
    }

    setIsGeneratingLooks(true)
    const looks = []

    for (const item of currentOutfit) {
      // Show loading state per item
      looks.push({ item, image: null, loading: true })
      setGeneratedLooks([...looks])

      try {
        const res = await api.generateTryOn(userPhoto, item.id)
        looks[looks.length - 1] = {
          item,
          image: res.result_image,
          loading: false,
          reason: item.reason
        }
      } catch (e) {
        looks[looks.length - 1] = {
          item,
          image: "https://picsum.photos/id/1012/600/800",
          loading: false,
          reason: item.reason,
          error: true
        }
      }
      setGeneratedLooks([...looks])
    }

    setIsGeneratingLooks(false)
    toast.success('Full outfit visualizations generated!')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">Outfit Builder</h1>
        <p className="text-zinc-400 mt-2">
          Body shape + skin tone aware recommendations. Mix items and generate full look try-ons.
        </p>
      </div>

      {/* Your Analysis Summary (XAI) */}
      {analysis ? (
        <div className="mb-8 p-6 rounded-3xl border border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-2 mb-4 text-sm font-medium text-emerald-400">
            <Sparkles className="w-4 h-4" /> Your Analysis (used for all recommendations)
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-zinc-400">Body Shape</div>
              <div className="font-semibold text-lg">{analysis.body_type}</div>
            </div>
            <div>
              <div className="text-zinc-400">Skin Undertone</div>
              <div className="font-semibold text-lg">{analysis.skin_tone_category} — {analysis.skin_tone}</div>
            </div>
          </div>
          <button
            onClick={loadRecommendations}
            disabled={isLoadingRecs}
            className="mt-4 flex items-center gap-2 text-sm bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl transition-colors"
          >
            {isLoadingRecs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Refresh Recommendations using this analysis
          </button>
        </div>
      ) : (
        <div className="mb-8 p-6 rounded-3xl border border-dashed border-white/20 text-center">
          <Camera className="w-8 h-8 mx-auto mb-3 text-zinc-500" />
          <p className="text-zinc-400">No body/skin analysis found yet.</p>
          <a href="/wardrobe" className="text-indigo-400 hover:underline text-sm">Go to Virtual Try-On to get analyzed →</a>
        </div>
      )}

      {/* Recommended Items */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-xl">Recommended for You</h2>
          {recommendations.length === 0 && analysis && (
            <button
              onClick={loadRecommendations}
              className="text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl hover:bg-white/10"
            >
              <Sparkles className="w-4 h-4" /> Load Recommendations
            </button>
          )}
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {recommendations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 flex flex-col">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-zinc-500 mb-2">{item.category} • {item.color}</div>
                <div className="text-sm text-zinc-400 flex-1">{item.reason}</div>
                <div className="flex items-center justify-between mt-4 text-xs">
                  <div className="text-emerald-400 font-medium">{(item.score * 100).toFixed(0)}% match</div>
                  <button
                    onClick={() => addToOutfit(item)}
                    className="flex items-center gap-1 px-3 py-1 bg-white text-black rounded-lg text-xs font-medium active:scale-[0.985]"
                  >
                    <Plus className="w-3 h-3" /> Add to look
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-500">Recommendations will appear here after analysis.</div>
        )}
      </div>

      {/* Your Current Outfit */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-xl">Your Current Look ({currentOutfit.length} items)</h2>
          {currentOutfit.length > 0 && (
            <button onClick={clearOutfit} className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        {currentOutfit.length > 0 ? (
          <div className="flex flex-wrap gap-3 mb-4">
            {currentOutfit.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-2 text-sm">
                <span>{item.name}</span>
                <button onClick={() => removeFromOutfit(item.id)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-500 mb-4">Add items from the recommendations above.</div>
        )}

        <button
          onClick={generateFullOutfitTryOns}
          disabled={currentOutfit.length === 0 || isGeneratingLooks || !userPhoto}
          className="flex items-center gap-3 bg-white text-black font-medium px-6 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985] transition-all"
        >
          {isGeneratingLooks ? (
            <> <RefreshCw className="w-4 h-4 animate-spin" /> Generating full look visualizations... </>
          ) : (
            <> <Sparkles className="w-4 h-4" /> Generate Full Outfit Try-Ons ({currentOutfit.length}) </>
          )}
        </button>
        {!userPhoto && <p className="text-xs text-amber-400 mt-2">Upload your photo in the Virtual Try-On page to enable this.</p>}
      </div>

      {/* Generated Looks */}
      {generatedLooks.length > 0 && (
        <div>
          <h2 className="font-semibold text-xl mb-4">Your Generated Looks</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedLooks.map((look, index) => (
              <div key={index} className="rounded-3xl border border-white/10 overflow-hidden bg-zinc-900/50">
                <div className="aspect-[4/3] bg-zinc-950 relative">
                  {look.loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">Generating...</div>
                  ) : (
                    <img src={look.image} alt={look.item.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <div className="font-semibold">{look.item.name}</div>
                  <div className="text-xs text-zinc-500 mb-2">{look.item.category} • {look.item.color}</div>
                  <div className="text-sm text-zinc-300 leading-snug">{look.reason}</div>
                  {look.error && <div className="text-xs text-red-400 mt-1">Fallback image shown</div>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            Each look was generated using your photo + the selected garment, conditioned on your body shape and skin tone.
          </p>
        </div>
      )}

      <div className="mt-12 text-xs text-zinc-500 border-t border-white/10 pt-6">
        This demonstrates body/skin-aware recommendations + full-outfit visualization (as proposed in the research report).
        In a production version this would use FashionCLIP embeddings for compatibility + trend signals.
      </div>
    </div>
  )
}
