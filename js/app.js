(function () {
    const STORAGE_KEY = "tming-bazi-profiles-v1";
    const state = { current: null };

    function initSelects() {
        fillSelect("birth-year", 1950, 2035, new Date().getFullYear() - 30);
        fillSelect("target-year", 2020, 2045, new Date().getFullYear());
        fillSelect("birth-month", 1, 12, 6);
        fillSelect("birth-day", 1, 31, 18);
        fillSelect("birth-hour", 0, 11, 5, (value) => {
            const labels = ["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时"];
            return labels[value];
        });
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
    }

    function showSection(section) {
        document.querySelectorAll(".section").forEach((node) => node.classList.remove("active"));
        document.querySelector(`#section-${section}`).classList.add("active");
        document.querySelectorAll(".nav-links a").forEach((node) => node.classList.toggle("active", node.dataset.section === section));
    }

    function getInput() {
        const calendarType = document.getElementById("calendar-type").value;
        const input = {
            profileName: document.getElementById("profile-name").value.trim() || "未命名档案",
            year: Number(document.getElementById("birth-year").value),
            month: Number(document.getElementById("birth-month").value),
            day: Number(document.getElementById("birth-day").value),
            hourIndex: Number(document.getElementById("birth-hour").value),
            gender: document.getElementById("gender").value,
            calendarType,
            targetYear: Number(document.getElementById("target-year").value)
        };
        if (calendarType === "lunar") {
            alert("当前离线版尚未内置完整农历换算库。为保证结果稳定，请先换算为公历后录入。");
        }
        return input;
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
        renderPillars(chart);
        renderWuxing(chart);
        renderNarratives(chart);
        renderDayun(dayun, liunian, liuyue);
        renderHealth(health);
        renderAI(report, environment, lucky);
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
        }, 250);
    }

    function loadExample() {
        document.getElementById("profile-name").value = "示例命盘";
        document.getElementById("birth-year").value = "1992";
        document.getElementById("birth-month").value = "8";
        document.getElementById("birth-day").value = "16";
        document.getElementById("birth-hour").value = "4";
        document.getElementById("gender").value = "female";
        document.getElementById("calendar-type").value = "solar";
        document.getElementById("target-year").value = String(new Date().getFullYear());
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
                    <p class="muted">${item.input.year}-${item.input.month}-${item.input.day} · ${item.input.gender === "male" ? "男" : "女"}</p>
                </div>
                <button class="btn-link" data-load-id="${item.id}">载入</button>
            </div>
        `).join("") : `<p class="muted">还没有本地档案。</p>`;
        container.querySelectorAll("[data-load-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const profile = profiles.find((item) => String(item.id) === button.dataset.loadId);
                if (!profile) return;
                applyInput(profile.input, profile.name);
                runAnalysis(profile.input);
            });
        });
    }

    function applyInput(input, name) {
        document.getElementById("profile-name").value = name || input.profileName || "";
        document.getElementById("birth-year").value = String(input.year);
        document.getElementById("birth-month").value = String(input.month);
        document.getElementById("birth-day").value = String(input.day);
        document.getElementById("birth-hour").value = String(input.hourIndex);
        document.getElementById("gender").value = input.gender;
        document.getElementById("calendar-type").value = input.calendarType || "solar";
        document.getElementById("target-year").value = String(input.targetYear || new Date().getFullYear());
    }

    function clearProfiles() {
        localStorage.removeItem(STORAGE_KEY);
        renderSavedProfiles();
    }

    initSelects();
    bindEvents();
    renderSavedProfiles();
    loadExample();
})();
