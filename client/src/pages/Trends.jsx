import { TrendingUp } from 'lucide-react'

export default function Trends() {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Fashion Trend Forecasting</h1>
      <p className="text-zinc-400 mb-8">ML predictions for colors, styles, and seasonal trends with Sri Lankan cultural context.</p>

      <div className="rounded-3xl border border-white/10 p-12 bg-zinc-900/40 text-center">
        <TrendingUp className="w-16 h-16 mx-auto text-zinc-700 mb-6" />
        <div className="text-xl font-medium mb-2">Trend Dashboard in development</div>
        <p className="text-zinc-500 max-w-md mx-auto">
          Will integrate time-series transformers, social media signals, and local cultural calendar features.
        </p>
      </div>
    </div>
  )
}
