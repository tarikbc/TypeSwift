declare module 'connect-pg-simple' {
  import session from 'express-session';
  import { Pool } from 'pg';
  
  interface PgStoreOptions {
    pool: Pool | any;
    tableName?: string;
    schemaName?: string;
    ttl?: number;
    disableTouch?: boolean;
    pruneSessionInterval?: number;
    errorLog?: (error: Error) => void;
    createTableIfMissing?: boolean;
  }
  
  interface PgStore extends session.Store {
    new (options: PgStoreOptions): PgStore;
  }
  
  function PgStoreFactory(connect: typeof session): {
    new (options: PgStoreOptions): session.Store;
  };
  
  export = PgStoreFactory;
}
