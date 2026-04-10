// Resets schema and reseeds deterministic data for repeatable QA cycles.
require('dotenv').config();
const sequelize = require('../config/db');
const { seed } = require('./seed');

async function resetSeed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    await seed();
    console.log('Reset + seed completed successfully.');
  } catch (error) {
    console.error('Reset seed failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  resetSeed();
}

module.exports = {
  resetSeed
};
