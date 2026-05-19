const { User, Admin } = require('./models/schema');
const bcrypt = require('bcryptjs');
const http = require('http');

async function run() {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@amena.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

    let user = await User.findOne({
      where: { email: ADMIN_EMAIL },
      include: [{ model: Admin, as: 'adminProfile' }]
    });

    if (user) {
      console.log('User found:', JSON.stringify(user, null, 2));
      console.log('Detected Role:', user.adminProfile ? 'Admin' : 'None');
    } else {
      console.log('User admin@amena.tn not found.');
    }

    if (!user || !user.adminProfile) {
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@amena.com';
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      if (!user) {
        user = await User.create({
          name: 'Admin',
          email: ADMIN_EMAIL,
          password: hashedPassword
        });
        console.log('Created new user.');
      } else {
        user.password = hashedPassword;
        await user.save();
        console.log('Updated existing user password.');
      }

      await Admin.create({
        admin_id: user.user_id,
        role: 'SuperAdmin'
      });
      console.log('Assigned Admin role.');
      
      // Re-fetch to confirm
      user = await User.findOne({
        where: { email: ADMIN_EMAIL },
        include: [{ model: Admin, as: 'adminProfile' }]
      });
    }

    console.log('Final User Details:');
    console.log('ID:', user?.user_id || 'unknown');
    console.log('Email:', user?.email || 'unknown');
    console.log('Role:', user?.adminProfile ? user.adminProfile.role : 'None');

    console.log('\nAttempting login...');
    const data = JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Login Response Status:', res.statusCode);
        console.log('Login Response Body:', body);
        process.exit(0);
      });
    });

    req.on('error', (err) => {
      console.error('Login request failed:', err.message);
      process.exit(0);
    });

    req.write(data);
    req.end();

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
