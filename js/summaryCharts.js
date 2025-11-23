// summaryCharts.js - donut chart rendering and center text plugin

// Plugin to draw center text in donut
Chart.register({
    id: 'centerText',
    afterDraw(chart) {
        if (chart.config.options.plugins.centerText) {
            const ctx = chart.ctx;
            const centerConfig = chart.config.options.plugins.centerText;
            ctx.save();
            ctx.font = 'bold 1.1em Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#222';
            const x = chart.getDatasetMeta(0).data[0].x;
            const y = chart.getDatasetMeta(0).data[0].y;
            ctx.fillText(centerConfig.text1, x, y - 12);
            ctx.font = 'bold 1em Arial';
            ctx.fillText(centerConfig.text2, x, y + 12);
            ctx.restore();
        }
    }
});

// Chart rendering logic, called from summary.js
function renderSummaryChart(stats) {
    // Bar chart hidden: do not render bar chart canvas
    let chartDiv = document.getElementById('summary-chart-container');
    chartDiv.innerHTML = '';

    // Render 4 donut charts for each period
    // Set colors as requested
    // Sales: #0066FF, Paid: #00FFCC, Pending: #FF6633, Summary: dynamic (Profit/Loss)
    const donutContainer = document.getElementById('donut-charts-container');
    donutContainer.innerHTML = '';
    stats.forEach((s, i) => {
        // dynamic label for the summary slice: Profit if >=0, Loss if <0
        const summaryLabel = (Number(s.summary) < 0) ? 'Loss' : 'Profit';
        const donutLabels = ['Sales', 'Paid', 'Pending', summaryLabel];
        const donutId = `donutChart${i}`;
        const donutBox = document.createElement('div');
        donutBox.style.display = 'flex';
        donutBox.style.flexDirection = 'column';
        donutBox.style.alignItems = 'center';
        donutBox.style.justifyContent = 'center';
        donutBox.style.width = '260px';
        donutBox.innerHTML = `<canvas id="${donutId}" width="260" height="260"></canvas><div style='margin-top:8px;font-weight:600;font-size:1em;'>${s.label}</div>`;
        donutContainer.appendChild(donutBox);
        const donutCtx = donutBox.querySelector('canvas').getContext('2d');
        if (window[`_donutChart${i}`]) window[`_donutChart${i}`].destroy();
        // Compose center text: total and summary
        const total = s.sales + s.paidExpenses + s.pendingExpenses;
        // Dynamic color for summary: treat zero as Profit (green)
        let summaryColor = '#269900';
        if (Number(s.summary) < 0) summaryColor = '#cc0000';
        const donutColors = ['#0066FF', '#ff5f1f', '#ffc107', summaryColor];
        window[`_donutChart${i}`] = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: donutLabels,
                datasets: [{
                    data: [s.sales, s.paidExpenses, s.pendingExpenses, s.summary],
                    backgroundColor: donutColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                    datalabels: {
                        color: '#222',
                        font: {
                            weight: 'bold',
                            size: 14 // smaller for label
                        },
                        align: 'outside',
                        anchor: 'end',
                        offset: 60,
                        clamp: false,
                        textAlign: 'center',
                        display: 'auto',
                        rotation: 0,
                        formatter: function(value, ctx) {
                            const label = ctx.chart.data.labels[ctx.dataIndex];
                            if (value === 0) return '';
                            return label + '\n₹' + value.toLocaleString();
                        },
                        font: function(context) {
                            // Use smaller font for label, larger for value
                            const value = context.dataset.data[context.dataIndex];
                            return {
                                weight: 'bold',
                                size: context.dataset.data[context.dataIndex] === value ? 14 : 18
                            };
                        },
                    },
                    centerText: {
                        text1: `Total: ₹${total.toLocaleString()}`,
                        text2: `${summaryLabel}: ₹${Number(s.summary).toLocaleString()}`
                    }
                },
                cutout: '65%'
            },
            plugins: [ChartDataLabels]
        });
    });
}
