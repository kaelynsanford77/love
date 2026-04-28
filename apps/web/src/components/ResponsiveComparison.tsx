import { useState } from 'react'
import { Monitor, Tablet, Smartphone, X } from 'lucide-react'

interface ResponsiveComparisonProps {
  url: string
  onClose: () => void
}

const SIZES = [
  { label: 'Mobile', icon: Smartphone, width: 390, note: 'iPhone 14' },
  { label: 'Tablet', icon: Tablet, width: 768, note: 'iPad' },
  { label: 'Desktop', icon: Monitor, width: 1280, note: 'Full HD' },
]

export default function ResponsiveComparison({ url, onClose }: ResponsiveComparisonProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2a2a2a] flex-shrink-0">
        <h2 className="text-sm font-semibold">Responsive Comparison</h2>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#e8e8e8]">
          <X size={16} />
        </button>
      </div>

      {/* Labels */}
      <div className="flex border-b border-[#2a2a2a] flex-shrink-0">
        {SIZES.map(size => (
          <div key={size.label} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-[#555]">
            <size.icon size={13} />
            <span>{size.label}</span>
            <span className="text-[#333]">({size.width}px)</span>
            <span className="text-[#2a2a2a]">— {size.note}</span>
          </div>
        ))}
      </div>

      {/* iframes */}
      <div className="flex-1 flex overflow-hidden">
        {SIZES.map((size, i) => (
          <div key={size.label} className={`flex-1 overflow-hidden flex justify-center bg-[#111] ${i > 0 ? 'border-l border-[#2a2a2a]' : ''}`}>
            <div
              className="h-full overflow-hidden"
              style={{ width: `${size.width}px`, maxWidth: '100%' }}
            >
              <iframe
                src={url}
                className="w-full h-full border-0 bg-white"
                style={{ width: `${size.width}px`, transform: 'scale(1)', transformOrigin: 'top left' }}
                title={`${size.label} preview`}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
