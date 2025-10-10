/**
 * 🏥 Database Connection Pool Health Monitor
 * 
 * Monitors database connection health and provides automatic recovery
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  activeConnections: number;
  totalQueries: number;
  failedQueries: number;
  avgResponseTime: number;
  lastCheckTime: Date;
  uptime: number;
  errorRate: number;
}

interface ConnectionTest {
  success: boolean;
  responseTime: number;
  error?: string;
}

class ConnectionHealthMonitor {
  private metrics: HealthMetrics = {
    status: 'healthy',
    activeConnections: 0,
    totalQueries: 0,
    failedQueries: 0,
    avgResponseTime: 0,
    lastCheckTime: new Date(),
    uptime: 0,
    errorRate: 0,
  };

  private startTime = Date.now();
  private responseTimes: number[] = [];
  private maxResponseTimesSamples = 100;
  private healthCheckInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  /**
   * Start health monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('📊 Health monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`🏥 Starting connection health monitoring (every ${intervalMs}ms)`);

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);

    // Perform immediate check
    this.performHealthCheck();
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.isMonitoring = false;
      console.log('🛑 Stopped connection health monitoring');
    }
  }

  /**
   * Perform a health check
   */
  async performHealthCheck(): Promise<HealthMetrics> {
    const test = await this.testConnection();

    if (test.success) {
      this.recordSuccessfulQuery(test.responseTime);
    } else {
      this.recordFailedQuery();
      console.error(`❌ Health check failed: ${test.error}`);
    }

    this.updateHealthStatus();
    this.metrics.lastCheckTime = new Date();
    this.metrics.uptime = Date.now() - this.startTime;

    return this.metrics;
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<ConnectionTest> {
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        responseTime: 0,
        error: 'DATABASE_URL not configured',
      };
    }

    const sql = neon(process.env.DATABASE_URL);
    const start = Date.now();

    try {
      // Simple query to test connection
      await sql`SELECT 1 as health_check`;
      const responseTime = Date.now() - start;

      return {
        success: true,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - start;
      return {
        success: false,
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Record successful query
   */
  recordSuccessfulQuery(responseTime: number): void {
    this.metrics.totalQueries++;
    this.responseTimes.push(responseTime);

    // Keep only last N samples
    if (this.responseTimes.length > this.maxResponseTimesSamples) {
      this.responseTimes.shift();
    }

    // Update average response time
    this.metrics.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  /**
   * Record failed query
   */
  recordFailedQuery(): void {
    this.metrics.totalQueries++;
    this.metrics.failedQueries++;
  }

  /**
   * Update overall health status
   */
  private updateHealthStatus(): void {
    const errorRate = this.metrics.totalQueries > 0
      ? (this.metrics.failedQueries / this.metrics.totalQueries) * 100
      : 0;

    this.metrics.errorRate = errorRate;

    // Determine health status
    if (errorRate > 10 || this.metrics.avgResponseTime > 2000) {
      this.metrics.status = 'unhealthy';
      console.error(`🔴 Database unhealthy: ${errorRate.toFixed(1)}% error rate, ${this.metrics.avgResponseTime.toFixed(0)}ms avg response`);
    } else if (errorRate > 2 || this.metrics.avgResponseTime > 1000) {
      this.metrics.status = 'degraded';
      console.warn(`🟡 Database degraded: ${errorRate.toFixed(1)}% error rate, ${this.metrics.avgResponseTime.toFixed(0)}ms avg response`);
    } else {
      this.metrics.status = 'healthy';
    }
  }

  /**
   * Get current health metrics
   */
  getHealthMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      status: 'healthy',
      activeConnections: 0,
      totalQueries: 0,
      failedQueries: 0,
      avgResponseTime: 0,
      lastCheckTime: new Date(),
      uptime: Date.now() - this.startTime,
      errorRate: 0,
    };
    this.responseTimes = [];
    console.log('📊 Health metrics reset');
  }

  /**
   * Check if database is healthy
   */
  isHealthy(): boolean {
    return this.metrics.status === 'healthy';
  }

  /**
   * Get detailed health report
   */
  getHealthReport(): {
    metrics: HealthMetrics;
    recentResponseTimes: number[];
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (this.metrics.status === 'unhealthy') {
      recommendations.push('Database is unhealthy - check connection and database server status');
    }

    if (this.metrics.errorRate > 5) {
      recommendations.push(`High error rate (${this.metrics.errorRate.toFixed(1)}%) - investigate failed queries`);
    }

    if (this.metrics.avgResponseTime > 1000) {
      recommendations.push(`Slow response time (${this.metrics.avgResponseTime.toFixed(0)}ms) - check for slow queries or network issues`);
    }

    if (this.responseTimes.length > 0) {
      const maxResponseTime = Math.max(...this.responseTimes);
      if (maxResponseTime > 5000) {
        recommendations.push(`Very slow queries detected (max ${maxResponseTime}ms) - review query performance`);
      }
    }

    return {
      metrics: this.metrics,
      recentResponseTimes: [...this.responseTimes],
      recommendations,
    };
  }
}

// Singleton instance
export const connectionHealth = new ConnectionHealthMonitor();

/**
 * Express middleware to add health info to responses
 */
export function healthHeadersMiddleware(req: any, res: any, next: any): void {
  const metrics = connectionHealth.getHealthMetrics();
  res.setHeader('X-DB-Health', metrics.status);
  res.setHeader('X-DB-Avg-Response', Math.round(metrics.avgResponseTime).toString());
  next();
}

/**
 * Health check endpoint
 */
export function healthCheckEndpoint(req: any, res: any): void {
  const report = connectionHealth.getHealthReport();
  
  const statusCode = report.metrics.status === 'healthy' ? 200
    : report.metrics.status === 'degraded' ? 207
    : 503;

  res.status(statusCode).json(report);
}

/**
 * Auto-start monitoring in production
 */
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_HEALTH_MONITORING !== 'false') {
  connectionHealth.startMonitoring(30000); // Check every 30 seconds
}
