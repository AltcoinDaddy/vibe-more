/**
 * Logging system for migration process tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  context?: Record<string, any>
  file?: string
  line?: number
}

export class MigrationLogger {
  private logs: LogEntry[] = []
  private minLevel: LogLevel = LogLevel.INFO

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel
  }

  setLogLevel(level: LogLevel): void {
    this.minLevel = level
  }

  debug(message: string, context?: Record<string, any>, file?: string, line?: number): void {
    this.log(LogLevel.DEBUG, message, context, file, line)
  }

  info(message: string, context?: Record<string, any>, file?: string, line?: number): void {
    this.log(LogLevel.INFO, message, context, file, line)
  }

  warn(message: string, context?: Record<string, any>, file?: string, line?: number): void {
    this.log(LogLevel.WARN, message, context, file, line)
  }

  error(message: string, context?: Record<string, any>, file?: string, line?: number): void {
    this.log(LogLevel.ERROR, message, context, file, line)
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, file?: string, line?: number): void {
    if (level < this.minLevel) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      file,
      line
    }

    this.logs.push(entry)

    // Also log to console for development
    const logMethod = this.getConsoleMethod(level)
    const prefix = `[${this.getLevelString(level)}] ${entry.timestamp.toISOString()}`
    const location = file ? ` (${file}${line ? `:${line}` : ''})` : ''
    
    logMethod(`${prefix} ${message}${location}`)
    if (context) {
      logMethod('Context:', context)
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
        return console.error
      default:
        return console.log
    }
  }

  private getLevelString(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG'
      case LogLevel.INFO:
        return 'INFO'
      case LogLevel.WARN:
        return 'WARN'
      case LogLevel.ERROR:
        return 'ERROR'
      default:
        return 'UNKNOWN'
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level)
    }
    return [...this.logs]
  }

  getLogsByFile(file: string): LogEntry[] {
    return this.logs.filter(log => log.file === file)
  }

  clearLogs(): void {
    this.logs = []
  }

  exportLogs(): string {
    return this.logs.map(log => {
      const location = log.file ? ` (${log.file}${log.line ? `:${log.line}` : ''})` : ''
      const context = log.context ? ` | Context: ${JSON.stringify(log.context)}` : ''
      return `[${this.getLevelString(log.level)}] ${log.timestamp.toISOString()} ${log.message}${location}${context}`
    }).join('\n')
  }

  getStatistics(): {
    total: number
    byLevel: Record<string, number>
    errorFiles: string[]
    warningFiles: string[]
  } {
    const byLevel: Record<string, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0
    }

    const errorFiles = new Set<string>()
    const warningFiles = new Set<string>()

    this.logs.forEach(log => {
      byLevel[this.getLevelString(log.level)]++
      
      if (log.level === LogLevel.ERROR && log.file) {
        errorFiles.add(log.file)
      }
      if (log.level === LogLevel.WARN && log.file) {
        warningFiles.add(log.file)
      }
    })

    return {
      total: this.logs.length,
      byLevel,
      errorFiles: Array.from(errorFiles),
      warningFiles: Array.from(warningFiles)
    }
  }
}