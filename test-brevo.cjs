const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/AnalyticCore-Server/.env') });
const brevoService = require('./server/AnalyticCore-Server/brevoService');

async function test() {
    const success = await brevoService.sendWorkspaceCreatedEmail('suhaifakt01@gmail.com', 'Suhaif', 'Test Workspace');
    console.log("Email sent successfully?", success);
    process.exit(0);
}
test();
