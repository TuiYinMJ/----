(function () {
    const STORAGE_KEY = "tming-bazi-profiles-v3";
    const REGIONS = [
        { name: "上海", longitude: 121.47, timezoneOffset: 8 },
        { name: "北京", longitude: 116.41, timezoneOffset: 8 },
        { name: "广州", longitude: 113.26, timezoneOffset: 8 },
        { name: "深圳", longitude: 114.05, timezoneOffset: 8 },
        { name: "杭州", longitude: 120.15, timezoneOffset: 8 },
        { name: "南京", longitude: 118.80, timezoneOffset: 8 },
        { name: "苏州", longitude: 120.58, timezoneOffset: 8 },
        { name: "武汉", longitude: 114.31, timezoneOffset: 8 },
        { name: "成都", longitude: 104.06, timezoneOffset: 8 },
        { name: "重庆", longitude: 106.55, timezoneOffset: 8 },
        { name: "西安", longitude: 108.94, timezoneOffset: 8 },
        { name: "长沙", longitude: 112.94, timezoneOffset: 8 },
        { name: "郑州", longitude: 113.62, timezoneOffset: 8 },
        { name: "昆明", longitude: 102.83, timezoneOffset: 8 },
        { name: "南宁", longitude: 108.37, timezoneOffset: 8 },
        { name: "福州", longitude: 119.30, timezoneOffset: 8 },
        { name: "厦门", longitude: 118.09, timezoneOffset: 8 },
        { name: "哈尔滨", longitude: 126.64, timezoneOffset: 8 },
        { name: "沈阳", longitude: 123.43, timezoneOffset: 8 },
        { name: "济南", longitude: 117.00, timezoneOffset: 8 },
        { name: "青岛", longitude: 120.38, timezoneOffset: 8 },
        { name: "拉萨", longitude: 91.13, timezoneOffset: 8 },
        { name: "乌鲁木齐", longitude: 87.62, timezoneOffset: 8 },
        { name: "香港", longitude: 114.17, timezoneOffset: 8 },
        { name: "台北", longitude: 121.56, timezoneOffset: 8 },
        { name: "东京", longitude: 139.69, timezoneOffset: 9 },
        { name: "新加坡", longitude: 103.82, timezoneOffset: 8 },
        { name: "纽约", longitude: -74.01, timezoneOffset: -5 },
        { name: "伦敦", longitude: -0.13, timezoneOffset: 0 },
        { name: "自定义", longitude: 120.00, timezoneOffset: 8 }
    ];
    const state = { current: null };

    function $(id) {
        return document.getElementById(id);
    }

    function fillSelect(id, start, end, selected) {
        const el = $(id);
        el.innerHTML = "";
        for (let i = start; i <= end; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            if (i === selected) option.selected = true;
            el.appendChild(option);
        }
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function initSelects() {
        fillSelect("birth-year", 1900, 2099, new Date().getFullYear() - 30);
        fillSelect("birth-month", 1, 12, 6);
        fillSelect("birth-day", 1, 31, 18);
        fillSelect("target-year", 2020, 2045, new Date().getFullYear());
        const regionSelect = $("birth-region");
        regionSelect.innerHTML = REGIONS.map((region, index) => `<option value="${index}">${region.name}</option>`).join("");
        regionSelect.value = "0";
        applyRegion(REGIONS[0]);
        syncLunarLeap();
        syncDayOptions();
    }

    function bindEvents() {
        document.querySelectorAll(".nav-links a").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                showSection(link.dataset.section);
            });
        });
        $("bazi-form").addEventListener("submit", handleSubmit);
        $("btn-example").addEventListener("click", loadExample);
        $("btn-save").addEventListener("click", saveCurrentProfile);
        $("btn-clear-storage").addEventListener("click", clearProfiles);
        $("birth-region").addEventListener("change", handleRegionChange);
        ["calendar-type", "birth-year", "birth-month"].forEach((id) => {
            $(id).addEventListener("change", () => {
                syncLunarLeap();
                syncDayOptions();
                updatePreview();
            });
        });
        $("lunar-leap").addEventListener("change", () => {
            syncDayOptions();
            updatePreview();
        });
        [
            "birth-day",
            "birth-time",
            "birth-longitude",
            "timezone-offset",
            "solar-time-mode",
            "day-boundary-sect",
            "yun-sect",
            "gender",
            "target-year"
        ].forEach((id) => {
            $(id).addEventListener("change", updatePreview);
            $(id).addEventListener("input", updatePreview);
        });
    }

    function showSection(section) {
        document.querySelectorAll(".section").forEach((node) => node.classList.remove("active"));
        document.querySelector(`#section-${section}`).classList.add("active");
        document.querySelectorAll(".nav-links a").forEach((node) => node.classList.toggle("active", node.dataset.section === section));
    }

    function handleRegionChange(event) {
        applyRegion(REGIONS[Number(event.target.value)] || REGIONS[0]);
        updatePreview();
    }

    function applyRegion(region) {
        $("birth-longitude").value = region.longitude.toFixed(2);
        $("timezone-offset").value = String(region.timezoneOffset);
    }

    function syncLunarLeap() {
        const leapSelect = $("lunar-leap");
        const calendarType = $("calendar-type").value;
        if (calendarType !== "lunar") {
            leapSelect.value = "0";
            leapSelect.disabled = true;
            return;
        }
        const year = Number($("birth-year").value);
        const month = Number($("birth-month").value);
        const leapMonth = LunarYear.fromYear(year).getLeapMonth();
        leapSelect.disabled = leapMonth !== month;
        if (leapMonth !== month) leapSelect.value = "0";
    }

    function syncDayOptions() {
        const calendarType = $("calendar-type").value;
        const year = Number($("birth-year").value);
        const month = Number($("birth-month").value);
        const daySelect = $("birth-day");
        const previous = Number(daySelect.value || 1);
        let maxDay = 31;
        if (calendarType === "solar") {
            maxDay = new Date(year, month, 0).getDate();
        } else {
            const lunarMonth = Number($("lunar-leap").value) ? -month : month;
            const lunarMonthInfo = LunarYear.fromYear(year).getMonth(lunarMonth);
            maxDay = lunarMonthInfo ? lunarMonthInfo.getDayCount() : 30;
        }
        daySelect.innerHTML = "";
        for (let i = 1; i <= maxDay; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            if (i === Math.min(previous, maxDay)) option.selected = true;
            daySelect.appendChild(option);
        }
    }

    function getTimeParts() {
        const [hour, minute] = ($("birth-time").value || "09:30").split(":").map(Number);
        return { hour, minute };
    }

    function getInput() {
        const { hour, minute } = getTimeParts();
        const region = REGIONS[Number($("birth-region").value)] || REGIONS[0];
        return {
            profileName: $("profile-name").value.trim() || "未命名档案",
            calendarType: $("calendar-type").value,
            year: Number($("birth-year").value),
            month: Number($("birth-month").value),
            day: Number($("birth-day").value),
            lunarLeap: $("lunar-leap").value === "1",
            hour,
            minute,
            gender: $("gender").value,
            targetYear: Number($("target-year").value),
            solarTimeMode: $("solar-time-mode").value,
            timezoneOffset: Number($("timezone-offset").value),
            longitude: Number($("birth-longitude").value),
            regionName: region.name,
            dayBoundarySect: Number($("day-boundary-sect").value),
            yunSect: Number($("yun-sect").value)
        };
    }

    function handleSubmit(event) {
        event.preventDefault();
        runAnalysis(getInput());
    }

    function updatePreview() {
        let input;
        try {
            input = getInput();
            const preview = BaziCore.buildPreview(input);
            const recommendation = preview.solarMeta.autoUseTrueSolar
                ? "自动模式建议采用真太阳时，因为修正后会影响时柱或日期。"
                : "自动模式可保持标准时间，因为修正后未跨关键边界。";
            const inputTypeText = input.calendarType === "solar"
                ? `公历录入：${preview.standardSolar.toYmdHms().slice(0, 16)}`
                : `农历录入：${input.year}年${input.lunarLeap ? "闰" : ""}${input.month}月${input.day}日 ${pad(input.hour)}:${pad(input.minute)}`;
            $("datetime-preview").innerHTML = `
                <div class="preview-line"><span>录入值</span><strong>${inputTypeText}</strong></div>
                <div class="preview-line"><span>标准公历</span><strong>${preview.standardSolar.toYmdHms().slice(0, 16)}</strong></div>
                <div class="preview-line"><span>标准农历</span><strong>${preview.standardLunar.toString()}</strong></div>
                <div class="preview-line"><span>标准时辰</span><strong>${preview.solarMeta.standardShichen.label}（${preview.solarMeta.standardShichen.start}-${preview.solarMeta.standardShichen.end}）</strong></div>
                <div class="preview-line"><span>真太阳时</span><strong>${preview.solarMeta.trueSolarText} · ${preview.solarMeta.trueSolarShichen.label}</strong></div>
                <div class="preview-line"><span>最终排盘</span><strong>${preview.solarMeta.usedMode === "trueSolar" ? "真太阳时" : "标准时间"} · ${preview.solarMeta.effectiveText}</strong></div>
                <div class="preview-line"><span>修正值</span><strong>${BaziCore.formatSigned(preview.solarMeta.totalOffsetMinutes)} 分钟（经度项 ${BaziCore.formatSigned(preview.solarMeta.longitudeMinutes)}，均时差 ${BaziCore.formatSigned(preview.solarMeta.equationMinutes)}）</strong></div>
                <div class="preview-line"><span>自动建议</span><strong>${recommendation}</strong></div>
            `;
        } catch (error) {
            $("datetime-preview").innerHTML = `<p class="muted">当前输入无法换算，请检查农历闰月、日期或时间：${error.message}</p>`;
        }
    }

    function runAnalysis(input) {
        const chart = BaziCore.computeBaZi(input);
        const dayun = DayunEngine.buildDaYun(chart, input.targetYear);
        const liunian = DayunEngine.buildLiuNian(dayun.current);
        const currentYearEntry = liunian.find((item) => item.year === input.targetYear) || liunian[0];
        const liuyue = DayunEngine.buildLiuYue(currentYearEntry);
        const focusMonth = input.targetYear === new Date().getFullYear() ? new Date().getMonth() + 1 : 1;
        const currentMonthEntry = liuyue[focusMonth - 1] || liuyue[0];
        const yearEvaluations = liunian.map((item) => ({
            ...item,
            evaluation: BaziAnalysis.evaluateCycle(chart, item.pillar, "流年", `${item.year}年 · ${item.pillar}`)
        }));
        const monthEvaluations = liuyue.map((item) => ({
            ...item,
            evaluation: BaziAnalysis.evaluateCycle(chart, item.pillar, "流月", `${item.month}月 · ${item.pillar}`)
        }));
        const currentYearEval = yearEvaluations.find((item) => item.year === currentYearEntry.year).evaluation;
        const currentMonthEval = monthEvaluations.find((item) => item.month === currentMonthEntry.month).evaluation;
        const health = HealthEngine.analyzeHealth(chart);
        const environment = BaziAnalysis.getEnvironmentAnalysis(chart, input.targetYear);
        const detailed = BaziAnalysis.buildDetailedAnalysis(chart, currentYearEval);
        const report = AIEngine.buildReport(chart, dayun, currentYearEval, currentMonthEval, health, input.targetYear);
        const lucky = AIEngine.buildLuckySuggestions(chart, currentYearEval, currentMonthEval, health);
        state.current = {
            input,
            chart,
            dayun,
            yearEvaluations,
            monthEvaluations,
            currentYearEval,
            currentMonthEval,
            health,
            environment,
            detailed,
            report,
            lucky
        };
        renderAll();
        showSection("bazi");
    }

    function renderAll() {
        const { input, chart, dayun, yearEvaluations, monthEvaluations, currentYearEval, currentMonthEval, health, environment, detailed, report, lucky } = state.current;
        $("env-year-label").textContent = input.targetYear;
        $("liuyue-year-label").textContent = input.targetYear;
        renderCalculationMeta(chart, dayun);
        renderPillars(chart);
        renderWuxing(chart);
        renderNarratives(chart);
        renderDayun(dayun, yearEvaluations, monthEvaluations);
        renderHealth(health);
        renderAI(report, environment, lucky, detailed, currentYearEval, currentMonthEval);
    }

    function renderCalculationMeta(chart, dayun) {
        const solar = chart.solarMeta;
        const cards = [
            { title: "录入历法", body: chart.input.calendarType === "solar" ? "公历录入" : `农历录入${chart.input.lunarLeap ? "（闰月）" : ""}` },
            { title: "出生地与经度", body: `${chart.input.regionName} · 经度 ${chart.input.longitude.toFixed(2)}° · 时区 UTC${chart.input.timezoneOffset >= 0 ? "+" : ""}${chart.input.timezoneOffset}` },
            { title: "标准排盘时间", body: `${solar.standardText} · ${solar.standardShichen.label}` },
            { title: "真太阳时", body: `${solar.trueSolarText} · ${solar.trueSolarShichen.label} · 修正 ${BaziCore.formatSigned(solar.totalOffsetMinutes)} 分钟` },
            { title: "最终依据", body: `${solar.usedMode === "trueSolar" ? "采用真太阳时" : "采用标准时间"} · 晚子时流派 ${chart.input.dayBoundarySect === 1 ? "子初换日" : "子正换日"}` },
            { title: "起运设置", body: `起运流派 ${chart.input.yunSect === 2 ? "分钟折算" : "时辰折算"} · 起运日期约 ${dayun.startSolar}` }
        ];
        $("calculation-meta").innerHTML = cards.map((item) => `<div class="mini-card"><h3>${item.title}</h3><p>${item.body}</p></div>`).join("");
    }

    function renderPillars(chart) {
        $("pillars-container").innerHTML = chart.pillars.map((pillar, index) => `
            <div class="pillar">
                <div class="pillar-label">${pillar.label}${index === 2 ? "（日主）" : ""}</div>
                <div class="pillar-main">
                    <div class="gan ${index === 2 ? "day-master" : ""}">${pillar.stem}</div>
                    <div class="zhi">${pillar.branch}</div>
                </div>
                <p><strong>${pillar.tenGod}</strong></p>
                <p class="muted">地支十神：${pillar.tenGodZhi.join("、")}</p>
                <p class="muted">藏干：${pillar.hidden.join("、")}</p>
                <p class="muted">纳音：${pillar.nayin} · 地势：${pillar.diShi}</p>
                <p class="muted">旬空：${pillar.xunKong}</p>
            </div>
        `).join("");
    }

    function renderWuxing(chart) {
        const max = Math.max(...Object.values(chart.wuxing));
        ChartRenderer.renderRadar($("wuxing-chart"), chart.wuxing, chart.colors);
        $("wuxing-details").innerHTML = Object.entries(chart.wuxing).map(([key, value]) => `
            <div class="wuxing-row">
                <span>${key}</span>
                <div class="progress"><span style="width:${(value / max) * 100}%; background:${chart.colors[key]}"></span></div>
                <strong>${value.toFixed(1)}</strong>
            </div>
        `).join("");
        $("wuxing-summary").innerHTML = `<p>${BaziAnalysis.getWuxingSummary(chart)}</p>`;
    }

    function renderNarratives(chart) {
        const shishen = BaziAnalysis.getShishenAnalysis(chart);
        const pattern = BaziAnalysis.getPatternAnalysis(chart);
        $("shishen-analysis").innerHTML = shishen.map((item) => `<div class="mini-card"><h3>${item.title}</h3><p>${item.body}</p></div>`).join("");
        $("pattern-analysis").innerHTML = `
            <div class="report-block">
                <h3>${pattern.pattern}</h3>
                <p>${pattern.advice}</p>
                <p>胎元 ${chart.extras.taiYuan}，胎息 ${chart.extras.taiXi}，命宫 ${chart.extras.mingGong}，身宫 ${chart.extras.shenGong}。</p>
            </div>
        `;
        $("shensha-analysis").innerHTML = [
            ...chart.shensha.map((item) => `<div class="chip">${item}</div>`),
            `<div class="chip">命宫 ${chart.extras.mingGong}</div>`,
            `<div class="chip">身宫 ${chart.extras.shenGong}</div>`,
            `<div class="chip">胎元 ${chart.extras.taiYuan}</div>`
        ].join("");
    }

    function renderDayun(dayun, yearEvaluations, monthEvaluations) {
        $("dayun-info").innerHTML = `
            <p>起运约 ${dayun.startYear} 年 ${dayun.startMonth} 个月 ${dayun.startDay} 天 ${dayun.startHour} 小时后启动，当前处于 <strong>${dayun.current.label}</strong> 大运。</p>
        `;
        $("dayun-timeline").innerHTML = dayun.list.map((item) => `
            <div class="timeline-item ${item.label === dayun.current.label ? "active" : ""}">
                <h3>${item.label}</h3>
                <p>${item.startYear} - ${item.endYear}</p>
                <p>${item.startAge} - ${item.endAge} 岁</p>
            </div>
        `).join("");
        $("current-dayun-label").textContent = `（当前大运：${dayun.current.label}）`;
        $("liunian-container").innerHTML = `<div class="pair-grid">${yearEvaluations.map((item) => `
            <div class="mini-card">
                <h3>${item.year} · ${item.pillar}</h3>
                <p class="score">综合分 ${item.evaluation.scores.overall}</p>
                <p>事业 ${item.evaluation.scores.career} / 财运 ${item.evaluation.scores.wealth} / 感情 ${item.evaluation.scores.relation}</p>
                <p>${item.evaluation.highlights[0]}</p>
            </div>
        `).join("")}</div>`;
        $("liuyue-container").innerHTML = `<div class="pair-grid">${monthEvaluations.map((item) => `
            <div class="month-card">
                <h3>${item.month}月 · ${item.pillar}</h3>
                <p class="score">综合分 ${item.evaluation.scores.overall}</p>
                <p>事业 ${item.evaluation.scores.career} / 财运 ${item.evaluation.scores.wealth} / 感情 ${item.evaluation.scores.relation}</p>
                <p>${item.evaluation.highlights[0]}</p>
            </div>
        `).join("")}</div>`;
        ChartRenderer.drawLineChart($("fortune-chart"), yearEvaluations.map((item) => ({ label: item.year, value: item.evaluation.scores.overall })), "#9a3412");
        renderDomainCharts(yearEvaluations, monthEvaluations);
    }

    function renderDomainCharts(yearEvaluations, monthEvaluations) {
        ChartRenderer.drawMultiLineChart(
            $("year-domain-chart"),
            [
                { name: "事业", color: BaziAnalysis.DOMAIN_COLORS.career, values: yearEvaluations.map((item) => item.evaluation.scores.career) },
                { name: "财运", color: BaziAnalysis.DOMAIN_COLORS.wealth, values: yearEvaluations.map((item) => item.evaluation.scores.wealth) },
                { name: "感情", color: BaziAnalysis.DOMAIN_COLORS.relation, values: yearEvaluations.map((item) => item.evaluation.scores.relation) },
                { name: "家庭", color: BaziAnalysis.DOMAIN_COLORS.family, values: yearEvaluations.map((item) => item.evaluation.scores.family) },
                { name: "健康", color: BaziAnalysis.DOMAIN_COLORS.health, values: yearEvaluations.map((item) => item.evaluation.scores.health) }
            ],
            yearEvaluations.map((item) => String(item.year).slice(2))
        );
        ChartRenderer.drawMultiLineChart(
            $("month-domain-chart"),
            [
                { name: "事业", color: BaziAnalysis.DOMAIN_COLORS.career, values: monthEvaluations.map((item) => item.evaluation.scores.career) },
                { name: "财运", color: BaziAnalysis.DOMAIN_COLORS.wealth, values: monthEvaluations.map((item) => item.evaluation.scores.wealth) },
                { name: "感情", color: BaziAnalysis.DOMAIN_COLORS.relation, values: monthEvaluations.map((item) => item.evaluation.scores.relation) },
                { name: "家庭", color: BaziAnalysis.DOMAIN_COLORS.family, values: monthEvaluations.map((item) => item.evaluation.scores.family) },
                { name: "健康", color: BaziAnalysis.DOMAIN_COLORS.health, values: monthEvaluations.map((item) => item.evaluation.scores.health) }
            ],
            monthEvaluations.map((item) => `${item.month}`)
        );
        $("year-events").innerHTML = yearEvaluations.map((item) => `<div class="mini-card"><h3>${item.year}年</h3><p>${item.evaluation.highlights.join(" ")}</p></div>`).join("");
        $("month-events").innerHTML = monthEvaluations.map((item) => `<div class="mini-card"><h3>${item.month}月</h3><p>${item.evaluation.highlights.join(" ")}</p></div>`).join("");
    }

    function renderHealth(health) {
        $("health-wuxing-map").innerHTML = `<div class="pair-grid">${health.organScores.map((item) => `
            <div class="mini-card">
                <h3>${item.element}</h3>
                <p>对应：${item.organs.join("、")}</p>
                <p>${item.risk}</p>
            </div>
        `).join("")}</div>`;
        $("health-risk-analysis").innerHTML = health.risks.length
            ? health.risks.map((item) => `<div class="risk-card"><h3>${item.element}系风险</h3><p>脏腑：${item.organs.join("、")}</p><p>指数：${item.score}</p><p>${item.risk}</p></div>`).join("")
            : `<div class="risk-card"><p>当前五行健康指数整体较均衡，仍需关注长期生活方式。</p></div>`;
        $("health-suggestions").innerHTML = health.suggestions.map((item) => `<div class="report-block"><p>${item}</p></div>`).join("");
        ChartRenderer.drawBarChart($("health-chart"), health.organScores);
    }

    function renderAI(report, environment, lucky, detailed, currentYearEval, currentMonthEval) {
        const loading = $("ai-loading");
        loading.classList.remove("hidden");
        setTimeout(() => {
            loading.classList.add("hidden");
            $("ai-report").innerHTML = report.map((item) => `<div class="report-block"><h3>${item.title}</h3><p>${item.body}</p></div>`).join("");
            $("environment-analysis").innerHTML = `<div class="report-block"><h3>${environment.title}</h3><p>${environment.body}</p><p>当前参考年分：事业 ${currentYearEval.scores.career}，财运 ${currentYearEval.scores.wealth}，感情 ${currentYearEval.scores.relation}，家庭 ${currentYearEval.scores.family}，健康 ${currentYearEval.scores.health}。</p></div>`;
            $("lucky-suggestions").innerHTML = lucky.map((item) => `<div class="report-block"><p>${item}</p></div>`).join("");
            $("detailed-analysis-grid").innerHTML = [
                ...detailed.map((item) => `<div class="mini-card"><h3>${item.title}</h3><p>${item.body}</p></div>`),
                `<div class="mini-card"><h3>本月重点</h3><p>${currentMonthEval.highlights.join(" ")}</p></div>`
            ].join("");
        }, 180);
    }

    function loadExample() {
        $("profile-name").value = "示例命盘";
        $("calendar-type").value = "solar";
        $("birth-year").value = "1992";
        $("birth-month").value = "8";
        $("birth-day").value = "16";
        $("lunar-leap").value = "0";
        $("birth-time").value = "08:36";
        $("birth-region").value = "0";
        applyRegion(REGIONS[0]);
        $("solar-time-mode").value = "auto";
        $("day-boundary-sect").value = "1";
        $("yun-sect").value = "2";
        $("gender").value = "female";
        $("target-year").value = String(new Date().getFullYear());
        syncLunarLeap();
        syncDayOptions();
        updatePreview();
        runAnalysis(getInput());
    }

    function saveCurrentProfile() {
        if (!state.current) {
            alert("请先完成一次测算。");
            return;
        }
        const profiles = loadProfiles();
        profiles.unshift({
            id: Date.now(),
            name: state.current.input.profileName,
            input: state.current.input
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.slice(0, 16)));
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
        const profiles = loadProfiles();
        $("saved-profiles").innerHTML = profiles.length
            ? profiles.map((item) => `
                <div class="saved-item">
                    <div>
                        <strong>${item.name}</strong>
                        <p class="muted">${item.input.calendarType === "solar" ? "公历" : "农历"} · ${item.input.year}-${pad(Math.abs(item.input.month))}-${pad(item.input.day)} ${pad(item.input.hour)}:${pad(item.input.minute)} · ${item.input.regionName}</p>
                    </div>
                    <button class="btn-link" data-load-id="${item.id}">载入</button>
                </div>
            `).join("")
            : `<p class="muted">还没有本地档案。</p>`;
        $("saved-profiles").querySelectorAll("[data-load-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const profile = profiles.find((item) => String(item.id) === button.dataset.loadId);
                if (!profile) return;
                applyInput(profile.input, profile.name);
                syncLunarLeap();
                syncDayOptions();
                updatePreview();
                runAnalysis(getInput());
            });
        });
    }

    function applyInput(input, name) {
        $("profile-name").value = name || input.profileName || "";
        $("calendar-type").value = input.calendarType || "solar";
        $("birth-year").value = String(input.year);
        $("birth-month").value = String(Math.abs(input.month));
        $("lunar-leap").value = input.lunarLeap ? "1" : "0";
        syncLunarLeap();
        syncDayOptions();
        $("birth-day").value = String(input.day);
        $("birth-time").value = `${pad(input.hour)}:${pad(input.minute)}`;
        $("gender").value = input.gender;
        $("target-year").value = String(input.targetYear || new Date().getFullYear());
        $("solar-time-mode").value = input.solarTimeMode || "auto";
        $("timezone-offset").value = String(input.timezoneOffset ?? 8);
        $("birth-longitude").value = Number(input.longitude).toFixed(2);
        $("day-boundary-sect").value = String(input.dayBoundarySect || 1);
        $("yun-sect").value = String(input.yunSect || 2);
        const regionIndex = Math.max(REGIONS.findIndex((region) => region.name === input.regionName), 0);
        $("birth-region").value = String(regionIndex);
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
