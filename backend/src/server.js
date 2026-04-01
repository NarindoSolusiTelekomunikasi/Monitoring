import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import {
  getDashboardData,
  getFilterOptions,
  getHealthData,
  getImjasData,
  getJadwalData,
  getRankedTeams,
  getRankedTechnicians,
  getTeamData,
  getTicketByIncident,
  getTicketData,
  getUnspecData,
} from './workbookService.js'

const app = express()
const port = process.env.PORT || 3001

app.use(
  cors({
    origin: true,
  }),
)
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

function handleRequest(handler) {
  return async (req, res) => {
    try {
      const payload = await handler(req, res)
      if (payload !== undefined && !res.headersSent) {
        res.json(payload)
      }
    } catch (error) {
      res.status(500).json({
        error: 'internal_error',
        message: error.message,
      })
    }
  }
}

app.get(
  '/api/health',
  handleRequest(async () => ({
    ok: true,
    ...(await getHealthData()),
  })),
)

app.get(
  '/api/filters',
  handleRequest(async () => ({
    filters: await getFilterOptions(),
  })),
)

app.get(
  '/api/dashboard',
  handleRequest(async (req) => {
    const filters = req.query
    const filterOptions = await getFilterOptions()
    return {
      filters: filterOptions,
      ...(await getDashboardData(filters)),
    }
  }),
)

app.get(
  '/api/tickets',
  handleRequest(async (req) => {
    const filters = req.query
    const [filterOptions, tickets] = await Promise.all([getFilterOptions(), getTicketData(filters)])
    return {
      filters: filterOptions,
      total: tickets.length,
      items: tickets,
    }
  }),
)

app.get(
  '/api/tickets/:incidentId',
  handleRequest(async (req, res) => {
    const ticket = await getTicketByIncident(req.params.incidentId)
    if (!ticket) {
      res.status(404).json({
        error: 'not_found',
        message: `Ticket ${req.params.incidentId} was not found.`,
      })
      return
    }
    return ticket
  }),
)

app.get(
  '/api/teams',
  handleRequest(async (req) => {
    const filters = req.query
    const filterOptions = await getFilterOptions()
    return {
      filters: filterOptions,
      ...(await getTeamData(filters)),
    }
  }),
)

app.get(
  '/api/rankings/teams',
  handleRequest(async (req) => ({
    filters: await getFilterOptions(),
    items: await getRankedTeams(req.query),
  })),
)

app.get(
  '/api/rankings/technicians',
  handleRequest(async (req) => ({
    filters: await getFilterOptions(),
    items: await getRankedTechnicians(req.query),
  })),
)

app.get(
  '/api/imjas',
  handleRequest(async (req) => ({
    filters: await getFilterOptions(),
    ...(await getImjasData(req.query)),
  })),
)

app.get(
  '/api/unspec',
  handleRequest(async (req) => ({
    filters: await getFilterOptions(),
    ...(await getUnspecData(req.query)),
  })),
)

app.get(
  '/api/jadwal',
  handleRequest(async (req) => ({
    filters: await getFilterOptions(),
    ...(await getJadwalData(req.query)),
  })),
)

export const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
