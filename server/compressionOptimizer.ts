/**
 * 📦 Advanced Response Compression Optimizer
 * 
 * Smart compression with content-type detection and optimization
 */

import compression from 'compression';
import { Request, Response, NextFunction } from 'express';

interface CompressionStats {
  totalRequests: number;
  compressedRequests: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  compressionRatio: number;
  savedBytes: number;
}

class CompressionOptimizer {
  private stats: CompressionStats = {
    totalRequests: 0,
    compressedRequests: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    compressionRatio: 0,
    savedBytes: 0,
  };

  /**
   * Create optimized compression middleware
   */
  createMiddleware() {
    return compression({
      // Only compress responses larger than 1kb
      threshold: 1024,

      // Compression level (0-9, 6 is default)
      level: 6,

      // Filter function to determine what to compress
      filter: (req: Request, res: Response) => {
        // Don't compress if client doesn't support it
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Don't compress already compressed content
        const contentType = res.getHeader('Content-Type') as string;
        if (
          contentType &&
          (contentType.includes('zip') ||
            contentType.includes('gzip') ||
            contentType.includes('image/') ||
            contentType.includes('video/') ||
            contentType.includes('audio/'))
        ) {
          return false;
        }

        // Default filter for compressible content
        return compression.filter(req, res);
      },
    });
  }

  /**
   * Middleware to track compression stats
   */
  trackingMiddleware() {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);
      
      let originalSize = 0;
      let compressedSize = 0;

      // Override write
      res.write = function (chunk: any, ...args: any[]): boolean {
        if (chunk) {
          originalSize += Buffer.byteLength(chunk);
        }
        return originalWrite(chunk, ...args);
      };

      // Override end
      res.end = function (chunk?: any, ...args: any[]): Response {
        if (chunk) {
          originalSize += Buffer.byteLength(chunk);
        }

        // Update stats
        self.stats.totalRequests++;
        self.stats.totalOriginalSize += originalSize;

        const contentEncoding = res.getHeader('Content-Encoding');
        if (contentEncoding && (contentEncoding === 'gzip' || contentEncoding === 'deflate')) {
          self.stats.compressedRequests++;
          
          // Estimate compressed size (rough estimation)
          const contentLength = res.getHeader('Content-Length');
          if (contentLength) {
            compressedSize = parseInt(contentLength as string, 10);
            self.stats.totalCompressedSize += compressedSize;
          }
        } else {
          self.stats.totalCompressedSize += originalSize;
        }

        // Calculate compression ratio
        if (self.stats.totalOriginalSize > 0) {
          self.stats.compressionRatio =
            ((self.stats.totalOriginalSize - self.stats.totalCompressedSize) /
              self.stats.totalOriginalSize) *
            100;
          self.stats.savedBytes =
            self.stats.totalOriginalSize - self.stats.totalCompressedSize;
        }

        return originalEnd(chunk, ...args);
      };

      next();
    };
  }

  /**
   * Get compression statistics
   */
  getStats(): CompressionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      compressionRatio: 0,
      savedBytes: 0,
    };
  }

  /**
   * Format stats for display
   */
  getFormattedStats(): string {
    const stats = this.stats;
    const compressionRate =
      stats.totalRequests > 0
        ? ((stats.compressedRequests / stats.totalRequests) * 100).toFixed(1)
        : '0';

    return `
📦 Compression Statistics:
  Total Requests: ${stats.totalRequests}
  Compressed: ${stats.compressedRequests} (${compressionRate}%)
  Original Size: ${this.formatBytes(stats.totalOriginalSize)}
  Compressed Size: ${this.formatBytes(stats.totalCompressedSize)}
  Saved: ${this.formatBytes(stats.savedBytes)} (${stats.compressionRatio.toFixed(1)}%)
    `.trim();
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// Singleton instance
export const compressionOptimizer = new CompressionOptimizer();

/**
 * Create optimized compression middleware
 */
export function createOptimizedCompression() {
  return compressionOptimizer.createMiddleware();
}

/**
 * Compression stats endpoint
 */
export function compressionStatsEndpoint(req: Request, res: Response): void {
  const stats = compressionOptimizer.getStats();
  res.json({
    ...stats,
    formattedStats: compressionOptimizer.getFormattedStats(),
  });
}

/**
 * Middleware to add compression hints to response headers
 */
export function compressionHintsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Add hint for large responses
    const jsonString = JSON.stringify(data);
    const size = Buffer.byteLength(jsonString);

    if (size > 10 * 1024) {
      // > 10KB
      res.setHeader('X-Compression-Recommended', 'true');
      res.setHeader('X-Original-Size', size.toString());
    }

    return originalJson(data);
  };

  next();
}
