require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log(`${sequelize.getDialect()} connection successful.`);

    await sequelize.sync();
    console.log('Sequelize models synchronized.');

    app.listen(PORT, () => {
      console.log(`Amena backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

bootstrap();
