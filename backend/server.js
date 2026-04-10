// Starts the HTTP server and validates database connectivity before serving traffic.
require('dotenv').config();

const http = require('http');

const app = require('./app');
const sequelize = require('./config/db');
const { initDeliveryRealtime } = require('./services/deliveryRealtimeService');
require('./models');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('MariaDB connection successful.');

    await sequelize.sync();
    console.log('Sequelize models synchronized.');

    const server = http.createServer(app);
    initDeliveryRealtime(server);

    server.listen(PORT, () => {
      console.log(`Amena backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

bootstrap();
