import fetch from 'node-fetch';

async function testDuplicationFix() {
    const userId = 2; 
    const baseUrl = 'http://localhost:5000/api';
    
    console.log('--- Testing Dashboard List (Should only show non-workspace) ---');
    try {
        const response = await fetch(`${baseUrl}/dashboards?userId=${userId}`);
        if (!response.ok) {
            console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
            return;
        }
        const dashboards = await response.json();
        
        const workspaceDashboards = dashboards.filter(d => d.is_workspace);
        const personalDashboards = dashboards.filter(d => !d.is_workspace);
        
        console.log(`Total dashboards returned: ${dashboards.length}`);
        console.log(`Workspace dashboards in list (should be 0): ${workspaceDashboards.length}`);
        console.log(`Personal dashboards in list: ${personalDashboards.length}`);
        
        if (workspaceDashboards.length === 0) {
            console.log('✅ PASS: Workspace dashboards are excluded from the main list.');
        } else {
            console.log('❌ FAIL: Workspace dashboards are still appearing in the main list.');
        }
    } catch (error) {
        console.error('❌ Error during test:', error.message);
    }
}

testDuplicationFix();
