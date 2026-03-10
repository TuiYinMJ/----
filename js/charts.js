(function () {
    function renderRadar(container, wuxing, colors) {
        const entries = Object.entries(wuxing);
        const max = Math.max(...entries.map(([, v]) => v), 1);
        const size = 300;
        const center = size / 2;
        const radius = 110;
        const angleStep = (Math.PI * 2) / entries.length;
        const grid = [0.25, 0.5, 0.75, 1].map((ratio) => {
            const points = entries.map((_, i) => {
                const angle = -Math.PI / 2 + i * angleStep;
                return `${center + Math.cos(angle) * radius * ratio},${center + Math.sin(angle) * radius * ratio}`;
            }).join(" ");
            return `<polygon points="${points}" fill="none" stroke="rgba(89,58,28,0.15)" stroke-width="1"/>`;
        }).join("");
        const axes = entries.map((entry, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            const lx = center + Math.cos(angle) * (radius + 24);
            const ly = center + Math.sin(angle) * (radius + 24);
            return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(89,58,28,0.18)"/><text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#78624b" font-size="14">${entry[0]}</text>`;
        }).join("");
        const dataPoints = entries.map(([key, value], i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return `${center + Math.cos(angle) * radius * (value / max)},${center + Math.sin(angle) * radius * (value / max)}`;
        }).join(" ");
        container.innerHTML = `
            <svg viewBox="0 0 ${size} ${size}" width="100%" height="300" aria-label="五行雷达图">
                ${grid}
                ${axes}
                <polygon points="${dataPoints}" fill="rgba(154,52,18,0.18)" stroke="#9a3412" stroke-width="2"/>
                ${entries.map(([key, value], i) => {
                    const angle = -Math.PI / 2 + i * angleStep;
                    const x = center + Math.cos(angle) * radius * (value / max);
                    const y = center + Math.sin(angle) * radius * (value / max);
                    return `<circle cx="${x}" cy="${y}" r="4.5" fill="${colors[key]}"/>`;
                }).join("")}
            </svg>
            <div class="chart-legend">
                ${entries.map(([key]) => `<span class="legend-item"><span class="legend-color" style="background:${colors[key]}"></span>${key}</span>`).join("")}
            </div>
        `;
    }

    function drawLineChart(canvas, points, color) {
        const ctx = canvas.getContext("2d");
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        const padding = 40;
        const max = Math.max(...points.map((item) => item.value), 100);
        const min = Math.min(...points.map((item) => item.value), 0);
        ctx.strokeStyle = "rgba(89,58,28,0.15)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = padding + ((height - padding * 2) / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        points.forEach((point, idx) => {
            const x = padding + ((width - padding * 2) / Math.max(points.length - 1, 1)) * idx;
            const y = height - padding - ((point.value - min) / Math.max(max - min, 1)) * (height - padding * 2);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        points.forEach((point, idx) => {
            const x = padding + ((width - padding * 2) / Math.max(points.length - 1, 1)) * idx;
            const y = height - padding - ((point.value - min) / Math.max(max - min, 1)) * (height - padding * 2);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#78624b";
            ctx.font = "12px sans-serif";
            ctx.fillText(String(point.label), x - 12, height - 12);
            ctx.fillText(String(point.value), x - 10, y - 10);
        });
    }

    function drawBarChart(canvas, items) {
        const ctx = canvas.getContext("2d");
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        const barWidth = Math.min(120, (width - 120) / items.length);
        const max = 100;
        items.forEach((item, idx) => {
            const x = 60 + idx * (barWidth + 28);
            const h = (item.score / max) * (height - 90);
            const y = height - 50 - h;
            ctx.fillStyle = "rgba(22,78,99,0.12)";
            ctx.fillRect(x, 30, barWidth, height - 80);
            ctx.fillStyle = item.score >= 75 ? "#3f6212" : item.score >= 65 ? "#b45309" : "#991b1b";
            ctx.fillRect(x, y, barWidth, h);
            ctx.fillStyle = "#2f2418";
            ctx.font = "14px sans-serif";
            ctx.fillText(item.element, x + barWidth / 2 - 7, height - 20);
            ctx.fillText(String(item.score), x + barWidth / 2 - 10, y - 8);
        });
    }

    window.ChartRenderer = {
        renderRadar,
        drawLineChart,
        drawBarChart
    };
})();
