#!/usr/bin/env node

/**
 * 🚀 Production Readiness Checker
 * 
 * Validates that the application is properly configured for production deployment
 */

import 'dotenv/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const checks: Array<() => CheckResult> = [];

// Check 1: Environment variables
checks.push(() => {
  const required = ['DATABASE_URL', 'NODE_ENV'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    return {
      passed: false,
      message: `Missing required environment variables: ${missing.join(', ')}`,
      severity: 'error'
    };
  }
  
  return {
    passed: true,
    message: 'All required environment variables are set',
    severity: 'info'
  };
});

// Check 2: NODE_ENV
checks.push(() => {
  const nodeEnv = process.env.NODE_ENV;
  
  if (nodeEnv !== 'production' && nodeEnv !== 'development') {
    return {
      passed: false,
      message: `NODE_ENV should be 'production' or 'development', got: ${nodeEnv}`,
      severity: 'warning'
    };
  }
  
  return {
    passed: true,
    message: `NODE_ENV is correctly set to: ${nodeEnv}`,
    severity: 'info'
  };
});

// Check 3: Database URL format
checks.push(() => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return {
      passed: false,
      message: 'DATABASE_URL is not set',
      severity: 'error'
    };
  }
  
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    return {
      passed: false,
      message: 'DATABASE_URL should start with postgresql:// or postgres://',
      severity: 'error'
    };
  }
  
  return {
    passed: true,
    message: 'DATABASE_URL format is valid',
    severity: 'info'
  };
});

// Check 4: Rate limiting in production
checks.push(() => {
  const isProduction = process.env.NODE_ENV === 'production';
  const rateLimitDisabled = process.env.DISABLE_AUTH_RATE_LIMIT === 'true';
  
  if (isProduction && rateLimitDisabled) {
    return {
      passed: false,
      message: 'DISABLE_AUTH_RATE_LIMIT should NOT be true in production!',
      severity: 'error'
    };
  }
  
  return {
    passed: true,
    message: 'Rate limiting configuration is correct',
    severity: 'info'
  };
});

// Check 5: Performance metrics token in production
checks.push(() => {
  const isProduction = process.env.NODE_ENV === 'production';
  const metricsEnabled = process.env.ENABLE_PERF_METRICS_ENDPOINT === 'true';
  const token = process.env.PERF_METRICS_TOKEN;
  
  if (isProduction && metricsEnabled && (!token || token.length < 20)) {
    return {
      passed: false,
      message: 'PERF_METRICS_TOKEN should be a strong token (20+ characters) in production',
      severity: 'warning'
    };
  }
  
  return {
    passed: true,
    message: 'Performance metrics security is properly configured',
    severity: 'info'
  };
});

// Check 6: Log level in production
checks.push(() => {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL;
  
  if (isProduction && logLevel === 'debug') {
    return {
      passed: false,
      message: 'LOG_LEVEL=debug in production will create excessive logs and slow down the server',
      severity: 'warning'
    };
  }
  
  return {
    passed: true,
    message: 'Log level is appropriate for the environment',
    severity: 'info'
  };
});

// Check 7: Package.json exists
checks.push(() => {
  const packagePath = join(process.cwd(), 'package.json');
  
  if (!existsSync(packagePath)) {
    return {
      passed: false,
      message: 'package.json not found - run this from the project root',
      severity: 'error'
    };
  }
  
  try {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const hasDbOptimize = pkg.scripts && pkg.scripts['db:optimize'];
    
    if (!hasDbOptimize) {
      return {
        passed: false,
        message: 'Missing "db:optimize" script in package.json',
        severity: 'warning'
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: 'Failed to read package.json',
      severity: 'error'
    };
  }
  
  return {
    passed: true,
    message: 'package.json is properly configured',
    severity: 'info'
  };
});

// Check 8: Required files exist
checks.push(() => {
  const requiredFiles = [
    'server/index.ts',
    'server/postgresStorage.ts',
    'server/addCriticalIndexes.ts',
    'PERFORMANCE_OPTIMIZATIONS.md'
  ];
  
  const missing = requiredFiles.filter(file => !existsSync(join(process.cwd(), file)));
  
  if (missing.length > 0) {
    return {
      passed: false,
      message: `Missing required files: ${missing.join(', ')}`,
      severity: 'error'
    };
  }
  
  return {
    passed: true,
    message: 'All required files are present',
    severity: 'info'
  };
});

// Run all checks
console.log('🔍 Running production readiness checks...\n');

let errorCount = 0;
let warningCount = 0;

for (const check of checks) {
  try {
    const result = check();
    
    const icon = result.severity === 'error' ? '❌' : 
                 result.severity === 'warning' ? '⚠️' : '✅';
    
    console.log(`${icon} ${result.message}`);
    
    if (!result.passed) {
      if (result.severity === 'error') errorCount++;
      if (result.severity === 'warning') warningCount++;
    }
  } catch (error: any) {
    console.error(`❌ Check failed with error: ${error.message}`);
    errorCount++;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Errors:   ${errorCount}`);
console.log(`Warnings: ${warningCount}`);
console.log(`Total:    ${checks.length} checks`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (errorCount > 0) {
  console.error('❌ Production readiness check FAILED');
  console.error('   Please fix the errors above before deploying.\n');
  process.exit(1);
} else if (warningCount > 0) {
  console.warn('⚠️ Production readiness check passed with warnings');
  console.warn('   Consider addressing the warnings above.\n');
  process.exit(0);
} else {
  console.log('✅ Production readiness check PASSED');
  console.log('   Your application is ready for deployment!\n');
  console.log('📋 Next steps:');
  console.log('   1. Run database optimization: npm run db:optimize');
  console.log('   2. Build the application: npm run build');
  console.log('   3. Deploy to production');
  console.log('   4. Monitor logs and metrics for first 24 hours\n');
  process.exit(0);
}
