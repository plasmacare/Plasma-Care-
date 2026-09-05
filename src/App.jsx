import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import PathologyBooking from './pages/PathologyBooking'
import B2BInfo from './pages/B2BInfo'
import LegalPage from './pages/LegalPage'
import PaymentStatus from './pages/PaymentStatus'
import ReportView from './pages/ReportView'
import SiteBackground from './components/SiteBackground'
import Analytics from './components/Analytics'

// Staff/Admin/B2B portal — lazy-loaded so a first-time customer visiting
// the booking site never downloads any of this code.
const PortalRoutes = lazy(() => import('./portal/PortalRoutes'))

export default function App() {
  const location = useLocation()
  const isPortalRoute = location.pathname.startsWith('/portal')

  return (
    <>
      <SiteBackground />
      {/* Customer-only: page-view logging + the "site-viewers" Presence
          channel. Must NOT mount on /portal/* — staff/admin/B2B sessions
          aren't customer traffic, and joining the same Presence channel
          twice in one tab (once here, once from the Views tab) throws
          "cannot add presence callbacks after subscribe()". */}
      {!isPortalRoute && <Analytics />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/pathology" element={<PathologyBooking />} />
        <Route path="/b2b" element={<B2BInfo />} />
        <Route path="/pages/:slug" element={<LegalPage />} />
        <Route path="/pay/:bookingId" element={<PaymentStatus />} />
        <Route path="/report/:bookingId" element={<ReportView />} />
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
