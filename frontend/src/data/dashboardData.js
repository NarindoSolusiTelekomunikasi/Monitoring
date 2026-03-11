export const dashboardSummary = {
  dateLabel: '11 Maret 2026',
  lastUpdate: '14:32 WIB',
  syncStatus: 'ONLINE',
  title: 'Dashboard Monitoring Teknisi',
  description:
    'Pantau volume tiket, produktivitas teknisi, dan kondisi workzone dalam satu tampilan operasional yang cepat dibaca oleh tim NOC dan supervisor.',
  chips: ['NOC Live Monitor', 'Shift Pagi'],
}

export const kpis = [
  {
    label: 'Total Tiket',
    value: 232,
    trend: 'Naik 12% dari kemarin',
    badge: 'Semua channel',
    tone: 'total',
    icon: '+',
  },
  {
    label: 'Tiket Open',
    value: 54,
    trend: '18 tiket di atas SLA',
    badge: 'Perlu follow up',
    tone: 'open',
    icon: '!',
  },
  {
    label: 'Tiket Close',
    value: 178,
    trend: '76% penyelesaian hari ini',
    badge: 'Stabil',
    tone: 'close',
    icon: '?',
  },
  {
    label: 'Teknisi Aktif',
    value: 28,
    trend: '4 teknisi standby',
    badge: 'Shift aktif',
    tone: 'warning',
    icon: '•',
  },
]

export const ticketStatus = {
  total: 232,
  close: 178,
  open: 54,
  note: 'Workzone KTU dan TAM menyumbang tiket open tertinggi.',
}

export const workzones = [
  { name: 'KTU', open: 16, close: 20 },
  { name: 'SGB', open: 10, close: 22 },
  { name: 'BTA', open: 8, close: 15 },
  { name: 'MUD', open: 11, close: 18 },
  { name: 'MPA', open: 7, close: 14 },
  { name: 'TAM', open: 12, close: 17 },
  { name: 'TLK', open: 9, close: 19 },
]

export const ranking = [
  { rank: 1, name: 'Fredi Agustinus', zone: 'KTU', service: 'Fiber Home', close: 12 },
  { rank: 2, name: 'Firdaus', zone: 'SGB', service: 'Enterprise', close: 9 },
  { rank: 3, name: 'Jerry', zone: 'TAM', service: 'Wireless', close: 7 },
  { rank: 4, name: 'Alfian', zone: 'TLK', service: 'Fiber Home', close: 6 },
]

export const technicianPerformance = [
  {
    name: 'Fredi Agustinus',
    service: 'Fiber Home',
    workzone: 'KTU',
    total: 15,
    open: 3,
    close: 12,
    productivity: 80,
    status: 'Sangat baik',
    statusTone: 'close',
  },
  {
    name: 'Firdaus',
    service: 'Enterprise',
    workzone: 'SGB',
    total: 12,
    open: 3,
    close: 9,
    productivity: 75,
    status: 'Baik',
    statusTone: 'close',
  },
  {
    name: 'Jerry',
    service: 'Wireless',
    workzone: 'TAM',
    total: 10,
    open: 3,
    close: 7,
    productivity: 70,
    status: 'Perlu dukungan',
    statusTone: 'warning',
  },
  {
    name: 'Alfian',
    service: 'Fiber Home',
    workzone: 'TLK',
    total: 8,
    open: 2,
    close: 6,
    productivity: 75,
    status: 'Baik',
    statusTone: 'close',
  },
]

export const ticketList = [
  {
    incident: 'INC-260311-001',
    customer: 'PT Sumber Data Utama',
    workzone: 'KTU',
    status: 'Open',
    statusTone: 'open',
    technician: 'Fredi Agustinus',
    date: '11 Mar 2026',
    service: 'Metro Ethernet',
  },
  {
    incident: 'INC-260311-002',
    customer: 'CV Bintang Nusantara',
    workzone: 'SGB',
    status: 'Close',
    statusTone: 'close',
    technician: 'Firdaus',
    date: '11 Mar 2026',
    service: 'Fiber Home',
  },
  {
    incident: 'INC-260311-003',
    customer: 'PT Tunas Logistik',
    workzone: 'TAM',
    status: 'Open',
    statusTone: 'open',
    technician: 'Jerry',
    date: '11 Mar 2026',
    service: 'Wireless',
  },
  {
    incident: 'INC-260311-004',
    customer: 'Dinas Pendidikan MPA',
    workzone: 'MPA',
    status: 'Close',
    statusTone: 'close',
    technician: 'Rian Saputra',
    date: '10 Mar 2026',
    service: 'VPN Corporate',
  },
  {
    incident: 'INC-260311-005',
    customer: 'Universitas Telaga',
    workzone: 'TLK',
    status: 'On Progress',
    statusTone: 'warning',
    technician: 'Alfian',
    date: '10 Mar 2026',
    service: 'Dedicated Internet',
  },
]
