import { IGraphDatabaseService } from './IGraphDatabaseService'
import { MemgraphService } from '../MemgraphService'

export class MemgraphAdapter implements IGraphDatabaseService {
  private service: MemgraphService

  constructor(host = '127.0.0.1', port = 7687, username = '', password = '') {
    this.service = new MemgraphService(host, port, username, password)
  }

  async connect(): Promise<void> {
    await this.service.connect()
  }

  async execute(query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
    return this.service.execute(query, parameters)
  }

  async executeRead(query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
    return this.service.executeRead(query, parameters)
  }

  async executeWrite(query: string, parameters: Record<string, unknown> = {}): Promise<unknown[]> {
    return this.service.executeWrite(query, parameters)
  }

  async executeSingle(query: string, parameters: Record<string, unknown> = {}): Promise<unknown> {
    return this.service.executeSingle(query, parameters)
  }

  async close(): Promise<void> {
    await this.service.close()
  }

  getDatabaseType(): string {
    return 'memgraph'
  }
}

