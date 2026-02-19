import postgres from 'postgres';


const connectionString = process.env.DATABASE_URL;

export const sql = postgres(connectionString || '', {
  ssl: false,           
  max: 5,                
  idle_timeout: 15,      
  connect_timeout: 10,  
  prepare: false         
});

export default sql;