import { useState } from 'react'

const SHADCN_COMPONENTS = [
  { name: 'Button', description: 'Displays a button or a component that looks like a button', category: 'UI' },
  { name: 'Card', description: 'Displays a card with header, content, and footer', category: 'UI' },
  { name: 'Dialog', description: 'A window overlaid on either the primary window', category: 'Overlay' },
  { name: 'Input', description: 'Displays a form input field', category: 'Form' },
  { name: 'Label', description: 'Renders an accessible label associated with controls', category: 'Form' },
  { name: 'Select', description: 'Displays a list of options to pick from', category: 'Form' },
  { name: 'Checkbox', description: 'A control that allows the user to toggle between checked and not checked', category: 'Form' },
  { name: 'Switch', description: 'A control that allows the user to toggle between on and off states', category: 'Form' },
  { name: 'Tabs', description: 'A set of layered sections of content', category: 'Navigation' },
  { name: 'Table', description: 'A responsive table component', category: 'Data' },
  { name: 'Badge', description: 'Displays a badge with a label', category: 'UI' },
  { name: 'Avatar', description: 'An image element with a fallback for representing the user', category: 'UI' },
  { name: 'Tooltip', description: 'A popup that displays information related to an element', category: 'Overlay' },
  { name: 'Popover', description: 'Displays rich content in a portal, triggered by a button', category: 'Overlay' },
  { name: 'Sheet', description: 'Extends the Dialog component to display content that complements the main content', category: 'Overlay' },
  { name: 'Alert', description: 'Displays a callout for user attention', category: 'Feedback' },
  { name: 'Toast', description: 'A succinct message that is displayed temporarily', category: 'Feedback' },
  { name: 'Progress', description: 'Displays an indicator showing the completion progress', category: 'Feedback' },
  { name: 'Skeleton', description: 'Use to show a placeholder while content is loading', category: 'Feedback' },
  { name: 'Command', description: 'Fast, composable, unstyled command menu', category: 'Navigation' },
]

interface ShadcnBrowserProps {
  onClose: () => void
  onAddComponent: (name: string) => void
}

export default function ShadcnBrowser({ onClose, onAddComponent }: ShadcnBrowserProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(SHADCN_COMPONENTS.map(c => c.category)))]

  const filtered = SHADCN_COMPONENTS.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-base font-semibold">shadcn/ui Components</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#e8e8e8]">✕</button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-[#2a2a2a] space-y-3">
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedCategory === cat
                    ? 'text-white'
                    : 'bg-[#111] border border-[#2a2a2a] text-[#555] hover:text-[#888]'
                }`}
                style={selectedCategory === cat ? { background: 'oklch(0.55 0.18 265)' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Components grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(component => (
              <div
                key={component.name}
                className="flex items-start justify-between p-4 bg-[#111] border border-[#2a2a2a] rounded-xl hover:border-[#3a3a3a] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#e8e8e8]">{component.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[#555]">{component.category}</span>
                  </div>
                  <p className="text-xs text-[#555] mt-1 line-clamp-2">{component.description}</p>
                </div>
                <button
                  onClick={() => onAddComponent(component.name)}
                  className="ml-3 flex-shrink-0 px-2.5 py-1.5 text-xs rounded-lg text-white transition-all"
                  style={{ background: 'oklch(0.55 0.18 265)' }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
