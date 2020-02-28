require('dotenv').config();
const { setup: setupDevServer } = require('jest-dev-server');

module.exports = async function globalSetup() {
  await setupDevServer({
    command: `TEST_PORT=${process.env.TEST_PORT} NODE_ENV=testing ts-node src/api.ts`,
    launchTimeout: 60000,
    port: process.env.TEST_PORT,
  });
};
