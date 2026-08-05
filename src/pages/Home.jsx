import { Link } from 'react-router-dom'
import PulseDivider from '../components/PulseDivider'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../lib/i18n.jsx'
import './Home.css'

export default function Home() {
  const { t } = useLanguage()

  const SERVICES = [
    { key: 'pathology', name: t('svc_pathology_name'), desc: t('svc_pathology_desc'), icon: TubeIcon, live: true },
    { key: 'radiology', name: t('svc_radiology_name'), desc: t('svc_radiology_desc'), icon: ScanIcon },
    { key: 'consultation', name: t('svc_consultation_name'), desc: t('svc_consultation_desc'), icon: DoctorIcon },
    { key: 'daycare', name: t('svc_daycare_name'), desc: t('svc_daycare_desc'), icon: BedIcon },
    { key: 'pharmacy', name: t('svc_pharmacy_name'), desc: t('svc_pharmacy_desc'), icon: PillIcon },
    { key: 'insurance', name: t('svc_insurance_name'), desc: t('svc_insurance_desc'), icon: ShieldIcon },
  ]

  return (
    <div className="home">
      <div className="home__top-bar">
        <LanguageSwitcher />
      </div>

      <header className="home__hero">
        <div className="home__brand">
          <DropletIcon />
          <div>
            <h1>Plasma Care</h1>
            <p className="home__tagline">{t('tagline')}</p>
          </div>
        </div>
        <p className="home__sub">
          {t('unitOf')} · G13 K8 BDA Market Complex, Kalinga Nagar
        </p>
        <PulseDivider />
      </header>

      <section className="home__services">
        <h2 className="home__section-title">{t('ourServices')}</h2>
        <div className="home__grid">
          {SERVICES.map((s) => (
            <ServiceCard key={s.key} service={s} t={t} />
          ))}
        </div>
      </section>

      <footer className="home__footer">
        <p>{t('callWhatsapp')} <a href="tel:8112060205">8112060205</a></p>
      </footer>
    </div>
  )
}

function ServiceCard({ service, t }) {
  const Icon = service.icon
  const content = (
    <>
      <div className="service-card__icon">
        <Icon />
      </div>
      <h3 className="service-card__name">{service.name}</h3>
      <p className="service-card__desc">{service.desc}</p>
      {!service.live && <span className="service-card__badge">{t('comingSoon')}</span>}
      {service.live && <span className="service-card__cta">{t('bookNow')}</span>}
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
