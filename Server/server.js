const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();

// Add the middleware
app.use(express.json());
app.use(cors());

// Define database connection details from environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AdrishMitra@4',
  database: process.env.DB_DATABASE || "WaterManagement",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Sample endpoint to demonstrate connection
app.get('/test-connection', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ message: 'Connection successful', result: rows[0].result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error connecting to database' });
  }
});

// ... Existing code (imports, pool, app)

// Create user endpoint
app.post('/create-user', async (req, res) => {
  try {
    const { username, password, account_type } = req.body;

    // Validate input data (optional)
    if (!username || !password || !account_type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Hash the password using a secure hashing algorithm before storing it
    const hashedPassword = await bcrypt.hash(password, 10); // Replace with desired salt rounds

    // Prepare SQL query with placeholders
    const sql = `INSERT INTO Users (username, password, account_type) VALUES (?, ?, ?)`;

    // Execute the query with prepared statement
    const [result] = await pool.query(sql, [username, hashedPassword, account_type]);

    // Check if user was created successfully
    if (result.affectedRows === 1) {
      res.json({ message: 'User created successfully' });
    } else {
      res.status(500).json({ message: 'Failed to create user' });
    }
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Username already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Endpoint for user authentication
app.post('/login', async (req, res) => {
  const { username, password, account_type } = req.body;

  try {
    // Check if username and account type combination exists in the database
    const [rows] = await pool.query('SELECT * FROM Users WHERE username = ? AND account_type = ?', [username, account_type]);
    if (rows.length === 0) {
      // Username or account type not found
      return res.status(401).json({ message: 'Authentication failed. Invalid username, account type, or password.' });
    }

    // Retrieve the hashed password from the database
    const hashedPassword = rows[0].password;

    // Compare the provided password with the hashed password from the database
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch) {
      // Passwords don't match
      return res.status(401).json({ message: 'Authentication failed. Invalid username, account type, or password.' });
    }

    // Authentication successful
    res.json({ message: 'Authentication successful' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error authenticating user' });
  }
});



app.post('/add-product', async (req, res) => {
  try {
    const { product_name, description, price, username } = req.body;

    // Validate input data (optional)
    if (!product_name || !description || !price || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Prepare SQL query with placeholders
    const sql = `INSERT INTO Products (product_name, description, price, username) VALUES (?, ?, ?, ?)`;

    // Execute the query with prepared statement to prevent SQL injection
    const [result] = await pool.query(sql, [product_name, description, price, username]);

    // Check if product was inserted successfully
    if (result.affectedRows === 1) {
      res.json({ message: 'Product added successfully' });
    } else {
      res.status(500).json({ message: 'Failed to add product' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/delete-product/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;

    // Validate input data
    if (!product_id) {
      return res.status(400).json({ message: 'Missing product ID' });
    }

    // Prepare SQL query with placeholder
    const sql = `DELETE FROM Products WHERE product_id = ?`;

    // Execute the query with prepared statement
    const [result] = await pool.query(sql, [product_id]);

    // Check if product was deleted successfully
    if (result.affectedRows === 1) {
      res.json({ message: 'Product deleted successfully' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.status(500).json({ message: 'Failed to delete product' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Get all products endpoint
app.get('/products', async (req, res) => {
  try {
    // Prepare SQL query
    const sql = `SELECT * FROM Products`;

    // Execute the query
    const [rows] = await pool.query(sql);

    // Send response with all products
    res.json({ products: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id);

  try {
    const [rows] = await pool.query('SELECT * FROM Products WHERE product_id = ?', [productId]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Add order endpoint
app.post('/add-order', async (req, res) => {
  try {
    const { product_id, date, username } = req.body;

    // Validate input data
    if (!product_id || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Prepare SQL query with placeholders
    const sql = `INSERT INTO Orders (product_id, date, username) VALUES (?, ?, ?)`;

    // Execute the query with prepared statement
    const [result] = await pool.query(sql, [product_id, date, username]);

    // Check if order was inserted successfully
    if (result.affectedRows === 1) {
      res.json({ message: 'Order added successfully' });
    } else {
      res.status(500).json({ message: 'Failed to add order' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// ... Existing code (imports, pool, app)

// Get all orders endpoint
app.get('/orders', async (req, res) => {
  try {
    // Prepare SQL query with JOIN to retrieve product details
    const sql = `
      SELECT o.product_id, o.date, p.product_name, p.description, p.price
      FROM Orders o
      INNER JOIN Products p ON o.product_id = p.product_id
    `;

    // Execute the query
    const [rows] = await pool.query(sql);

    // Send response with all orders and associated product details
    res.json({ orders: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/orders/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Prepare SQL query with JOIN and username filter
    const sql = `
      SELECT p.product_name, p.price, o.date
      FROM Orders o
      INNER JOIN Products p ON o.product_id = p.product_id
      INNER JOIN Users u ON o.username = u.username
      WHERE u.username = ?
    `;

    // Execute the query with username parameter
    const [rows] = await pool.query(sql, [username]);

    // Send response with all orders and associated product details
    res.json({ orders: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});