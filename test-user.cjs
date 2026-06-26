const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/AnalyticCore-Server/.env') });
const supabaseService = require('./server/AnalyticCore-Server/supabaseService');

async function test() {
    const user = await supabaseService.getUserByEmail('suhaifakt01@gmail.com');
    console.log(user);
    process.exit(0);
}
test();
