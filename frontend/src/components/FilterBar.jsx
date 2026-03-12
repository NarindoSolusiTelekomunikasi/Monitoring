import { useMemo } from 'react'
import { useDashboard } from '../context/DashboardContext'

const allLabels = {
  STO: 'Semua STO',
  Team: 'Semua team',
  Status: 'Semua status',
  'Jenis Tiket': 'Semua jenis tiket',
  Teknisi: 'Semua teknisi',
}

const REQUIRED_STATUS_OPTIONS = ['OPEN', 'CLOSE SYSTEM', 'CLOSE HD', 'CLOSE MYI']

function parseMultiValue(value) {
  if (!value || value === 'all') {
    return []
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function stringifyMultiValue(values) {
  return values.length ? values.join(',') : 'all'
}

function formatMultiValueLabel(values) {
  if (!values.length) {
    return 'Semua STO'
  }
  if (values.length <= 2) {
    return values.join(', ')
  }
  return `${values.slice(0, 2).join(', ')} +${values.length - 2}`
}

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

function StoMultiSelect({ value, options, onChange }) {
  const selectedValues = parseMultiValue(value)
  const stoOptions = options.filter((option) => option !== 'all')

  const toggleValue = (sto) => {
    const nextValues = selectedValues.includes(sto)
      ? selectedValues.filter((item) => item !== sto)
      : [...selectedValues, sto]
    onChange(stringifyMultiValue(nextValues))
  }

  return (
    <div className="filter-select">
      <span>STO</span>
      <details className="multi-select">
        <summary>{formatMultiValueLabel(selectedValues)}</summary>
        <div className="multi-select__menu">
          <button type="button" className="multi-select__action" onClick={() => onChange('all')}>
            Pilih semua STO
          </button>
          {stoOptions.map((option) => (
            <label key={option} className="multi-select__option">
              <input type="checkbox" checked={selectedValues.includes(option)} onChange={() => toggleValue(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  )
}

function FilterBar({ title, description, options }) {
  const { state, setFilter, resetFilters } = useDashboard()
  const statusOptions = ['all', ...new Set([...(options.statuses ?? []), ...REQUIRED_STATUS_OPTIONS])]
  const stoOptions = useMemo(() => ['all', ...(options.stos ?? [])], [options.stos])

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
        <StoMultiSelect value={state.filters.sto} options={stoOptions} onChange={(value) => setFilter('sto', value)} />
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
          label="Jenis Tiket"
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
