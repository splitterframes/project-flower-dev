/**
 * 🎯 Smart Logging System
 * 
 * Provides environment-aware logging with configurable levels
 * Reduces log spam in production while maintaining debug capabilities
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  minLogLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class SmartLogger {
  private config: LogConfig;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Parse log level from environment or default based on NODE_ENV
    const envLogLevel = process.env.LOG_LEVEL as LogLevel;
    const minLogLevel: LogLevel = envLogLevel || (this.isProduction ? 'warn' : 'debug');
    
    this.config = {
      level: minLogLevel,
      enableTimestamps: process.env.LOG_TIMESTAMPS === 'true',
      enableColors: !this.isProduction,
      minLogLevel,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLogLevel];
  }

  private formatMessage(level: LogLevel, emoji: string, message: string, ...args: any[]): string {
    const timestamp = this.config.enableTimestamps ? `[${new Date().toISOString()}] ` : '';
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    
    return `${timestamp}${emoji} ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', '🔍', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', 'ℹ️', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', '⚠️', message, ...args));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      const errorMsg = error instanceof Error ? error.message : String(error || '');
      console.error(this.formatMessage('error', '❌', message, errorMsg));
      
      // In development, also log the stack trace
      if (!this.isProduction && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
  }

  // Special loggers for specific systems
  auth(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', '🔐', message, ...args));
    }
  }

  butterfly(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', '🦋', message, ...args));
    }
  }

  sun(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', '☀️', message, ...args));
    }
  }

  income(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', '💰', message, ...args));
    }
  }

  db(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', '🗄️', message, ...args));
    }
  }

  api(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', '🌐', message, ...args));
    }
  }

  perf(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', '⚡', message, ...args));
    }
  }

  // Get current configuration
  getConfig(): LogConfig {
    return { ...this.config };
  }

  // Check if we're in production
  isProductionMode(): boolean {
    return this.isProduction;
  }
}

// Export singleton instance
export const logger = new SmartLogger();

// Convenience exports for backwards compatibility
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
