(function () {
    const STORAGE_KEY = "tming-bazi-profiles-v4";
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

    const PROFILE_CONFIGS = {
        primary: {
            name: "profile-name",
            calendarType: "calendar-type",
            year: "birth-year",
            month: "birth-month",
            day: "birth-day",
            lunarLeap: "lunar-leap",
            time: "birth-time",
            region: "birth-region",
            longitude: "birth-longitude",
            solarTimeMode: "solar-time-mode",
            dayBoundarySect: "day-boundary-sect",
            gender: "gender",
            timezoneOffset: "timezone-offset",
            preview: "datetime-preview",
            targetYear: "target-year",
            yunSect: "yun-sect"
        },
        compat: {
            enabled: "compat-enabled",
            name: "compat-name",
            calendarType: "compat-calendar-type",
            year: "compat-year",
            month: "compat-month",
            day: "compat-day",
            lunarLeap: "compat-lunar-leap",
            time: "compat-time",
            region: "compat-region",
            longitude: "compat-longitude",
            solarTimeMode: "compat-solar-time-mode",
            dayBoundarySect: "compat-day-boundary-sect",
            gender: "compat-gender",
            timezoneOffset: "compat-timezone-offset",
            preview: "compat-preview"
        }
    };

    const state = { current: null };
    const TRUE_SOLAR_GROUPS = {
        high: "建议重点核对真太阳时（偏差 >= 40 分钟）",
        low: "通常标准时即可（偏差 < 40 分钟）",
        custom: "自定义"
    };

    function $(id) {
        return document.getElementById(id);
    }

    function pad(value) {
        return String(value).padStart(2, "0");
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

    function getTrueSolarOffsetMinutes(region) {
        return Math.abs(4 * region.longitude - 60 * region.timezoneOffset);
    }

    function getRegionGroup(region) {
        if (region.name === "自定义") return TRUE_SOLAR_GROUPS.custom;
        return getTrueSolarOffsetMinutes(region) >= 40 ? TRUE_SOLAR_GROUPS.high : TRUE_SOLAR_GROUPS.low;
    }

    function renderRegionOptions() {
        const groups = {
            [TRUE_SOLAR_GROUPS.high]: [],
            [TRUE_SOLAR_GROUPS.low]: [],
            [TRUE_SOLAR_GROUPS.custom]: []
        };
        REGIONS.forEach((region, index) => {
            groups[getRegionGroup(region)].push({ region, index });
        });
        return Object.entries(groups).map(([label, items]) => {
            if (!items.length) return "";
            return `<optgroup label="${label}">${items.map(({ region, index }) => `<option value="${index}">${region.name}</option>`).join("")}</optgroup>`;
        }).join("");
    }

    function parseMonthOptionValue(rawValue, config) {
        const value = String(rawValue || $(config.month).value || "1");
        if (value.includes("|")) {
            const [month, leap] = value.split("|");
            return { month: Number(month), lunarLeap: leap === "1" };
        }
        return {
            month: Number(value),
            lunarLeap: $(config.calendarType).value === "lunar" && $(config.lunarLeap).value === "1"
        };
    }

    function getMonthSelection(config) {
        const selection = parseMonthOptionValue($(config.month).value, config);
        return {
            month: Number.isFinite(selection.month) && selection.month > 0 ? selection.month : 1,
            lunarLeap: Boolean(selection.lunarLeap)
        };
    }

    function setMonthSelection(config, month, lunarLeap) {
        const monthEl = $(config.month);
        const candidates = $(config.calendarType).value === "lunar"
            ? [`${month}|${lunarLeap ? 1 : 0}`, `${month}|0`, `${month}|1`]
            : [String(month)];
        const selected = candidates.find((value) => Array.from(monthEl.options).some((option) => option.value === value));
        monthEl.value = selected || monthEl.options[0]?.value || "1";
    }

    function getRegionGroupNote(region) {
        const offset = getTrueSolarOffsetMinutes(region).toFixed(1);
        if (region.name === "自定义") {
            return "自定义经度会按你填写的经度和时区即时计算真太阳时偏差。";
        }
        if (getRegionGroup(region) === TRUE_SOLAR_GROUPS.high) {
            return `${region.name}相对时区中央经线的时间偏差约 ${offset} 分钟，容易跨时辰，自动模式建议重点核对真太阳时。`;
        }
        return `${region.name}相对时区中央经线的时间偏差约 ${offset} 分钟，通常不跨时辰，标准时间多数情况下可用。`;
    }

    function renderMonthOptions(config) {
        const monthEl = $(config.month);
        const calendarType = $(config.calendarType).value;
        const year = Number($(config.year).value);
        const previous = getMonthSelection(config);
        const leapMonth = LunarYear.fromYear(year).getLeapMonth();
        monthEl.innerHTML = "";
        if (calendarType === "solar") {
            for (let month = 1; month <= 12; month++) {
                const option = document.createElement("option");
                option.value = String(month);
                option.textContent = String(month);
                if (month === previous.month) option.selected = true;
                monthEl.appendChild(option);
            }
            return;
        }
        for (let month = 1; month <= 12; month++) {
            const normalOption = document.createElement("option");
            normalOption.value = `${month}|0`;
            normalOption.textContent = leapMonth === month ? `${month}月（本年另有闰${month}月）` : `${month}月`;
            monthEl.appendChild(normalOption);
            if (leapMonth === month) {
                const leapOption = document.createElement("option");
                leapOption.value = `${month}|1`;
                leapOption.textContent = `闰${month}月`;
                monthEl.appendChild(leapOption);
            }
        }
        setMonthSelection(config, previous.month, previous.lunarLeap);
    }

    function initProfileControls(config, defaultYear, defaultMonth, defaultDay, defaultRegion) {
        fillSelect(config.year, 1900, 2099, defaultYear);
        fillSelect(config.month, 1, 12, defaultMonth);
        fillSelect(config.day, 1, 31, defaultDay);
        const regionEl = $(config.region);
        regionEl.innerHTML = renderRegionOptions();
        regionEl.value = String(defaultRegion);
        applyRegion(config, REGIONS[defaultRegion]);
        renderMonthOptions(config);
        syncLunarLeap(config);
        syncDayOptions(config);
        if (config.enabled) setCompatibilityEnabled(false);
    }

    function initSelects() {
        initProfileControls(PROFILE_CONFIGS.primary, new Date().getFullYear() - 30, 6, 18, 0);
        initProfileControls(PROFILE_CONFIGS.compat, new Date().getFullYear() - 28, 10, 9, 0);
        fillSelect(PROFILE_CONFIGS.primary.targetYear, 2020, 2045, new Date().getFullYear());
    }

    function bindEvents() {
        document.querySelectorAll(".nav-links a").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                showSection(link.dataset.section);
            });
        });
        $("bazi-form").addEventListener("submit", handleSubmit);
        $("compat-form").addEventListener("submit", (event) => event.preventDefault());
        $("btn-example").addEventListener("click", loadExample);
        $("btn-compat-example").addEventListener("click", loadCompatibilityExample);
        $("btn-save").addEventListener("click", saveCurrentProfile);
        $("btn-clear-storage").addEventListener("click", clearProfiles);
        $("btn-export-markdown").addEventListener("click", exportMarkdownReport);
        $("btn-export-html").addEventListener("click", exportHtmlReport);
        $("btn-print-report").addEventListener("click", printReport);
        $("btn-kb-export").addEventListener("click", exportKnowledgeBase);
        $("btn-kb-seed").addEventListener("click", resetKnowledgeBase);
        $("btn-kb-add").addEventListener("click", addKnowledgeBaseEntry);
        $("kb-file-input").addEventListener("change", importKnowledgeBaseFiles);
        bindProfileEvents(PROFILE_CONFIGS.primary);
        bindProfileEvents(PROFILE_CONFIGS.compat);
        $(PROFILE_CONFIGS.compat.enabled).addEventListener("change", () => {
            setCompatibilityEnabled($(PROFILE_CONFIGS.compat.enabled).checked);
            updatePreview(PROFILE_CONFIGS.compat);
        });
    }

    function bindProfileEvents(config) {
        $(config.region).addEventListener("change", (event) => {
            applyRegion(config, REGIONS[Number(event.target.value)] || REGIONS[0]);
            updatePreview(config);
        });
        [config.calendarType, config.year, config.month].forEach((id) => {
            $(id).addEventListener("change", () => {
                renderMonthOptions(config);
                syncLunarLeap(config);
                syncDayOptions(config);
                updatePreview(config);
            });
        });
        $(config.lunarLeap).addEventListener("change", () => {
            syncDayOptions(config);
            updatePreview(config);
        });
        [
            config.day,
            config.time,
            config.longitude,
            config.timezoneOffset,
            config.solarTimeMode,
            config.dayBoundarySect,
            config.gender
        ].forEach((id) => {
            $(id).addEventListener("change", () => {
                updatePreview(config);
            });
            $(id).addEventListener("input", () => {
                updatePreview(config);
            });
        });
        if (config.targetYear) {
            $(config.targetYear).addEventListener("change", () => updatePreview(config));
        }
    }

    function showSection(section) {
        document.querySelectorAll(".section").forEach((node) => node.classList.remove("active"));
        document.querySelector(`#section-${section}`).classList.add("active");
        document.querySelectorAll(".nav-links a").forEach((node) => node.classList.toggle("active", node.dataset.section === section));
    }

    function setCompatibilityEnabled(enabled) {
        const config = PROFILE_CONFIGS.compat;
        $(config.enabled).checked = enabled;
        [
            config.name,
            config.calendarType,
            config.year,
            config.month,
            config.day,
            config.lunarLeap,
            config.time,
            config.region,
            config.longitude,
            config.solarTimeMode,
            config.dayBoundarySect,
            config.gender,
            config.timezoneOffset,
            "btn-compat-example"
        ].forEach((id) => {
            $(id).disabled = !enabled;
        });
        if (!enabled) {
            $(config.preview).innerHTML = `<p class="muted">未启用合盘。打开开关后，可录入第二个人的出生信息，系统会计算合盘、合婚、子嗣和家庭协同分析。</p>`;
        }
    }

    function applyRegion(config, region) {
        $(config.longitude).value = region.longitude.toFixed(2);
        $(config.timezoneOffset).value = String(region.timezoneOffset);
    }

    function syncLunarLeap(config) {
        const leapEl = $(config.lunarLeap);
        const calendarType = $(config.calendarType).value;
        if (calendarType !== "lunar") {
            leapEl.value = "0";
            leapEl.disabled = true;
            return;
        }
        const { month, lunarLeap } = getMonthSelection(config);
        const leapMonth = LunarYear.fromYear(Number($(config.year).value)).getLeapMonth();
        leapEl.value = leapMonth === month && lunarLeap ? "1" : "0";
        leapEl.disabled = true;
    }

    function syncDayOptions(config) {
        const dayEl = $(config.day);
        const previous = Number(dayEl.value || 1);
        const year = Number($(config.year).value);
        const { month, lunarLeap } = getMonthSelection(config);
        const calendarType = $(config.calendarType).value;
        let maxDay = 31;
        if (calendarType === "solar") {
            maxDay = new Date(year, month, 0).getDate();
        } else {
            const lunarMonth = lunarLeap ? -month : month;
            const lunarMonthInfo = LunarYear.fromYear(year).getMonth(lunarMonth);
            maxDay = lunarMonthInfo ? lunarMonthInfo.getDayCount() : 30;
        }
        dayEl.innerHTML = "";
        for (let i = 1; i <= maxDay; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            if (i === Math.min(previous, maxDay)) option.selected = true;
            dayEl.appendChild(option);
        }
    }

    function getTimeParts(config) {
        const [hour, minute] = ($(config.time).value || "09:30").split(":").map(Number);
        return { hour, minute };
    }

    function getProfileInput(config) {
        if (config.enabled && !$(config.enabled).checked) return null;
        const { hour, minute } = getTimeParts(config);
        const region = REGIONS[Number($(config.region).value)] || REGIONS[0];
        const monthSelection = getMonthSelection(config);
        return {
            profileName: $(config.name).value.trim() || (config === PROFILE_CONFIGS.primary ? "未命名档案" : "合盘对象"),
            calendarType: $(config.calendarType).value,
            year: Number($(config.year).value),
            month: monthSelection.month,
            day: Number($(config.day).value),
            lunarLeap: monthSelection.lunarLeap,
            hour,
            minute,
            gender: $(config.gender).value,
            solarTimeMode: $(config.solarTimeMode).value,
            timezoneOffset: Number($(config.timezoneOffset).value),
            longitude: Number($(config.longitude).value),
            regionName: region.name,
            dayBoundarySect: Number($(config.dayBoundarySect).value),
            targetYear: config.targetYear ? Number($(config.targetYear).value) : Number($(PROFILE_CONFIGS.primary.targetYear).value),
            yunSect: config.yunSect ? Number($(config.yunSect).value) : 2
        };
    }

    function updatePreview(config) {
        if (config.enabled && !$(config.enabled).checked) {
            $(config.preview).innerHTML = `<p class="muted">未启用合盘。打开开关后，可录入第二个人的出生信息，系统会计算合盘、合婚、子嗣和家庭协同分析。</p>`;
            return;
        }
        try {
            const input = getProfileInput(config);
            const preview = BaziCore.buildPreview(input);
            const recommendation = preview.solarMeta.autoUseTrueSolar
                ? "自动模式建议采用真太阳时，因为修正后会影响时柱或日期。"
                : "自动模式可保持标准时间，因为修正后未跨关键边界。";
            const region = REGIONS[Number($(config.region).value)] || REGIONS[0];
            const regionGroup = getRegionGroup(region);
            const leapMonth = LunarYear.fromYear(input.year).getLeapMonth();
            const leapHint = input.calendarType === "lunar"
                ? (leapMonth
                    ? (leapMonth === input.month
                        ? `系统已识别该年闰${leapMonth}月。月份下拉里已经拆成“${leapMonth}月”和“闰${leapMonth}月”，当前已自动识别为${input.lunarLeap ? "闰月" : "普通月"}。`
                        : `系统已识别该年闰${leapMonth}月；你当前选择的不是闰月月份，所以闰月已自动关闭。`)
                    : "系统已识别该年无闰月，所以闰月已自动关闭。")
                : "当前为公历录入，不涉及闰月判断。";
            const solarExplain = preview.solarMeta.usedMode === "trueSolar"
                ? "本次已采用真太阳时。真太阳时依据“出生地经度 + 时区中央经线差 + 当天均时差”计算，因为修正后已跨时辰或日期边界。"
                : "本次排盘仍采用标准时间。真太阳时只有在修正后影响时辰或日期边界时，自动模式才会接管。";
            const inputTypeText = input.calendarType === "solar"
                ? `公历录入：${preview.standardSolar.toYmdHms().slice(0, 16)}`
                : `农历录入：${input.year}年${input.lunarLeap ? "闰" : ""}${input.month}月${input.day}日 ${pad(input.hour)}:${pad(input.minute)}`;
            $(config.preview).innerHTML = `
                <div class="preview-line"><span>录入值</span><strong>${inputTypeText}</strong></div>
                <div class="preview-line"><span>标准公历</span><strong>${preview.standardSolar.toYmdHms().slice(0, 16)}</strong></div>
                <div class="preview-line"><span>标准农历</span><strong>${preview.standardLunar.toString()}</strong></div>
                <div class="preview-line"><span>标准时辰</span><strong>${preview.solarMeta.standardShichen.label}（${preview.solarMeta.standardShichen.start}-${preview.solarMeta.standardShichen.end}）</strong></div>
                <div class="preview-line"><span>真太阳时</span><strong>${preview.solarMeta.trueSolarText} · ${preview.solarMeta.trueSolarShichen.label}</strong></div>
                <div class="preview-line"><span>最终排盘</span><strong>${preview.solarMeta.usedMode === "trueSolar" ? "真太阳时" : "标准时间"} · ${preview.solarMeta.effectiveText}</strong></div>
                <div class="preview-line"><span>地区分组</span><strong>${regionGroup}</strong></div>
                <div class="preview-line"><span>地区说明</span><strong>${getRegionGroupNote(region)}</strong></div>
                <div class="preview-line"><span>闰月识别</span><strong>${leapHint}</strong></div>
                <div class="preview-line"><span>真太阳时说明</span><strong>${solarExplain}</strong></div>
                <div class="preview-line"><span>自动建议</span><strong>${recommendation}</strong></div>
            `;
        } catch (error) {
            $(config.preview).innerHTML = `<p class="muted">当前输入无法换算，请检查日期、闰月或时间：${error.message}</p>`;
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        runAnalysis(getProfileInput(PROFILE_CONFIGS.primary));
    }

    function runAnalysis(primaryInput) {
        const chart = BaziCore.computeBaZi(primaryInput);
        const dayun = DayunEngine.buildDaYun(chart, primaryInput.targetYear);
        const liunian = DayunEngine.buildLiuNian(dayun.current);
        const currentYearEntry = liunian.find((item) => item.year === primaryInput.targetYear) || liunian[0];
        const liuyue = DayunEngine.buildLiuYue(currentYearEntry);
        const focusMonth = primaryInput.targetYear === new Date().getFullYear() ? new Date().getMonth() + 1 : 1;
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
        const environment = BaziAnalysis.getEnvironmentAnalysis(chart, primaryInput.targetYear);
        const detailed = BaziAnalysis.buildDetailedAnalysis(chart, currentYearEval);
        const family = BaziAnalysis.buildFamilyAnalysis(chart, currentYearEval);
        const master = BaziAnalysis.buildMasterSummary(chart, currentYearEval, currentMonthEval);
        const report = AIEngine.buildReport(chart, dayun, currentYearEval, currentMonthEval, health, primaryInput.targetYear);
        const lucky = AIEngine.buildLuckySuggestions(chart, currentYearEval, currentMonthEval, health);
        let compatibility = null;
        const compatInput = getProfileInput(PROFILE_CONFIGS.compat);
        if (compatInput) {
            const compatChart = BaziCore.computeBaZi(compatInput);
            compatibility = {
                input: compatInput,
                chart: compatChart,
                result: CompatibilityEngine.buildCompatibility(chart, compatChart)
            };
        }
        const kbMatches = KnowledgeBaseEngine.matchEntries(chart, currentYearEval, currentMonthEval, compatibility);
        state.current = {
            input: primaryInput,
            chart,
            dayun,
            yearEvaluations,
            monthEvaluations,
            currentYearEval,
            currentMonthEval,
            health,
            environment,
            detailed,
            family,
            master,
            compatibility,
            kbMatches,
            report,
            lucky
        };
        renderAll();
        showSection("bazi");
    }

    function renderAll() {
        const { input, chart, dayun, yearEvaluations, monthEvaluations, currentYearEval, currentMonthEval, health, environment, detailed, family, master, compatibility, kbMatches, report, lucky } = state.current;
        $(PROFILE_CONFIGS.primary.targetYear).value = String(input.targetYear);
        $("env-year-label").textContent = input.targetYear;
        $("liuyue-year-label").textContent = input.targetYear;
        renderCalculationMeta(chart, dayun);
        renderPillars(chart);
        renderPillarInterpretations(chart);
        renderWuxing(chart);
        renderNarratives(chart);
        renderUsefulAnalysis(chart);
        renderShenshaDetails(chart);
        renderDayun(dayun, yearEvaluations, monthEvaluations);
        renderHealth(health, yearEvaluations, monthEvaluations);
        renderAI(report, environment, lucky, detailed, family, master, currentYearEval, currentMonthEval, compatibility, kbMatches);
    }

    function renderCalculationMeta(chart, dayun) {
        const solar = chart.solarMeta;
        const region = REGIONS.find((item) => item.name === chart.input.regionName) || {
            name: chart.input.regionName,
            longitude: chart.input.longitude,
            timezoneOffset: chart.input.timezoneOffset
        };
        const cards = [
            { title: "录入历法", body: chart.input.calendarType === "solar" ? "公历录入" : `农历录入${chart.input.lunarLeap ? "（闰月）" : ""}` },
            { title: "出生地与经度", body: `${chart.input.regionName} · 经度 ${chart.input.longitude.toFixed(2)}° · 时区 UTC${chart.input.timezoneOffset >= 0 ? "+" : ""}${chart.input.timezoneOffset}` },
            { title: "地区分组", body: `${getRegionGroup(region)} · ${getRegionGroupNote(region)}` },
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

    function renderPillarInterpretations(chart) {
        $("pillar-interpretations").innerHTML = BaziAnalysis.buildPillarInterpretations(chart).map(renderSectionCard).join("");
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
        $("shishen-analysis").innerHTML = shishen.map(renderSectionCard).join("");
        $("pattern-analysis").innerHTML = `
            <div class="report-block">
                <p class="section-kicker">直说</p>
                <h3>${pattern.pattern}</h3>
                <p>${pattern.advice}</p>
                <p>胎元 ${chart.extras.taiYuan}，胎息 ${chart.extras.taiXi}，命宫 ${chart.extras.mingGong}，身宫 ${chart.extras.shenGong}。</p>
            </div>
        `;
    }

    function renderUsefulAnalysis(chart) {
        $("useful-analysis").innerHTML = BaziAnalysis.buildUsefulAnalysis(chart).map(renderSectionCard).join("");
    }

    function renderShenshaDetails(chart) {
        $("shensha-analysis").innerHTML = BaziAnalysis.buildShenshaDetails(chart).map(renderSectionCard).join("");
    }

    function renderDayun(dayun, yearEvaluations, monthEvaluations) {
        $("dayun-info").innerHTML = `<p>起运约 ${dayun.startYear} 年 ${dayun.startMonth} 个月 ${dayun.startDay} 天 ${dayun.startHour} 小时后启动，当前处于 <strong>${dayun.current.label}</strong> 大运。</p>`;
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
                <p class="blunt">${item.evaluation.blunt}</p>
                <p class="good-text">可能发生：${item.evaluation.opportunities[0]}</p>
                <p class="bad-text">需要注意：${item.evaluation.risks[0]}</p>
            </div>
        `).join("")}</div>`;
        $("liuyue-container").innerHTML = `<div class="pair-grid">${monthEvaluations.map((item) => `
            <div class="month-card">
                <h3>${item.month}月 · ${item.pillar}</h3>
                <p class="score">综合分 ${item.evaluation.scores.overall}</p>
                <p class="blunt">${item.evaluation.blunt}</p>
                <p class="good-text">可能发生：${item.evaluation.opportunities[0]}</p>
                <p class="bad-text">需要注意：${item.evaluation.risks[0]}</p>
            </div>
        `).join("")}</div>`;
        ChartRenderer.drawLineChart($("fortune-chart"), yearEvaluations.map((item) => ({ label: item.year, value: item.evaluation.scores.overall })), "#9a3412");
        renderDomainCharts(yearEvaluations, monthEvaluations);
        renderFocusNarratives(yearEvaluations, monthEvaluations);
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
        $("year-events").innerHTML = yearEvaluations.map((item) => `<div class="mini-card"><h3>${item.year}年</h3><p class="good-text">可能发生：${item.evaluation.opportunities.join(" ")}</p><p class="bad-text">需要注意：${item.evaluation.risks.join(" ")}</p></div>`).join("");
        $("month-events").innerHTML = monthEvaluations.map((item) => `<div class="mini-card"><h3>${item.month}月</h3><p class="good-text">可能发生：${item.evaluation.opportunities.join(" ")}</p><p class="bad-text">需要注意：${item.evaluation.risks.join(" ")}</p></div>`).join("");
    }

    function renderFocusNarratives(yearEvaluations, monthEvaluations) {
        const currentYear = yearEvaluations.find((item) => item.year === Number($(PROFILE_CONFIGS.primary.targetYear).value)) || yearEvaluations[0];
        const monthIndex = Number($(PROFILE_CONFIGS.primary.targetYear).value) === new Date().getFullYear() ? new Date().getMonth() : 0;
        const currentMonth = monthEvaluations[monthIndex] || monthEvaluations[0];
        $("current-year-focus").innerHTML = renderSectionCard(BaziAnalysis.buildFocusNarrative(state.current.chart, currentYear.evaluation, "流年"));
        $("current-month-focus").innerHTML = renderSectionCard(BaziAnalysis.buildFocusNarrative(state.current.chart, currentMonth.evaluation, "流月"));
    }

    function renderHealth(health, yearEvaluations, monthEvaluations) {
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
        ChartRenderer.drawLineChart($("year-health-chart"), yearEvaluations.map((item) => ({ label: item.year, value: item.evaluation.scores.health })), "#0f766e");
        ChartRenderer.drawLineChart($("month-health-chart"), monthEvaluations.map((item) => ({ label: item.month, value: item.evaluation.scores.health })), "#0f766e");
        $("year-health-notes").innerHTML = yearEvaluations.map((item) => {
            const detail = HealthEngine.describeCycleHealth(state.current.chart, item.evaluation, item.pillar, "流年");
            return `
                <div class="mini-card">
                    <h3>${item.year}年</h3>
                    <p class="blunt">${detail.summary}</p>
                    <p class="bad-text">重点防：${detail.likely.join("；")}</p>
                    <p>调理建议：${detail.advice.join("；")}</p>
                </div>
            `;
        }).join("");
        $("month-health-notes").innerHTML = monthEvaluations.map((item) => {
            const detail = HealthEngine.describeCycleHealth(state.current.chart, item.evaluation, item.pillar, "流月");
            return `
                <div class="mini-card">
                    <h3>${item.month}月</h3>
                    <p class="blunt">${detail.summary}</p>
                    <p class="bad-text">重点防：${detail.likely.join("；")}</p>
                    <p>调理建议：${detail.advice.join("；")}</p>
                </div>
            `;
        }).join("");
    }

    function renderSectionCard(section) {
        return `
            <div class="mini-card">
                <p class="section-kicker">直说</p>
                <h3>${section.title}</h3>
                <p class="blunt">${section.verdict}</p>
                <p>${section.plain}</p>
                <p class="good-text">有利：${joinItems(section.positives)}</p>
                <p class="bad-text">风险：${joinItems(section.negatives)}</p>
                <p>建议：${section.advice}</p>
            </div>
        `;
    }

    function joinItems(items, fallback = "暂无明显特别项。") {
        return items && items.length ? items.join("；") : fallback;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#39;");
    }

    function ensureReportState() {
        if (!state.current) {
            alert("请先完成一次测算。");
            return null;
        }
        return state.current;
    }

    function downloadTextFile(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function setTargetYearFromSummary(year) {
        $(PROFILE_CONFIGS.primary.targetYear).value = String(year);
        updatePreview(PROFILE_CONFIGS.primary);
        runAnalysis(getProfileInput(PROFILE_CONFIGS.primary));
        showSection("dayun");
    }

    function renderKeyYearsSummary(yearEvaluations) {
        const bestYears = [...yearEvaluations].sort((a, b) => b.evaluation.scores.overall - a.evaluation.scores.overall).slice(0, 3);
        const riskyYears = [...yearEvaluations].sort((a, b) => a.evaluation.scores.overall - b.evaluation.scores.overall).slice(0, 3);
        const currentYear = Number($(PROFILE_CONFIGS.primary.targetYear).value);
        const cards = [
            ...bestYears.map((item) => `
                <div class="mini-card">
                    <p class="section-kicker">顺势年份</p>
                    <h3>${item.year}年 · ${item.pillar}</h3>
                    <p class="blunt">综合分 ${item.evaluation.scores.overall}，更容易看到推进、合作和结果。</p>
                    <p class="good-text">重点机会：${joinItems(item.evaluation.opportunities)}</p>
                    <p class="bad-text">仍需注意：${joinItems(item.evaluation.risks)}</p>
                    <button type="button" class="btn-link" data-target-year="${item.year}">${item.year === currentYear ? "当前分析年" : "切换到该年"}</button>
                </div>
            `),
            ...riskyYears.map((item) => `
                <div class="mini-card">
                    <p class="section-kicker">高压年份</p>
                    <h3>${item.year}年 · ${item.pillar}</h3>
                    <p class="blunt">综合分 ${item.evaluation.scores.overall}，这一年更怕硬顶和失控。</p>
                    <p class="bad-text">高风险点：${joinItems(item.evaluation.risks)}</p>
                    <p class="good-text">可用窗口：${joinItems(item.evaluation.opportunities)}</p>
                    <button type="button" class="btn-link" data-target-year="${item.year}">${item.year === currentYear ? "当前分析年" : "切换到该年"}</button>
                </div>
            `)
        ];
        $("key-years-summary").innerHTML = cards.join("");
        $("key-years-summary").querySelectorAll("[data-target-year]").forEach((button) => {
            button.addEventListener("click", () => setTargetYearFromSummary(Number(button.dataset.targetYear)));
        });
    }

    function refreshKnowledgeBaseMatches() {
        const matches = state.current
            ? KnowledgeBaseEngine.matchEntries(
                state.current.chart,
                state.current.currentYearEval,
                state.current.currentMonthEval,
                state.current.compatibility
            )
            : [];
        if (state.current) state.current.kbMatches = matches;
        renderKnowledgeBase(matches);
    }

    function removeKnowledgeBaseEntry(id) {
        KnowledgeBaseEngine.removeEntry(id);
        refreshKnowledgeBaseMatches();
    }

    function renderKnowledgeBase(kbMatches) {
        const entries = KnowledgeBaseEngine.loadEntries();
        $("kb-matches").innerHTML = kbMatches && kbMatches.length
            ? kbMatches.map((entry) => `
                <div class="mini-card">
                    <p class="section-kicker">关联参考</p>
                    <h3>${escapeHtml(entry.title)}</h3>
                    <p>${escapeHtml(entry.content.slice(0, 180))}${entry.content.length > 180 ? "..." : ""}</p>
                    <p class="muted">标签：${escapeHtml(entry.tags.join("、") || "未标注")} · 来源：${escapeHtml(entry.source)}</p>
                </div>
            `).join("")
            : `<div class="mini-card"><h3>暂无高相关条目</h3><p>可以导入你整理过的命理笔记、书目摘要、断语索引或案例库，系统会按当前命盘自动匹配相关内容。</p></div>`;
        $("kb-list").innerHTML = entries.length
            ? entries.map((entry) => `
                <div class="mini-card">
                    <h3>${escapeHtml(entry.title)}</h3>
                    <p>${escapeHtml(entry.content.slice(0, 240))}${entry.content.length > 240 ? "..." : ""}</p>
                    <p class="muted">标签：${escapeHtml(entry.tags.join("、") || "未标注")} · 来源：${escapeHtml(entry.source)}</p>
                    ${String(entry.id).startsWith("seed-")
                        ? `<p class="muted">内置条目不可单独删除，可通过“恢复内置书目”重置。</p>`
                        : `<button type="button" class="btn-link" data-kb-remove="${escapeHtml(entry.id)}">删除条目</button>`}
                </div>
            `).join("")
            : `<div class="mini-card"><h3>知识库为空</h3><p>你可以导入本地 TXT/MD/JSON，也可以手动新增笔记条目。</p></div>`;
        $("kb-list").querySelectorAll("[data-kb-remove]").forEach((button) => {
            button.addEventListener("click", () => removeKnowledgeBaseEntry(button.dataset.kbRemove));
        });
    }

    function renderCompatibility(compatibility) {
        if (!compatibility) {
            $("compatibility-analysis").innerHTML = `<div class="mini-card"><h3>未启用合盘</h3><p>打开“启用合盘 / 合婚分析”后，录入第二个人的出生信息，这里会显示合盘、合婚、家庭协同和子嗣协同结果。</p></div>`;
            ChartRenderer.drawBarChart($("compatibility-chart"), [
                { element: "吸引", score: 0 },
                { element: "沟通", score: 0 },
                { element: "婚姻", score: 0 },
                { element: "家庭", score: 0 },
                { element: "财务", score: 0 },
                { element: "子嗣", score: 0 }
            ]);
            return;
        }
        const scores = compatibility.result.scores;
        ChartRenderer.drawBarChart($("compatibility-chart"), [
            { element: "吸引", score: scores.attraction },
            { element: "沟通", score: scores.communication },
            { element: "婚姻", score: scores.marriage },
            { element: "家庭", score: scores.family },
            { element: "财务", score: scores.finance },
            { element: "子嗣", score: scores.child }
        ]);
        $("compatibility-analysis").innerHTML = compatibility.result.sections.map(renderSectionCard).join("");
    }

    function renderAI(report, environment, lucky, detailed, family, master, currentYearEval, currentMonthEval, compatibility, kbMatches) {
        const loading = $("ai-loading");
        loading.classList.remove("hidden");
        setTimeout(() => {
            loading.classList.add("hidden");
            $("ai-report").innerHTML = report.map((item) => `<div class="report-block"><h3>${item.title}</h3><p>${item.body}</p></div>`).join("");
            $("environment-analysis").innerHTML = `<div class="report-block"><h3>${environment.title}</h3><p>${environment.body}</p><p class="good-text">这一年可能发生：${currentYearEval.opportunities.join(" ")}</p><p class="bad-text">需要注意：${currentYearEval.risks.join(" ")}</p></div>`;
            $("lucky-suggestions").innerHTML = lucky.map((item) => `<div class="report-block"><p>${item}</p></div>`).join("");
            if (kbMatches?.length) {
                $("lucky-suggestions").innerHTML += `<div class="report-block"><h3>知识库校注</h3><p>本地知识库匹配到：${kbMatches.slice(0, 3).map((entry) => `${entry.title}（${entry.source}）`).join("；")}。这些条目已在下方“本地知识库”中展开，便于对照经典笔记和案例索引进一步细看。</p></div>`;
            }
            $("detailed-analysis-grid").innerHTML = [
                ...detailed.map(renderSectionCard),
                `<div class="mini-card"><p class="section-kicker">本月重点</p><h3>${currentMonthEval.meta}</h3><p class="blunt">${currentMonthEval.blunt}</p><p class="good-text">可能发生：${currentMonthEval.opportunities.join(" ")}</p><p class="bad-text">需要注意：${currentMonthEval.risks.join(" ")}</p></div>`
            ].join("");
            $("master-summary").innerHTML = master.map(renderSectionCard).join("");
            $("family-analysis-grid").innerHTML = family.map(renderSectionCard).join("");
            renderKeyYearsSummary(state.current.yearEvaluations);
            renderKnowledgeBase(kbMatches);
            renderCompatibility(compatibility);
        }, 180);
    }

    function buildSectionMarkdown(section) {
        return [
            `### ${section.title}`,
            `- 直说：${section.verdict}`,
            `- 白话：${section.plain}`,
            `- 有利：${joinItems(section.positives)}`,
            `- 风险：${joinItems(section.negatives)}`,
            `- 建议：${section.advice}`
        ].join("\n");
    }

    function buildReportMarkdown() {
        const current = ensureReportState();
        if (!current) return "";
        const pillarInterpretations = BaziAnalysis.buildPillarInterpretations(current.chart);
        const useful = BaziAnalysis.buildUsefulAnalysis(current.chart);
        const shensha = BaziAnalysis.buildShenshaDetails(current.chart);
        const lines = [
            `# 天命本地报告：${current.input.profileName}`,
            "",
            "## 排盘依据",
            `- 出生信息：${current.input.year}-${pad(current.input.month)}-${pad(current.input.day)} ${pad(current.input.hour)}:${pad(current.input.minute)} · ${current.input.regionName}`,
            `- 录入历法：${current.input.calendarType === "solar" ? "公历" : `农历${current.input.lunarLeap ? "（闰月）" : ""}`}`,
            `- 最终排盘：${current.chart.solarMeta.usedMode === "trueSolar" ? "真太阳时" : "标准时间"} · ${current.chart.solarMeta.effectiveText}`,
            `- 当前大运：${current.dayun.current.label}（${current.dayun.current.startYear}-${current.dayun.current.endYear}）`,
            "",
            "## 八字四柱",
            ...current.chart.pillars.map((pillar) => `- ${pillar.label}：${pillar.stem}${pillar.branch} · 天干十神 ${pillar.tenGod} · 地支十神 ${pillar.tenGodZhi.join("、")} · 藏干 ${pillar.hidden.join("、")}`),
            "",
            "## 四柱详解",
            ...pillarInterpretations.map(buildSectionMarkdown),
            "",
            "## 用神与结构",
            ...useful.map(buildSectionMarkdown),
            ...shensha.map(buildSectionMarkdown),
            "",
            "## 当前年份重点",
            `- 年份：${current.input.targetYear}`,
            `- 综合：${current.currentYearEval.blunt}`,
            `- 可能发生：${joinItems(current.currentYearEval.opportunities)}`,
            `- 需要注意：${joinItems(current.currentYearEval.risks)}`,
            "",
            "## 当前月份重点",
            `- ${current.currentMonthEval.meta}`,
            `- 综合：${current.currentMonthEval.blunt}`,
            `- 可能发生：${joinItems(current.currentMonthEval.opportunities)}`,
            `- 需要注意：${joinItems(current.currentMonthEval.risks)}`,
            "",
            "## 专题分析",
            ...current.detailed.map(buildSectionMarkdown),
            "",
            "## 六亲与子嗣",
            ...current.family.map(buildSectionMarkdown),
            "",
            "## 道长总断",
            ...current.master.map(buildSectionMarkdown),
            "",
            "## 关键年份",
            ...current.yearEvaluations
                .slice()
                .sort((a, b) => b.evaluation.scores.overall - a.evaluation.scores.overall)
                .slice(0, 5)
                .map((item) => `- ${item.year}年 ${item.pillar}：综合 ${item.evaluation.scores.overall}；机会 ${joinItems(item.evaluation.opportunities)}；风险 ${joinItems(item.evaluation.risks)}`),
            ...current.yearEvaluations
                .slice()
                .sort((a, b) => a.evaluation.scores.overall - b.evaluation.scores.overall)
                .slice(0, 3)
                .map((item) => `- 高压提醒 ${item.year}年 ${item.pillar}：综合 ${item.evaluation.scores.overall}；先防 ${joinItems(item.evaluation.risks)}`),
            "",
            "## 健康重点",
            ...current.health.risks.length
                ? current.health.risks.map((item) => `- ${item.element}：${item.risk}；对应部位 ${item.organs.join("、")}；建议 ${item.advice}`)
                : ["- 健康结构相对均衡，但仍需管理作息和恢复。"]
        ];
        if (current.compatibility) {
            lines.push("", "## 合盘 / 合婚", ...current.compatibility.result.sections.map(buildSectionMarkdown));
        }
        if (current.kbMatches?.length) {
            lines.push("", "## 本地知识库关联参考", ...current.kbMatches.map((entry) => `- ${entry.title}（${entry.source}）：${entry.content.slice(0, 160)}`));
        }
        return `${lines.join("\n")}\n`;
    }

    function buildReportHtml() {
        const markdown = buildReportMarkdown();
        if (!markdown) return "";
        const paragraphs = markdown
            .split("\n")
            .map((line) => {
                if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
                if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
                if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
                if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
                if (!line.trim()) return "";
                return `<p>${escapeHtml(line)}</p>`;
            });
        const htmlLines = [];
        let listBuffer = [];
        paragraphs.forEach((line) => {
            if (line.startsWith("<li>")) {
                listBuffer.push(line);
                return;
            }
            if (listBuffer.length) {
                htmlLines.push(`<ul>${listBuffer.join("")}</ul>`);
                listBuffer = [];
            }
            if (line) htmlLines.push(line);
        });
        if (listBuffer.length) htmlLines.push(`<ul>${listBuffer.join("")}</ul>`);
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(state.current.input.profileName)} - 天命报告</title>
    <style>
        body { font-family: "Noto Serif SC", "Songti SC", serif; margin: 32px auto; max-width: 960px; color: #2f2418; line-height: 1.8; }
        h1, h2, h3 { color: #9a3412; }
        h1 { border-bottom: 2px solid #e7dac5; padding-bottom: 12px; }
        h2 { margin-top: 28px; }
        ul { padding-left: 20px; }
        p, li { margin: 8px 0; }
    </style>
</head>
<body>${htmlLines.join("")}</body>
</html>`;
    }

    function exportMarkdownReport() {
        const content = buildReportMarkdown();
        if (!content) return;
        const filename = `${(state.current.input.profileName || "bazi-report").replace(/\s+/g, "-")}-report.md`;
        downloadTextFile(filename, content, "text/markdown;charset=utf-8");
    }

    function exportHtmlReport() {
        const content = buildReportHtml();
        if (!content) return;
        const filename = `${(state.current.input.profileName || "bazi-report").replace(/\s+/g, "-")}-report.html`;
        downloadTextFile(filename, content, "text/html;charset=utf-8");
    }

    function printReport() {
        const content = buildReportHtml();
        if (!content) return;
        const win = window.open("", "_blank");
        if (!win) {
            alert("浏览器拦截了打印窗口，请允许弹窗后重试。");
            return;
        }
        win.document.open();
        win.document.write(content);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 250);
    }

    function exportKnowledgeBase() {
        downloadTextFile("tming-knowledge-base.json", KnowledgeBaseEngine.exportEntries(), "application/json;charset=utf-8");
    }

    function resetKnowledgeBase() {
        if (!confirm("恢复后会用内置书目覆盖当前知识库，是否继续？")) return;
        KnowledgeBaseEngine.resetSeed();
        refreshKnowledgeBaseMatches();
    }

    function addKnowledgeBaseEntry() {
        const title = $("kb-manual-title").value.trim();
        const tags = $("kb-manual-tags").value.split(",").map((item) => item.trim()).filter(Boolean);
        const content = $("kb-manual-content").value.trim();
        if (!title || !content) {
            alert("请至少填写标题和内容。");
            return;
        }
        KnowledgeBaseEngine.addEntry({ title, tags, content, source: "手动添加" });
        $("kb-manual-title").value = "";
        $("kb-manual-tags").value = "";
        $("kb-manual-content").value = "";
        refreshKnowledgeBaseMatches();
    }

    async function importKnowledgeBaseFiles(event) {
        const files = event.target.files;
        if (!files || !files.length) return;
        try {
            await KnowledgeBaseEngine.importFiles(files);
            refreshKnowledgeBaseMatches();
        } catch (error) {
            alert(`导入失败：${error.message}`);
        } finally {
            event.target.value = "";
        }
    }

    function loadCompatibilityExample() {
        setCompatibilityEnabled(true);
        const config = PROFILE_CONFIGS.compat;
        $(config.name).value = "合盘对象示例";
        $(config.calendarType).value = "solar";
        $(config.year).value = "1994";
        $(config.month).value = "11";
        syncLunarLeap(config);
        syncDayOptions(config);
        $(config.day).value = "27";
        $(config.lunarLeap).value = "0";
        $(config.time).value = "20:20";
        $(config.region).value = "1";
        applyRegion(config, REGIONS[1]);
        $(config.solarTimeMode).value = "auto";
        $(config.dayBoundarySect).value = "1";
        $(config.gender).value = "male";
        updatePreview(config);
    }

    function loadExample() {
        const config = PROFILE_CONFIGS.primary;
        $(config.name).value = "示例命盘";
        $(config.calendarType).value = "solar";
        $(config.year).value = "1992";
        $(config.month).value = "8";
        syncLunarLeap(config);
        syncDayOptions(config);
        $(config.day).value = "16";
        $(config.lunarLeap).value = "0";
        $(config.time).value = "08:36";
        $(config.region).value = "0";
        applyRegion(config, REGIONS[0]);
        $(config.solarTimeMode).value = "auto";
        $(config.dayBoundarySect).value = "1";
        $(config.gender).value = "female";
        $(config.targetYear).value = String(new Date().getFullYear());
        $(config.yunSect).value = "2";
        updatePreview(config);
        loadCompatibilityExample();
        runAnalysis(getProfileInput(config));
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
                applyInput(PROFILE_CONFIGS.primary, profile.input, profile.name);
                updatePreview(PROFILE_CONFIGS.primary);
                runAnalysis(getProfileInput(PROFILE_CONFIGS.primary));
            });
        });
    }

    function applyInput(config, input, name) {
        $(config.name).value = name || input.profileName || "";
        $(config.calendarType).value = input.calendarType || "solar";
        $(config.year).value = String(input.year);
        renderMonthOptions(config);
        setMonthSelection(config, Math.abs(input.month), Boolean(input.lunarLeap));
        syncLunarLeap(config);
        syncDayOptions(config);
        $(config.day).value = String(input.day);
        $(config.time).value = `${pad(input.hour)}:${pad(input.minute)}`;
        $(config.gender).value = input.gender;
        $(config.solarTimeMode).value = input.solarTimeMode || "auto";
        $(config.timezoneOffset).value = String(input.timezoneOffset ?? 8);
        $(config.longitude).value = Number(input.longitude).toFixed(2);
        $(config.dayBoundarySect).value = String(input.dayBoundarySect || 1);
        if (config.targetYear) $(config.targetYear).value = String(input.targetYear || new Date().getFullYear());
        if (config.yunSect) $(config.yunSect).value = String(input.yunSect || 2);
        const regionIndex = Math.max(REGIONS.findIndex((region) => region.name === input.regionName), 0);
        $(config.region).value = String(regionIndex);
    }

    function clearProfiles() {
        localStorage.removeItem(STORAGE_KEY);
        renderSavedProfiles();
    }

    initSelects();
    bindEvents();
    renderSavedProfiles();
    renderKnowledgeBase([]);
    updatePreview(PROFILE_CONFIGS.primary);
    updatePreview(PROFILE_CONFIGS.compat);
    loadExample();
})();
