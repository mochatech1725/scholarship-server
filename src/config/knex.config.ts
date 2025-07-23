import knex, { Knex } from 'knex';
import { getSecret } from './secrets.config.js';

let knexInstance: Knex | null = null;

export async function initKnex(secretArn: string): Promise<Knex> {
  if (knexInstance) {
    return knexInstance;
  }

  try {
    const secret = await getSecret(secretArn);
    
    knexInstance = knex({
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST || secret.host, // Use local tunnel if set
        user: secret.username,
        password: secret.password,
        database: secret.dbname,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : (secret.port ? Number(secret.port) : 3306), // Use local tunnel port if set
        ssl: secret.ssl || undefined,
      },
      pool: { 
        min: 0, 
        max: 10,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
      },
    });

    // Test the connection
    await knexInstance.raw('SELECT 1');
    console.log('✅ Knex MySQL connection established successfully');
    
    return knexInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Knex:', error);
    throw error;
  }
}

export function getKnex(): Knex {
  if (!knexInstance) {
    throw new Error('Knex not initialized. Call initKnex() first.');
  }
  return knexInstance;
}

export default knexInstance; 