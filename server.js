import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pkg from 'pg';

const app = express();
const port = 5004;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:1CCf63d-c25c3dgff1Cab6F2A5*C5cFC@roundhouse.proxy.rlwy.net:38917/railway';
const { Client } = pkg;

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
  }
}

connectToDatabase();
async function initDatabase() {
  try {
    const resultLastToken = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'LastToken'
      );
    `);

    const tableLastTokenExists = resultLastToken.rows[0].exists;

    const resultUserRegistration = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'userregistration'
      );
    `);

    const tableUserRegistrationExists = resultUserRegistration.rows[0].exists;

    if (!tableLastTokenExists) {
      // Create the LastToken table if it does not exist
      await client.query(`
        CREATE TABLE LastToken (
          name TEXT,
          symbol TEXT,
          Taddress TEXT,
          walletAddress TEXT,
          category TEXT,
          transactionHash TEXT
        );
      `);

      console.log('LastToken table created');
    }

    if (!tableUserRegistrationExists) {
      // Create the userregistration table if it does not exist
      await client.query(`
        CREATE TABLE userregistration (
          id SERIAL PRIMARY KEY,
          email TEXT,
          referralCode TEXT,
          productName TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('userregistration table created');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
initDatabase();

// API endpoint to save deployed tokens
app.post('/api/saveDeployedTokens', async (req, res) => {
  const deployedTokens = req.body.deployedTokens;
  console.log('Received request at post /api/saveDeployedTokens');

  try {
    for (const token of deployedTokens) {
      await client.query('INSERT INTO LastToken VALUES ($1, $2, $3, $4, $5, $6)', [
        token.name,
        token.symbol,
        token.Taddress,
        token.walletAddress,
        token.category,
        token.transactionHash,
      ]);
    }

    res.json({ success: true, message: 'Tokens saved successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error saving tokens.' });
  }
});

// API endpoint to get deployed tokens based on category and walletAddress
app.get('/api/getDeployedTokens', async (req, res) => {
  const { category, walletAddress } = req.query;

  try {
    // Query the database based on category and walletAddress
    console.log('Received request at get /api/getDeployedTokens');
    console.log('Request query:', req.query);

    let query = 'SELECT name, symbol, Taddress, walletAddress, category, "transactionhash" FROM LastToken';
    const params = [];

    if (category && walletAddress) {
      query += ' WHERE category = $1 AND walletAddress = $2';
      params.push(category, walletAddress);
    } else if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    } else if (walletAddress) {
      query += ' WHERE walletAddress = $2';
      params.push(walletAddress);
    }

    const result = await client.query(query, params);
    const storedTokens = result.rows;

    if (storedTokens.length === 0) {
      // No tokens found
      res.json({ success: true, message: 'No tokens found for the given category and wallet address.', deployedTokens: [] });
    } else {
      // Tokens found
      res.json({ success: true, deployedTokens: storedTokens });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving tokens.' });
  }
});


app.post('/api/register', async (req, res) => {
  const { email, referralCode, productName } = req.body;
  console.log('Received request at post /api/register');

  try {
    const result = await client.query(`
      INSERT INTO userregistration (email, referralCode, productName)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [email, referralCode, productName]);

    const registeredUser = result.rows[0];
    res.json({ success: true, message: 'User registered successfully.', user: registeredUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error registering user.' });
  }
});

// API endpoint to get all registered users
app.get('/api/getRegisteredUsers', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM userregistration');
    const registeredUsers = result.rows;

    res.json({ success: true, registeredUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching registered users.' });
  }
});

app.get('/api/getDeployedTokensCount', async (req, res) => {
  try {
    const result = await client.query('SELECT COUNT(*) as count FROM LastToken');
    const lasttokensCount = result.rows[0].count;

    res.json({ success: true, tokensCount: lasttokensCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving token count.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
