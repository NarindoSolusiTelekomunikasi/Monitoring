function RankingList({ items = [], compact = false }) {
  return (
    <div className={`ranking-list ${compact ? 'ranking-list--compact' : ''}`}>
      {items.map((item, index) => {
        const title = item.name ?? item.teknisi ?? item.team ?? '-'
        const subtitle = [item.sto ?? item.workzone ?? item.zone, item.team ?? item.service ?? item.specialty]
          .filter(Boolean)
          .join(' • ')
        const score = item.close ?? item.totalClose ?? item.productivity ?? 0
        const scoreLabel = item.close != null || item.totalClose != null ? 'close' : '%'
        return (
          <div key={`${title}-${index}`} className={`ranking-item ranking-item--${index + 1}`}>
            <span className="ranking-item__rank">{index + 1}</span>
            <div className="ranking-item__copy">
              <strong>{title}</strong>
              <span>{subtitle || 'Monitoring data'}</span>
            </div>
            <div className="ranking-item__score">
              <strong>{score}</strong>
              <span>{scoreLabel}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RankingList
