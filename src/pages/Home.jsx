import { Link } from 'react-router-dom'
import PulseDivider from '../components/PulseDivider'
import './Home.css'

const SERVICES = [
  {
    key: 'pathology',
    name: 'Pathology Tests',
    desc: 'Blood, urine & stool — lab visit or home collection',
    icon: TubeIcon,
    live: true,
  },
  { key: 'radiology', name: 'Radiology', desc: 'X-Ray & imaging', icon: ScanIcon },
  { key: 'consultation', name: 'Doctor Consultation', desc: 'Expert care, personalized attention', icon: DoctorIcon },
  { key: 'daycare', name: 'Day Care', desc: 'Professional medical observation', icon: BedIcon },
  { key: 'pharmacy', name: 'Pharmacy', desc: 'Quality medicines for better health', icon: PillIcon },
  { key: 'insurance', name: 'Insurance', desc: 'Life & non-life', icon: ShieldIcon },
]

export default function Home() {
  return (
    <div className="home">
      <header className="home__hero">
        <div className="home__brand">
          <DropletIcon />
          <div>
            <h1>Plasma Care</h1>
            <p className="home__tagline">Precision in every diagnosis</p>
          </div>
        </div>
        <p className="home__sub">
          A unit of Trivana Ventures LLP · G13 K8 BDA Market Complex, Kalinga Nagar
        </p>
        <PulseDivider />
      </header>

      <section className="home__services">
        <h2 className="home__section-title">Our Services</h2>
        <div className="home__grid">
          {SERVICES.map((s) => (
            <ServiceCard key={s.key} service={s} />
          ))}
        </div>
      </section>

      <footer className="home__footer">
        <p>Call / WhatsApp <a href="tel:8112060205">8112060205</a></p>
      </footer>
    </div>
  )
}

function ServiceCard({ service }) {
  const Icon = service.icon
  const content = (
    <>
      <div className="service-card__icon">
        <Icon />
      </div>
      <h3 className="service-card__name">{service.name}</h3>
      <p className="service-card__desc">{service.desc}</p>
      {!service.live && <span className="service-card__badge">Coming Soon</span>}
      {service.live && <span className="service-card__cta">Book now →</span>}
    </>
  )

  if (service.live) {
    return (
      <Link to="/book/pathology" className="service-card service-card--live">
        {content}
      </Link>
    )
  }
  return (
    <div className="service-card service-card--disabled" aria-disabled="true">
      {content}
    </div>
  )
}

/* --- inline icon set, kept simple/geometric to match the brand mark --- */
function DropletIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 5 11 5 15.5C5 19.09 8.13 22 12 22C15.87 22 19 19.09 19 15.5C19 11 12 2 12 2Z" fill="var(--red-600)" />
    </svg>
  )
}
function TubeIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M9 2h6M10 3v12a2 2 0 004 0V3" /><path d="M9 12h6" /></svg>
}
function ScanIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
}
function DoctorIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><circle cx="12" cy="8" r="3" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7" /></svg>
}
function BedIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18h18M3 18v2M21 18v2" /><path d="M7 10V7a1 1 0 011-1h3" /></svg>
}
function PillIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)" /><path d="M9 9l6 6" /></svg>
}
function ShieldIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></svg>
}
