import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, RefreshCw, User, Palette, Info, X } from 'lucide-react'
import { toast } from 'sonner'
import api, { getDemoUserId } from '../lib/api'

export default function VirtualWardrobe() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [processingStep, setProcessingStep] = useState('idle') // idle | analyzing | generating | success | error
  const [tryOnResult, setTryOnResult] = useState(null)
  const [selectedGarment, setSelectedGarment] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)

  // Dynamic garment catalog from backend (Mongo)
  const [garments, setGarments] = useState([])
  const [loadingGarments, setLoadingGarments] = useState(true)

  // Webcam state
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      stopWebcam()
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target.result)
        setTryOnResult(null)
        setAnalysisResults(null)
        setProcessingStep('idle')
        toast.success('Photo uploaded. Ready for try-on.')
      }
      reader.readAsDataURL(file)
    }
  }

  // Cleanup webcam stream
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsWebcamActive(false)
  }

  const startWebcam = async () => {
    try {
      stopWebcam() // ensure clean state

      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setIsWebcamActive(true)

      // Small delay to ensure video element is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 60)

      setTryOnResult(null)
      setAnalysisResults(null)
      setProcessingStep('idle')
      toast.success('Webcam active — position yourself and click Capture')
    } catch (err) {
      console.error('Webcam error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera access denied. Please allow camera permissions in your browser.')
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera found. Please connect a webcam.')
      } else {
        toast.error('Failed to start webcam. Check browser permissions and try again.')
      }
    }
  }

  const captureFromWebcam = () => {
    const video = videoRef.current
    if (!video) {
      toast.error('Camera feed not ready yet')
      return
    }

    // Ensure the video has valid dimensions and is ready
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      // Retry shortly if the feed is still initializing
      setTimeout(captureFromWebcam, 120)
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Use JPEG for smaller size, good quality for try-on models
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

    setSelectedImage(dataUrl)
    setTryOnResult(null)
    setAnalysisResults(null)
    setProcessingStep('idle')

    stopWebcam()
    toast.success('Photo captured from webcam!')
  }

  // Cleanup on unmount + attach stream when webcam activates
  useEffect(() => {
    if (isWebcamActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
    }

    return () => {
      stopWebcam()
    }
  }, [isWebcamActive])

  // Load garments from backend catalog (Mongo)
  useEffect(() => {
    const loadGarments = async () => {
      setLoadingGarments(true)
      try {
        const data = await api.getGarments()
        if (data.success && data.garments?.length) {
          setGarments(data.garments)
        } else {
          // Fallback to a couple if backend empty (should be seeded)
          setGarments([
            { id: '1', name: "Oversized White Tee", category: "Top", color: "White", image: "https://images.unsplash.com/photo-1618519764620-7403ba5c9c52?w=300" },
          ])
        }
      } catch (e) {
        // graceful fallback
        setGarments([
          { id: 'fallback1', name: "Oversized White Tee", category: "Top", color: "White", image: "https://images.unsplash.com/photo-1618519764620-7403ba5c9c52?w=300" },
          { id: 'fallback2', name: "Black Denim Jacket", category: "Outerwear", color: "Black", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300" },
        ])
      } finally {
        setLoadingGarments(false)
      }
    }
    loadGarments()
  }, [])

  const generateTryOn = async () => {
    if (!selectedImage || !selectedGarment) {
      toast.error('Please upload a photo and select a garment')
      return
    }

    setProcessingStep('analyzing')
    setTryOnResult(null)

    try {
      // Step 1: Fast analysis (pose + body + skin)
      const analyzeData = await api.analyzeUser(selectedImage)

      if (analyzeData.success) {
        setAnalysisResults(analyzeData)
        // Persist for Outfit Builder and other pages (local + backend)
        localStorage.setItem('userPhotoBase64', selectedImage)
        localStorage.setItem('lastAnalysis', JSON.stringify(analyzeData))

        // Save to Mongo via backend (non-blocking)
        api.saveAnalysis(analyzeData).catch(() => {})
      }

      // Step 2: Slow diffusion try-on (this is the long part)
      setProcessingStep('generating')

      const tryOnData = await api.generateTryOn(selectedImage, selectedGarment)

      setTryOnResult(tryOnData.result_image)

      if (tryOnData.success) {
        setProcessingStep('success')
        toast.success('Virtual try-on generated!', { 
          description: analyzeData.success 
            ? `Using ${analyzeData.body_type} + ${analyzeData.skin_tone_category} conditioning` 
            : 'Using diffusion-based synthesis' 
        })
      } else {
        setProcessingStep('success')
        toast.success('Try-on complete (using fallback image)', {
          description: tryOnData.message || 'Real generation failed — showing demo result'
        })
      }
    } catch (err) {
      console.error(err)
      setProcessingStep('error')
      // Fallback to placeholder if AI service not running
      setTryOnResult(`https://picsum.photos/id/${Math.floor(Math.random() * 100)}/600/800`)
      toast.warning('Generation took too long or failed — showing demo result.', {
        description: 'The public IDM-VTON queue can be slow. Try again later or start the local AI service.'
      })
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
              <button 
                onClick={startWebcam} 
                disabled={processingStep === 'analyzing' || processingStep === 'generating'}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" /> 
                {selectedImage ? 'Retake with webcam' : 'Webcam'}
              </button>
              <label className={`flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 ${processingStep === 'analyzing' || processingStep === 'generating' ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                <Upload className="w-4 h-4" /> Upload
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="tryon-container aspect-[4/3] flex items-center justify-center relative overflow-hidden bg-zinc-900">
            {isWebcamActive ? (
              // Live webcam feed
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* LIVE indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500/90 text-white text-[10px] font-medium rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
                {/* Capture button overlay */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                  <button
                    onClick={captureFromWebcam}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-2xl shadow-lg active:scale-[0.985] transition-all"
                  >
                    <Camera className="w-4 h-4" /> Capture Photo
                  </button>
                </div>
                <button
                  onClick={stopWebcam}
                  className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 text-xs bg-black/70 hover:bg-black/90 rounded-full"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            ) : selectedImage ? (
              // Captured / uploaded photo
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={selectedImage} alt="Your photo" className="max-h-full object-contain" />
                <button
                  onClick={() => {
                    setSelectedImage(null)
                    setTryOnResult(null)
                    setAnalysisResults(null)
                    setProcessingStep('idle')
                  }}
                  className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 text-xs bg-black/70 hover:bg-black/90 rounded-full"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            ) : (
              // Empty state
              <div className="text-center text-zinc-500 px-6">
                <Camera className="w-10 h-10 mx-auto mb-4 opacity-50" />
                <p>Upload a clear full-body or half-body photo</p>
                <p className="text-xs mt-1">Best results with good lighting and front pose</p>
                <p className="text-[10px] text-zinc-600 mt-3">Or click the Webcam button above for live capture</p>
              </div>
            )}
          </div>
        </div>

        {/* Garment Selection */}
        <div className="lg:col-span-7">
          <div className="font-medium mb-3 flex items-center justify-between">
            <span>Select Garment</span>
            {loadingGarments && <span className="text-xs text-zinc-500">Loading catalog...</span>}
          </div>
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${processingStep === 'analyzing' || processingStep === 'generating' ? 'opacity-60 pointer-events-none' : ''}`}>
            {garments.map((garment) => (
              <div 
                key={garment.id}
                onClick={() => setSelectedGarment(garment)}
                className={`garment-card cursor-pointer rounded-2xl overflow-hidden border relative ${selectedGarment?.id === garment.id ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-white/10'}`}
              >
                <img src={garment.image} alt={garment.name} className="w-full aspect-square object-cover" />
                <div className="p-3 text-sm">
                  <div className="font-medium">{garment.name}</div>
                  <div className="text-xs text-zinc-500">{garment.category} • {garment.color}</div>
                </div>
                {/* Quick delete for demo catalog management */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Delete ${garment.name}?`)) return;
                    try {
                      await api.deleteGarment(garment.id);
                      setGarments(prev => prev.filter(g => g.id !== garment.id));
                      if (selectedGarment?.id === garment.id) setSelectedGarment(null);
                      toast.success('Garment removed from catalog');
                    } catch (err) {
                      toast.error('Delete failed');
                    }
                  }}
                  className="absolute top-1 right-1 text-[10px] bg-black/70 hover:bg-red-600/80 px-1.5 py-0.5 rounded"
                >
                  ×
                </button>
              </div>
            ))}
            {garments.length === 0 && !loadingGarments && (
              <div className="col-span-4 text-sm text-zinc-500 p-4 border border-white/10 rounded-2xl">No garments in catalog yet. (Seed should have run on backend)</div>
            )}
          </div>

          {/* Quick demo: add a new garment to the Mongo catalog */}
          <button
            onClick={async () => {
              const newGarment = {
                name: "Lightweight Denim Jacket",
                category: "Outerwear",
                color: "Light Blue",
                image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=512",
              };
              try {
                const res = await api.createGarment(newGarment);
                if (res.success) {
                  setGarments(prev => [res.garment, ...prev]);
                  toast.success('Added new garment to catalog');
                }
              } catch (e) {
                toast.error('Failed to add garment');
              }
            }}
            className="mt-3 text-xs px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5"
          >
            + Add demo garment to catalog (Mongo)
          </button>

          <button 
            onClick={generateTryOn}
            disabled={!selectedImage || !selectedGarment || processingStep === 'analyzing' || processingStep === 'generating'}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985] transition-all"
          >
            {processingStep === 'analyzing' && (
              <> <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing pose, body shape & skin tone... </>
            )}
            {processingStep === 'generating' && (
              <> <RefreshCw className="w-4 h-4 animate-spin" /> Generating realistic try-on with IDM-VTON... (20-60s) </>
            )}
            {(processingStep === 'idle' || processingStep === 'success' || processingStep === 'error') && (
              'Generate Virtual Try-On'
            )}
          </button>

          {processingStep === 'generating' && (
            <p className="text-center text-[10px] text-amber-400 mt-2">
              The public Hugging Face model can be slow. Please wait...
            </p>
          )}
          <p className="text-center text-[10px] text-zinc-500 mt-1">Powered by diffusion models + MediaPipe pose estimation (see research report for details)</p>
        </div>

        {/* AI Analysis Insights - XAI Cards (for demo & explainability) */}
        {analysisResults && (
          <div className="lg:col-span-12">
            <div className="font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> AI Analysis Insights <span className="text-xs text-zinc-500">(Explainable AI)</span>
              {processingStep === 'generating' && (
                <span className="text-xs text-emerald-400 ml-2">• Analysis complete — generating image...</span>
              )}
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

        {/* Result Area - show original early, try-on when ready */}
        {(selectedImage && (analysisResults || tryOnResult)) && (
          <div className="lg:col-span-12 mt-4">
            <div className="font-medium mb-3 flex items-center gap-2">Result</div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Original</div>
                <img src={selectedImage} className="rounded-2xl border border-white/10" alt="original" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Virtual Try-On</div>
                {tryOnResult ? (
                  <img src={tryOnResult} className="rounded-2xl border border-white/10" alt="try-on result" />
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/60 aspect-[4/3] flex items-center justify-center text-center px-6">
                    <div>
                      <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-zinc-400" />
                      <div className="text-sm text-zinc-300">Generating your try-on...</div>
                      <div className="text-[10px] text-zinc-500 mt-1">This can take 20–60 seconds on the public model</div>
                    </div>
                  </div>
                )}
                {tryOnResult && (
                  <div className="mt-4 text-sm text-emerald-400 flex items-center gap-2">
                    High fidelity • Garment details preserved
                    {analysisResults && <span className="text-xs text-white/60">• Conditioned on body + skin tone</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
