import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PathologyBooking from './pages/PathologyBooking'
import LegalPage from './pages/LegalPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book/pathology" element={<PathologyBooking />} />
      <Route path="/pages/:slug" element={<LegalPage />} />
    </Routes>
  )
}
