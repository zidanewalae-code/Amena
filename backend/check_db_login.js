const mysql = require('mysql2/promise');
const axios = require('axios');

async function run() {
  console.log('Starting script...');
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'AmenaDB'
    });

    console.log('Querying user...');
    const [users] = await connection.execute(
      'SELECT id, email, password, role FROM Users WHERE email = ?',
      ['admin@amena.tn']
    );

    if (users.length > 0) {
      const user = users[0];
      console.log('User found:');
      console.log('Email: ' + user.email);
      console.log('Role: ' + user.role);
      console.log('Password Hash Prefix: ' + user.password.substring(0, 10) + '...');

      const [admins] = await connection.execute(
        'SELECT * FROM Admins WHERE userId = ?',
        [user.id]
      );
      console.log('Admin record found: ' + (admins.length > 0 ? 'Yes' : 'No'));
    } else {
      console.log('User admin@amena.tn not found.');
    }

    console.log('\n--- Login Attempt ---');
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        email: 'admin@amena.tn',
        password: 'secret123'
      });
      console.log('Status Code: ' + response.status);
      console.log('Response Body: ' + JSON.stringify(response.data));
    } catch (error) {
      console.log('Status Code: ' + (error.response ? error.response.status : 'No response'));
      console.log('Error Body: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }

  } catch (err) {
    console.error('Script Error: ' + err.message);
  } finally {
    if (connection) await connection.end();
  }
}

run().then(() => console.log('Script finished.'));
