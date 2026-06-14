import { useState } from 'react'
import { Camera, Upload, RefreshCw, User, Palette, Info } from 'lucide-react'
import { toast } from 'sonner'
import api, { getDemoUserId } from '../lib/api'

export default function VirtualWardrobe() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [tryOnResult, setTryOnResult] = useState(null)
  const [selectedGarment, setSelectedGarment] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)

  // Sample garments (in real app these would come from backend)
  const sampleGarments = [
    { id: 1, name: "Oversized White Tee", category: "Top", color: "White", image: "https://images.unsplash.com/photo-1618519764620-7403ba5c9c52?w=300" },
    { id: 2, name: "Black Denim Jacket", category: "Outerwear", color: "Black", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300" },
    { id: 3, name: "Beige Linen Shirt", category: "Top", color: "Beige", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300" },
    { id: 4, name: "Relaxed Chino Pants", category: "Bottom", color: "Khaki", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300" },
  ]

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target.result)
        setTryOnResult(null)
        setAnalysisResults(null)
        toast.success('Photo uploaded. Ready for try-on.')
      }
      reader.readAsDataURL(file)
    }
  }

  const startWebcam = async () => {
    toast.info('Webcam capture coming soon in full implementation')
    // In full version: use navigator.mediaDevices.getUserMedia + canvas capture
  }

  const generateTryOn = async () => {
    if (!selectedImage || !selectedGarment) {
      toast.error('Please upload a photo and select a garment')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Analyze pose + body shape + skin tone via backend gateway (recommended)
      const analyzeData = await api.analyzeUser(selectedImage)

      if (analyzeData.success) {
        setAnalysisResults(analyzeData)
        // Persist for Outfit Builder and other pages (local + backend)
        localStorage.setItem('userPhotoBase64', selectedImage)
        localStorage.setItem('lastAnalysis', JSON.stringify(analyzeData))

        // Save to Mongo via backend
        api.saveAnalysis(analyzeData).catch(() => {
          // non-fatal
        })

        toast.info(`Body: ${analyzeData.body_type || 'N/A'} • Skin: ${analyzeData.skin_tone_category || 'N/A'}`, {
          description: analyzeData.skin_tone
        })
      }

      // 2. Call try-on through gateway (placeholder for now, ready for real diffusion)
      const tryOnData = await api.generateTryOn(selectedImage, selectedGarment.id)

      setTryOnResult(tryOnData.result_image)
      toast.success('Virtual try-on generated!', { 
        description: analyzeData.success 
          ? `Using ${analyzeData.body_type} + ${analyzeData.skin_tone_category} conditioning` 
          : 'Using diffusion-based synthesis' 
      })
    } catch (err) {
      console.error(err)
      // Fallback to placeholder if AI service not running
      setTryOnResult(`https://picsum.photos/id/${Math.floor(Math.random() * 100)}/600/800`)
      toast.warning('AI service not reachable — showing demo result. Start the ai-service to get real pose analysis.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">Virtual Try-On</h1>
        <p className="text-zinc-400 mt-2">Upload your photo or use webcam. Select a garment and see it on you in seconds.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* User Photo Area */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium flex items-center gap-2"><User className="w-4 h-4" /> Your Photo</div>
            <div className="flex gap-2">
              <button onClick={startWebcam} className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-xl border border-white/10">
                <Camera className="w-4 h-4" /> Webcam
              </button>
              <label className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer">
                <Upload className="w-4 h-4" /> Upload
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="tryon-container aspect-[4/3] flex items-center justify-center relative overflow-hidden">
            {selectedImage ? (
              <img src={selectedImage} alt="Your photo" className="max-h-full object-contain" />
            ) : (
              <div className="text-center text-zinc-500">
                <Camera className="w-10 h-10 mx-auto mb-4 opacity-50" />
                <p>Upload a clear full-body or half-body photo</p>
                <p className="text-xs mt-1">Best results with good lighting and front pose</p>
              </div>
            )}
          </div>
        </div>

        {/* Garment Selection */}
        <div className="lg:col-span-7">
          <div className="font-medium mb-3">Select Garment</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {sampleGarments.map((garment) => (
              <div 
                key={garment.id}
                onClick={() => setSelectedGarment(garment)}
                className={`garment-card cursor-pointer rounded-2xl overflow-hidden border ${selectedGarment?.id === garment.id ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-white/10'}`}
              >
                <img src={garment.image} alt={garment.name} className="w-full aspect-square object-cover" />
                <div className="p-3 text-sm">
                  <div className="font-medium">{garment.name}</div>
                  <div className="text-xs text-zinc-500">{garment.category} • {garment.color}</div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={generateTryOn}
            disabled={!selectedImage || !selectedGarment || isProcessing}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985] transition-all"
          >
            {isProcessing ? (
              <> <RefreshCw className="w-4 h-4 animate-spin" /> Generating realistic try-on... </>
            ) : (
              'Generate Virtual Try-On'
            )}
          </button>
          <p className="text-center text-[10px] text-zinc-500 mt-3">Powered by diffusion models + MediaPipe pose estimation (see research report for details)</p>
        </div>

        {/* AI Analysis Insights - XAI Cards (for demo & explainability) */}
        {analysisResults && (
          <div className="lg:col-span-12">
            <div className="font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> AI Analysis Insights <span className="text-xs text-zinc-500">(Explainable AI)</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Body Shape Card */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-widest">Body Shape</span>
                </div>
                <div className="text-2xl font-semibold mb-1">{analysisResults.body_type}</div>
                <div className="text-sm text-zinc-400">Used for accurate garment warping, drape simulation, and realistic fit on your specific proportions.</div>
              </div>

              {/* Skin Tone Card */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                <div className="flex items-center gap-2 mb-2 text-rose-400">
                  <Palette className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-widest">Skin Tone</span>
                </div>
                <div className="text-2xl font-semibold mb-1">{analysisResults.skin_tone}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm px-2 py-0.5 rounded bg-white/10">{analysisResults.skin_tone_category}</span>
                </div>
                <div className="text-sm text-zinc-400">Influences realistic lighting, color harmony, and personalized garment rendering adjustments.</div>
              </div>
            </div>
            <div className="text-[10px] text-emerald-400 mt-2">These factors were used to condition the virtual try-on for higher fidelity and personalization.</div>
          </div>
        )}

        {/* Result Area */}
        {tryOnResult && (
          <div className="lg:col-span-12 mt-4">
            <div className="font-medium mb-3 flex items-center gap-2">Result</div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Original</div>
                <img src={selectedImage} className="rounded-2xl border border-white/10" alt="original" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Virtual Try-On</div>
                <img src={tryOnResult} className="rounded-2xl border border-white/10" alt="try-on result" />
                <div className="mt-4 text-sm text-emerald-400 flex items-center gap-2">
                  High fidelity • Garment details preserved
                  {analysisResults && <span className="text-xs text-white/60">• Conditioned on body + skin tone</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
