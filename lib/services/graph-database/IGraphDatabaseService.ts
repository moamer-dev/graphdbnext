export interface IGraphDatabaseService {
  connect(): Promise<void>
  execute(query: string, parameters?: Record<string, unknown>): Promise<unknown[]>
  executeRead(query: string, parameters?: Record<string, unknown>): Promise<unknown[]>
  executeWrite(query: string, parameters?: Record<string, unknown>): Promise<unknown[]>
  executeSingle(query: string, parameters?: Record<string, unknown>): Promise<unknown>
  close(): Promise<void>
  getDatabaseType(): string
}

