import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PathologyBooking from './pages/PathologyBooking'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book/pathology" element={<PathologyBooking />} />
    </Routes>
  )
}
