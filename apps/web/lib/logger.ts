/* Simple structured logger with correlation IDs */
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
  const line = JSON.stringify(payload);
  // eslint-disable-next-line no-console
  console.log(line);
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




