import { useDashboard } from '../context/DashboardContext'

const allLabels = {
  STO: 'Semua STO',
  Team: 'Semua team',
  Status: 'Semua status',
  Layanan: 'Semua layanan',
  Teknisi: 'Semua teknisi',
}

const REQUIRED_STATUS_OPTIONS = ['OPEN', 'CLOSE SYSTEM', 'CLOSE HD', 'CLOSE MYI']

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="filter-select">
      <span>{label}</span>
      <select value={value} onChange={onChange}>
        {options.map((option) => {
          const normalized =
            typeof option === 'string'
              ? { value: option, label: option === 'all' ? allLabels[label] ?? `Semua ${label.toLowerCase()}` : option }
              : option
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function FilterBar({ title, description, options }) {
  const { state, setFilter, resetFilters } = useDashboard()
  const statusOptions = ['all', ...new Set([...(options.statuses ?? []), ...REQUIRED_STATUS_OPTIONS])]

  return (
    <section className="filter-bar panel">
      <div className="filter-bar__copy">
        <span className="eyebrow">Filter Control</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="filter-bar__controls">
        <FilterSelect
          label="Tanggal"
          value={state.filters.dateRange}
          options={options.dateRanges ?? [{ value: 'all', label: 'Semua tanggal' }]}
          onChange={(event) => setFilter('dateRange', event.target.value)}
        />
        <FilterSelect
          label="STO"
          value={state.filters.sto}
          options={['all', ...(options.stos ?? [])]}
          onChange={(event) => setFilter('sto', event.target.value)}
        />
        <FilterSelect
          label="Team"
          value={state.filters.team}
          options={['all', ...(options.teams ?? [])]}
          onChange={(event) => setFilter('team', event.target.value)}
        />
        <FilterSelect
          label="Status"
          value={state.filters.status}
          options={statusOptions}
          onChange={(event) => setFilter('status', event.target.value)}
        />
        <FilterSelect
          label="Layanan"
          value={state.filters.serviceType}
          options={['all', ...(options.serviceTypes ?? [])]}
          onChange={(event) => setFilter('serviceType', event.target.value)}
        />
        <FilterSelect
          label="Teknisi"
          value={state.filters.teknisi}
          options={['all', ...(options.teknisis ?? [])]}
          onChange={(event) => setFilter('teknisi', event.target.value)}
        />
      </div>

      <div className="filter-bar__actions">
        <button type="button" className="toolbar-button toolbar-button--muted" onClick={resetFilters}>
          Reset filters
        </button>
      </div>
    </section>
  )
}

export default FilterBar
