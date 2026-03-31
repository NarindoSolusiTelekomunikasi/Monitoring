function KpiCard({ label, value, trend, detail, badge, tone }) {
  return (
    <article className={`kpi-card panel tone-${tone}`}>
      <div className="kpi-card__top">
        <div>
          <span className="eyebrow">{label}</span>
          <strong>{value}</strong>
        </div>
        <span className="kpi-icon">{tone === 'close' ? 'OK' : tone === 'open' ? '!' : tone === 'warning' ? '*' : '+'}</span>
      </div>
      <div className="kpi-card__bottom">
        <div className="kpi-card__meta">
          <span>{trend}</span>
          {detail ? <small className="kpi-card__detail">{detail}</small> : null}
        </div>
        <span className={`pill pill--${tone}`}>{badge}</span>
      </div>
    </article>
  )
}

export default KpiCard
