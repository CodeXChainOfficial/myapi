// vercel needs this to know it's a Node.js project
// @ts-nocheck
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');

const app = express();
const port = 5004;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json()); 
// Create a new token



let db;



async function initDatabase() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });

  // Check if the newToken table exists
  const tableExists = await db.get('SELECT name FROM sqlite_master WHERE type = "table" AND name = "LastToken"');

  if (!tableExists) {
    // Create the newToken table if it does not exist
    await db.exec(`
      CREATE TABLE LastToken (
        name TEXT,
        symbol TEXT,
        Taddress TEXT,
        walletAddress TEXT,
        category TEXT,
        transactionHash TEXT
      );
    `);
  }
}


initDatabase();


// API endpoint to save deployed tokens
app.post('/api/saveDeployedTokens', async (req, res) => {
  const deployedTokens = req.body.deployedTokens;
  console.log('Received request at post /api/saveDeployedTokens');

  try {
    // Assuming deployedTokens is an array of objects with name, symbol, tokenAddress, walletAddress, and category properties
    for (const token of deployedTokens) {
      await db.run('INSERT INTO LastToken VALUES (?, ?, ?, ?, ?, ?)', [token.name, token.symbol, token.Taddress, token.walletAddress, token.category, token.transactionHash]);
    }

    res.json({ success: true, message: 'Tokens saved successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error saving tokens.' });
  }
});

// API endpoint to get deployed tokens based on category and walletAddress
// API endpoint to get deployed tokens based on category and walletAddress
app.get('/api/getDeployedTokens', async (req, res) => {
  const { category, walletAddress } = req.query;

  try {
    // Query the database based on category and walletAddress
    console.log('Received request at get /api/getDeployedTokens');
    console.log('Request query:', req.query);

    let query = 'SELECT name, symbol, Taddress, walletAddress, category, "transactionHash" FROM LastToken';
    const params = [];

    if (category && walletAddress) {
      query += ' WHERE category = ? AND walletAddress = ?';
      params.push(category, walletAddress);
    } else if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    } else if (walletAddress) {
      query += ' WHERE walletAddress = ?';
      params.push(walletAddress);
    }

    const storedTokens = await db.all(query, params);

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

app.get('/api/getDeployedTokensCount', async (req, res) => {
  try {
    // Query the newToken database to get the count of tokens
    const newTokenQuery = 'SELECT COUNT(*) as count FROM newToken';
    const newTokenCount = await db.get(newTokenQuery);

    // Query the tokens database to get the count of tokens
    // Replace 'tokens' with the actual name of your tokens table
    const tokensQuery = 'SELECT COUNT(*) as count FROM tokens';
    const tokensCount = await db.get(tokensQuery);

    const lasttokensQuery = 'SELECT COUNT(*) as count FROM LastToken';
    const lasttokensCount = await db.get(lasttokensQuery);

    // Calculate the total count
    const totalCount = newTokenCount.count + tokensCount.count + lasttokensCount.count;

    res.json({ success: true, tokensCount: totalCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving token count.' });
  }
});
/*
app.post('/api/createToken', (req, res) => {

  console.log('server create token');
  const newTokenData = req.body;
  createToken(newTokenData);
  console.log('server created token');

  executeBash();
  console.log('server executed token');

  res.json({ message: 'Token creation initiated' });
});

let storedCanisterInfo = null;

// ... (previous code)

// Define a schema and model for your tokens
/*const tokenSchema = new mongoose.Schema({
  name: String,
  symbol: String,
  tokenAddress: String,
  walletAddress: String,
  category: String,
  // Add other properties as needed
});

const Token = mongoose.model('Token', tokenSchema);



// ... (previous code)*/

/*

app.post('/api/scriptInfo', (req, res) => {
  const { canisterInfo } = req.body;
  storedCanisterInfo = canisterInfo; // Store canisterInfo

  // Respond with a success message
  res.json({ message: 'Data receive successfully',storedCanisterInfo });
});

app.get('/api/scriptInfo', (req, res) => {
  // Respond with the storedCanisterInfo
  res.json({ storedCanisterInfo });
});


app.get('/api/storedCanisterInfo', (req, res) => {
  // Retrieve the storedCanisterInfo (implement this logic based on how you store it)
  const storedCanisterInfo = // retrieve your storedCanisterInfo

  // Respond with the storedCanisterInfo
  res.json({ storedCanisterInfo });
});


app.get("/indexICP", (req, res) => {
  const principal = req.query.principal; // Retrieve the principal from the query parameters
  const agent = JSON.parse(req.query.agent); // Parse the agent from JSON
  const actor = JSON.parse(req.query.actor); // Parse the actor from JSON

  res.send(`
    <html>
      <head>
        <title>ICP Data</title>
      </head>
      <body>
        <h1>Principal: ${principal}</h1>
        <p>Agent: ${JSON.stringify(agent)}</p>
        <p>Actor: ${JSON.stringify(actor)}</p>
      </body>
    </html>
  `);

  // Now you have access to the principal, agent, and actor.

  // Your logic here...

  res.send("Hello ICP Page"); // Respond to the request
});

*/

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
