/**
 * 🔍 Database Query Analyzer & Optimizer
 * 
 * Analyzes slow queries and provides optimization suggestions
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

interface QueryStats {
  query: string;
  calls: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  table?: string;
}

interface QueryAnalysis {
  query: string;
  estimatedCost: number;
  usesIndex: boolean;
  suggestions: string[];
  planDetails?: any;
}

class DatabaseQueryAnalyzer {
  private queryStats = new Map<string, QueryStats>();
  private slowQueryThreshold = 100; // ms
  private enabled = process.env.ENABLE_QUERY_ANALYSIS === 'true';

  /**
   * Track a query execution
   */
  trackQuery(query: string, durationMs: number): void {
    if (!this.enabled) return;

    const normalizedQuery = this.normalizeQuery(query);
    const stats = this.queryStats.get(normalizedQuery) || {
      query: normalizedQuery,
      calls: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
    };

    stats.calls++;
    stats.totalTime += durationMs;
    stats.avgTime = stats.totalTime / stats.calls;
    stats.minTime = Math.min(stats.minTime, durationMs);
    stats.maxTime = Math.max(stats.maxTime, durationMs);

    this.queryStats.set(normalizedQuery, stats);

    // Log slow queries immediately
    if (durationMs > this.slowQueryThreshold) {
      console.warn(`🐌 Slow query (${durationMs}ms): ${normalizedQuery.substring(0, 100)}...`);
    }
  }

  /**
   * Normalize query by removing specific values
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\d+/g, '?') // Replace numbers with ?
      .replace(/'[^']*'/g, '?') // Replace strings with ?
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get top slow queries
   */
  getSlowQueries(limit: number = 10): QueryStats[] {
    return Array.from(this.queryStats.values())
      .filter(stat => stat.avgTime > this.slowQueryThreshold)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  /**
   * Get most frequent queries
   */
  getMostFrequentQueries(limit: number = 10): QueryStats[] {
    return Array.from(this.queryStats.values())
      .sort((a, b) => b.calls - a.calls)
      .slice(0, limit);
  }

  /**
   * Analyze a query and provide optimization suggestions
   */
  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
      // Get query execution plan
      const plan = await sql(`EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) ${query}`);
      const planData = plan[0]?.['QUERY PLAN']?.[0];

      const suggestions: string[] = [];
      let usesIndex = false;
      let estimatedCost = planData?.['Total Cost'] || 0;

      // Analyze plan for optimization opportunities
      const planStr = JSON.stringify(planData).toLowerCase();

      // Check if query uses index
      if (planStr.includes('index scan') || planStr.includes('index only scan')) {
        usesIndex = true;
      } else {
        suggestions.push('Query performs sequential scan - consider adding an index');
      }

      // Check for sorts
      if (planStr.includes('sort')) {
        suggestions.push('Query requires sorting - consider adding an index on ORDER BY columns');
      }

      // Check for high cost
      if (estimatedCost > 1000) {
        suggestions.push(`High query cost (${estimatedCost.toFixed(0)}) - consider query optimization`);
      }

      // Check for nested loops with high row count
      if (planStr.includes('nested loop') && planStr.includes('rows')) {
        suggestions.push('Nested loop detected - ensure proper indexes on join columns');
      }

      // Check for missing WHERE clause on large tables
      if (!query.toLowerCase().includes('where') && !query.toLowerCase().includes('limit')) {
        suggestions.push('Query lacks WHERE clause - may scan entire table');
      }

      return {
        query,
        estimatedCost,
        usesIndex,
        suggestions,
        planDetails: planData,
      };
    } catch (error: any) {
      console.error('Failed to analyze query:', error.message);
      return {
        query,
        estimatedCost: 0,
        usesIndex: false,
        suggestions: ['Failed to analyze query'],
      };
    }
  }

  /**
   * Generate optimization report
   */
  generateReport(): {
    totalQueries: number;
    uniqueQueries: number;
    slowQueries: QueryStats[];
    frequentQueries: QueryStats[];
    recommendations: string[];
  } {
    const slowQueries = this.getSlowQueries(5);
    const frequentQueries = this.getMostFrequentQueries(5);
    const recommendations: string[] = [];

    // Analyze patterns and make recommendations
    let totalSlowQueries = 0;
    for (const stat of this.queryStats.values()) {
      if (stat.avgTime > this.slowQueryThreshold) {
        totalSlowQueries++;
      }
    }

    if (totalSlowQueries > 10) {
      recommendations.push(`${totalSlowQueries} queries are slow (>${this.slowQueryThreshold}ms avg) - review indexes`);
    }

    // Check for repeated slow queries
    for (const slow of slowQueries) {
      if (slow.calls > 100) {
        recommendations.push(`Query "${slow.query.substring(0, 50)}..." is both slow AND frequent (${slow.calls} calls)`);
      }
    }

    // Check for N+1 patterns
    const selectQueries = Array.from(this.queryStats.values()).filter(s =>
      s.query.toLowerCase().includes('select')
    );
    if (selectQueries.length > 50 && selectQueries.some(s => s.calls > 1000)) {
      recommendations.push('High number of SELECT queries detected - possible N+1 query problem');
    }

    let totalCalls = 0;
    for (const stat of this.queryStats.values()) {
      totalCalls += stat.calls;
    }

    return {
      totalQueries: totalCalls,
      uniqueQueries: this.queryStats.size,
      slowQueries,
      frequentQueries,
      recommendations,
    };
  }

  /**
   * Clear all statistics
   */
  clearStats(): void {
    this.queryStats.clear();
  }

  /**
   * Get all stats
   */
  getAllStats(): QueryStats[] {
    return Array.from(this.queryStats.values());
  }
}

// Singleton instance
export const queryAnalyzer = new DatabaseQueryAnalyzer();

/**
 * Wrapper for query execution with automatic tracking
 */
export async function executeTrackedQuery<T>(
  queryFn: () => Promise<T>,
  queryString: string
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    queryAnalyzer.trackQuery(queryString, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    queryAnalyzer.trackQuery(queryString, duration);
    throw error;
  }
}

/**
 * Express endpoint to get query analysis
 */
export function getQueryAnalysisEndpoint(req: any, res: any): void {
  try {
    const token = process.env.QUERY_ANALYSIS_TOKEN;
    if (token && req.headers['x-analysis-token'] !== token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = queryAnalyzer.generateReport();
    res.json(report);
  } catch (error) {
    console.error('Failed to generate query analysis:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
}

/**
 * Analyze a specific query (for manual testing)
 */
export async function analyzeQueryEndpoint(req: any, res: any): Promise<void> {
  try {
    const token = process.env.QUERY_ANALYSIS_TOKEN;
    if (token && req.headers['x-analysis-token'] !== token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const analysis = await queryAnalyzer.analyzeQuery(query);
    res.json(analysis);
  } catch (error: any) {
    console.error('Failed to analyze query:', error);
    res.status(500).json({ error: error.message });
  }
}
