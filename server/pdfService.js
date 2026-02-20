const puppeteer = require('puppeteer');

/**
 * Generates a high-quality PDF from dashboard data using Puppeteer and Chart.js
 */
async function generateDashboardPDF(dashboardName, charts, theme = 'dark') {
    const isDark = theme === 'dark';

    // Background colors based on theme
    const bgColor = isDark ? '#0f172a' : '#f8fafc';
    const cardColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f1f5f9' : '#0f172a';
    const mutedTextColor = isDark ? '#94a3b8' : '#64748b';
    const borderColor = isDark ? '#334155' : '#e2e8f0';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: ${bgColor};
                color: ${textColor};
                margin: 0;
                padding: 40px;
                -webkit-print-color-adjust: exact;
            }
            .header {
                margin-bottom: 40px;
                border-bottom: 2px solid ${borderColor};
                padding-bottom: 20px;
            }
            .dashboard-title {
                font-size: 32px;
                font-weight: 700;
                margin: 0;
            }
            .dashboard-subtitle {
                font-size: 14px;
                color: ${mutedTextColor};
                margin-top: 8px;
            }
            .charts-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 24px;
            }
            .chart-card {
                background-color: ${cardColor};
                border: 1px solid ${borderColor};
                border-radius: 16px;
                padding: 24px;
                display: flex;
                flex-direction: column;
                break-inside: avoid;
            }
            .chart-card.full-width {
                grid-column: span 2;
            }
            .chart-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 4px;
            }
            .chart-desc {
                font-size: 12px;
                color: ${mutedTextColor};
                margin-bottom: 20px;
            }
            .chart-container {
                position: relative;
                height: 300px;
                width: 100%;
            }
            .kpi-value {
                font-size: 48px;
                font-weight: 700;
                color: #6366f1;
            }
            @media print {
                body { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="dashboard-title">${dashboardName}</h1>
            <p class="dashboard-subtitle">InsightAI Generated Report • ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="charts-grid">
            ${charts.map((chart, index) => {
        const isKPI = chart.config.type === 'KPI';
        const isLarge = chart.config.type === 'LINE' || chart.config.type === 'AREA';
        return `
                <div class="chart-card ${isLarge ? 'full-width' : ''}">
                    <div class="chart-title">${chart.config.title}</div>
                    <div class="chart-desc">${chart.config.description}</div>
                    <div class="chart-container">
                        ${isKPI
                ? `<div class="kpi-value">${chart.data[0]?.value || 0}</div>`
                : `<canvas id="chart-${index}"></canvas>`
            }
                    </div>
                </div>
                `;
    }).join('')}
        </div>

        <script>
            const chartsData = ${JSON.stringify(charts)};
            const isDark = ${isDark};
            const themeColors = {
                grid: isDark ? '#334155' : '#e2e8f0',
                text: isDark ? '#94a3b8' : '#64748b'
            };

            const colorOptions = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#38bdf8'];

            chartsData.forEach((chart, index) => {
                if (chart.config.type === 'KPI') return;

                const ctx = document.getElementById('chart-' + index).getContext('2d');
                const labels = chart.data.map(d => d[chart.config.xAxisKey]);
                const values = chart.data.map(d => d[chart.config.dataKey]);
                
                let chartType = 'bar';
                if (chart.config.type === 'LINE') chartType = 'line';
                if (chart.config.type === 'AREA') chartType = 'line';
                if (chart.config.type === 'PIE') chartType = 'doughnut';

                const config = {
                    type: chartType,
                    data: {
                        labels: labels,
                        datasets: [{
                            label: chart.config.title,
                            data: values,
                            backgroundColor: chart.config.multicolor 
                                ? colorOptions 
                                : (chart.config.color || colorOptions[index % colorOptions.length]),
                            borderColor: chart.config.type === 'PIE' ? 'transparent' : (chart.config.color || colorOptions[index % colorOptions.length]),
                            borderWidth: 2,
                            fill: chart.config.type === 'AREA',
                            tension: 0.4
                        }]
                    },
                    options: {
                        animation: false, // CRITICAL: Disable animations for stable PDF capture
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: chart.config.type === 'PIE',
                                position: 'bottom',
                                labels: { color: themeColors.text, font: { family: 'Inter', size: 10 } }
                            }
                        },
                        scales: chart.config.type === 'PIE' ? {} : {
                            x: {
                                grid: { display: false },
                                ticks: { color: themeColors.text, font: { family: 'Inter', size: 10 } }
                            },
                            y: {
                                grid: { color: themeColors.grid },
                                ticks: { color: themeColors.text, font: { family: 'Inter', size: 10 } }
                            }
                        }
                    }
                };

                if (chart.config.type === 'AREA') {
                    config.data.datasets[0].backgroundColor = (chart.config.color || colorOptions[index % colorOptions.length]) + '44';
                }

                new Chart(ctx, config);
            });
        </script>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Wait for Chart.js animations to finish (or disable animations)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();
    return pdf;
}

module.exports = { generateDashboardPDF };
