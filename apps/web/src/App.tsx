import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Dashboard from './components/Dashboard'
import IDE from './components/IDE'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            color: '#e8e8e8',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:id" element={<IDE />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
