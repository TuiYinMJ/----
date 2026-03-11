(function () {
    const STORAGE_KEY = "tming-bazi-profiles-v4";
    const AI_CONFIG_KEY = "tming-ai-config-v1";
    const GEO_CONFIG_KEY = "tming-geo-config-v1";
    const LUNAR_MONTH_NAMES = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
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
    const GEO_QUICK_HINTS = [
        "上海市第一妇婴保健院",
        "北京协和医院",
        "广州市妇女儿童医疗中心",
        "成都市妇女儿童中心医院",
        "杭州市妇产科医院"
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
            dateTip: "date-validation-tip",
            timeTip: "time-boundary-tip",
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

    const state = { current: null, ai: null };
    const TRUE_SOLAR_GROUPS = {
        high: "建议重点核对真太阳时（偏差 >= 40 分钟）",
        low: "通常标准时即可（偏差 < 40 分钟）",
        custom: "自定义"
    };

    function $(id) {
        return document.getElementById(id);
    }

    function defaultAiConfig() {
        return {
            provider: "none",
            workflowMode: "multi",
            baseUrl: "",
            apiKey: "",
            model: "",
            embeddingModel: "",
            promptTemplate: AIEngine.DEFAULT_PROMPT_TEMPLATE
        };
    }

    function defaultGeoConfig() {
        return {
            provider: "none",
            apiKey: ""
        };
    }

    function loadAiConfig() {
        try {
            return { ...defaultAiConfig(), ...(JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || "null") || {}) };
        } catch {
            return defaultAiConfig();
        }
    }

    function saveAiConfig(config) {
        state.ai = { ...defaultAiConfig(), ...config };
        localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(state.ai));
        return state.ai;
    }

    function loadGeoConfig() {
        try {
            return { ...defaultGeoConfig(), ...(JSON.parse(localStorage.getItem(GEO_CONFIG_KEY) || "null") || {}) };
        } catch {
            return defaultGeoConfig();
        }
    }

    function saveGeoConfig(config) {
        const merged = { ...defaultGeoConfig(), ...config };
        localStorage.setItem(GEO_CONFIG_KEY, JSON.stringify(merged));
        return merged;
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

    function renderGeoSuggestions() {
        const datalist = $("geo-suggestions");
        if (!datalist) return;
        const options = [
            ...REGIONS.map((region) => region.name).filter((name) => name !== "自定义"),
            ...GEO_QUICK_HINTS
        ];
        datalist.innerHTML = options.map((item) => `<option value="${escapeHtml(item)}"></option>`).join("");
    }

    function setInputTip(id, message, level = "muted") {
        const node = $(id);
        if (!node) return;
        node.className = "input-tip";
        if (level === "warn") node.classList.add("tip-warn");
        if (level === "error") node.classList.add("tip-error");
        if (level === "ok") node.classList.add("tip-ok");
        if (level === "muted") node.classList.add("muted");
        node.textContent = message;
    }

    function lunarMonthLabel(month) {
        return LUNAR_MONTH_NAMES[Math.max(1, Math.min(12, Number(month || 1))) - 1] || `${month}月`;
    }

    function parseMonthOptionValue(rawValue) {
        const value = String(rawValue || "1");
        const lunarLeap = /L$/i.test(value);
        const numeric = Number(value.replace(/L$/i, ""));
        return {
            month: Number.isFinite(numeric) && numeric > 0 ? numeric : 1,
            lunarLeap
        };
    }

    function getMonthSelection(config) {
        const selection = parseMonthOptionValue($(config.month).value);
        return {
            month: Number.isFinite(selection.month) && selection.month > 0 ? selection.month : 1,
            lunarLeap: $(config.calendarType).value === "lunar" ? Boolean(selection.lunarLeap) : false
        };
    }

    function setMonthSelection(config, month, lunarLeap) {
        const monthEl = $(config.month);
        const calendarType = $(config.calendarType).value;
        const preferred = calendarType === "lunar" && lunarLeap ? `${month}L` : String(month);
        const fallback = String(month);
        const selected = Array.from(monthEl.options).some((option) => option.value === preferred)
            ? preferred
            : Array.from(monthEl.options).some((option) => option.value === fallback)
                ? fallback
                : (monthEl.options[0]?.value || "1");
        monthEl.value = selected;
        $(config.lunarLeap).value = /L$/i.test(selected) ? "1" : "0";
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

    function renderMonthOptions(config, preferred = null) {
        const monthEl = $(config.month);
        const calendarType = $(config.calendarType).value;
        const year = Number($(config.year).value);
        const previous = preferred || getMonthSelection(config);
        const leapMonth = LunarYear.fromYear(year).getLeapMonth();
        monthEl.innerHTML = "";
        for (let month = 1; month <= 12; month++) {
            const option = document.createElement("option");
            option.value = String(month);
            option.textContent = calendarType === "lunar" ? lunarMonthLabel(month) : String(month);
            if (month === previous.month && !previous.lunarLeap) option.selected = true;
            monthEl.appendChild(option);
            if (calendarType === "lunar" && leapMonth === month) {
                const leapOption = document.createElement("option");
                leapOption.value = `${month}L`;
                leapOption.textContent = `闰${lunarMonthLabel(month)}`;
                if (month === previous.month && previous.lunarLeap) leapOption.selected = true;
                monthEl.appendChild(leapOption);
            }
        }
        setMonthSelection(config, previous.month, previous.lunarLeap);
    }

    function updateCalendarFromSolar(config, solar, nextCalendarType) {
        $(config.calendarType).value = nextCalendarType;
        if (nextCalendarType === "solar") {
            $(config.year).value = String(solar.getYear());
            renderMonthOptions(config, { month: solar.getMonth(), lunarLeap: false });
            syncDayOptions(config);
            $(config.day).value = String(Math.min(solar.getDay(), Number($(config.day).options.length || 31)));
            $(config.time).value = `${pad(solar.getHour())}:${pad(solar.getMinute())}`;
        } else {
            const lunar = solar.getLunar();
            const lunarMonth = lunar.getMonth();
            $(config.year).value = String(lunar.getYear());
            renderMonthOptions(config, { month: Math.abs(lunarMonth), lunarLeap: lunarMonth < 0 });
            syncDayOptions(config);
            $(config.day).value = String(Math.min(lunar.getDay(), Number($(config.day).options.length || 30)));
            $(config.time).value = `${pad(solar.getHour())}:${pad(solar.getMinute())}`;
        }
        syncLunarLeap(config);
    }

    function switchCalendarKeepingMoment(config, previousType, nextType) {
        const hourMinute = getTimeParts(config);
        const selection = getMonthSelection(config);
        const rawInput = {
            profileName: $(config.name).value.trim() || (config === PROFILE_CONFIGS.primary ? "未命名档案" : "合盘对象"),
            calendarType: previousType,
            year: Number($(config.year).value),
            month: selection.month,
            day: Number($(config.day).value),
            lunarLeap: selection.lunarLeap,
            hour: hourMinute.hour,
            minute: hourMinute.minute,
            gender: $(config.gender).value,
            solarTimeMode: $(config.solarTimeMode).value,
            timezoneOffset: Number($(config.timezoneOffset).value),
            longitude: Number($(config.longitude).value),
            regionName: (REGIONS[Number($(config.region).value)] || REGIONS[0]).name,
            dayBoundarySect: Number($(config.dayBoundarySect).value),
            targetYear: config.targetYear ? Number($(config.targetYear).value) : Number($(PROFILE_CONFIGS.primary.targetYear).value),
            yunSect: config.yunSect ? Number($(config.yunSect).value) : 2
        };
        try {
            const solar = BaziCore.getSolarFromInput(rawInput);
            updateCalendarFromSolar(config, solar, nextType);
        } catch {
            // 如果当前输入本身就非法（极少），只切模式不做转换，避免锁死表单。
            syncLunarLeap(config);
            renderMonthOptions(config);
            syncDayOptions(config);
        }
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
        $(config.calendarType).dataset.prevType = $(config.calendarType).value;
        if (config.enabled) setCompatibilityEnabled(false);
    }

    function initSelects() {
        initProfileControls(PROFILE_CONFIGS.primary, new Date().getFullYear() - 30, 6, 18, 0);
        initProfileControls(PROFILE_CONFIGS.compat, new Date().getFullYear() - 28, 10, 9, 0);
        fillSelect(PROFILE_CONFIGS.primary.targetYear, 1900, 2099, new Date().getFullYear());
        renderGeoSuggestions();
        renderAiConfig(loadAiConfig());
        renderGeoConfig(loadGeoConfig());
    }

    function renderAiConfig(config) {
        $("llm-provider").value = config.provider;
        $("llm-workflow-mode").value = config.workflowMode || "multi";
        $("llm-base-url").value = config.baseUrl;
        $("llm-api-key").value = config.apiKey;
        $("embedding-model").value = config.embeddingModel;
        $("llm-prompt-template").value = config.promptTemplate || AIEngine.DEFAULT_PROMPT_TEMPLATE;
        $("llm-model").innerHTML = config.model
            ? `<option value="${escapeHtml(config.model)}" selected>${escapeHtml(config.model)}</option>`
            : `<option value="">请先获取模型</option>`;
        state.ai = config;
        renderLlmStatus(`当前模式：${config.provider === "none" ? "仅本地规则引擎" : config.provider === "openai" ? "OpenAI 兼容接口" : "Ollama"}；工作流：${config.workflowMode === "multi" ? "多 Agent" : "单次直出"}。${config.model ? `已选择模型 ${config.model}。` : "尚未选择模型。"}${config.embeddingModel ? ` 向量模型 ${config.embeddingModel}。` : ""}`);
    }

    function getAiConfigFromForm() {
        return {
            provider: $("llm-provider").value,
            workflowMode: $("llm-workflow-mode").value || "multi",
            baseUrl: $("llm-base-url").value.trim(),
            apiKey: $("llm-api-key").value.trim(),
            model: $("llm-model").value.trim(),
            embeddingModel: $("embedding-model").value.trim(),
            promptTemplate: $("llm-prompt-template").value.trim() || AIEngine.DEFAULT_PROMPT_TEMPLATE
        };
    }

    function persistAiConfigFromForm() {
        saveAiConfig(getAiConfigFromForm());
    }

    function renderLlmStatus(message) {
        $("llm-status").innerHTML = `<p>${message}</p>`;
    }

    function renderGeoConfig(config) {
        $("geo-provider").value = config.provider || "none";
        $("geo-api-key").value = config.apiKey || "";
    }

    function getGeoConfigFromForm() {
        return {
            provider: $("geo-provider").value,
            apiKey: $("geo-api-key").value.trim()
        };
    }

    function persistGeoConfigFromForm() {
        saveGeoConfig(getGeoConfigFromForm());
    }

    function openSettingsModal() {
        const modal = $("settings-modal");
        if (!modal) return;
        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeSettingsModal() {
        const modal = $("settings-modal");
        if (!modal) return;
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
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
        $("btn-llm-models").addEventListener("click", refreshLlmModels);
        $("btn-llm-generate").addEventListener("click", generateLlmReport);
        $("btn-kb-reindex").addEventListener("click", rebuildKnowledgeVectors);
        $("btn-kb-reindex-inline").addEventListener("click", rebuildKnowledgeVectors);
        $("btn-kb-export").addEventListener("click", exportKnowledgeBase);
        $("btn-kb-seed").addEventListener("click", resetKnowledgeBase);
        $("btn-kb-add").addEventListener("click", addKnowledgeBaseEntry);
        $("kb-file-input").addEventListener("change", importKnowledgeBaseFiles);
        $("btn-geo-search").addEventListener("click", geocodeBirthPlace);
        $("btn-open-settings").addEventListener("click", openSettingsModal);
        $("btn-close-settings").addEventListener("click", closeSettingsModal);
        $("btn-save-settings").addEventListener("click", () => {
            persistGeoConfigFromForm();
            closeSettingsModal();
            setInputTip("geo-status", "系统设置已保存。现在可直接在出生地输入框搜索定位。", "ok");
        });
        document.querySelectorAll("[data-close-settings]").forEach((node) => {
            node.addEventListener("click", closeSettingsModal);
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeSettingsModal();
        });
        ["llm-provider", "llm-workflow-mode", "llm-base-url", "llm-api-key", "llm-model", "embedding-model", "llm-prompt-template"].forEach((id) => {
            $(id).addEventListener("change", persistAiConfigFromForm);
            $(id).addEventListener("input", persistAiConfigFromForm);
        });
        ["geo-provider", "geo-api-key"].forEach((id) => {
            $(id).addEventListener("change", persistGeoConfigFromForm);
            $(id).addEventListener("input", persistGeoConfigFromForm);
        });
        $("geo-query").addEventListener("change", () => updatePreview(PROFILE_CONFIGS.primary));
        $("geo-query").addEventListener("input", () => updatePreview(PROFILE_CONFIGS.primary));
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
        $(config.calendarType).addEventListener("change", () => {
            const previousType = $(config.calendarType).dataset.prevType || "solar";
            const nextType = $(config.calendarType).value;
            if (previousType !== nextType) {
                switchCalendarKeepingMoment(config, previousType, nextType);
            } else {
                renderMonthOptions(config);
                syncLunarLeap(config);
                syncDayOptions(config);
            }
            $(config.calendarType).dataset.prevType = nextType;
            updatePreview(config);
        });
        $(config.year).addEventListener("change", () => {
            renderMonthOptions(config);
            syncLunarLeap(config);
            syncDayOptions(config);
            updatePreview(config);
        });
        $(config.month).addEventListener("change", () => {
            syncLunarLeap(config);
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
        $(config.longitude).value = region.longitude.toFixed(4);
        $(config.timezoneOffset).value = String(region.timezoneOffset);
    }

    function guessRegionFromQuery(query) {
        const text = String(query || "").trim();
        if (!text) return null;
        return REGIONS.find((region) => region.name !== "自定义" && text.includes(region.name)) || null;
    }

    async function geocodeByAmap(query, apiKey) {
        const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url);
        const payload = await response.json();
        if (String(payload.status) !== "1" || !Array.isArray(payload.geocodes) || !payload.geocodes.length) {
            throw new Error(payload.info || "高德未返回有效坐标。");
        }
        const best = payload.geocodes[0];
        const [lngText, latText] = String(best.location || "").split(",");
        const longitude = Number(lngText);
        const latitude = Number(latText);
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
            throw new Error("高德返回坐标格式异常。");
        }
        return {
            provider: "高德",
            longitude,
            latitude,
            title: best.formatted_address || query,
            detail: [best.country, best.province, best.city, best.district].filter(Boolean).join(" ")
        };
    }

    async function geocodeByTencent(query, apiKey) {
        const url = `https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url);
        const payload = await response.json();
        if (Number(payload.status) !== 0 || !payload.result?.location) {
            throw new Error(payload.message || "腾讯未返回有效坐标。");
        }
        const longitude = Number(payload.result.location.lng);
        const latitude = Number(payload.result.location.lat);
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
            throw new Error("腾讯返回坐标格式异常。");
        }
        return {
            provider: "腾讯",
            longitude,
            latitude,
            title: payload.result.title || query,
            detail: payload.result.address || ""
        };
    }

    async function geocodeBirthPlace() {
        const config = getGeoConfigFromForm();
        const query = $("geo-query").value.trim();
        persistGeoConfigFromForm();
        if (!query) {
            setInputTip("geo-status", "请先输入出生市/县/医院。", "error");
            return;
        }
        const guessedRegion = guessRegionFromQuery(query);
        if (config.provider === "none") {
            if (!guessedRegion) {
                setInputTip("geo-status", "当前未启用地图接口，未能从关键词匹配城市。请打开“系统设置”填写地图接口后再定位。", "warn");
                return;
            }
            const primary = PROFILE_CONFIGS.primary;
            const index = REGIONS.findIndex((item) => item.name === guessedRegion.name);
            $(primary.region).value = String(Math.max(index, 0));
            applyRegion(primary, guessedRegion);
            updatePreview(primary);
            setInputTip("geo-status", `📍 已定位：${guessedRegion.name}（使用内置城市库，经度 ${guessedRegion.longitude.toFixed(2)}，真太阳时已自动校准）`, "ok");
            return;
        }
        if (!config.apiKey) {
            setInputTip("geo-status", "请先在“系统设置”填写地图 API Key。", "error");
            return;
        }
        try {
            setInputTip("geo-status", "正在检索地址并校准真太阳时...", "muted");
            const result = config.provider === "amap"
                ? await geocodeByAmap(query, config.apiKey)
                : await geocodeByTencent(query, config.apiKey);
            const customIndex = REGIONS.findIndex((item) => item.name === "自定义");
            const primary = PROFILE_CONFIGS.primary;
            $(primary.region).value = String(Math.max(customIndex, 0));
            $(primary.longitude).value = result.longitude.toFixed(4);
            updatePreview(primary);
            setInputTip("geo-status", `📍 已定位：${result.title}（经度 ${result.longitude.toFixed(4)}，真太阳时已自动校准）`, "ok");
        } catch (error) {
            setInputTip("geo-status", `定位失败：${error.message}。若接口限制跨域，可在高级排盘里手动微调经度。`, "error");
        }
    }

    function syncLunarLeap(config) {
        const selection = getMonthSelection(config);
        $(config.lunarLeap).value = selection.lunarLeap ? "1" : "0";
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
            const yearInfo = LunarYear.fromYear(year);
            let lunarMonthInfo = yearInfo.getMonth(lunarMonth);
            // 非法闰月组合时，先退回平月天数展示，最终以校验提示为准。
            if (!lunarMonthInfo && lunarLeap) {
                lunarMonthInfo = yearInfo.getMonth(month);
            }
            maxDay = lunarMonthInfo ? lunarMonthInfo.getDayCount() : 30;
        }
        const adjusted = previous > maxDay;
        const adjustedTo = Math.min(previous, maxDay);
        dayEl.innerHTML = "";
        for (let i = 1; i <= maxDay; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            if (i === adjustedTo) option.selected = true;
            dayEl.appendChild(option);
        }
        if (config.dateTip) {
            if (calendarType === "lunar" && adjusted) {
                setInputTip(config.dateTip, `该农历月为小月，无 ${previous} 日，已自动调整为 ${adjustedTo} 日。`, "error");
            } else if (calendarType === "lunar") {
                setInputTip(config.dateTip, maxDay === 29
                    ? "该农历月为小月（29天），系统已按规则限制日期。"
                    : "该农历月为大月（30天），可正常选择 1-30 日。", "muted");
            } else {
                setInputTip(config.dateTip, "当前为公历录入，日期会按公历每月天数自动联动校验。", "muted");
            }
        }
    }

    function validateLunarLeapChoice(input) {
        if (input.calendarType !== "lunar") {
            return { valid: true, leapMonth: LunarYear.fromYear(input.year).getLeapMonth() };
        }
        const leapMonth = LunarYear.fromYear(input.year).getLeapMonth();
        if (!input.lunarLeap) {
            return { valid: true, leapMonth };
        }
        if (!leapMonth) {
            return { valid: false, leapMonth, message: `你选择了闰月，但 ${input.year} 年没有闰月。` };
        }
        if (leapMonth !== input.month) {
            return { valid: false, leapMonth, message: `你选择了闰月，但 ${input.year} 年只有闰${leapMonth}月，没有闰${input.month}月。` };
        }
        return { valid: true, leapMonth };
    }

    function renderTemporalSensitivityTip(config, input) {
        if (!config.timeTip) return;
        try {
            const chart = BaziCore.computeBaZi(input);
            const jie = chart.seasonal?.jieQi;
            if (!jie) {
                setInputTip(config.timeTip, "未获取到节气边界数据。", "muted");
                return;
            }
            const afterPrev = Math.abs(Number(jie.passedMinutes || 0));
            const beforeNext = Math.abs(Number(jie.remainingMinutes || 0));
            const nearest = Math.min(afterPrev, beforeNext);
            if (!Number.isFinite(nearest)) {
                setInputTip(config.timeTip, "未获取到节气边界数据。", "muted");
                return;
            }
            if (nearest <= 180) {
                const nearName = afterPrev <= beforeNext ? jie.prevName : jie.nextName;
                const direction = afterPrev <= beforeNext ? "后" : "前";
                const level = nearest <= 60 ? "error" : "warn";
                setInputTip(config.timeTip, `此时间距离「${nearName}」交节仅差 ${Math.round(nearest)} 分钟（${direction}），排盘结果敏感，请确保出生时间准确。`, level);
                return;
            }
            setInputTip(config.timeTip, `节气边界正常：距离上一/下一节气分别约 ${Math.round(afterPrev)} 分钟 / ${Math.round(beforeNext)} 分钟。`, "ok");
        } catch {
            setInputTip(config.timeTip, "节气敏感度提示暂不可用，请检查录入时间。", "warn");
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
            const leapValidation = validateLunarLeapChoice(input);
            if (!leapValidation.valid) {
                $(config.preview).innerHTML = `<p class="muted">${escapeHtml(leapValidation.message)} 请先修正闰月选项。</p>`;
                if (config.timeTip) setInputTip(config.timeTip, "请先修正日期后再判断节气边界。", "warn");
                return;
            }
            renderTemporalSensitivityTip(config, input);
            const preview = BaziCore.buildPreview(input);
            const recommendation = preview.solarMeta.autoUseTrueSolar
                ? "自动模式建议采用真太阳时，因为修正后会影响时柱或日期。"
                : "自动模式可保持标准时间，因为修正后未跨关键边界。";
            const region = REGIONS[Number($(config.region).value)] || REGIONS[0];
            const regionGroup = getRegionGroup(region);
            const leapMonth = leapValidation.leapMonth;
            const leapHint = input.calendarType === "lunar"
                ? (leapMonth
                    ? `系统已识别该年闰${lunarMonthLabel(leapMonth)}。月份下拉已直接提供“闰${lunarMonthLabel(leapMonth)}”选项。`
                    : "系统已识别该年无闰月，月份下拉不显示闰月项。")
                : (preview.standardLunar.getMonth() < 0
                    ? `当前为公历录入，不要求填写闰月。换算农历结果为“闰${Math.abs(preview.standardLunar.getMonth())}月”。`
                    : "当前为公历录入，不涉及闰月录入判断。");
            const solarExplain = preview.solarMeta.usedMode === "trueSolar"
                ? "本次已采用真太阳时。真太阳时依据“出生地经度 + 时区中央经线差 + 当天均时差”计算，因为修正后已跨时辰或日期边界。"
                : "本次排盘仍采用标准时间。真太阳时只有在修正后影响时辰或日期边界时，自动模式才会接管。";
            const inputTypeText = input.calendarType === "solar"
                ? `公历录入：${preview.standardSolar.toYmdHms().slice(0, 16)}`
                : `农历录入：${input.year}年${input.lunarLeap ? "闰" : ""}${lunarMonthLabel(input.month)}${input.day}日 ${pad(input.hour)}:${pad(input.minute)}`;
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
            if (config.timeTip) setInputTip(config.timeTip, "当前时间无法完成节气边界计算，请检查输入。", "warn");
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        try {
            runAnalysis(getProfileInput(PROFILE_CONFIGS.primary));
        } catch (error) {
            alert(`排盘失败：${error.message}`);
        }
    }

    function buildAllYearEvaluations(chart, dayun) {
        const birthYear = chart.source.standardSolar.getYear();
        const rows = [];
        dayun.list.forEach((dayunEntry) => {
            DayunEngine.buildLiuNian(dayunEntry).forEach((item) => {
                const evaluation = BaziAnalysis.evaluateCycle(chart, item.pillar, "流年", `${item.year}年 · ${item.pillar}`, {
                    year: item.year,
                    currentDayunLabel: dayunEntry.label,
                    dayunStartYear: dayunEntry.startYear,
                    dayunEndYear: dayunEntry.endYear
                });
                rows.push({
                    ...item,
                    dayunLabel: dayunEntry.label,
                    dayunStartYear: dayunEntry.startYear,
                    dayunEndYear: dayunEntry.endYear,
                    evaluation
                });
            });
        });
        const uniq = new Map();
        rows.forEach((item) => {
            const previous = uniq.get(item.year);
            if (!previous || item.evaluation.scores.overall > previous.evaluation.scores.overall) {
                uniq.set(item.year, item);
            }
        });
        return Array.from(uniq.values())
            .filter((item) => item.year >= birthYear && item.year <= birthYear + 80)
            .sort((a, b) => a.year - b.year);
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
            evaluation: BaziAnalysis.evaluateCycle(chart, item.pillar, "流年", `${item.year}年 · ${item.pillar}`, {
                year: item.year,
                currentDayunLabel: dayun.current.label,
                dayunStartYear: dayun.current.startYear,
                dayunEndYear: dayun.current.endYear
            })
        }));
        const monthEvaluations = liuyue.map((item) => ({
            ...item,
            evaluation: BaziAnalysis.evaluateCycle(chart, item.pillar, "流月", `${item.month}月 · ${item.pillar}`, {
                month: item.month,
                parentYear: currentYearEntry.year,
                currentDayunLabel: dayun.current.label,
                dayunStartYear: dayun.current.startYear,
                dayunEndYear: dayun.current.endYear
            })
        }));
        const allYearEvaluations = buildAllYearEvaluations(chart, dayun);
        const currentYearEval = yearEvaluations.find((item) => item.year === currentYearEntry.year).evaluation;
        const currentMonthEval = monthEvaluations.find((item) => item.month === currentMonthEntry.month).evaluation;
        const health = HealthEngine.analyzeHealth(chart);
        const environment = BaziAnalysis.getEnvironmentAnalysis(chart, primaryInput.targetYear);
        const detailed = BaziAnalysis.buildDetailedAnalysis(chart, currentYearEval);
        const family = BaziAnalysis.buildFamilyAnalysis(chart, currentYearEval);
        const master = BaziAnalysis.buildMasterSummary(chart, currentYearEval, currentMonthEval);
        const criticalYears = BaziAnalysis.buildCriticalYears(chart, allYearEvaluations);
        const eventDashboard = BaziAnalysis.buildEventDashboard(chart, allYearEvaluations, monthEvaluations);
        const dailyGuide = BaziAnalysis.buildDailyGuide(chart, dayun.current.label, new Date(), 30);
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
        const modern = BaziAnalysis.buildModernLifeAdvice(chart, compatibility?.result || null, primaryInput.targetYear);
        const kbMatches = KnowledgeBaseEngine.matchEntries(chart, currentYearEval, currentMonthEval, compatibility);
        const caseMatches = KnowledgeBaseEngine.matchCaseEntries(chart, currentYearEval, currentMonthEval, compatibility, null, 5);
        state.current = {
            input: primaryInput,
            chart,
            dayun,
            yearEvaluations,
            monthEvaluations,
            allYearEvaluations,
            currentYearEval,
            currentMonthEval,
            health,
            environment,
            detailed,
            family,
            master,
            modern,
            criticalYears,
            eventDashboard,
            dailyGuide,
            compatibility,
            kbMatches,
            caseMatches,
            ragMatches: [],
            ragReferences: [],
            llmReport: "",
            agentReports: {},
            report,
            lucky
        };
        renderAll();
        showSection("bazi");
    }

    function renderAll() {
        const { input, chart, dayun, yearEvaluations, monthEvaluations, allYearEvaluations, eventDashboard, criticalYears, dailyGuide, currentYearEval, currentMonthEval, health, environment, detailed, family, master, modern, compatibility, kbMatches, caseMatches, report, lucky } = state.current;
        $(PROFILE_CONFIGS.primary.targetYear).value = String(input.targetYear);
        $("env-year-label").textContent = input.targetYear;
        $("liuyue-year-label").textContent = input.targetYear;
        renderCalculationMeta(chart, dayun);
        renderPillars(chart);
        renderInteractiveBranchBoard(chart);
        renderPillarInterpretations(chart);
        renderWuxing(chart);
        renderNarratives(chart);
        renderUsefulAnalysis(chart);
        renderShenshaDetails(chart);
        renderDayun(dayun, yearEvaluations, monthEvaluations, allYearEvaluations, eventDashboard, criticalYears, dailyGuide);
        renderHealth(health, yearEvaluations, monthEvaluations);
        renderAI(report, environment, lucky, modern, detailed, family, master, currentYearEval, currentMonthEval, compatibility, kbMatches, caseMatches);
    }

    function renderCalculationMeta(chart, dayun) {
        const solar = chart.solarMeta;
        const region = REGIONS.find((item) => item.name === chart.input.regionName) || {
            name: chart.input.regionName,
            longitude: chart.input.longitude,
            timezoneOffset: chart.input.timezoneOffset
        };
        const dayBoundaryText = BaziCore.getDayBoundaryModeText(chart.input.dayBoundarySect);
        const commanderText = chart.structure.commanderInfo.weights.map((item) => `${item.stem}${item.element} ${Math.round(item.weight * 100)}%`).join("、");
        const transformText = [
            ...chart.transformations.stemCombos.filter((item) => item.success).map((item) => `${item.pair}->${item.element}`),
            ...chart.transformations.branchCombos.filter((item) => item.success).map((item) => `${item.type}${item.element}`)
        ].join("；") || "当前无明确合化改气";
        const blindText = chart.blindPatterns.findings.length
            ? chart.blindPatterns.findings.slice(0, 2).map((item) => `${item.type} ${item.pair}（${item.focus}）`).join("；")
            : chart.blindPatterns.summary;
        const cards = [
            { title: "录入历法", body: chart.input.calendarType === "solar" ? "公历录入" : `农历录入${chart.input.lunarLeap ? "（闰月）" : ""}` },
            { title: "出生地与经度", body: `${chart.input.regionName} · 经度 ${chart.input.longitude.toFixed(2)}° · 时区 UTC${chart.input.timezoneOffset >= 0 ? "+" : ""}${chart.input.timezoneOffset}` },
            { title: "地区分组", body: `${getRegionGroup(region)} · ${getRegionGroupNote(region)}` },
            { title: "标准排盘时间", body: `${solar.standardText} · ${solar.standardShichen.label}` },
            { title: "真太阳时", body: `${solar.trueSolarText} · ${solar.trueSolarShichen.label} · 修正 ${BaziCore.formatSigned(solar.totalOffsetMinutes)} 分钟` },
            { title: "最终依据", body: `${solar.usedMode === "trueSolar" ? "采用真太阳时" : "采用标准时间"} · 换日流派 ${dayBoundaryText}` },
            { title: "月令与节气", body: `${chart.seasonal.season}令 · ${chart.seasonal.jieQi.prevName}后 ${chart.seasonal.jieQi.passedDays} 天 / ${chart.seasonal.jieQi.nextName}前 ${chart.seasonal.jieQi.remainingDays} 天 · 司令 ${commanderText}` },
            { title: "格局与根气", body: `${chart.structure.pattern.finalPattern} · 日主${chart.structure.strength}（强弱比 ${chart.structure.strengthScore}） · 日主根气 ${chart.roots.dayMasterRootStrength}` },
            { title: "合化与改气", body: transformText },
            { title: "盲派断点", body: blindText },
            { title: "起运设置", body: `起运流派 ${chart.input.yunSect === 2 ? "分钟折算" : "时辰折算"} · 起运日期约 ${dayun.startSolar}` }
        ];
        if (chart.boundaryMeta?.note) {
            cards.push({ title: "换日补充", body: chart.boundaryMeta.note });
        }
        if (chart.seasonal.jieQi?.criticalBoundary) {
            cards.push({
                title: "交节边界预警",
                body: `经当前排盘时刻校准，${chart.seasonal.jieQi.criticalText} 上一节气时间 ${chart.seasonal.jieQi.prevDateText}，下一节气时间 ${chart.seasonal.jieQi.nextDateText}。若你出生记录在边界附近，建议核对医院原始时间。`
            });
        }
        $("calculation-meta").innerHTML = cards.map((item) => `
            <div class="mini-card ${item.title === "交节边界预警" ? "warning-card" : ""}">
                <h3>${item.title}</h3>
                <p>${item.body}</p>
            </div>
        `).join("");
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

    function getBranchRelationTargets(baseBranch) {
        const targets = [];
        const push = (type, target, text) => {
            if (!target) return;
            targets.push({ type, target, text });
        };
        push("六合", BaziCore.LIU_HE[baseBranch], "六合：容易配合、吸引、绑定。");
        push("相冲", BaziCore.CHONG[baseBranch], "相冲：节奏对撞，常见变动、重组。");
        push("相穿", BaziCore.CHUAN[baseBranch], "相穿（害）：慢性耗损，容易长期拉扯。");
        push("相破", BaziCore.PO[baseBranch], "相破：合作破局、计划反复。");
        (BaziCore.XING_PAIRS[baseBranch] || []).forEach((target) => {
            push("相刑", target, "相刑：反复较劲、流程卡壳、内耗。");
        });
        return targets;
    }

    function relationClass(type) {
        if (type === "六合") return "is-he";
        if (type === "相冲") return "is-chong";
        if (type === "相穿") return "is-chuan";
        if (type === "相破") return "is-po";
        if (type === "相刑") return "is-xing";
        return "";
    }

    function renderInteractiveBranchBoard(chart) {
        const board = $("branch-relation-board");
        const detail = $("branch-relation-detail");
        if (!board || !detail) return;
        const natalMap = new Map();
        chart.pillars.forEach((pillar) => {
            const labels = natalMap.get(pillar.branch) || [];
            labels.push(pillar.label.replace("柱", ""));
            natalMap.set(pillar.branch, labels);
        });
        let selected = chart.pillars[2].branch;
        const draw = () => {
            const targets = getBranchRelationTargets(selected);
            const targetMap = new Map(targets.map((item) => [item.target, item]));
            board.innerHTML = BaziCore.BRANCHES.map((branch) => {
                const rel = targetMap.get(branch);
                const classes = ["branch-node"];
                if (branch === selected) classes.push("is-base");
                if (rel) classes.push(relationClass(rel.type));
                const natalLabel = natalMap.get(branch)?.join("/") || "";
                return `<button type="button" class="${classes.join(" ")}" data-branch-node="${branch}">
                    <strong>${branch}</strong>${natalLabel ? `<div class="muted">${natalLabel}柱</div>` : `<div class="muted">-</div>`}
                </button>`;
            }).join("");
            const relationLines = targets.map((item) => `<p><span class="marker-chip">${item.type}</span>${selected}${item.target}：${item.text}</p>`).join("");
            const inChart = chart.pillars
                .filter((pillar) => pillar.branch === selected)
                .map((pillar) => pillar.label)
                .join("、");
            detail.innerHTML = relationLines
                ? `<p><strong>${selected}</strong> 当前落在：${inChart || "非原局主支"}。</p>${relationLines}`
                : `<p><strong>${selected}</strong> 与其它支没有明确六合/冲/穿/破/刑映射，更多看原局十神与大运流年组合。</p>`;
            board.querySelectorAll("[data-branch-node]").forEach((node) => {
                node.addEventListener("click", () => {
                    selected = node.dataset.branchNode;
                    draw();
                });
            });
        };
        draw();
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

    function renderDayun(dayun, yearEvaluations, monthEvaluations, allYearEvaluations, eventDashboard, criticalYears, dailyGuide) {
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
                ${(item.evaluation.specialAlerts || []).length ? `<p class="bad-text">雷达预警：${item.evaluation.specialAlerts.map((entry) => entry.type).join("、")}</p>` : ""}
            </div>
        `).join("")}</div>`;
        $("liuyue-container").innerHTML = `<div class="pair-grid">${monthEvaluations.map((item) => `
            <div class="month-card">
                <h3>${item.month}月 · ${item.pillar}</h3>
                <p class="score">综合分 ${item.evaluation.scores.overall}</p>
                <p class="blunt">${item.evaluation.blunt}</p>
                <p class="good-text">可能发生：${item.evaluation.opportunities[0]}</p>
                <p class="bad-text">需要注意：${item.evaluation.risks[0]}</p>
                ${(item.evaluation.specialAlerts || []).length ? `<p class="bad-text">雷达预警：${item.evaluation.specialAlerts.map((entry) => entry.type).join("、")}</p>` : ""}
            </div>
        `).join("")}</div>`;
        ChartRenderer.drawLineChart($("fortune-chart"), yearEvaluations.map((item) => ({ label: item.year, value: item.evaluation.scores.overall })), "#9a3412");
        renderLifeRoadmap(allYearEvaluations, criticalYears);
        renderEventDashboard(eventDashboard);
        renderDailyGuide(dailyGuide);
        renderDomainCharts(yearEvaluations, monthEvaluations);
        renderFocusNarratives(yearEvaluations, monthEvaluations);
    }

    function renderDailyGuide(dailyGuide) {
        const container = $("daily-guide");
        if (!container) return;
        container.innerHTML = (dailyGuide || []).map((item) => `
            <div class="mini-card ${item.level === "慎" ? "warning-card" : ""}">
                <h3>${item.date} · ${item.pillar}</h3>
                <p class="${item.level === "宜" ? "good-text" : item.level === "慎" ? "bad-text" : ""}">${item.level} · 评分 ${item.score}</p>
                <p>${item.note}</p>
            </div>
        `).join("") || `<div class="mini-card"><p>暂无流日数据。</p></div>`;
    }

    function renderLifeRoadmap(allYearEvaluations, criticalYears) {
        const canvas = $("life-roadmap-chart");
        const summary = $("life-roadmap-summary");
        if (!canvas || !summary) return;
        const birthYear = state.current.chart.source.standardSolar.getYear();
        const byYear = new Map((allYearEvaluations || []).map((item) => [item.year, item]));
        const points = [];
        for (let age = 0; age <= 80; age++) {
            const year = birthYear + age;
            const evalItem = byYear.get(year);
            points.push({
                age,
                year,
                value: evalItem ? evalItem.evaluation.scores.overall : 60
            });
        }
        const wealthTop = [...(allYearEvaluations || [])].sort((a, b) => b.evaluation.scores.wealth - a.evaluation.scores.wealth).slice(0, 3);
        const relationTop = [...(allYearEvaluations || [])].sort((a, b) => b.evaluation.scores.relation - a.evaluation.scores.relation).slice(0, 3);
        const healthRisk = [...(allYearEvaluations || [])].sort((a, b) => a.evaluation.scores.health - b.evaluation.scores.health).slice(0, 3);
        const warningTop = [...(allYearEvaluations || [])]
            .filter((item) => (item.evaluation.specialAlerts || []).some((entry) => entry.level !== "chance"))
            .sort((a, b) => (b.evaluation.specialAlerts || []).length - (a.evaluation.specialAlerts || []).length)
            .slice(0, 5);
        const markers = [
            ...wealthTop.map((item) => ({ index: item.year - birthYear, type: "wealth", symbol: "财" })),
            ...relationTop.map((item) => ({ index: item.year - birthYear, type: "relation", symbol: "缘" })),
            ...healthRisk.map((item) => ({ index: item.year - birthYear, type: "health", symbol: "警" })),
            ...warningTop.map((item) => ({ index: item.year - birthYear, type: "warning", symbol: "危" }))
        ];
        ChartRenderer.drawRoadmapChart(canvas, points, markers);
        const cards = [
            ...(criticalYears?.favorable || []).slice(0, 4).map((item) => `
                <div class="mini-card">
                    <p class="section-kicker">顺势窗口</p>
                    <h3>${item.year}年 · ${item.pillar}</h3>
                    <p>${item.reason}</p>
                    <button type="button" class="btn-link" data-target-year="${item.year}">切换分析年</button>
                </div>
            `),
            ...(criticalYears?.risky || []).slice(0, 4).map((item) => `
                <div class="mini-card">
                    <p class="section-kicker">预警窗口</p>
                    <h3>${item.year}年 · ${item.pillar}</h3>
                    <p class="bad-text">${item.reason}</p>
                    <button type="button" class="btn-link" data-target-year="${item.year}">切换分析年</button>
                </div>
            `)
        ];
        summary.innerHTML = cards.join("") || `<div class="mini-card"><p>当前没有可展示的全生命周期数据。</p></div>`;
        summary.querySelectorAll("[data-target-year]").forEach((button) => {
            button.addEventListener("click", () => setTargetYearFromSummary(Number(button.dataset.targetYear)));
        });
    }

    function renderEventDashboard(eventDashboard) {
        const marriageEl = $("dashboard-marriage");
        const wealthEl = $("dashboard-wealth");
        const healthEl = $("dashboard-health-traffic");
        const warningEl = $("dashboard-warning-radar");
        if (!marriageEl || !wealthEl || !healthEl || !warningEl) return;
        const marriageCards = [
            ...(eventDashboard?.marriageWindows || []).map((item) => `<div class="mini-card"><p class="section-kicker">正缘窗口</p><h3>${item.year}年</h3><p>${item.note}</p></div>`),
            ...(eventDashboard?.marriageRisk || []).map((item) => `<div class="mini-card"><p class="section-kicker">桃花/关系风险</p><h3>${item.year}年</h3><p class="bad-text">${item.note}</p></div>`)
        ];
        const wealthCards = [
            ...(eventDashboard?.wealthPeaks || []).map((item) => `<div class="mini-card"><p class="section-kicker">财富高峰</p><h3>${item.year}年</h3><p class="good-text">${item.note}</p></div>`),
            ...(eventDashboard?.wealthPits || []).map((item) => `<div class="mini-card"><p class="section-kicker">破财填坑</p><h3>${item.year}年</h3><p class="bad-text">${item.note}</p></div>`)
        ];
        const healthCards = (eventDashboard?.healthTraffic || []).map((item) => `
            <div class="mini-card">
                <h3>${item.month}月 · ${item.level}</h3>
                <p>${item.pillar}</p>
                <p class="${item.level === "红灯" ? "bad-text" : item.level === "黄灯" ? "" : "good-text"}">${item.note}</p>
            </div>
        `);
        const warningCards = (eventDashboard?.warningRadar || []).map((item) => `
            <div class="mini-card warning-card">
                <h3>${item.year}年 · ${item.pillar}</h3>
                <p class="bad-text">${item.note}</p>
            </div>
        `);
        marriageEl.innerHTML = marriageCards.join("") || `<div class="mini-card"><p>暂无婚姻专题数据。</p></div>`;
        wealthEl.innerHTML = wealthCards.join("") || `<div class="mini-card"><p>暂无财富专题数据。</p></div>`;
        healthEl.innerHTML = healthCards.join("") || `<div class="mini-card"><p>暂无健康红绿灯数据。</p></div>`;
        warningEl.innerHTML = warningCards.join("") || `<div class="mini-card"><p>暂无特殊预警。</p></div>`;
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
        const keywordMatches = state.current
            ? KnowledgeBaseEngine.matchEntries(
                state.current.chart,
                state.current.currentYearEval,
                state.current.currentMonthEval,
                state.current.compatibility
            )
            : [];
        const caseMatches = state.current
            ? KnowledgeBaseEngine.matchCaseEntries(
                state.current.chart,
                state.current.currentYearEval,
                state.current.currentMonthEval,
                state.current.compatibility,
                null,
                5
            )
            : [];
        const ragMatches = state.current?.ragMatches || [];
        const merged = mergeKnowledgeMatches(keywordMatches, ragMatches);
        if (state.current) {
            state.current.kbMatches = keywordMatches;
            state.current.caseMatches = caseMatches;
            state.current.ragReferences = KnowledgeBaseEngine.buildCitedReferences(merged, 6);
        }
        renderKnowledgeBase(merged);
        renderCaseSimilarity(caseMatches);
    }

    function removeKnowledgeBaseEntry(id) {
        KnowledgeBaseEngine.removeEntry(id);
        refreshKnowledgeBaseMatches();
    }

    function mergeKnowledgeMatches(primary, secondary) {
        const bucket = new Map();
        const existingIds = new Set(KnowledgeBaseEngine.loadEntries().map((entry) => entry.id));
        [...(primary || []), ...(secondary || [])].forEach((entry) => {
            if (!existingIds.has(entry.id)) return;
            const previous = bucket.get(entry.id);
            if (!previous || (entry.score || 0) > (previous.score || 0)) {
                bucket.set(entry.id, entry);
            }
        });
        return Array.from(bucket.values())
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 8);
    }

    function renderKnowledgeBase(kbMatches) {
        const entries = KnowledgeBaseEngine.loadEntries();
        $("kb-matches").innerHTML = kbMatches && kbMatches.length
            ? kbMatches.map((entry) => `
                <div class="mini-card">
                    <p class="section-kicker">关联参考</p>
                    <h3>${escapeHtml(entry.title)}</h3>
                    <p>${escapeHtml(entry.content.slice(0, 180))}${entry.content.length > 180 ? "..." : ""}</p>
                    <p class="muted">标签：${escapeHtml(entry.tags.join("、") || "未标注")} · 来源：${escapeHtml(entry.source)}${entry.locator ? ` · 定位 ${escapeHtml(entry.locator)}` : ""}${entry.embeddingModel ? ` · 向量 ${escapeHtml(entry.embeddingModel)}` : ""}</p>
                </div>
            `).join("")
            : `<div class="mini-card"><h3>暂无高相关条目</h3><p>可以导入你整理过的命理笔记、书目摘要、断语索引或案例库，系统会按当前命盘自动匹配相关内容。</p></div>`;
        $("kb-list").innerHTML = entries.length
            ? entries.map((entry) => `
                <div class="mini-card">
                    <h3>${escapeHtml(entry.title)}</h3>
                    <p>${escapeHtml(entry.content.slice(0, 240))}${entry.content.length > 240 ? "..." : ""}</p>
                    <p class="muted">标签：${escapeHtml(entry.tags.join("、") || "未标注")} · 来源：${escapeHtml(entry.source)}${entry.locator ? ` · 定位 ${escapeHtml(entry.locator)}` : ""}</p>
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

    function renderCaseSimilarity(caseMatches) {
        const container = $("case-similarity");
        if (!container) return;
        container.innerHTML = caseMatches && caseMatches.length
            ? caseMatches.map((entry, index) => `
                <div class="mini-card">
                    <p class="section-kicker">相似案例 #${index + 1}</p>
                    <h3>${escapeHtml(entry.title)}</h3>
                    <p class="blunt">相似度 ${entry.similarity}%</p>
                    <p>${escapeHtml(entry.content.slice(0, 200))}${entry.content.length > 200 ? "..." : ""}</p>
                    <p class="muted">来源：${escapeHtml(entry.source)}${entry.locator ? ` · ${escapeHtml(entry.locator)}` : ""}</p>
                </div>
            `).join("")
            : `<div class="mini-card"><p>暂无可比对案例。可导入带“案例”标签的历史记录以启用相似度匹配。</p></div>`;
    }

    async function refreshLlmModels() {
        const config = saveAiConfig(getAiConfigFromForm());
        if (config.provider === "none") {
            renderLlmStatus("当前仍是“仅本地规则引擎”模式，不会请求远端模型。");
            return;
        }
        try {
            renderLlmStatus("正在获取模型列表...");
            const models = await LLMClient.listModels(config);
            $("llm-model").innerHTML = models.length
                ? models.map((model) => `<option value="${escapeHtml(model)}"${model === config.model ? " selected" : ""}>${escapeHtml(model)}</option>`).join("")
                : `<option value="">未获取到模型</option>`;
            if (!models.includes(config.model)) {
                $("llm-model").value = models[0] || "";
            }
            saveAiConfig(getAiConfigFromForm());
            renderLlmStatus(models.length ? `已获取 ${models.length} 个模型，请选择后再调用 LLM。` : "没有取到可用模型，请检查 Base URL、Key 或目标服务的 CORS 设置。");
        } catch (error) {
            renderLlmStatus(`获取模型失败：${error.message}`);
        }
    }

    async function rebuildKnowledgeVectors() {
        const config = saveAiConfig(getAiConfigFromForm());
        if (config.provider === "none") {
            renderLlmStatus("未启用远端模型接口，无法重建向量索引。");
            return;
        }
        if (!config.embeddingModel) {
            renderLlmStatus("请先填写向量模型，再重建知识库向量索引。");
            return;
        }
        const entries = KnowledgeBaseEngine.loadEntries();
        renderLlmStatus(`开始重建向量索引，共 ${entries.length} 条。`);
        try {
            for (let index = 0; index < entries.length; index++) {
                const entry = entries[index];
                const text = `${entry.title}\n${entry.tags.join(" ")}\n${entry.content}`.slice(0, 6000);
                const embedding = await LLMClient.embed(config, config.embeddingModel, text);
                KnowledgeBaseEngine.setEntryEmbedding(entry.id, embedding, config.embeddingModel);
                renderLlmStatus(`正在重建向量索引：${index + 1}/${entries.length} · ${entry.title}`);
            }
            renderLlmStatus(`向量索引重建完成，共 ${entries.length} 条，使用模型 ${config.embeddingModel}。`);
            refreshKnowledgeBaseMatches();
        } catch (error) {
            renderLlmStatus(`向量索引重建失败：${error.message}`);
        }
    }

    async function getRagReferences(config) {
        if (!state.current) return [];
        const keywordMatches = KnowledgeBaseEngine.matchEntries(
            state.current.chart,
            state.current.currentYearEval,
            state.current.currentMonthEval,
            state.current.compatibility
        );
        let ragMatches = [];
        let queryEmbedding = null;
        if (config.embeddingModel && KnowledgeBaseEngine.loadEntries().some((entry) => Array.isArray(entry.embedding) && entry.embedding.length)) {
            const queryText = AIEngine.buildKnowledgeQueryText(state.current);
            queryEmbedding = await LLMClient.embed(config, config.embeddingModel, queryText);
            ragMatches = KnowledgeBaseEngine.semanticMatchEntries(queryEmbedding, 6);
        }
        const caseMatches = KnowledgeBaseEngine.matchCaseEntries(
            state.current.chart,
            state.current.currentYearEval,
            state.current.currentMonthEval,
            state.current.compatibility,
            queryEmbedding,
            5
        );
        state.current.ragMatches = ragMatches;
        state.current.caseMatches = caseMatches;
        const merged = mergeKnowledgeMatches(keywordMatches, ragMatches);
        state.current.kbMatches = keywordMatches;
        state.current.ragReferences = KnowledgeBaseEngine.buildCitedReferences(merged, 6);
        renderKnowledgeBase(merged);
        renderCaseSimilarity(caseMatches);
        return state.current.ragReferences;
    }

    function renderLlmReport(content, agentReports = {}) {
        $("llm-report").innerHTML = content
            ? `<div class="report-block"><h3>LLM 深度报告</h3><p>${escapeHtml(content).replace(/\n/g, "<br>")}</p></div>`
            : "";
        const labels = Object.fromEntries((AIEngine.MULTI_AGENT_SEQUENCE || []).map((item) => [item.key, item.title]));
        $("llm-agent-report").innerHTML = Object.keys(agentReports).length
            ? Object.entries(agentReports).map(([key, value]) => `
                <div class="report-block">
                    <h3>${escapeHtml(labels[key] || key)} 输出</h3>
                    <p>${escapeHtml(String(value || "")).replace(/\n/g, "<br>")}</p>
                </div>
            `).join("")
            : "";
    }

    async function generateLlmReport() {
        const current = ensureReportState();
        if (!current) return;
        const config = saveAiConfig(getAiConfigFromForm());
        if (config.provider === "none") {
            renderLlmStatus("当前未启用 LLM 接口，仍只使用本地规则引擎。");
            return;
        }
        if (!config.model) {
            renderLlmStatus("请先获取并选择分析模型。");
            return;
        }
        try {
            renderLlmStatus("正在准备 RAG 参考与 LLM 请求...");
            const references = await getRagReferences(config);
            if (config.workflowMode === "multi") {
                const outputs = {};
                for (const agent of AIEngine.MULTI_AGENT_SEQUENCE || []) {
                    renderLlmStatus(`正在调用 ${agent.title}...`);
                    const messages = AIEngine.buildAgentPromptMessages(current, config.promptTemplate, references, agent.key, outputs);
                    const content = await LLMClient.chat(config, config.model, messages, { temperature: agent.key === "master" ? 0.6 : 0.75 });
                    outputs[agent.key] = content;
                }
                current.agentReports = outputs;
                current.llmReport = outputs.master || outputs[AIEngine.MULTI_AGENT_SEQUENCE[AIEngine.MULTI_AGENT_SEQUENCE.length - 1].key] || "";
                renderLlmReport(current.llmReport, outputs);
                renderLlmStatus(`多 Agent 报告生成完成，使用模型 ${config.model}。`);
            } else {
                const messages = AIEngine.buildPromptMessages(current, config.promptTemplate, references);
                const content = await LLMClient.chat(config, config.model, messages, { temperature: 0.7 });
                current.llmReport = content;
                current.agentReports = {};
                renderLlmReport(content, {});
                renderLlmStatus(`LLM 报告生成完成，使用模型 ${config.model}。`);
            }
            showSection("ai-analysis");
        } catch (error) {
            renderLlmStatus(`LLM 调用失败：${error.message}`);
        }
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

    function renderAI(report, environment, lucky, modern, detailed, family, master, currentYearEval, currentMonthEval, compatibility, kbMatches, caseMatches) {
        const loading = $("ai-loading");
        loading.classList.remove("hidden");
        setTimeout(() => {
            loading.classList.add("hidden");
            renderLlmReport(state.current.llmReport || "", state.current.agentReports || {});
            $("ai-report").innerHTML = report.map((item) => `<div class="report-block"><h3>${item.title}</h3><p>${item.body}</p></div>`).join("");
            $("environment-analysis").innerHTML = `<div class="report-block"><h3>${environment.title}</h3><p>${environment.body}</p><p class="good-text">这一年可能发生：${currentYearEval.opportunities.join(" ")}</p><p class="bad-text">需要注意：${currentYearEval.risks.join(" ")}</p></div>`;
            $("lucky-suggestions").innerHTML = lucky.map((item) => `<div class="report-block"><p>${item}</p></div>`).join("");
            if (modern?.length) {
                $("lucky-suggestions").innerHTML += modern.map(renderSectionCard).join("");
            }
            if (kbMatches?.length) {
                const citations = KnowledgeBaseEngine.buildCitedReferences(mergeKnowledgeMatches(kbMatches, state.current.ragMatches || []), 3);
                $("lucky-suggestions").innerHTML += `<div class="report-block"><h3>知识库校注</h3><p>本地知识库匹配到：${citations.map((entry) => entry.citation).join("；")}。这些条目已在下方“本地知识库”中展开，可直接追溯出处。</p></div>`;
            }
            $("detailed-analysis-grid").innerHTML = [
                ...detailed.map(renderSectionCard),
                `<div class="mini-card"><p class="section-kicker">本月重点</p><h3>${currentMonthEval.meta}</h3><p class="blunt">${currentMonthEval.blunt}</p><p class="good-text">可能发生：${currentMonthEval.opportunities.join(" ")}</p><p class="bad-text">需要注意：${currentMonthEval.risks.join(" ")}</p></div>`
            ].join("");
            $("master-summary").innerHTML = master.map(renderSectionCard).join("");
            $("family-analysis-grid").innerHTML = family.map(renderSectionCard).join("");
            renderKeyYearsSummary(state.current.allYearEvaluations || state.current.yearEvaluations);
            renderKnowledgeBase(mergeKnowledgeMatches(kbMatches, state.current.ragMatches || []));
            renderCaseSimilarity(caseMatches || state.current.caseMatches || []);
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
        const allYears = current.allYearEvaluations || current.yearEvaluations;
        const lines = [
            `# 天命本地报告：${current.input.profileName}`,
            "",
            "## 排盘依据",
            `- 出生信息：${current.input.year}-${pad(current.input.month)}-${pad(current.input.day)} ${pad(current.input.hour)}:${pad(current.input.minute)} · ${current.input.regionName}`,
            `- 录入历法：${current.input.calendarType === "solar" ? "公历" : `农历${current.input.lunarLeap ? "（闰月）" : ""}`}`,
            `- 最终排盘：${current.chart.solarMeta.usedMode === "trueSolar" ? "真太阳时" : "标准时间"} · ${current.chart.solarMeta.effectiveText}`,
            `- 月令司令：${current.chart.structure.commanderInfo.weights.map((item) => `${item.stem}${item.element} ${Math.round(item.weight * 100)}%`).join("、")}`,
            `- 格局：${current.chart.structure.pattern.finalPattern} · 用神 ${current.chart.structure.usefulElement} · 辅助 ${current.chart.structure.supportiveElement}`,
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
            "## 现代生活应用",
            ...(current.modern || []).map(buildSectionMarkdown),
            "",
            "## 六亲与子嗣",
            ...current.family.map(buildSectionMarkdown),
            "",
            "## 道长总断",
            ...current.master.map(buildSectionMarkdown),
            "",
            "## 关键年份",
            ...allYears
                .slice()
                .sort((a, b) => b.evaluation.scores.overall - a.evaluation.scores.overall)
                .slice(0, 5)
                .map((item) => `- ${item.year}年 ${item.pillar}：综合 ${item.evaluation.scores.overall}；机会 ${joinItems(item.evaluation.opportunities)}；风险 ${joinItems(item.evaluation.risks)}`),
            ...allYears
                .slice()
                .sort((a, b) => a.evaluation.scores.overall - b.evaluation.scores.overall)
                .slice(0, 3)
                .map((item) => `- 高压提醒 ${item.year}年 ${item.pillar}：综合 ${item.evaluation.scores.overall}；先防 ${joinItems(item.evaluation.risks)}`),
            ...(current.criticalYears?.risky?.length
                ? ["", "## 应期触发（重点预警）", ...current.criticalYears.risky.slice(0, 6).map((item) => `- ${item.year}年 ${item.pillar}：${item.reason}（焦点：${item.focus}）`)]
                : []),
            "",
            "## 健康重点",
            ...current.health.risks.length
                ? current.health.risks.map((item) => `- ${item.element}：${item.risk}；对应部位 ${item.organs.join("、")}；建议 ${item.advice}`)
                : ["- 健康结构相对均衡，但仍需管理作息和恢复。"]
        ];
        if (current.compatibility) {
            lines.push("", "## 合盘 / 合婚", ...current.compatibility.result.sections.map(buildSectionMarkdown));
        }
        if (current.kbMatches?.length || current.ragMatches?.length) {
            const refs = KnowledgeBaseEngine.buildCitedReferences(mergeKnowledgeMatches(current.kbMatches || [], current.ragMatches || []), 8);
            lines.push("", "## 本地知识库关联参考", ...refs.map((entry) => `- ${entry.citation}：${entry.excerpt}`));
        }
        if (current.caseMatches?.length) {
            lines.push("", "## 相似案例", ...current.caseMatches.map((entry) => `- ${entry.title}（相似度 ${entry.similarity}%）：${entry.content.slice(0, 140)}`));
        }
        if (current.llmReport) {
            lines.push("", "## LLM 深度报告", current.llmReport);
        }
        if (current.agentReports && Object.keys(current.agentReports).length) {
            lines.push("", "## 多 Agent 输出");
            Object.entries(current.agentReports).forEach(([key, value]) => {
                lines.push(`### ${key}`, String(value || ""));
            });
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
        $(config.calendarType).dataset.prevType = "solar";
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
        $(config.calendarType).dataset.prevType = "solar";
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
        $(config.calendarType).dataset.prevType = $(config.calendarType).value;
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
        $(config.longitude).value = Number(input.longitude).toFixed(4);
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
    renderCaseSimilarity([]);
    updatePreview(PROFILE_CONFIGS.primary);
    updatePreview(PROFILE_CONFIGS.compat);
})();
