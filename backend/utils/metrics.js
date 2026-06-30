const client = require('prom-client');

// Single shared registry for the whole app. Everything below registers
// itself onto this one Registry, and server.js exposes it at GET /metrics
// for Prometheus to scrape (see k8s/monitoring/servicemonitor.yaml).
const register = new client.Registry();

// Standard Node.js process metrics (memory, event loop lag, GC pauses,
// open file descriptors, etc.) — collected automatically every 10s.
// This is "free" observability that doesn't require any custom code.
client.collectDefaultMetrics({ register });

// Counts every HTTP request, labeled by method/route/status code. This is
// what lets you ask Prometheus things like "how many 500s has /api/login
// returned in the last hour" — something pod-level CPU/memory can never
// tell you, since a pod can be perfectly healthy on resources while still
// returning errors to every citizen.
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Request duration histogram — lets you compute p50/p95/p99 latency per
// route in Grafana, not just an average that one slow outlier can hide.
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

/**
 * Express middleware that records the two metrics above for every request.
 * Mounted globally in server.js, before the route handlers.
 *
 * Route label uses req.route?.path when available (e.g. "/api/requests/:id")
 * rather than the raw URL, so metrics aggregate correctly across different
 * IDs hitting the same route instead of creating a separate time series
 * per unique URL (which would make Prometheus's cardinality explode on an
 * app with thousands of request IDs).
 */
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    // baseUrl + route.path gives the mounted prefix back, e.g. an app.use('/api/requests', router)
    // with router.get('/:id', ...) reports as "/api/requests/:id", not just "/:id".
    const route = req.route ? `${req.baseUrl}${req.route.path}` : req.path;

    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    httpRequestDurationSeconds.observe({ method: req.method, route, status_code: res.statusCode }, durationSeconds);
  });

  next();
};

module.exports = { register, metricsMiddleware };
