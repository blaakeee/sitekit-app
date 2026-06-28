type LogLevel = 'info' | 'warn' | 'error';

type LogEntry = {
  level: LogLevel;
  tag: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
};

const LOG_BUFFER_MAX = 200;
const buffer: LogEntry[] = [];

function write(level: LogLevel, tag: string, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    tag,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  buffer.push(entry);
  if (buffer.length > LOG_BUFFER_MAX) buffer.shift();

  const prefix = `[${tag}]`;
  switch (level) {
    case 'info':
      console.log(prefix, message, data ?? '');
      break;
    case 'warn':
      console.warn(prefix, message, data ?? '');
      break;
    case 'error':
      console.error(prefix, message, data ?? '');
      break;
  }
}

export const logger = {
  info: (tag: string, message: string, data?: Record<string, unknown>) =>
    write('info', tag, message, data),
  warn: (tag: string, message: string, data?: Record<string, unknown>) =>
    write('warn', tag, message, data),
  error: (tag: string, message: string, data?: Record<string, unknown>) =>
    write('error', tag, message, data),
  getBuffer: () => [...buffer],
};
