function KpiCard({ label, value, trend, badge, tone }) {
  return (
    <article className={`kpi-card panel tone-${tone}`}>
      <div className="kpi-card__top">
        <div>
          <span className="eyebrow">{label}</span>
          <strong>{value}</strong>
        </div>
        <span className="kpi-icon">{tone === 'close' ? 'OK' : tone === 'open' ? '!' : tone === 'warning' ? '•' : '+'}</span>
      </div>
      <div className="kpi-card__bottom">
        <span>{trend}</span>
        <span className={`pill pill--${tone}`}>{badge}</span>
      </div>
    </article>
  )
}

export default KpiCard
