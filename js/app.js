(function () {
    const STORAGE_KEY = "tming-bazi-profiles-v2";
    const REGIONS = [
        { name: "上海", longitude: 121.47, timezoneOffset: 8 },
        { name: "北京", longitude: 116.41, timezoneOffset: 8 },
        { name: "广州", longitude: 113.26, timezoneOffset: 8 },
        { name: "深圳", longitude: 114.05, timezoneOffset: 8 },
        { name: "成都", longitude: 104.06, timezoneOffset: 8 },
        { name: "重庆", longitude: 106.55, timezoneOffset: 8 },
        { name: "西安", longitude: 108.94, timezoneOffset: 8 },
        { name: "武汉", longitude: 114.31, timezoneOffset: 8 },
        { name: "昆明", longitude: 102.83, timezoneOffset: 8 },
        { name: "乌鲁木齐", longitude: 87.62, timezoneOffset: 8 },
        { name: "拉萨", longitude: 91.13, timezoneOffset: 8 },
        { name: "香港", longitude: 114.17, timezoneOffset: 8 },
        { name: "台北", longitude: 121.56, timezoneOffset: 8 },
        { name: "东京", longitude: 139.69, timezoneOffset: 9 },
        { name: "新加坡", longitude: 103.82, timezoneOffset: 8 },
        { name: "自定义", longitude: 120, timezoneOffset: 8 }
    ];

    const state = { current: null };

    function initSelects() {
        fillSelect("birth-year", 1950, 2035, new Date().getFullYear() - 30);
        fillSelect("target-year", 2020, 2045, new Date().getFullYear());
        fillSelect("birth-month", 1, 12, 6);
        fillSelect("birth-day", 1, 31, 18);
        initRegionSelect();
    }

    function fillSelect(id, start, end, selected, formatter) {
        const el = document.getElementById(id);
        el.innerHTML = "";
        for (let i = start; i <= end; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = formatter ? formatter(i) : i;
            if (i === selected) option.selected = true;
            el.appendChild(option);
        }
    }

    function initRegionSelect() {
        const select = document.getElementById("birth-region");
        select.innerHTML = REGIONS.map((region, index) => `<option value="${index}">${region.name}</option>`).join("");
        select.value = "0";
        applyRegion(REGIONS[0]);
    }

    function bindEvents() {
        document.querySelectorAll(".nav-links a").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                showSection(link.dataset.section);
            });
        });
        document.getElementById("bazi-form").addEventListener("submit", handleSubmit);
        document.getElementById("btn-example").addEventListener("click", loadExample);
        document.getElementById("btn-save").addEventListener("click", saveCurrentProfile);
        document.getElementById("btn-clear-storage").addEventListener("click", clearProfiles);
        document.getElementById("birth-region").addEventListener("change", handleRegionChange);
        [
            "birth-year",
            "birth-month",
            "birth-day",
            "birth-time",
            "birth-longitude",
            "timezone-offset",
            "solar-time-mode"
        ].forEach((id) => {
            document.getElementById(id).addEventListener("input", updatePreview);
            document.getElementById(id).addEventListener("change", updatePreview);
        });
    }

    function handleRegionChange(event) {
        const region = REGIONS[Number(event.target.value)] || REGIONS[0];
        applyRegion(region);
        updatePreview();
    }

    function applyRegion(region) {
        document.getElementById("birth-longitude").value = region.longitude.toFixed(2);
        document.getElementById("timezone-offset").value = String(region.timezoneOffset);
    }

    function showSection(section) {
        document.querySelectorAll(".section").forEach((node) => node.classList.remove("active"));
        document.querySelector(`#section-${section}`).classList.add("active");
        document.querySelectorAll(".nav-links a").forEach((node) => node.classList.toggle("active", node.dataset.section === section));
    }

    function getTimeParts() {
        const raw = document.getElementById("birth-time").value || "09:30";
        const [hour, minute] = raw.split(":").map(Number);
        return { hour, minute };
    }

    function getInput() {
        const { hour, minute } = getTimeParts();
        const region = REGIONS[Number(document.getElementById("birth-region").value)] || REGIONS[0];
        return {
            profileName: document.getElementById("profile-name").value.trim() || "未命名档案",
            year: Number(document.getElementById("birth-year").value),
            month: Number(document.getElementById("birth-month").value),
            day: Number(document.getElementById("birth-day").value),
            hour,
            minute,
            gender: document.getElementById("gender").value,
            targetYear: Number(document.getElementById("target-year").value),
            solarTimeMode: document.getElementById("solar-time-mode").value,
            timezoneOffset: Number(document.getElementById("timezone-offset").value),
            longitude: Number(document.getElementById("birth-longitude").value),
            regionName: region.name
        };
    }

    function handleSubmit(event) {
        event.preventDefault();
        runAnalysis(getInput());
    }

    function runAnalysis(input) {
        const chart = BaziCore.computeBaZi(input);
        const dayun = DayunEngine.buildDaYun(chart, input.targetYear);
        const liunian = DayunEngine.buildLiuNian(chart, dayun, input.targetYear);
        const liuyue = DayunEngine.buildLiuYue(chart, input.targetYear);
        const health = HealthEngine.analyzeHealth(chart);
        const environment = BaziAnalysis.getEnvironmentAnalysis(chart, input.targetYear);
        const report = AIEngine.buildReport(chart, dayun, liunian, liuyue, health, input.targetYear);
        const lucky = AIEngine.buildLuckySuggestions(chart, health);
        state.current = { input, chart, dayun, liunian, liuyue, health, environment, report, lucky };
        renderAll();
        showSection("bazi");
    }

    function renderAll() {
        const { input, chart, dayun, liunian, liuyue, health, environment, report, lucky } = state.current;
        document.getElementById("env-year-label").textContent = input.targetYear;
        document.getElementById("liuyue-year-label").textContent = input.targetYear;
        renderCalculationMeta(chart);
        renderPillars(chart);
        renderWuxing(chart);
        renderNarratives(chart);
        renderDayun(dayun, liunian, liuyue);
        renderHealth(health);
        renderAI(report, environment, lucky);
    }

    function renderCalculationMeta(chart) {
        const solar = chart.solarMeta;
        const cards = [
            { title: "出生地与经度", body: `${chart.input.regionName} · 东经 ${chart.input.longitude.toFixed(2)}° · 时区 UTC${chart.input.timezoneOffset >= 0 ? "+" : ""}${chart.input.timezoneOffset}` },
            { title: "标准时间", body: `${solar.standardText} · ${solar.standardShichen.label}（${solar.standardShichen.start}-${solar.standardShichen.end}）` },
            { title: "真太阳时", body: `${solar.trueSolarText} · ${solar.trueSolarShichen.label}（${solar.trueSolarShichen.start}-${solar.trueSolarShichen.end}）` },
            { title: "最终排盘依据", body: `${solar.usedMode === "trueSolar" ? "采用真太阳时" : "采用标准时间"}；修正 ${formatSigned(solar.totalOffsetMinutes)} 分钟` }
        ];
        document.getElementById("calculation-meta").innerHTML = cards.map((item) => `<div class="mini-card"><h3>${item.title}</h3><p>${item.body}</p></div>`).join("");
    }

    function renderPillars(chart) {
        const container = document.getElementById("pillars-container");
        container.innerHTML = chart.pillars.map((pillar, index) => `
            <div class="pillar">
                <div class="pillar-label">${pillar.label}${index === 2 ? "（日主）" : ""}</div>
                <div class="pillar-main">
                    <div class="gan ${index === 2 ? "day-master" : ""}">${pillar.stem}</div>
                    <div class="zhi">${pillar.branch}</div>
                </div>
                <p><strong>${pillar.tenGod}</strong></p>
                ${index === 3 ? `<p class="muted">${chart.solarMeta.effectiveShichen.label}（${chart.solarMeta.effectiveShichen.start}-${chart.solarMeta.effectiveShichen.end}）</p>` : ""}
                <p class="muted">藏干：${pillar.hidden.join("、")}</p>
                <p class="muted">纳音：${pillar.nayin}</p>
            </div>
        `).join("");
    }

    function renderWuxing(chart) {
        const max = Math.max(...Object.values(chart.wuxing));
        ChartRenderer.renderRadar(document.getElementById("wuxing-chart"), chart.wuxing, chart.colors);
        document.getElementById("wuxing-details").innerHTML = Object.entries(chart.wuxing).map(([key, value]) => `
            <div class="wuxing-row">
                <span>${key}</span>
                <div class="progress"><span style="width:${(value / max) * 100}%; background:${chart.colors[key]}"></span></div>
                <strong>${value.toFixed(1)}</strong>
            </div>
        `).join("");
        document.getElementById("wuxing-summary").innerHTML = `<p>${BaziAnalysis.getWuxingSummary(chart)}</p>`;
    }

    function renderNarratives(chart) {
        const shishen = BaziAnalysis.getShishenAnalysis(chart);
        const pattern = BaziAnalysis.getPatternAnalysis(chart);
        document.getElementById("shishen-analysis").innerHTML = shishen.map((item) => `<div class="mini-card"><h3>${item.title}</h3><p>${item.body}</p></div>`).join("");
        document.getElementById("pattern-analysis").innerHTML = `
            <div class="report-block">
                <h3>${pattern.pattern}</h3>
                <p>${pattern.advice}</p>
                <p>用神参考：${chart.structure.usefulElement}；辅助参考：${chart.structure.supportiveElement}。</p>
            </div>
        `;
        document.getElementById("shensha-analysis").innerHTML = chart.shensha.length
            ? chart.shensha.map((item) => `<div class="chip">${item}</div>`).join("")
            : `<div class="chip">当前示例规则下未触发重点神煞</div>`;
    }

    function renderDayun(dayun, liunian, liuyue) {
        document.getElementById("dayun-info").innerHTML = `
            <p>起运年龄约 <strong>${dayun.startAge}</strong> 岁，当前年龄约 <strong>${dayun.currentAge}</strong> 岁，当前处于 <strong>${dayun.current.label}</strong> 大运。</p>
        `;
        document.getElementById("dayun-timeline").innerHTML = dayun.list.map((item) => `
            <div class="timeline-item ${item.label === dayun.current.label ? "active" : ""}">
                <h3>${item.label}</h3>
                <p>${item.yearStart} - ${item.yearEnd}</p>
                <p>${item.ageStart} - ${item.ageEnd} 岁</p>
            </div>
        `).join("");
        document.getElementById("current-dayun-label").textContent = `（当前大运：${dayun.current.label}）`;
        document.getElementById("liunian-container").innerHTML = `<div class="pair-grid">${liunian.map((item) => `
            <div class="mini-card">
                <h3>${item.year} · ${item.pillar}</h3>
                <p class="score">综合分 ${item.score}</p>
                <p>${item.summary}</p>
            </div>
        `).join("")}</div>`;
        document.getElementById("liuyue-container").innerHTML = `<div class="pair-grid">${liuyue.map((item) => `
            <div class="month-card">
                <h3>${item.month}月 · ${item.pillar}</h3>
                <p class="score">月度分 ${item.score}</p>
                <p>${item.focus}</p>
            </div>
        `).join("")}</div>`;
        ChartRenderer.drawLineChart(document.getElementById("fortune-chart"), liunian.map((item) => ({ label: item.year, value: item.score })), "#9a3412");
    }

    function renderHealth(health) {
        document.getElementById("health-wuxing-map").innerHTML = `<div class="pair-grid">${health.organScores.map((item) => `
            <div class="mini-card">
                <h3>${item.element}</h3>
                <p>对应：${item.organs.join("、")}</p>
                <p>${item.risk}</p>
            </div>
        `).join("")}</div>`;
        document.getElementById("health-risk-analysis").innerHTML = health.risks.length
            ? health.risks.map((item) => `<div class="risk-card"><h3>${item.element}系风险</h3><p>脏腑：${item.organs.join("、")}</p><p>指数：${item.score}</p><p>${item.risk}</p></div>`).join("")
            : `<div class="risk-card"><p>当前五行健康指数整体较均衡，仍需关注长期生活方式。</p></div>`;
        document.getElementById("health-suggestions").innerHTML = health.suggestions.map((item) => `<div class="report-block"><p>${item}</p></div>`).join("");
        ChartRenderer.drawBarChart(document.getElementById("health-chart"), health.organScores);
    }

    function renderAI(report, environment, lucky) {
        const loading = document.getElementById("ai-loading");
        loading.classList.remove("hidden");
        setTimeout(() => {
            loading.classList.add("hidden");
            document.getElementById("ai-report").innerHTML = report.map((item) => `<div class="report-block"><h3>${item.title}</h3><p>${item.body}</p></div>`).join("");
            document.getElementById("environment-analysis").innerHTML = `<div class="report-block"><h3>${environment.title}</h3><p>${environment.body}</p></div>`;
            document.getElementById("lucky-suggestions").innerHTML = lucky.map((item) => `<div class="report-block"><p>${item}</p></div>`).join("");
        }, 180);
    }

    function getLunarText(year, month, day) {
        const date = new Date(year, month - 1, day, 12, 0, 0);
        const formatter = new Intl.DateTimeFormat("zh-Hans-CN-u-ca-chinese", { year: "numeric", month: "long", day: "numeric" });
        const parts = formatter.formatToParts(date);
        const relatedYear = parts.find((item) => item.type === "relatedYear")?.value || String(year);
        const yearName = parts.find((item) => item.type === "yearName")?.value || "";
        const monthName = parts.find((item) => item.type === "month")?.value || "";
        const dayName = parts.find((item) => item.type === "day")?.value || "";
        return `${relatedYear}${yearName ? `（${yearName}年）` : ""}${monthName}${dayName}日`;
    }

    function updatePreview() {
        const input = getInput();
        const solarMeta = BaziCore.buildSolarTimeMeta(input);
        const lunarText = getLunarText(input.year, input.month, input.day);
        const recommendation = solarMeta.autoUseTrueSolar
            ? "自动模式下建议采用真太阳时，因为修正后已影响时柱或日期边界。"
            : "自动模式下可继续使用标准时间，因为修正未跨越时柱或日期边界。";
        document.getElementById("datetime-preview").innerHTML = `
            <div class="preview-line"><span>公历</span><strong>${input.year}-${pad(input.month)}-${pad(input.day)} ${pad(input.hour)}:${pad(input.minute)}</strong></div>
            <div class="preview-line"><span>对应农历</span><strong>${lunarText}</strong></div>
            <div class="preview-line"><span>标准时辰</span><strong>${solarMeta.standardShichen.label}（${solarMeta.standardShichen.start}-${solarMeta.standardShichen.end}）</strong></div>
            <div class="preview-line"><span>真太阳时</span><strong>${solarMeta.trueSolarText} · ${solarMeta.trueSolarShichen.label}</strong></div>
            <div class="preview-line"><span>修正值</span><strong>${formatSigned(solarMeta.totalOffsetMinutes)} 分钟（经度 ${formatSigned(solarMeta.longitudeMinutes)}，均时差 ${formatSigned(solarMeta.equationMinutes)}）</strong></div>
            <div class="preview-line"><span>自动建议</span><strong>${recommendation}</strong></div>
        `;
    }

    function formatSigned(value) {
        return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function loadExample() {
        document.getElementById("profile-name").value = "示例命盘";
        document.getElementById("birth-year").value = "1992";
        document.getElementById("birth-month").value = "8";
        document.getElementById("birth-day").value = "16";
        document.getElementById("birth-time").value = "08:36";
        document.getElementById("birth-region").value = "0";
        applyRegion(REGIONS[0]);
        document.getElementById("solar-time-mode").value = "auto";
        document.getElementById("gender").value = "female";
        document.getElementById("target-year").value = String(new Date().getFullYear());
        updatePreview();
        runAnalysis(getInput());
    }

    function saveCurrentProfile() {
        if (!state.current) {
            alert("请先完成一次测算。");
            return;
        }
        const profiles = loadProfiles();
        const payload = {
            id: Date.now(),
            name: state.current.input.profileName,
            input: state.current.input
        };
        profiles.unshift(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.slice(0, 12)));
        renderSavedProfiles();
    }

    function loadProfiles() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    }

    function renderSavedProfiles() {
        const container = document.getElementById("saved-profiles");
        const profiles = loadProfiles();
        container.innerHTML = profiles.length ? profiles.map((item) => `
            <div class="saved-item">
                <div>
                    <strong>${item.name}</strong>
                    <p class="muted">${item.input.year}-${pad(item.input.month)}-${pad(item.input.day)} ${pad(item.input.hour)}:${pad(item.input.minute)} · ${item.input.regionName}</p>
                </div>
                <button class="btn-link" data-load-id="${item.id}">载入</button>
            </div>
        `).join("") : `<p class="muted">还没有本地档案。</p>`;
        container.querySelectorAll("[data-load-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const profile = profiles.find((item) => String(item.id) === button.dataset.loadId);
                if (!profile) return;
                applyInput(profile.input, profile.name);
                updatePreview();
                runAnalysis(profile.input);
            });
        });
    }

    function applyInput(input, name) {
        document.getElementById("profile-name").value = name || input.profileName || "";
        document.getElementById("birth-year").value = String(input.year);
        document.getElementById("birth-month").value = String(input.month);
        document.getElementById("birth-day").value = String(input.day);
        document.getElementById("birth-time").value = `${pad(input.hour)}:${pad(input.minute)}`;
        document.getElementById("gender").value = input.gender;
        document.getElementById("target-year").value = String(input.targetYear || new Date().getFullYear());
        document.getElementById("solar-time-mode").value = input.solarTimeMode || "auto";
        document.getElementById("timezone-offset").value = String(input.timezoneOffset ?? 8);
        document.getElementById("birth-longitude").value = Number(input.longitude).toFixed(2);
        const regionIndex = Math.max(REGIONS.findIndex((region) => region.name === input.regionName), 0);
        document.getElementById("birth-region").value = String(regionIndex);
    }

    function clearProfiles() {
        localStorage.removeItem(STORAGE_KEY);
        renderSavedProfiles();
    }

    initSelects();
    bindEvents();
    renderSavedProfiles();
    updatePreview();
    loadExample();
})();
