/* Simple structured logger with correlation IDs */
import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  cid?: string; // correlation id
  path?: string;
  method?: string;
  userId?: string;
  [key: string]: any;
}

function ts() {
  return new Date().toISOString();
}

function base(level: LogLevel, message: string, ctx?: LogContext, extra?: any) {
  const payload: any = {
    t: ts(),
    level,
    message,
    ...(ctx || {}),
  };
  if (extra !== undefined) payload.extra = extra;
  
  // Console output
  const line = JSON.stringify(payload);
  // eslint-disable-next-line no-console
  console.log(line);
  
  // File output for development
  if (process.env.NODE_ENV === 'development') {
    try {
      const logsDir = path.join(process.cwd(), 'logs', 'dev');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = `${line}\n`;
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Silently fail if file logging fails
      console.warn('Failed to write to log file:', error);
    }
  }
}

export const logger = {
  debug: (message: string, ctx?: LogContext, extra?: any) => base('debug', message, ctx, extra),
  info: (message: string, ctx?: LogContext, extra?: any) => base('info', message, ctx, extra),
  warn: (message: string, ctx?: LogContext, extra?: any) => base('warn', message, ctx, extra),
  error: (message: string, ctx?: LogContext, extra?: any) => base('error', message, ctx, extra),
};

export function withCorrelationId(req: { headers: any }, fallback?: string): string {
  const headerCid = (req.headers['x-correlation-id'] as string) || (req.headers['x-request-id'] as string);
  return headerCid || fallback || `cid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Development-specific logging helpers
export const devLogger = {
  // YouTube API specific logging
  youtube: {
    search: (query: string, filters: any, cid?: string) => {
      logger.info('🎬 YouTube API Search Request', {
        cid,
        service: 'youtube',
        action: 'search',
        query,
        filters,
        timestamp: new Date().toISOString()
      });
    },
    
    success: (results: any[], cid?: string) => {
      logger.info('✅ YouTube API Search Success', {
        cid,
        service: 'youtube',
        action: 'search',
        resultCount: results.length,
        timestamp: new Date().toISOString()
      });
    },
    
    error: (error: any, attempt: number, cid?: string) => {
      logger.error('❌ YouTube API Search Error', {
        cid,
        service: 'youtube',
        action: 'search',
        attempt,
        error: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    },
    
    fallback: (reason: string, cid?: string) => {
      logger.warn('🔄 YouTube API Fallback Used', {
        cid,
        service: 'youtube',
        action: 'fallback',
        reason,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  // Chat API specific logging
  chat: {
    request: (message: string, userId: string, mode: string, cid?: string) => {
      logger.info('💬 Chat API Request', {
        cid,
        service: 'chat',
        action: 'request',
        userId,
        mode,
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });
    },
    
    streaming: (cid?: string, phase?: string) => {
      logger.debug('🔄 Chat API Streaming', {
        cid,
        service: 'chat',
        action: 'streaming',
        phase,
        timestamp: new Date().toISOString()
      });
    },
    
    videoSearch: (query: string, cid?: string) => {
      logger.info('🎥 Chat API Video Search', {
        cid,
        service: 'chat',
        action: 'videoSearch',
        query,
        timestamp: new Date().toISOString()
      });
    },
    
    response: (responseLength: number, videoCount: number, cid?: string) => {
      logger.info('✅ Chat API Response Complete', {
        cid,
        service: 'chat',
        action: 'response',
        responseLength,
        videoCount,
        timestamp: new Date().toISOString()
      });
    },
    
    error: (error: any, cid?: string) => {
      logger.error('❌ Chat API Error', {
        cid,
        service: 'chat',
        action: 'error',
        error: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  // Database operations
  database: {
    save: (table: string, operation: string, cid?: string) => {
      logger.debug('💾 Database Operation', {
        cid,
        service: 'database',
        action: 'save',
        table,
        operation,
        timestamp: new Date().toISOString()
      });
    },
    
    load: (table: string, operation: string, cid?: string) => {
      logger.debug('📂 Database Operation', {
        cid,
        service: 'database',
        action: 'load',
        table,
        operation,
        timestamp: new Date().toISOString()
      });
    },
    
    error: (error: any, operation: string, cid?: string) => {
      logger.error('❌ Database Error', {
        cid,
        service: 'database',
        action: 'error',
        operation,
        error: error.message || error,
        timestamp: new Date().toISOString()
      });
    }
  }
};





