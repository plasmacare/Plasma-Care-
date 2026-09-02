import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PathologyBooking from './pages/PathologyBooking'
import LegalPage from './pages/LegalPage'
import PaymentStatus from './pages/PaymentStatus'
import SiteBackground from './components/SiteBackground'
import Analytics from './components/Analytics'

// Staff/Admin/B2B portal — lazy-loaded so a first-time customer visiting
// the booking site never downloads any of this code.
const PortalRoutes = lazy(() => import('./portal/PortalRoutes'))

export default function App() {
  return (
    <>
      <SiteBackground />
      <Analytics />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/pathology" element={<PathologyBooking />} />
        <Route path="/pages/:slug" element={<LegalPage />} />
        <Route path="/pay/:bookingId" element={<PaymentStatus />} />
        <Route
          path="/portal/*"
          element={
            <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
              <PortalRoutes />
            </Suspense>
          }
        />
      </Routes>
    </>
  )
}
