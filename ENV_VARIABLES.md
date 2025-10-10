# 🔧 Environment Variables Configuration

## Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Node Environment
NODE_ENV=development  # or 'production'
```

## Performance Optimization Variables

### Logging Configuration
```env
# Control log verbosity
LOG_LEVEL=debug              # Options: debug, info, warn, error
LOG_TIMESTAMPS=false         # Add timestamps to logs (true/false)

# Suppress debug logs in production
NODE_ENV=production          # Automatically sets LOG_LEVEL=warn
```

### Performance Metrics
```env
# Enable performance tracking
ENABLE_PERF_METRICS=true                    # Track API performance
ENABLE_PERF_METRICS_ENDPOINT=true           # Enable /api/internal/perf-metrics
PERF_METRICS_TOKEN=your_secret_token        # Protect metrics endpoint
PERF_SLOW_THRESHOLD_MS=250                  # Define "slow" request threshold (ms)

# Enable detailed timing headers
ENABLE_TIMING_HEADERS=true                  # Add Server-Timing headers to responses
```

### Authentication & Security
```env
# Disable rate limiting for development
DISABLE_AUTH_RATE_LIMIT=true               # Skip rate limits (dev only!)

# Rate limit configuration
AUTH_RATE_LIMIT_WINDOW_MS=900000           # 15 minutes in ms
AUTH_RATE_LIMIT_MAX=5                       # Max attempts per window

# Proxy configuration
TRUST_PROXY=true                            # Enable if behind proxy/load balancer
```

### Database Optimization
```env
# Connection pool settings (for future use)
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=10000
```

### Cache Configuration
```env
# Resource cache TTL
RESOURCE_CACHE_TTL_SECONDS=5               # User resource cache duration
```

### Server Configuration
```env
PORT=5000                                   # Server port
```

## 🚀 Recommended Configurations

### Development Environment
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_PERF_METRICS=true
ENABLE_PERF_METRICS_ENDPOINT=true
DISABLE_AUTH_RATE_LIMIT=true
ENABLE_TIMING_HEADERS=true
DATABASE_URL=postgresql://localhost/flower_dev
```

### Production Environment
```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_PERF_METRICS=true
ENABLE_PERF_METRICS_ENDPOINT=true
PERF_METRICS_TOKEN=generate_strong_random_token_here
TRUST_PROXY=true
AUTH_RATE_LIMIT_MAX=5
DATABASE_URL=your_production_database_url
```

### Testing/Staging Environment
```env
NODE_ENV=production
LOG_LEVEL=info
ENABLE_PERF_METRICS=true
DISABLE_AUTH_RATE_LIMIT=true
DATABASE_URL=your_staging_database_url
```

## 📊 Performance Impact

### LOG_LEVEL
- **debug**: Maximum verbosity, log everything (development only)
- **info**: Important events only (-40% log volume)
- **warn**: Warnings and errors only (-70% log volume)
- **error**: Errors only (-90% log volume)

**Production Recommendation:** `warn` or `error`

### ENABLE_PERF_METRICS
- **true**: Track API performance, adds ~1ms overhead per request
- **false**: No tracking, saves CPU but no metrics

**Production Recommendation:** `true` (valuable for monitoring)

### DISABLE_AUTH_RATE_LIMIT
- **true**: No rate limiting (development only!)
- **false**: Apply rate limits for security

**Production Requirement:** `false` (never disable in production!)

## 🔍 Monitoring Performance

### Check Current Metrics
```bash
# If ENABLE_PERF_METRICS_ENDPOINT=true
curl http://localhost:5000/api/internal/perf-metrics \
  -H "x-perf-token: your_secret_token"
```

### Response Headers
When `ENABLE_TIMING_HEADERS=true`, check response headers:
```
X-Response-Time: 45ms
Server-Timing: total;dur=45
```

## 🛠️ Troubleshooting

### High Memory Usage
If seeing memory warnings, check:
1. Cache size limits in `server/cache.ts`
2. DataLoader instances not being cleared
3. Memory leaks in long-running processes

### Slow Queries
Enable query logging:
```env
LOG_LEVEL=debug
```
Watch for "[SLOW]" or "[VERY-SLOW]" markers in logs.

### Rate Limit Issues
Temporarily disable for testing:
```env
DISABLE_AUTH_RATE_LIMIT=true
```
**Remember to re-enable in production!**

## 📝 Creating Your .env File

1. Copy example:
```bash
cp .env.example .env
```

2. Edit with your values:
```bash
notepad .env  # Windows
nano .env     # Linux/Mac
```

3. Never commit `.env` to git!
Verify it's in `.gitignore`:
```bash
cat .gitignore | grep .env
```

## 🔐 Security Notes

- **Never commit `.env` files** to version control
- **Rotate PERF_METRICS_TOKEN** regularly in production
- **Use strong DATABASE_URL credentials**
- **Keep AUTH_RATE_LIMIT_MAX low** (5-10 attempts) in production
- **Enable TRUST_PROXY only** if behind a reverse proxy

## 📚 Additional Resources

- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [Express Behind Proxies](https://expressjs.com/en/guide/behind-proxies.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
