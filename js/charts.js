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

    function drawMultiLineChart(canvas, series, labels) {
        const ctx = canvas.getContext("2d");
        const { width, height } = canvas;
        const padding = 48;
        const min = 35;
        const max = 95;
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(89,58,28,0.15)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = padding + ((height - padding * 2) / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        labels.forEach((label, index) => {
            const x = padding + ((width - padding * 2) / Math.max(labels.length - 1, 1)) * index;
            ctx.fillStyle = "#78624b";
            ctx.font = "12px sans-serif";
            ctx.fillText(String(label), x - 14, height - 12);
        });
        series.forEach((line) => {
            ctx.strokeStyle = line.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            line.values.forEach((value, index) => {
                const x = padding + ((width - padding * 2) / Math.max(line.values.length - 1, 1)) * index;
                const y = height - padding - ((value - min) / (max - min)) * (height - padding * 2);
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            line.values.forEach((value, index) => {
                const x = padding + ((width - padding * 2) / Math.max(line.values.length - 1, 1)) * index;
                const y = height - padding - ((value - min) / (max - min)) * (height - padding * 2);
                ctx.fillStyle = line.color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        let legendX = padding;
        const legendY = 20;
        series.forEach((line) => {
            ctx.fillStyle = line.color;
            ctx.fillRect(legendX, legendY, 12, 12);
            ctx.fillStyle = "#2f2418";
            ctx.font = "12px sans-serif";
            ctx.fillText(line.name, legendX + 18, legendY + 11);
            legendX += 90;
        });
    }

    function drawLineChart(canvas, points, color) {
        drawMultiLineChart(canvas, [{ name: "综合", color, values: points.map((item) => item.value) }], points.map((item) => item.label));
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

    function drawRoadmapChart(canvas, points, markers = []) {
        const ctx = canvas.getContext("2d");
        const { width, height } = canvas;
        const padding = 54;
        const min = 35;
        const max = 95;
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(89,58,28,0.14)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = padding + ((height - padding * 2) / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        ctx.strokeStyle = "#9a3412";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        points.forEach((item, index) => {
            const x = padding + ((width - padding * 2) / Math.max(points.length - 1, 1)) * index;
            const y = height - padding - ((item.value - min) / (max - min)) * (height - padding * 2);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        points.forEach((item, index) => {
            const x = padding + ((width - padding * 2) / Math.max(points.length - 1, 1)) * index;
            const y = height - padding - ((item.value - min) / (max - min)) * (height - padding * 2);
            ctx.fillStyle = "rgba(154,52,18,0.78)";
            ctx.beginPath();
            ctx.arc(x, y, 2.8, 0, Math.PI * 2);
            ctx.fill();
            if (index % 4 === 0) {
                ctx.fillStyle = "#78624b";
                ctx.font = "11px sans-serif";
                ctx.fillText(String(item.age), x - 8, height - 20);
            }
        });
        markers.forEach((marker) => {
            const index = marker.index;
            if (index < 0 || index >= points.length) return;
            const x = padding + ((width - padding * 2) / Math.max(points.length - 1, 1)) * index;
            const y = height - padding - ((points[index].value - min) / (max - min)) * (height - padding * 2);
            ctx.fillStyle = marker.type === "wealth" ? "#b45309" : marker.type === "relation" ? "#be123c" : "#0f766e";
            ctx.beginPath();
            ctx.arc(x, y, 5.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "10px sans-serif";
            ctx.fillText(marker.symbol || "!", x - 3, y + 3);
        });
    }

    window.ChartRenderer = {
        renderRadar,
        drawLineChart,
        drawMultiLineChart,
        drawBarChart,
        drawRoadmapChart
    };
})();
