const ENABLED = process.env.ENABLE_PERF_METRICS === "true";
const LOG_INTERVAL_MS = 60_000;
const SLOW_THRESHOLD_MS = parseInt(process.env.PERF_SLOW_THRESHOLD_MS ?? "250", 10) || 250;
const MAX_SAMPLES_PER_BUCKET = 128;

interface MetricBucket {
  count: number;
  totalDuration: number;
  maxDuration: number;
  minDuration: number;
  slowCount: number;
  errorCount: number;
  durations: number[]; // reservoir samples for percentile calc
  sampleCount: number;
}

export interface PerformanceSnapshotEntry {
  route: string;
  count: number;
  avgDuration: number;
  p95Duration: number;
  maxDuration: number;
  minDuration: number;
  slowCount: number;
  errorCount: number;
}

export interface PerformanceSnapshot {
  generatedAt: string;
  entries: PerformanceSnapshotEntry[];
}

const metrics = new Map<string, MetricBucket>();
let logTimerStarted = false;

function ensureLogTimer(): void {
  if (!ENABLED || logTimerStarted) {
    return;
  }

  const timer = setInterval(() => {
    const snapshot = getPerformanceSnapshot();
    if (!snapshot.entries.length) {
      return;
    }

    const topSlow = [...snapshot.entries]
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5)
      .map((entry) => `${entry.route} avg=${entry.avgDuration.toFixed(1)}ms p95=${entry.p95Duration.toFixed(1)}ms count=${entry.count}`)
      .join(" | ");

    console.log(`📈 Perf metrics @ ${snapshot.generatedAt}: ${snapshot.entries.length} routes · ${topSlow}`);
  }, LOG_INTERVAL_MS);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  logTimerStarted = true;
}

function normalizePath(path: string): string {
  // Replace numeric IDs and UUIDs with placeholders to group routes
  const normalized = path
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi, "/:id")
    .replace(/\/[0-9a-f]{24}(?=\/|$)/gi, "/:id");

  const segments = normalized.split("/").filter(Boolean).slice(0, 4);
  return segments.length ? `/${segments.join("/")}` : normalized || "/";
}

function recordSample(bucket: MetricBucket, duration: number): void {
  bucket.sampleCount += 1;

  if (bucket.durations.length < MAX_SAMPLES_PER_BUCKET) {
    bucket.durations.push(duration);
    return;
  }

  // Reservoir sampling to keep sample array bounded while staying representative
  const replaceIndex = Math.floor(Math.random() * bucket.sampleCount);
  if (replaceIndex < MAX_SAMPLES_PER_BUCKET) {
    bucket.durations[replaceIndex] = duration;
  }
}

function calculatePercentile(values: number[], percentile: number): number {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(percentile * (sorted.length - 1))));
  return sorted[index];
}

export function recordApiPerformance(method: string, path: string, statusCode: number, durationMs: number): void {
  if (!ENABLED || !path.startsWith("/api")) {
    return;
  }

  ensureLogTimer();

  const normalizedRoute = `${method.toUpperCase()} ${normalizePath(path)}`;
  let bucket = metrics.get(normalizedRoute);

  if (!bucket) {
    bucket = {
      count: 0,
      totalDuration: 0,
      maxDuration: 0,
      minDuration: Number.POSITIVE_INFINITY,
      slowCount: 0,
      errorCount: 0,
      durations: [],
      sampleCount: 0,
    };
    metrics.set(normalizedRoute, bucket);
  }

  bucket.count += 1;
  bucket.totalDuration += durationMs;
  bucket.maxDuration = Math.max(bucket.maxDuration, durationMs);
  bucket.minDuration = Math.min(bucket.minDuration, durationMs);

  if (durationMs >= SLOW_THRESHOLD_MS) {
    bucket.slowCount += 1;
  }

  if (statusCode >= 500) {
    bucket.errorCount += 1;
  }

  recordSample(bucket, durationMs);
}

export function getPerformanceSnapshot(options: { reset?: boolean } = {}): PerformanceSnapshot {
  const { reset = true } = options;
  const entries: PerformanceSnapshotEntry[] = [];

  metrics.forEach((bucket, route) => {
    if (bucket.count === 0) {
      return;
    }

    const avgDuration = bucket.totalDuration / bucket.count;
    const p95Duration = calculatePercentile(bucket.durations, 0.95);

    entries.push({
      route,
      count: bucket.count,
      avgDuration,
      p95Duration,
      maxDuration: bucket.maxDuration,
      minDuration: bucket.minDuration === Number.POSITIVE_INFINITY ? 0 : bucket.minDuration,
      slowCount: bucket.slowCount,
      errorCount: bucket.errorCount,
    });

    if (reset) {
      metrics.delete(route);
    }
  });

  entries.sort((a, b) => b.avgDuration - a.avgDuration);

  return {
    generatedAt: new Date().toISOString(),
    entries,
  };
}

export const PERFORMANCE_METRICS_ENABLED = ENABLED;
