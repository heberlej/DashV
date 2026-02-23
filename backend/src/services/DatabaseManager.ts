import { Pool } from 'pg';

export interface Service {
  id: string;
  name: string;
  url: string;
  icon?: string;
  iconUrl?: string;
  description?: string;
  containerName: string;
  containerType: 'lxc' | 'qemu';
  containerId: number;
  node?: string;
  status?: string;
  port: number;
  ip: string;
  lastUpdated: Date;
  source?: 'discovered' | 'manual';
}

export interface ProxmoxConnection {
  id: string;
  host: string;
  user: string;
  token: string;
  createdAt: Date;
}

export class DatabaseManager {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
      console.log('Database connection successful');
      await this.createTables();
    } catch (error) {
      console.warn('⚠️  Database not available - running in memory mode');
      console.warn('To enable database: Start PostgreSQL on localhost:5432');
    }
  }

  private async createTables(): Promise<void> {
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS proxmox_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        host VARCHAR(255) NOT NULL UNIQUE,
        "user" VARCHAR(255) NOT NULL,
        token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        icon VARCHAR(255),
        description TEXT,
        container_name VARCHAR(255) NOT NULL,
        container_type VARCHAR(50) NOT NULL,
        container_id INTEGER NOT NULL,
        port INTEGER NOT NULL,
        ip VARCHAR(45) NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(container_id, port)
      );

      CREATE TABLE IF NOT EXISTS service_changes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES services(id),
        change_type VARCHAR(50) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_services_container_id ON services(container_id);
      CREATE INDEX IF NOT EXISTS idx_service_changes_service_id ON service_changes(service_id);
    `;

    try {
      await this.pool.query(createTablesSQL);
      console.log('Tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async saveProxmoxConnection(config: {
    host: string;
    user: string;
    token: string;
  }): Promise<string> {
    const query = `
      INSERT INTO proxmox_connections (host, "user", token)
      VALUES ($1, $2, $3)
      ON CONFLICT (host) DO UPDATE SET
        "user" = EXCLUDED."user",
        token = EXCLUDED.token
      RETURNING id;
    `;

    const result = await this.pool.query(query, [
      config.host,
      config.user,
      config.token,
    ]);

    return result.rows[0].id;
  }

  async getProxmoxConnection(): Promise<ProxmoxConnection | null> {
    try {
      const query = `
        SELECT id, host, "user", token, created_at as "createdAt"
        FROM proxmox_connections
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const result = await this.pool.query(query);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      // Table might not exist in memory mode
      return null;
    }
  }

  async getAllServices(): Promise<Service[]> {
    const query = 'SELECT * FROM services ORDER BY name';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async saveService(service: Omit<Service, 'id' | 'lastUpdated'>): Promise<Service> {
    const query = `
      INSERT INTO services (name, url, icon, description, container_name, container_type, container_id, port, ip)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (container_id, port) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        ip = EXCLUDED.ip,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      service.name,
      service.url,
      service.icon,
      service.description,
      service.containerName,
      service.containerType,
      service.containerId,
      service.port,
      service.ip,
    ]);

    return result.rows[0];
  }

  async logServiceChange(
    serviceId: string,
    changeType: string,
    oldValue?: string,
    newValue?: string,
  ): Promise<void> {
    const query = `
      INSERT INTO service_changes (service_id, change_type, old_value, new_value)
      VALUES ($1, $2, $3, $4);
    `;

    await this.pool.query(query, [serviceId, changeType, oldValue, newValue]);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
