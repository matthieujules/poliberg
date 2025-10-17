import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// In-memory mock events matching lib/types/index.ts PolymarketEvent
let events = [
  {
    id: 'evt_001',
    title: 'Will Bitcoin reach $100,000 by end of 2025?',
    description:
      'Resolves YES if Bitcoin (BTC) trades at or above $100,000 before 2025-12-31 23:59:59 ET.',
    probability: 0.62,

    volume24hr: 2400000,
    volume1wk: 8200000,
    volume1mo: 23100000,
    volume1yr: 156000000,

    oneHourPriceChange: 0.01,
    oneDayPriceChange: 0.08,
    oneWeekPriceChange: 0.12,

    active: true,
    closed: false,
    archived: false,

    lastTradePrice: 0.62,
    bestBid: 0.61,
    bestAsk: 0.63,

    liquidityNum: 8500000,

    slug: 'bitcoin-100k-2025',
    marketUrl: 'https://polymarket.com/event/bitcoin-100k-2025',
    endDate: '2025-12-31T23:59:59Z',

    category: 'crypto',
    tags: ['crypto', 'bitcoin', 'price-prediction'],
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    locked: false,
    volumeSpike: 1.8,
  },
  {
    id: 'evt_002',
    title: 'Will NVIDIA stock hit $1000 in 2025?',
    description:
      'Resolves YES if NVIDIA (NVDA) trades at or above $1000 before 2025-12-31 23:59:59 ET.',
    probability: 0.55,

    volume24hr: 2900000,
    volume1wk: 9100000,
    volume1mo: 25100000,
    volume1yr: 182000000,

    oneHourPriceChange: 0.004,
    oneDayPriceChange: 0.09,
    oneWeekPriceChange: 0.15,

    active: true,
    closed: false,
    archived: false,

    lastTradePrice: 0.55,
    bestBid: 0.54,
    bestAsk: 0.56,

    liquidityNum: 7400000,

    slug: 'nvidia-1000-2025',
    marketUrl: 'https://polymarket.com/event/nvidia-1000-2025',
    endDate: '2025-12-31T23:59:59Z',

    category: 'business',
    tags: ['business', 'nvidia', 'stock', 'ai'],
    detectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    locked: false,
    volumeSpike: 1.6,
  },
  {
    id: 'evt_003',
    title: 'Will OpenAI release GPT-5 in 2025?',
    description:
      'Resolves YES if OpenAI announces and releases GPT-5 (or successor) in 2025.',
    probability: 0.67,

    volume24hr: 1300000,
    volume1wk: 4700000,
    volume1mo: 9200000,
    volume1yr: 68000000,

    oneHourPriceChange: -0.002,
    oneDayPriceChange: 0.04,
    oneWeekPriceChange: 0.06,

    active: true,
    closed: false,
    archived: false,

    lastTradePrice: 0.67,
    bestBid: 0.66,
    bestAsk: 0.68,

    liquidityNum: 3200000,

    slug: 'gpt5-2025',
    marketUrl: 'https://polymarket.com/event/gpt5-2025',
    endDate: '2025-12-31T23:59:59Z',

    category: 'tech',
    tags: ['tech', 'ai', 'openai', 'gpt'],
    detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    locked: false,
    volumeSpike: null,
  },
];

const getSpikeSummary = () => {
  const total_events = events.length;
  const spikes = events
    .map((e) => e.volumeSpike || 0)
    .filter((x) => x && x >= 1.5);
  const spike_events = spikes.length;
  const average_spike_ratio = spike_events
    ? Number((spikes.reduce((a, b) => a + b, 0) / spike_events).toFixed(2))
    : 0;
  const max_spike_ratio = spikes.length ? Math.max(...spikes) : 0;
  const top_spike_event = events
    .filter((e) => e.volumeSpike)
    .sort((a, b) => (b.volumeSpike || 0) - (a.volumeSpike || 0))[0] || null;
  return {
    total_events,
    spike_events,
    average_spike_ratio,
    max_spike_ratio,
    top_spike_event: top_spike_event
      ? {
          id: top_spike_event.id,
          title: top_spike_event.title,
          spike_ratio: top_spike_event.volumeSpike,
          volume24hr: top_spike_event.volume24hr,
        }
      : null,
  };
};

// Health endpoint
app.get('/health', (_req, res) => {
  const summary = getSpikeSummary();
  res.json({
    status: 'ok',
    events_tracked: events.length,
    events_with_spikes: summary.spike_events,
  });
});

// GET list of events
app.get('/api/events', (req, res) => {
  const limit = Number(req.query.limit || 20);
  const spikeOnly = String(req.query.spike_only || 'false') === 'true';
  let list = [...events];
  if (spikeOnly) list = list.filter((e) => (e.volumeSpike || 0) >= 1.5);
  res.json({
    events: list.slice(0, limit),
    total: events.length,
    hasVolumeSpike: list.filter((e) => (e.volumeSpike || 0) >= 1.5).length,
  });
});

// GET single event
app.get('/api/events/:id', (req, res) => {
  const e = events.find((x) => x.id === req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  res.json(e);
});

// Toggle lock
app.post('/api/events/:id/lock', (req, res) => {
  const idx = events.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  events[idx] = { ...events[idx], locked: !events[idx].locked };
  res.json({ id: events[idx].id, locked: events[idx].locked });
});

// Spike summary
app.get('/api/events/spikes/summary', (_req, res) => {
  res.json(getSpikeSummary());
});

// Refresh (no-op for mock)
app.post('/api/refresh', (_req, res) => {
  const summary = getSpikeSummary();
  res.json({ status: 'ok', events_fetched: events.length, spike_events: summary.spike_events });
});

app.listen(PORT, () => {
  console.log(`Mock backend listening on http://localhost:${PORT}`);
});
