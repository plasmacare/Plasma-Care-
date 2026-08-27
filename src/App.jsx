import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PathologyBooking from './pages/PathologyBooking'
import LegalPage from './pages/LegalPage'
import PaymentStatus from './pages/PaymentStatus'
import SiteBackground from './components/SiteBackground'

export default function App() {
  return (
    <>
      <SiteBackground />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/pathology" element={<PathologyBooking />} />
        <Route path="/pages/:slug" element={<LegalPage />} />
        <Route path="/pay/:bookingId" element={<PaymentStatus />} />
      </Routes>
    </>
  )
}
