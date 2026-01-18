
async function main() {

    console.log("Job finished successfully");

}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Job failed:", err);
    process.exit(1);
  })

const { Client } = require('pg'); // Example for PostgreSQL

const secret_config = JSON.parse(process.env.DB_SECRET_JSON);

const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // Injected by Fargate
  port: 5432,
  ssl: {
    rejectUnauthorized: false // Required for RDS encrypted connections
  }
});

async function manageDatabase() {
  try {
    await client.connect();
    console.log("Connected to database successfully.");

    // --- INSERT DATA ---
    const insertText = 'INSERT INTO users(name, email) VALUES($1, $2) RETURNING *';
    const insertValues = ['Jane Doe', 'jane@example.com'];
    
    const resInsert = await client.query(insertText, insertValues);
    console.log("Inserted Row:", resInsert.rows[0]);

    // --- SELECT DATA ---
    const selectText = 'SELECT * FROM users WHERE email = $1';
    const selectValues = ['jane@example.com'];

    const resSelect = await client.query(selectText, selectValues);
    console.log("Found User:", resSelect.rows);

  } catch (err) {
    console.error("Database Error:", err.stack);
  } finally {
    // Always close the connection
    await client.end();
    console.log("Connection closed.");
  }
}