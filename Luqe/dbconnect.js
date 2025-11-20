const { Client } = require('pg');

// Define your connection details
const client = new Client({
  user: 'your_db_user',
  host: 'localhost',
  database: 'your_db_name',
  password: 'your_password',
  port: 5432, 
});

async function connectAndQuery() {
  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    // Example query
    const res = await client.query('SELECT * FROM users WHERE id = $1', [1]);
    console.log('Query result:', res.rows);

    await client.end();
  } catch (err) {
    console.error('Connection or Query Error:', err);
  }
}

connectAndQuery();