import GenerateReportTab from './GenerateReportTab'

export default function ReportsTab() {
  return (
    <div className="catalog">
      <h2>Report Generation</h2>
      <p className="portal-form__hint">
        Pick a test, fill in patient and result details, and get a final Plasma Care branded report —
        parameters, units and reference ranges auto-fill from the catalog — ready to share.
      </p>
      <GenerateReportTab />
    </div>
  )
}
