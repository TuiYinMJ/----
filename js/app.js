(function () {
    const STORAGE_KEY = "tming-bazi-profiles-v4";
    const COMPAT_STORAGE_KEY = "tming-compat-profiles-v1";
    const AI_CONFIG_KEY = "tming-ai-config-v1";
    const GEO_CONFIG_KEY = "tming-geo-config-v1";
    const LIFE_EVENT_KEY = "tming-life-events-v1";
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

    const state = {
        current: null,
        ai: null,
        calendarSelection: { year: null, month: null, selectedDate: null },
        storage: {
            aiConfig: null,
            geoConfig: null,
            profilesCache: [],
            lifeEventsCache: [],
            compatProfilesCache: []
        },
        paging: {
            profiles: { page: 1, pageSize: 12, total: 0 },
            lifeEvents: { page: 1, pageSize: 8, total: 0 },
            compatProfiles: { page: 1, pageSize: 10, total: 0 }
        }
    };
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
            streamMode: "stream",
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

    function safeParse(json, fallback) {
        try {
            const parsed = JSON.parse(json || "null");
            return parsed == null ? fallback : parsed;
        } catch {
            return fallback;
        }
    }

    function loadAiConfig() {
        if (state.storage.aiConfig) return { ...defaultAiConfig(), ...state.storage.aiConfig };
        const local = safeParse(localStorage.getItem(AI_CONFIG_KEY), {});
        return { ...defaultAiConfig(), ...(local || {}) };
    }

    function saveAiConfig(config) {
        state.ai = { ...defaultAiConfig(), ...config };
        state.storage.aiConfig = state.ai;
        localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(state.ai));
        if (window.LocalDB?.available) {
            window.LocalDB.setKv(AI_CONFIG_KEY, state.ai).catch(() => {});
        }
        return state.ai;
    }

    function loadGeoConfig() {
        if (state.storage.geoConfig) return { ...defaultGeoConfig(), ...state.storage.geoConfig };
        const local = safeParse(localStorage.getItem(GEO_CONFIG_KEY), {});
        return { ...defaultGeoConfig(), ...(local || {}) };
    }

    function saveGeoConfig(config) {
        const merged = { ...defaultGeoConfig(), ...config };
        state.storage.geoConfig = merged;
        localStorage.setItem(GEO_CONFIG_KEY, JSON.stringify(merged));
        if (window.LocalDB?.available) {
            window.LocalDB.setKv(GEO_CONFIG_KEY, merged).catch(() => {});
        }
        return merged;
    }

    function loadLifeEvents() {
        return Array.isArray(state.storage.lifeEventsCache)
            ? state.storage.lifeEventsCache
                .filter((item) => item && item.id && item.year && item.type && item.note)
                .map((item) => ({ ...item }))
            : [];
    }

    function saveLifeEvents(events) {
        state.storage.lifeEventsCache = (events || [])
            .filter((item) => item && item.id && item.year && item.type && item.note)
            .slice(0, 120)
            .map((item) => ({ ...item }));
    }

    function loadProfiles() {
        return Array.isArray(state.storage.profilesCache)
            ? state.storage.profilesCache.map((item) => ({ ...item }))
            : [];
    }

    function saveProfiles(profiles) {
        const safe = (profiles || []).slice(0, 200).map((item) => ({ ...item }));
        state.storage.profilesCache = safe;
        return safe;
    }

    function loadCompatProfiles() {
        return Array.isArray(state.storage.compatProfilesCache)
            ? state.storage.compatProfilesCache.map((item) => ({ ...item }))
            : [];
    }

    function saveCompatProfiles(profiles) {
        const safe = (profiles || []).slice(0, 240).map((item) => ({ ...item }));
        state.storage.compatProfilesCache = safe;
        return safe;
    }

    function clearLegacyBusinessStorage() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LIFE_EVENT_KEY);
        localStorage.removeItem(COMPAT_STORAGE_KEY);
    }

    async function bootstrapStorage() {
        const localProfiles = Array.isArray(safeParse(localStorage.getItem(STORAGE_KEY), []))
            ? safeParse(localStorage.getItem(STORAGE_KEY), [])
            : [];
        const localLifeEvents = Array.isArray(safeParse(localStorage.getItem(LIFE_EVENT_KEY), []))
            ? safeParse(localStorage.getItem(LIFE_EVENT_KEY), [])
            : [];
        const localCompatProfiles = Array.isArray(safeParse(localStorage.getItem(COMPAT_STORAGE_KEY), []))
            ? safeParse(localStorage.getItem(COMPAT_STORAGE_KEY), [])
            : [];
        state.storage.aiConfig = { ...defaultAiConfig(), ...(safeParse(localStorage.getItem(AI_CONFIG_KEY), {}) || {}) };
        state.storage.geoConfig = { ...defaultGeoConfig(), ...(safeParse(localStorage.getItem(GEO_CONFIG_KEY), {}) || {}) };
        saveProfiles(localProfiles);
        saveLifeEvents(localLifeEvents);
        saveCompatProfiles(localCompatProfiles);
        state.paging.profiles.total = localProfiles.length;
        state.paging.lifeEvents.total = localLifeEvents.length;
        state.paging.compatProfiles.total = localCompatProfiles.length;
        if (!window.LocalDB?.available) return;
        await window.LocalDB.ready;
        const [dbAi, dbGeo, profileCount, lifeEventCount, compatCount, dbLifeEvents] = await Promise.all([
            window.LocalDB.getKv(AI_CONFIG_KEY),
            window.LocalDB.getKv(GEO_CONFIG_KEY),
            window.LocalDB.countProfiles(),
            window.LocalDB.countLifeEvents(),
            window.LocalDB.countCompatProfiles(),
            window.LocalDB.listLifeEvents()
        ]);
        if (dbAi) state.storage.aiConfig = { ...defaultAiConfig(), ...(dbAi || {}) };
        else await window.LocalDB.setKv(AI_CONFIG_KEY, state.storage.aiConfig);
        if (dbGeo) state.storage.geoConfig = { ...defaultGeoConfig(), ...(dbGeo || {}) };
        else await window.LocalDB.setKv(GEO_CONFIG_KEY, state.storage.geoConfig);
        if (!profileCount && localProfiles.length) await window.LocalDB.replaceProfiles(localProfiles);
        if (!lifeEventCount && localLifeEvents.length) await window.LocalDB.replaceLifeEvents(localLifeEvents);
        if (!compatCount && localCompatProfiles.length) await window.LocalDB.replaceCompatProfiles(localCompatProfiles);
        saveLifeEvents(dbLifeEvents?.length ? dbLifeEvents : localLifeEvents);
        clearLegacyBusinessStorage();
        state.paging.profiles.total = profileCount || localProfiles.length;
        state.paging.lifeEvents.total = (dbLifeEvents?.length ?? lifeEventCount) || localLifeEvents.length;
        state.paging.compatProfiles.total = compatCount || localCompatProfiles.length;
    }

    function getLocalPagedRows(rows, page, pageSize) {
        const safeRows = Array.isArray(rows) ? rows : [];
        const safePageSize = Math.max(1, Number(pageSize || 10));
        const total = safeRows.length;
        const totalPages = Math.max(1, Math.ceil(total / safePageSize));
        const safePage = Math.min(totalPages, Math.max(1, Number(page || 1)));
        const offset = (safePage - 1) * safePageSize;
        return {
            rows: safeRows.slice(offset, offset + safePageSize),
            total,
            page: safePage,
            totalPages
        };
    }

    function updatePager(scope, infoId, prevId, nextId) {
        const pager = state.paging[scope];
        if (!pager) return;
        const totalPages = Math.max(1, Math.ceil((pager.total || 0) / pager.pageSize));
        pager.page = Math.min(totalPages, Math.max(1, Number(pager.page || 1)));
        const infoNode = $(infoId);
        if (infoNode) infoNode.textContent = `第 ${pager.page} / ${totalPages} 页 · 共 ${pager.total || 0} 条`;
        const prevBtn = $(prevId);
        const nextBtn = $(nextId);
        if (prevBtn) prevBtn.disabled = pager.page <= 1;
        if (nextBtn) nextBtn.disabled = pager.page >= totalPages;
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

    function setInputTip(id, message, level = "muted", options = {}) {
        const node = $(id);
        if (!node) return;
        node.className = "input-tip";
        if (level === "warn") node.classList.add("tip-warn");
        if (level === "error") node.classList.add("tip-error");
        if (level === "ok") node.classList.add("tip-ok");
        if (level === "muted") node.classList.add("muted");
        if (options.allowHtml) {
            node.innerHTML = message;
            if (options.withSettingsLink) {
                const trigger = node.querySelector("[data-open-settings]");
                if (trigger) trigger.addEventListener("click", openSettingsModal);
            }
            return;
        }
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
            profileGroup: config === PROFILE_CONFIGS.primary ? $("profile-group").value.trim() : "",
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
        fillSelect("life-event-year", 1900, 2099, new Date().getFullYear());
        fillSelect("daily-calendar-year", 1900, 2099, new Date().getFullYear());
        fillSelect("daily-calendar-month", 1, 12, new Date().getMonth() + 1);
        renderGeoSuggestions();
        renderAiConfig(loadAiConfig());
        renderGeoConfig(loadGeoConfig());
    }

    function renderAiConfig(config) {
        $("llm-provider").value = config.provider;
        $("llm-workflow-mode").value = config.workflowMode || "multi";
        $("llm-stream-mode").value = config.streamMode || "stream";
        $("llm-base-url").value = config.baseUrl;
        $("llm-api-key").value = config.apiKey;
        $("embedding-model").value = config.embeddingModel;
        $("llm-prompt-template").value = config.promptTemplate || AIEngine.DEFAULT_PROMPT_TEMPLATE;
        $("llm-model").innerHTML = config.model
            ? `<option value="${escapeHtml(config.model)}" selected>${escapeHtml(config.model)}</option>`
            : `<option value="">请先获取模型</option>`;
        state.ai = config;
        renderLlmStatus(`当前模式：${config.provider === "none" ? "仅本地规则引擎" : config.provider === "openai" ? "OpenAI 兼容接口" : "Ollama"}；工作流：${config.workflowMode === "multi" ? "多 Agent" : "单次直出"}；输出：${config.streamMode === "stream" ? "流式" : "整段"}。${config.model ? `已选择模型 ${config.model}。` : "尚未选择模型。"}${config.embeddingModel ? ` 向量模型 ${config.embeddingModel}。` : ""}`);
    }

    function getAiConfigFromForm() {
        return {
            provider: $("llm-provider").value,
            workflowMode: $("llm-workflow-mode").value || "multi",
            streamMode: $("llm-stream-mode").value || "stream",
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
        const safe = escapeHtml(String(message || "")).replace(/\n/g, "<br>");
        $("llm-status").innerHTML = `<p>${safe}</p>`;
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
        let resizeTimer = null;
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
        $("btn-save-compat-profile").addEventListener("click", saveCurrentCompatibilityProfile);
        $("btn-save").addEventListener("click", saveCurrentProfile);
        $("btn-clear-storage").addEventListener("click", clearProfiles);
        $("profile-group-filter").addEventListener("change", () => {
            state.paging.profiles.page = 1;
            renderSavedProfiles();
        });
        $("btn-profiles-prev").addEventListener("click", () => {
            state.paging.profiles.page = Math.max(1, state.paging.profiles.page - 1);
            renderSavedProfiles();
        });
        $("btn-profiles-next").addEventListener("click", () => {
            state.paging.profiles.page += 1;
            renderSavedProfiles();
        });
        $("btn-life-events-prev").addEventListener("click", () => {
            state.paging.lifeEvents.page = Math.max(1, state.paging.lifeEvents.page - 1);
            renderLifeEvents();
        });
        $("btn-life-events-next").addEventListener("click", () => {
            state.paging.lifeEvents.page += 1;
            renderLifeEvents();
        });
        $("btn-compat-profiles-prev").addEventListener("click", () => {
            state.paging.compatProfiles.page = Math.max(1, state.paging.compatProfiles.page - 1);
            renderCompatibilityProfiles();
        });
        $("btn-compat-profiles-next").addEventListener("click", () => {
            state.paging.compatProfiles.page += 1;
            renderCompatibilityProfiles();
        });
        $("btn-export-all-data").addEventListener("click", exportAllData);
        $("btn-import-all-data").addEventListener("click", () => $("all-data-file").click());
        $("all-data-file").addEventListener("change", importAllDataFile);
        $("btn-export-markdown").addEventListener("click", exportMarkdownReport);
        $("btn-export-html").addEventListener("click", exportHtmlReport);
        $("btn-print-report").addEventListener("click", printReport);
        $("btn-export-poster").addEventListener("click", exportPosterImage);
        $("btn-scroll-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        $("btn-float-export").addEventListener("click", exportMarkdownReport);
        $("btn-float-print").addEventListener("click", printReport);
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
        $("btn-life-event-add").addEventListener("click", addLifeEventFromForm);
        $("btn-reverse-search").addEventListener("click", runReverseLookup);
        $("daily-calendar-year").addEventListener("change", renderDailyCalendar);
        $("daily-calendar-month").addEventListener("change", renderDailyCalendar);
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
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (state.current) renderAll();
            }, 120);
        });
        ["llm-provider", "llm-workflow-mode", "llm-stream-mode", "llm-base-url", "llm-api-key", "llm-model", "embedding-model", "llm-prompt-template"].forEach((id) => {
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
        if (state.current) {
            window.requestAnimationFrame(() => {
                renderAll();
            });
        }
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
            "compat-mode",
            "btn-compat-example",
            "btn-save-compat-profile"
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
                setInputTip(
                    "geo-status",
                    "当前未启用地图接口，未能从关键词匹配城市。<button type=\"button\" class=\"tip-action\" data-open-settings=\"1\">前往配置 API Key</button>",
                    "warn",
                    { allowHtml: true, withSettingsLink: true }
                );
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
            setInputTip(
                "geo-status",
                "请先填写地图 API Key。<button type=\"button\" class=\"tip-action\" data-open-settings=\"1\">前往配置 API Key</button>",
                "error",
                { allowHtml: true, withSettingsLink: true }
            );
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
            setInputTip(
                "geo-status",
                `定位失败：${escapeHtml(error.message)}。若接口限制跨域，可手动微调经度，或 <button type="button" class="tip-action" data-open-settings="1">前往配置 API Key</button>。`,
                "error",
                { allowHtml: true, withSettingsLink: true }
            );
        }
    }

    function lifeEventTypeLabel(type) {
        return {
            career: "事业",
            wealth: "财务",
            relationship: "感情/婚姻",
            family: "家庭/子女",
            health: "健康",
            relocation: "迁移/搬家"
        }[type] || type;
    }

    async function queryLifeEventsPage() {
        const pager = state.paging.lifeEvents;
        const offset = (pager.page - 1) * pager.pageSize;
        if (window.LocalDB?.available) {
            const pageResult = await window.LocalDB.listLifeEventsPage({ offset, limit: pager.pageSize });
            pager.total = pageResult.total || 0;
            if (!pageResult.rows?.length && pager.total > 0 && pager.page > 1) {
                pager.page = Math.max(1, Math.ceil(pager.total / pager.pageSize));
                return queryLifeEventsPage();
            }
            const rows = (pageResult.rows || []).slice().sort((a, b) => Number(a.year || 0) - Number(b.year || 0));
            return rows;
        }
        const all = loadLifeEvents().slice().sort((a, b) => Number(a.year || 0) - Number(b.year || 0));
        const pageResult = getLocalPagedRows(all, pager.page, pager.pageSize);
        pager.total = pageResult.total;
        pager.page = pageResult.page;
        return pageResult.rows;
    }

    async function renderLifeEvents() {
        const events = await queryLifeEventsPage();
        const container = $("life-events-list");
        if (!container) return;
        container.innerHTML = events.length
            ? events.map((item) => `
                <div class="mini-card">
                    <p class="section-kicker">${item.year} · ${lifeEventTypeLabel(item.type)}</p>
                    <p>${escapeHtml(item.note)}</p>
                    <button type="button" class="btn-link" data-life-event-remove="${escapeHtml(item.id)}">删除</button>
                </div>
            `).join("")
            : `<div class="mini-card"><p>尚未添加校准事件。建议先录入 2-5 个关键事件，再生成 AI 报告。</p></div>`;
        container.querySelectorAll("[data-life-event-remove]").forEach((node) => {
            node.addEventListener("click", () => removeLifeEvent(node.dataset.lifeEventRemove));
        });
        updatePager("lifeEvents", "life-events-page-info", "btn-life-events-prev", "btn-life-events-next");
    }

    async function removeLifeEvent(id) {
        if (window.LocalDB?.available) {
            await window.LocalDB.removeLifeEvent(id);
            saveLifeEvents((await window.LocalDB.listLifeEvents()) || []);
            state.paging.lifeEvents.total = await window.LocalDB.countLifeEvents();
        } else {
            const next = loadLifeEvents().filter((item) => String(item.id) !== String(id));
            saveLifeEvents(next);
            state.paging.lifeEvents.total = next.length;
        }
        await renderLifeEvents();
        if (state.current) state.current.lifeEvents = loadLifeEvents();
    }

    async function addLifeEventFromForm() {
        const year = Number($("life-event-year").value);
        const type = $("life-event-type").value;
        const note = $("life-event-note").value.trim();
        if (!note) {
            alert("请先填写事件描述。");
            return;
        }
        const entry = {
            id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            year,
            type,
            note
        };
        if (window.LocalDB?.available) {
            await window.LocalDB.upsertLifeEvent(entry);
            const total = await window.LocalDB.countLifeEvents();
            saveLifeEvents((await window.LocalDB.listLifeEvents()) || []);
            state.paging.lifeEvents.total = total;
            state.paging.lifeEvents.page = Math.max(1, Math.ceil(total / state.paging.lifeEvents.pageSize));
        } else {
            const events = loadLifeEvents();
            events.push(entry);
            saveLifeEvents(events);
            state.paging.lifeEvents.total = events.length;
            state.paging.lifeEvents.page = Math.max(1, Math.ceil(events.length / state.paging.lifeEvents.pageSize));
        }
        $("life-event-note").value = "";
        await renderLifeEvents();
        if (state.current) state.current.lifeEvents = loadLifeEvents();
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

    function renderMiniBaziPreview(input) {
        const shell = $("mini-bazi-preview");
        if (!shell) return;
        try {
            const chart = BaziCore.computeBaZi(input);
            const pillars = chart.pillars.map((pillar) => `
                <div class="mini-pillar">
                    <div class="mini-pillar-label">${pillar.label.replace("柱", "")}</div>
                    <div class="mini-pillar-main">${pillar.stem}${pillar.branch}</div>
                    <div class="mini-pillar-meta">${pillar.tenGod}</div>
                </div>
            `).join("");
            shell.innerHTML = `
                <div class="mini-bazi-pillars">${pillars}</div>
                <div class="preview-line"><span>日主强弱</span><strong>${chart.structure.strength}</strong></div>
                <div class="preview-line"><span>格局</span><strong>${chart.structure.pattern.finalPattern}</strong></div>
                <div class="preview-line"><span>用神</span><strong>${chart.structure.usefulElement}（辅：${chart.structure.supportiveElement}）</strong></div>
            `;
        } catch (error) {
            shell.innerHTML = `<div class="mini-card"><p class="muted">迷你命盘暂不可展示：${escapeHtml(error.message)}</p></div>`;
        }
    }

    function getProfileInput(config) {
        if (config.enabled && !$(config.enabled).checked) return null;
        const { hour, minute } = getTimeParts(config);
        const region = REGIONS[Number($(config.region).value)] || REGIONS[0];
        const monthSelection = getMonthSelection(config);
        return {
            profileName: $(config.name).value.trim() || (config === PROFILE_CONFIGS.primary ? "未命名档案" : "合盘对象"),
            profileGroup: config === PROFILE_CONFIGS.primary ? $("profile-group").value.trim() : "",
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
            if (config === PROFILE_CONFIGS.primary) {
                renderMiniBaziPreview(input);
            }
            $(config.preview).innerHTML = `
                <div class="preview-line"><span>录入值</span><strong>${inputTypeText}</strong></div>
                <div class="preview-line"><span>公历 / 农历</span><strong>${preview.standardSolar.toYmdHms().slice(0, 16)} ↔ ${preview.standardLunar.toString()}</strong></div>
                <div class="preview-line"><span>真太阳时</span><strong>${preview.solarMeta.trueSolarText}</strong></div>
                <div class="preview-line"><span>最终排盘依据</span><strong>${preview.solarMeta.usedMode === "trueSolar" ? "真太阳时" : "标准时间"} · ${preview.solarMeta.effectiveText}</strong></div>
                <div class="preview-line"><span>重点提示</span><strong>${preview.solarMeta.autoUseTrueSolar ? solarExplain : recommendation}</strong></div>
                <div class="preview-line"><span>闰月识别</span><strong>${leapHint}</strong></div>
                <div class="preview-line"><span>地区分组</span><strong>${regionGroup}</strong></div>
                <div class="preview-line"><span>地区说明</span><strong>${getRegionGroupNote(region)}</strong></div>
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
            const compatDayun = DayunEngine.buildDaYun(compatChart, primaryInput.targetYear);
            const compatAllYearEvaluations = buildAllYearEvaluations(compatChart, compatDayun);
            const primaryYears = new Map(allYearEvaluations.map((item) => [item.year, item.evaluation.scores.overall]));
            const pairedTrend = compatAllYearEvaluations
                .filter((item) => primaryYears.has(item.year))
                .slice(0, 40)
                .map((item) => ({
                    year: item.year,
                    primary: primaryYears.get(item.year),
                    compat: item.evaluation.scores.overall
                }));
            compatibility = {
                input: compatInput,
                chart: compatChart,
                result: CompatibilityEngine.buildCompatibility(chart, compatChart),
                pairedTrend
            };
        }
        const modern = BaziAnalysis.buildModernLifeAdvice(chart, compatibility?.result || null, primaryInput.targetYear);
        const kbMatches = KnowledgeBaseEngine.matchEntries(chart, currentYearEval, currentMonthEval, compatibility);
        const caseMatches = KnowledgeBaseEngine.matchCaseEntries(chart, currentYearEval, currentMonthEval, compatibility, null, 5);
        const lifeEvents = loadLifeEvents();
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
            lifeEvents,
            kbMatches,
            caseMatches,
            ragMatches: [],
            ragReferences: [],
            llmReport: "",
            agentReports: {},
            report,
            lucky
        };
        showSection("bazi");
    }

    function renderAll() {
        const { input, chart, dayun, yearEvaluations, monthEvaluations, allYearEvaluations, eventDashboard, criticalYears, dailyGuide, currentYearEval, currentMonthEval, health, environment, detailed, family, master, modern, compatibility, kbMatches, caseMatches, report, lucky } = state.current;
        $(PROFILE_CONFIGS.primary.targetYear).value = String(input.targetYear);
        $("daily-calendar-year").value = String(input.targetYear);
        $("daily-calendar-month").value = String(new Date().getMonth() + 1);
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
        renderDailyCalendar();
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
        const nayinTop = (chart.nayinMatrix?.pairs || [])
            .slice()
            .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
            .slice(0, 2)
            .map((item) => `${item.pair}${item.relation}`)
            .join("、") || "纳音关系中性";
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
            { title: "纳音隐层", body: `${nayinTop} · 纳音总分 ${chart.nayinMatrix?.score ?? 0}` },
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
                ${(item.evaluation.palaceTriggers || []).length ? `<p class="bad-text">宫位引动：${item.evaluation.palaceTriggers[0].palace} · ${item.evaluation.palaceTriggers[0].relationType}</p>` : ""}
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
                ${(item.evaluation.palaceTriggers || []).length ? `<p class="bad-text">宫位引动：${item.evaluation.palaceTriggers[0].palace} · ${item.evaluation.palaceTriggers[0].relationType}</p>` : ""}
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

    const HOUR_WINDOWS = [
        { label: "子时", hour: 23, range: "23:00-00:59" },
        { label: "丑时", hour: 1, range: "01:00-02:59" },
        { label: "寅时", hour: 3, range: "03:00-04:59" },
        { label: "卯时", hour: 5, range: "05:00-06:59" },
        { label: "辰时", hour: 7, range: "07:00-08:59" },
        { label: "巳时", hour: 9, range: "09:00-10:59" },
        { label: "午时", hour: 11, range: "11:00-12:59" },
        { label: "未时", hour: 13, range: "13:00-14:59" },
        { label: "申时", hour: 15, range: "15:00-16:59" },
        { label: "酉时", hour: 17, range: "17:00-18:59" },
        { label: "戌时", hour: 19, range: "19:00-20:59" },
        { label: "亥时", hour: 21, range: "21:00-22:59" }
    ];

    const HOUR_RELATION_SCORE = {
        六合: 6,
        同支: 3,
        相冲: -10,
        相穿: -11,
        相刑: -9,
        自刑: -9,
        相破: -8,
        相害: -7
    };

    function clampScore(score, min = 20, max = 98) {
        return Math.max(min, Math.min(max, Math.round(score)));
    }

    function buildHourRelationSignal(baseBranch, hourBranch, sourceLabel) {
        if (!baseBranch || !hourBranch || !BaziCore?.getBranchRelation) return null;
        const relation = BaziCore.getBranchRelation(baseBranch, hourBranch);
        if (!relation) return null;
        const delta = HOUR_RELATION_SCORE[relation.type] || 0;
        if (!delta) return null;
        return {
            delta,
            relationType: relation.type,
            text: `${sourceLabel}${baseBranch}与${hourBranch}${relation.type}`
        };
    }

    function buildHourlyWindowGuide(dateText) {
        if (!state.current) return [];
        const [year, month, day] = String(dateText || "").split("-").map(Number);
        if (!year || !month || !day) return [];
        const dayPillar = Solar.fromYmdHms(year, month, day, 12, 0, 0).getLunar().getDayInGanZhiExact();
        const dayBranch = dayPillar?.[1];
        const natalDayBranch = state.current.chart?.pillars?.[2]?.branch;
        const usefulElements = [state.current.chart?.structure?.usefulElement, state.current.chart?.structure?.supportiveElement].filter(Boolean);
        const avoidElements = state.current.chart?.structure?.yongshen?.avoid || [];
        return HOUR_WINDOWS.map((windowItem) => {
            const solar = Solar.fromYmdHms(year, month, day, windowItem.hour, 0, 0);
            const lunar = solar.getLunar();
            const pillar = lunar.getTimeInGanZhi();
            const hourStem = pillar?.[0];
            const hourBranch = pillar?.[1];
            const evaluation = BaziAnalysis.evaluateCycle(
                state.current.chart,
                pillar,
                "流时",
                `${dateText} ${windowItem.label} · ${pillar}`,
                {
                    year,
                    month,
                    day,
                    currentDayunLabel: state.current.dayun.current.label
                }
            );
            const hourStemElement = BaziCore.STEM_WUXING[BaziCore.STEMS.indexOf(hourStem)];
            const hourBranchElement = BaziCore.BRANCH_WUXING[BaziCore.BRANCHES.indexOf(hourBranch)];
            let dynamicDelta = 0;
            const dynamicNotes = [];

            const daySignal = buildHourRelationSignal(dayBranch, hourBranch, "当日");
            if (daySignal) {
                dynamicDelta += daySignal.delta;
                dynamicNotes.push(daySignal.text);
            }
            const natalSignal = buildHourRelationSignal(natalDayBranch, hourBranch, "命盘");
            if (natalSignal) {
                dynamicDelta += natalSignal.delta;
                dynamicNotes.push(natalSignal.text);
            }

            if ([hourStemElement, hourBranchElement].some((element) => usefulElements.includes(element))) {
                dynamicDelta += 4;
                dynamicNotes.push(`时段五行命中用神（${usefulElements.join(" / ")}）`);
            }
            if ([hourStemElement, hourBranchElement].some((element) => avoidElements.includes(element))) {
                dynamicDelta -= 4;
                dynamicNotes.push(`时段五行触发忌神（${avoidElements.join(" / ")}）`);
            }

            const score = clampScore(evaluation.scores.overall + dynamicDelta);
            const alerts = evaluation.specialAlerts || [];
            const attack = alerts.find((entry) => entry.type === "伤官见官");
            const directRisk = alerts.find((entry) => entry.level !== "chance")?.text
                || evaluation.palaceTriggers?.find((entry) => entry.relationType !== "六合")?.note
                || evaluation.risks?.[0];
            const directChance = alerts.find((entry) => entry.level === "chance")?.text
                || evaluation.opportunities?.[0];
            const dynamicSignal = dynamicNotes.filter(Boolean).slice(0, 2).join("；");
            const note = attack
                ? `${windowItem.range} 容易出现“伤官见官”型冲突，和上级沟通要先讲事实再讲立场。`
                : score <= 56 || evaluation.scores.relation <= 58
                    ? `${windowItem.range} 人际摩擦偏高：${directRisk || "先降火再沟通，避免硬碰硬。"}${dynamicSignal ? `（${dynamicSignal}）` : ""}`
                    : score >= 74 || evaluation.scores.career >= 74
                        ? `${windowItem.range} 推进窗口：${directChance || "适合谈判、汇报、签署和对外推进。"}${dynamicSignal ? `（${dynamicSignal}）` : ""}`
                        : `${windowItem.range} 中性时段：${dynamicSignal || [evaluation.opportunities?.[0], evaluation.risks?.[0]].filter(Boolean).join("；") || "适合整理、复盘和补齐细节。"}。`;
            return {
                ...windowItem,
                score,
                rawScore: evaluation.scores.overall,
                delta: dynamicDelta,
                note,
                alerts,
                riskHint: directRisk || evaluation.risks?.[0] || "",
                chanceHint: directChance || evaluation.opportunities?.[0] || "",
                focusTag: attack ? "伤官见官" : alerts[0]?.type || dynamicNotes[0] || "",
                hourIndex: HOUR_WINDOWS.indexOf(windowItem)
            };
        });
    }

    function trimText(text, maxLen = 34) {
        const raw = String(text || "").replace(/\s+/g, " ").trim();
        if (raw.length <= maxLen) return raw;
        return `${raw.slice(0, maxLen - 1)}…`;
    }

    function rankHourlyGuide(hourlyGuide) {
        return (hourlyGuide || []).map((item) => {
            const chanceAlerts = (item.alerts || []).filter((entry) => entry.level === "chance").length;
            const riskAlerts = (item.alerts || []).filter((entry) => entry.level !== "chance").length;
            const chanceWeight = item.score * 1.2 + Math.max(0, item.delta) * 3 + chanceAlerts * 9;
            const riskWeight = (100 - item.score) * 1.15 + Math.max(0, -item.delta) * 3 + riskAlerts * 9;
            return { ...item, chanceWeight, riskWeight };
        });
    }

    function pickDistinctSlots(sortedRows, limit = 2, blockedLabels = new Set()) {
        const used = new Set(blockedLabels || []);
        const rows = [];
        for (const item of sortedRows || []) {
            if (used.has(item.label)) continue;
            rows.push(item);
            used.add(item.label);
            if (rows.length >= limit) break;
        }
        return rows;
    }

    function renderDailyCalendar() {
        const grid = $("daily-calendar-grid");
        const detail = $("daily-calendar-detail");
        if (!grid || !detail || !state.current) return;
        const year = Number($("daily-calendar-year").value || state.current.input.targetYear);
        const month = Number($("daily-calendar-month").value || (new Date().getMonth() + 1));
        const dayCount = new Date(year, month, 0).getDate();
        const rows = BaziAnalysis.buildDailyGuide(state.current.chart, state.current.dayun.current.label, new Date(year, month - 1, 1), dayCount);
        if (!rows.length) {
            grid.innerHTML = `<div class="mini-card"><p>当前月份暂无日历数据。</p></div>`;
            detail.innerHTML = `<p class="muted">请选择其他月份。</p>`;
            return;
        }
        const selectedDate = state.calendarSelection.selectedDate && rows.some((item) => item.date === state.calendarSelection.selectedDate)
            ? state.calendarSelection.selectedDate
            : rows[0].date;
        state.calendarSelection = { year, month, selectedDate };
        grid.innerHTML = rows.map((item) => `
            <button type="button" class="calendar-day ${item.level === "宜" ? "lv-good" : item.level === "慎" ? "lv-bad" : "lv-mid"} ${item.date === selectedDate ? "active" : ""}" data-calendar-date="${item.date}">
                <span class="date">${Number(item.date.split("-")[2])}</span>
                <span class="lvl">${item.level} · ${item.score}</span>
            </button>
        `).join("");
        const selected = rows.find((item) => item.date === selectedDate) || rows[0];
        const hourlyGuide = rankHourlyGuide(buildHourlyWindowGuide(selected.date));
        const bestCandidates = [...hourlyGuide]
            .sort((a, b) => b.chanceWeight - a.chanceWeight || b.score - a.score || b.delta - a.delta || a.hourIndex - b.hourIndex);
        const riskCandidates = [...hourlyGuide]
            .sort((a, b) => b.riskWeight - a.riskWeight || a.score - b.score || a.delta - b.delta || a.hourIndex - b.hourIndex);
        const best = pickDistinctSlots(bestCandidates, 2);
        const risky = pickDistinctSlots(riskCandidates, 2, new Set(best.map((item) => item.label)));
        const topRisk = risky[0] || null;
        const topChance = best[0] || null;
        const daySignal = [
            topRisk ? `高风险窗口：${topRisk.label}（${trimText(topRisk.riskHint || topRisk.note, 28)}）` : "",
            topChance ? `推进窗口：${topChance.label}（${trimText(topChance.chanceHint || topChance.note, 28)}）` : "",
            selected.note ? `流日提示：${trimText(selected.note, 36)}` : ""
        ].filter(Boolean).join("；");
        detail.innerHTML = [
            `<p><strong>${selected.date}</strong>（${selected.pillar}） · ${selected.level} · 评分 ${selected.score}</p>`,
            `<p class="good-text">日内顺时段：${best.map((item) => `${item.label}(${item.range}) · ${trimText(item.chanceHint || item.focusTag || item.note, 22)}`).join("；") || "暂无明显顺时段"}</p>`,
            `<p class="bad-text">日内谨慎时段：${risky.map((item) => `${item.label}(${item.range}) · ${trimText(item.riskHint || item.focusTag || item.note, 22)}`).join("；") || "暂无明显谨慎时段"}</p>`,
            `<p>重点提醒：${daySignal || "今日整体中性，按计划推进，避免临时起意。"}。</p>`
        ].join("");
        grid.querySelectorAll("[data-calendar-date]").forEach((button) => {
            button.addEventListener("click", () => {
                state.calendarSelection.selectedDate = button.dataset.calendarDate;
                renderDailyCalendar();
            });
        });
    }

    function renderLifeRoadmap(allYearEvaluations, criticalYears) {
        const canvas = $("life-roadmap-chart");
        const summary = $("life-roadmap-summary");
        const overlay = $("life-roadmap-overlay");
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
        const wealthTop = [...(allYearEvaluations || [])]
            .sort((a, b) => b.evaluation.scores.wealth - a.evaluation.scores.wealth)
            .slice(0, 3);
        const relationTop = [...(allYearEvaluations || [])]
            .sort((a, b) => b.evaluation.scores.relation - a.evaluation.scores.relation)
            .slice(0, 3);
        const healthRisk = [...(allYearEvaluations || [])]
            .sort((a, b) => a.evaluation.scores.health - b.evaluation.scores.health)
            .slice(0, 3);
        const warningTop = [...(allYearEvaluations || [])]
            .filter((item) => (item.evaluation.specialAlerts || []).some((entry) => entry.level !== "chance"))
            .sort((a, b) => (b.evaluation.specialAlerts || []).length - (a.evaluation.specialAlerts || []).length)
            .slice(0, 5);
        const markerCandidates = [
            ...wealthTop.map((item) => ({
                year: item.year,
                pillar: item.pillar,
                index: item.year - birthYear,
                type: "wealth",
                symbol: "财",
                kind: "财富高点",
                bad: false,
                reason: `财运分 ${item.evaluation.scores.wealth}，${item.evaluation.opportunities?.[0] || item.evaluation.blunt}`
            })),
            ...relationTop.map((item) => ({
                year: item.year,
                pillar: item.pillar,
                index: item.year - birthYear,
                type: "relation",
                symbol: "缘",
                kind: "关系节点",
                bad: false,
                reason: `关系分 ${item.evaluation.scores.relation}，${item.evaluation.opportunities?.[0] || item.evaluation.blunt}`
            })),
            ...healthRisk.map((item) => ({
                year: item.year,
                pillar: item.pillar,
                index: item.year - birthYear,
                type: "health",
                symbol: "警",
                kind: "健康预警",
                bad: true,
                reason: `健康分 ${item.evaluation.scores.health}，${item.evaluation.risks?.[0] || item.evaluation.blunt}`
            })),
            ...warningTop.map((item) => ({
                year: item.year,
                pillar: item.pillar,
                index: item.year - birthYear,
                type: "warning",
                symbol: "危",
                kind: "雷达预警",
                bad: true,
                reason: `${(item.evaluation.specialAlerts || []).map((entry) => entry.type).join("、") || "重点预警"}：${item.evaluation.risks?.[0] || item.evaluation.blunt}`
            }))
        ];
        const markerBuckets = new Map();
        const markers = markerCandidates.map((marker) => {
            const key = String(marker.index);
            const rank = markerBuckets.get(key) || 0;
            markerBuckets.set(key, rank + 1);
            const angle = (Math.PI / 3) * (rank % 6);
            const radius = rank === 0 ? 0 : 9 + Math.floor((rank - 1) / 6) * 4;
            return {
                ...marker,
                offsetX: Math.cos(angle) * radius,
                offsetY: Math.sin(angle) * radius
            };
        });
        const chartLayout = ChartRenderer.drawRoadmapChart(canvas, points, markers);
        if (overlay && chartLayout?.markerPositions) {
            overlay.style.width = `${chartLayout.width}px`;
            overlay.style.height = `${chartLayout.height}px`;
            overlay.innerHTML = chartLayout.markerPositions.map((marker) => `
                <div
                    class="roadmap-marker roadmap-marker-${marker.type}"
                    role="button"
                    tabindex="0"
                    data-roadmap-year="${marker.year}"
                    style="left:${(marker.x / chartLayout.width) * 100}%; top:${(marker.y / chartLayout.height) * 100}%"
                    title="${marker.year}年 · ${marker.symbol} · 分数${marker.score} · 点击跳转卡片">
                    ${marker.symbol}
                </div>
            `).join("");
        }
        const lifeStage = (age) => {
            if (age <= 24) return "少年期";
            if (age <= 35) return "青年期";
            if (age <= 50) return "中年前段";
            if (age <= 65) return "中年后段";
            return "成熟期";
        };
        const grouped = {};
        const mergedCardsByYear = new Map();
        const mergeRoadmapCard = (item) => {
            if (!item || !Number.isFinite(item.year)) return;
            const existing = mergedCardsByYear.get(item.year) || {
                year: item.year,
                pillar: item.pillar || "",
                kinds: new Set(),
                reasons: [],
                bad: false
            };
            if (item.pillar && !existing.pillar) existing.pillar = item.pillar;
            if (item.kind) existing.kinds.add(item.kind);
            if (item.reason && !existing.reasons.includes(item.reason)) existing.reasons.push(item.reason);
            existing.bad = existing.bad || !!item.bad;
            mergedCardsByYear.set(item.year, existing);
        };
        (criticalYears?.favorable || []).forEach((item) => mergeRoadmapCard({ ...item, kind: "顺势窗口", bad: false }));
        (criticalYears?.risky || []).forEach((item) => mergeRoadmapCard({ ...item, kind: "预警窗口", bad: true }));
        markerCandidates.forEach((item) => mergeRoadmapCard(item));
        const allCards = Array.from(mergedCardsByYear.values())
            .sort((a, b) => a.year - b.year)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar || byYear.get(item.year)?.pillar || "-",
                kind: Array.from(item.kinds).join(" / ") || "关键节点",
                bad: item.bad,
                reason: item.reasons.slice(0, 2).join("；") || "该年结构有明显引动，建议切换到该年查看详细推演。"
            }));
        allCards.forEach((item) => {
            const stage = lifeStage(item.year - birthYear);
            if (!grouped[stage]) grouped[stage] = [];
            grouped[stage].push(item);
        });
        const cards = [
            ...Object.entries(grouped).map(([stage, rows]) => `
                <div class="mini-card">
                    <h3>${stage}</h3>
                    <p class="muted">${rows.map((item) => `${item.year}年`).join("、")}</p>
                </div>
                ${rows.map((item) => `
                    <div class="mini-card ${item.bad ? "warning-card" : ""}" data-roadmap-card-year="${item.year}">
                        <p class="section-kicker">${item.kind}</p>
                        <h3>${item.year}年 · ${item.pillar}</h3>
                        <p class="${item.bad ? "bad-text" : ""}">${item.reason}</p>
                        <button type="button" class="btn-link" data-target-year="${item.year}">切换分析年</button>
                    </div>
                `).join("")}
            `)
        ];
        summary.innerHTML = cards.join("") || `<div class="mini-card"><p>当前没有可展示的全生命周期数据。</p></div>`;
        const focusRoadmapCard = (year) => {
            const card = summary.querySelector(`[data-roadmap-card-year="${year}"]`);
            if (!card) {
                if (Number.isFinite(year)) setTargetYearFromSummary(year);
                return;
            }
            summary.querySelectorAll(".mini-card.is-focused").forEach((node) => node.classList.remove("is-focused"));
            card.classList.add("is-focused");
            card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            window.setTimeout(() => card.classList.remove("is-focused"), 1800);
        };
        if (overlay) {
            overlay.querySelectorAll("[data-roadmap-year]").forEach((marker) => {
                const triggerFocus = () => {
                    const year = Number(marker.dataset.roadmapYear);
                    if (!Number.isFinite(year)) return;
                    focusRoadmapCard(year);
                };
                marker.addEventListener("click", triggerFocus);
                marker.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        triggerFocus();
                    }
                });
            });
        }
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
        const progressWrap = $("kb-reindex-progress");
        const progressBar = $("kb-reindex-progress-bar");
        const progressText = $("kb-reindex-progress-text");
        const updateProgress = (done, total) => {
            if (!progressWrap || !progressBar || !progressText) return;
            const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
            progressWrap.classList.remove("hidden");
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${percent}% (${done}/${total})`;
        };
        if (config.provider === "none") {
            renderLlmStatus("未启用远端模型接口，无法重建向量索引。");
            if (progressWrap) progressWrap.classList.add("hidden");
            return;
        }
        if (!config.embeddingModel) {
            renderLlmStatus("请先填写向量模型，再重建知识库向量索引。");
            if (progressWrap) progressWrap.classList.add("hidden");
            return;
        }
        const entries = KnowledgeBaseEngine.loadEntries();
        renderLlmStatus(`开始重建向量索引，共 ${entries.length} 条。`);
        updateProgress(0, entries.length);
        try {
            for (let index = 0; index < entries.length; index++) {
                const entry = entries[index];
                const text = `${entry.title}\n${entry.tags.join(" ")}\n${entry.content}`.slice(0, 6000);
                const embedding = await LLMClient.embed(config, config.embeddingModel, text);
                KnowledgeBaseEngine.setEntryEmbedding(entry.id, embedding, config.embeddingModel);
                renderLlmStatus(`正在重建向量索引：${index + 1}/${entries.length} · ${entry.title}`);
                updateProgress(index + 1, entries.length);
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
            renderLlmStatus(`向量索引重建完成，共 ${entries.length} 条，使用模型 ${config.embeddingModel}。`);
            updateProgress(entries.length, entries.length);
            refreshKnowledgeBaseMatches();
        } catch (error) {
            renderLlmStatus(`向量索引重建失败：${error.message}`);
        } finally {
            if (progressWrap) {
                setTimeout(() => progressWrap.classList.add("hidden"), 1400);
            }
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

    async function requestLlmContent(config, model, messages, options = {}, onUpdate = null) {
        if (config.streamMode === "stream") {
            return LLMClient.chatStream(config, model, messages, {
                ...options,
                onToken: (_, fullText) => {
                    if (onUpdate) onUpdate(fullText);
                }
            });
        }
        const content = await LLMClient.chat(config, model, messages, options);
        if (onUpdate) onUpdate(content);
        return content;
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
                    const content = await requestLlmContent(
                        config,
                        config.model,
                        messages,
                        { temperature: agent.key === "master" ? 0.6 : 0.75 },
                        (partial) => {
                            outputs[agent.key] = partial;
                            const currentMaster = outputs.master || outputs[AIEngine.MULTI_AGENT_SEQUENCE[AIEngine.MULTI_AGENT_SEQUENCE.length - 1].key] || "";
                            renderLlmReport(currentMaster, outputs);
                        }
                    );
                    outputs[agent.key] = content;
                }
                current.agentReports = outputs;
                current.llmReport = outputs.master || outputs[AIEngine.MULTI_AGENT_SEQUENCE[AIEngine.MULTI_AGENT_SEQUENCE.length - 1].key] || "";
                renderLlmReport(current.llmReport, outputs);
                renderLlmStatus(`多 Agent 报告生成完成，使用模型 ${config.model}。`);
            } else {
                const messages = AIEngine.buildPromptMessages(current, config.promptTemplate, references);
                const content = await requestLlmContent(
                    config,
                    config.model,
                    messages,
                    { temperature: 0.7 },
                    (partial) => renderLlmReport(partial, {})
                );
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
        const trendCanvas = $("compatibility-trend-chart");
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
            if (trendCanvas) {
                ChartRenderer.drawMultiLineChart(
                    trendCanvas,
                    [
                        { name: "主盘", color: "#9a3412", values: [0] },
                        { name: "客盘", color: "#0f766e", values: [0] }
                    ],
                    ["-"]
                );
            }
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
        if (trendCanvas) {
            const trend = compatibility.pairedTrend || [];
            ChartRenderer.drawMultiLineChart(
                trendCanvas,
                [
                    { name: "主盘", color: "#9a3412", values: trend.map((item) => item.primary) },
                    { name: "客盘", color: "#0f766e", values: trend.map((item) => item.compat) }
                ],
                trend.map((item) => String(item.year).slice(2))
            );
        }
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
            if ((state.current.lifeEvents || []).length) {
                $("lucky-suggestions").innerHTML += `<div class="report-block"><h3>事件校准上下文</h3><p>已加载 ${(state.current.lifeEvents || []).length} 条历史事件作为推演校准：${state.current.lifeEvents.map((item) => `${item.year}年${lifeEventTypeLabel(item.type)}（${escapeHtml(item.note)}）`).join("；")}。</p></div>`;
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
            "## 事件校准",
            ...((current.lifeEvents || []).length
                ? current.lifeEvents.map((item) => `- ${item.year}年 ${lifeEventTypeLabel(item.type)}：${item.note}`)
                : ["- 未录入历史事件。"]),
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

    function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const content = String(text || "");
        let line = "";
        const rows = [];
        for (const char of content) {
            const candidate = line + char;
            if (ctx.measureText(candidate).width > maxWidth && line) {
                rows.push(line);
                line = char;
            } else {
                line = candidate;
            }
        }
        if (line) rows.push(line);
        rows.forEach((row, index) => {
            ctx.fillText(row, x, y + index * lineHeight);
        });
        return rows.length * lineHeight;
    }

    function exportPosterImage() {
        const current = ensureReportState();
        if (!current) return;
        const canvas = document.createElement("canvas");
        canvas.width = 1240;
        canvas.height = 1820;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const drawRoundCard = (x, y, w, h, r) => {
            if (typeof ctx.roundRect === "function") {
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, r);
                return;
            }
            const radius = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + w, y, x + w, y + h, radius);
            ctx.arcTo(x + w, y + h, x, y + h, radius);
            ctx.arcTo(x, y + h, x, y, radius);
            ctx.arcTo(x, y, x + w, y, radius);
            ctx.closePath();
        };
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#fff7ec");
        gradient.addColorStop(1, "#f3e7d2");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#9a3412";
        ctx.font = "bold 56px 'Noto Serif SC', 'Songti SC', serif";
        ctx.fillText("天命 · 八字命盘海报", 72, 96);
        ctx.fillStyle = "#4a3320";
        ctx.font = "30px 'Noto Serif SC', 'Songti SC', serif";
        ctx.fillText(`档案：${current.input.profileName}`, 72, 152);
        ctx.font = "24px 'Noto Serif SC', 'Songti SC', serif";
        ctx.fillText(`排盘时间：${current.chart.solarMeta.effectiveText}（${current.chart.solarMeta.usedMode === "trueSolar" ? "真太阳时" : "标准时间"}）`, 72, 194);
        ctx.fillText(`出生地：${current.input.regionName}  经度 ${Number(current.input.longitude).toFixed(4)}`, 72, 228);

        const pillarX = 72;
        const pillarY = 282;
        const boxW = 258;
        const boxH = 218;
        const gap = 20;
        current.chart.pillars.forEach((pillar, index) => {
            const x = pillarX + (boxW + gap) * index;
            ctx.fillStyle = "rgba(255,255,255,0.88)";
            ctx.strokeStyle = "rgba(154,52,18,0.35)";
            ctx.lineWidth = 2;
            drawRoundCard(x, pillarY, boxW, boxH, 18);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#7a4a25";
            ctx.font = "24px 'Noto Serif SC', 'Songti SC', serif";
            ctx.fillText(pillar.label.replace("柱", ""), x + 18, pillarY + 38);
            ctx.fillStyle = "#1f2937";
            ctx.font = "bold 56px 'Noto Serif SC', 'Songti SC', serif";
            ctx.fillText(`${pillar.stem}${pillar.branch}`, x + 18, pillarY + 108);
            ctx.fillStyle = "#374151";
            ctx.font = "21px 'Noto Serif SC', 'Songti SC', serif";
            ctx.fillText(`十神：${pillar.tenGod}`, x + 18, pillarY + 146);
            ctx.fillStyle = "#6b7280";
            ctx.font = "18px 'Noto Serif SC', 'Songti SC', serif";
            ctx.fillText(`藏干：${pillar.hidden.join("、")}`, x + 18, pillarY + 180);
        });

        ctx.fillStyle = "#7a4a25";
        ctx.font = "bold 34px 'Noto Serif SC', 'Songti SC', serif";
        ctx.fillText("五行强弱", 72, 580);
        const wuxing = current.chart.wuxing;
        const max = Math.max(...Object.values(wuxing));
        let rowY = 622;
        Object.entries(wuxing).forEach(([element, value]) => {
            const barW = Math.round((value / Math.max(max, 0.01)) * 420);
            ctx.fillStyle = current.chart.colors[element] || "#9a3412";
            ctx.fillRect(160, rowY - 18, barW, 20);
            ctx.fillStyle = "#1f2937";
            ctx.font = "22px 'Noto Serif SC', 'Songti SC', serif";
            ctx.fillText(`${element}`, 82, rowY);
            ctx.fillText(String(value.toFixed(1)), 600, rowY);
            rowY += 40;
        });

        ctx.fillStyle = "#7a4a25";
        ctx.font = "bold 34px 'Noto Serif SC', 'Songti SC', serif";
        ctx.fillText("核心断语", 72, 830);
        ctx.fillStyle = "#2f2418";
        ctx.font = "24px 'Noto Serif SC', 'Songti SC', serif";
        let nextY = 872;
        nextY += drawWrappedText(ctx, `总评：${current.currentYearEval.blunt}`, 72, nextY, 1090, 34) + 8;
        nextY += drawWrappedText(ctx, `有利：${joinItems(current.currentYearEval.opportunities)}`, 72, nextY, 1090, 34) + 8;
        nextY += drawWrappedText(ctx, `风险：${joinItems(current.currentYearEval.risks)}`, 72, nextY, 1090, 34) + 8;
        if ((current.lifeEvents || []).length) {
            const calibrationText = current.lifeEvents.slice(0, 3).map((item) => `${item.year}${lifeEventTypeLabel(item.type)}:${item.note}`).join("；");
            nextY += drawWrappedText(ctx, `校准事件：${calibrationText}`, 72, nextY, 1090, 34) + 8;
        }

        ctx.fillStyle = "#7a4a25";
        ctx.font = "bold 34px 'Noto Serif SC', 'Songti SC', serif";
        ctx.fillText("关键年份", 72, nextY + 36);
        ctx.fillStyle = "#2f2418";
        ctx.font = "22px 'Noto Serif SC', 'Songti SC', serif";
        const favorable = (current.criticalYears?.favorable || []).slice(0, 3);
        const risky = (current.criticalYears?.risky || []).slice(0, 3);
        let finalY = nextY + 78;
        favorable.forEach((item) => {
            finalY += drawWrappedText(ctx, `↑ ${item.year}年 ${item.pillar}：${item.reason}`, 72, finalY, 1090, 32) + 6;
        });
        risky.forEach((item) => {
            finalY += drawWrappedText(ctx, `! ${item.year}年 ${item.pillar}：${item.reason}`, 72, finalY, 1090, 32) + 6;
        });

        ctx.fillStyle = "#6b7280";
        ctx.font = "18px 'Noto Serif SC', 'Songti SC', serif";
        ctx.fillText("命理分析仅作参考，请结合现实选择与专业意见。", 72, canvas.height - 48);

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${(current.input.profileName || "bazi-poster").replace(/\s+/g, "-")}-poster.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
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
        $("compat-mode").value = "couple";
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
        $("profile-group").value = "示例";
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

    async function saveCurrentProfile() {
        if (!state.current) {
            alert("请先完成一次测算。");
            return;
        }
        const row = {
            id: `profile-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: state.current.input.profileName,
            group: state.current.input.profileGroup || "",
            savedAt: Date.now(),
            input: state.current.input
        };
        if (window.LocalDB?.available) {
            await window.LocalDB.upsertProfile(row);
            state.paging.profiles.total = await window.LocalDB.countProfiles();
        } else {
            const profiles = loadProfiles();
            profiles.unshift(row);
            saveProfiles(profiles);
            state.paging.profiles.total = profiles.length;
        }
        state.paging.profiles.page = 1;
        await renderSavedProfiles();
    }

    async function renderProfileGroupFilter() {
        const filter = $("profile-group-filter");
        if (!filter) return;
        const groups = window.LocalDB?.available
            ? await window.LocalDB.listProfileGroups()
            : Array.from(new Set(loadProfiles().map((item) => item.group || item.input?.profileGroup || "未分组"))).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
        const current = filter.value || "all";
        filter.innerHTML = [
            `<option value="all">全部分组</option>`,
            ...groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`)
        ].join("");
        filter.value = groups.includes(current) ? current : "all";
    }

    async function queryProfilesPage() {
        const filter = $("profile-group-filter")?.value || "all";
        const pager = state.paging.profiles;
        const offset = (pager.page - 1) * pager.pageSize;
        if (window.LocalDB?.available) {
            const pageResult = await window.LocalDB.listProfilesPage({
                offset,
                limit: pager.pageSize,
                group: filter === "all" ? "" : filter
            });
            pager.total = pageResult.total || 0;
            if (!pageResult.rows?.length && pager.total > 0 && pager.page > 1) {
                pager.page = Math.max(1, Math.ceil(pager.total / pager.pageSize));
                return queryProfilesPage();
            }
            return pageResult.rows || [];
        }
        const localRows = loadProfiles()
            .slice()
            .sort((a, b) => Number(b.savedAt || b.id || 0) - Number(a.savedAt || a.id || 0))
            .filter((item) => {
                const group = item.group || item.input?.profileGroup || "未分组";
                return filter === "all" || group === filter;
            });
        const pageResult = getLocalPagedRows(localRows, pager.page, pager.pageSize);
        pager.total = pageResult.total;
        pager.page = pageResult.page;
        return pageResult.rows;
    }

    async function renderSavedProfiles() {
        await renderProfileGroupFilter();
        const rows = await queryProfilesPage();
        $("saved-profiles").innerHTML = rows.length
            ? rows.map((item) => `
                <div class="saved-item">
                    <div>
                        <strong>${item.name} · ${escapeHtml(item.group || item.input?.profileGroup || "未分组")}</strong>
                        <p class="muted">${item.input.calendarType === "solar" ? "公历" : "农历"} · ${item.input.year}-${pad(Math.abs(item.input.month))}-${pad(item.input.day)} ${pad(item.input.hour)}:${pad(item.input.minute)} · ${item.input.regionName}</p>
                    </div>
                    <button class="btn-link" data-load-id="${item.id}">载入</button>
                </div>
            `).join("")
            : `<p class="muted">还没有本地档案。</p>`;
        $("saved-profiles").querySelectorAll("[data-load-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const profile = rows.find((item) => String(item.id) === button.dataset.loadId);
                if (!profile) return;
                applyInput(PROFILE_CONFIGS.primary, profile.input, profile.name);
                updatePreview(PROFILE_CONFIGS.primary);
                runAnalysis(getProfileInput(PROFILE_CONFIGS.primary));
            });
        });
        updatePager("profiles", "profiles-page-info", "btn-profiles-prev", "btn-profiles-next");
    }

    function applyInput(config, input, name) {
        $(config.name).value = name || input.profileName || "";
        if (config === PROFILE_CONFIGS.primary) {
            $("profile-group").value = input.profileGroup || "";
        }
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

    async function clearProfiles() {
        if (window.LocalDB?.available) {
            await window.LocalDB.clearProfiles();
            saveProfiles([]);
        } else {
            saveProfiles([]);
        }
        state.paging.profiles.total = 0;
        state.paging.profiles.page = 1;
        await renderSavedProfiles();
    }

    async function saveCurrentCompatibilityProfile() {
        if (!$(PROFILE_CONFIGS.compat.enabled).checked) {
            alert("请先启用合盘并录入对象信息。");
            return;
        }
        const primaryInput = getProfileInput(PROFILE_CONFIGS.primary);
        const compatInput = getProfileInput(PROFILE_CONFIGS.compat);
        if (!primaryInput || !compatInput) {
            alert("请先完成主盘与客盘录入。");
            return;
        }
        const row = {
            id: `compat-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: `${primaryInput.profileName} + ${compatInput.profileName}`,
            mode: $("compat-mode").value || "couple",
            createdAt: Date.now(),
            primaryInput,
            compatInput
        };
        if (window.LocalDB?.available) {
            await window.LocalDB.upsertCompatProfile(row);
            state.paging.compatProfiles.total = await window.LocalDB.countCompatProfiles();
        } else {
            const profiles = loadCompatProfiles();
            profiles.unshift(row);
            saveCompatProfiles(profiles);
            state.paging.compatProfiles.total = profiles.length;
        }
        state.paging.compatProfiles.page = 1;
        await renderCompatibilityProfiles();
    }

    async function queryCompatProfilesPage() {
        const pager = state.paging.compatProfiles;
        const offset = (pager.page - 1) * pager.pageSize;
        if (window.LocalDB?.available) {
            const pageResult = await window.LocalDB.listCompatProfilesPage({ offset, limit: pager.pageSize });
            pager.total = pageResult.total || 0;
            if (!pageResult.rows?.length && pager.total > 0 && pager.page > 1) {
                pager.page = Math.max(1, Math.ceil(pager.total / pager.pageSize));
                return queryCompatProfilesPage();
            }
            return pageResult.rows || [];
        }
        const localRows = loadCompatProfiles()
            .slice()
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        const pageResult = getLocalPagedRows(localRows, pager.page, pager.pageSize);
        pager.total = pageResult.total;
        pager.page = pageResult.page;
        return pageResult.rows;
    }

    async function renderCompatibilityProfiles() {
        const container = $("compat-profiles-list");
        if (!container) return;
        const rows = await queryCompatProfilesPage();
        container.innerHTML = rows.length
            ? rows.map((item) => `
                <div class="saved-item">
                    <div>
                        <strong>${escapeHtml(item.name)}</strong>
                        <p class="muted">${escapeHtml(item.mode || "couple")} · ${item.primaryInput?.year || "-"} / ${item.compatInput?.year || "-"}</p>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-link" data-compat-load="${escapeHtml(item.id)}">调入</button>
                        <button type="button" class="btn-link" data-compat-remove="${escapeHtml(item.id)}">删除</button>
                    </div>
                </div>
            `).join("")
            : `<p class="muted">暂无双人组合模板。可在录入后点击“保存组合模板”。</p>`;
        container.querySelectorAll("[data-compat-load]").forEach((button) => {
            button.addEventListener("click", () => {
                const row = rows.find((item) => String(item.id) === button.dataset.compatLoad);
                if (!row) return;
                applyInput(PROFILE_CONFIGS.primary, row.primaryInput, row.primaryInput.profileName);
                setCompatibilityEnabled(true);
                applyInput(PROFILE_CONFIGS.compat, row.compatInput, row.compatInput.profileName);
                $("compat-mode").value = row.mode || "couple";
                updatePreview(PROFILE_CONFIGS.primary);
                updatePreview(PROFILE_CONFIGS.compat);
                runAnalysis(getProfileInput(PROFILE_CONFIGS.primary));
                showSection("compat");
            });
        });
        container.querySelectorAll("[data-compat-remove]").forEach((button) => {
            button.addEventListener("click", async () => {
                if (window.LocalDB?.available) {
                    await window.LocalDB.removeCompatProfile(button.dataset.compatRemove);
                    state.paging.compatProfiles.total = await window.LocalDB.countCompatProfiles();
                } else {
                    const next = loadCompatProfiles().filter((item) => String(item.id) !== String(button.dataset.compatRemove));
                    saveCompatProfiles(next);
                    state.paging.compatProfiles.total = Math.max(0, state.paging.compatProfiles.total - 1);
                }
                await renderCompatibilityProfiles();
            });
        });
        updatePager("compatProfiles", "compat-profiles-page-info", "btn-compat-profiles-prev", "btn-compat-profiles-next");
    }

    function readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("文件读取失败"));
            reader.readAsText(file);
        });
    }

    async function exportAllData() {
        const [profiles, lifeEvents, compatProfiles] = window.LocalDB?.available
            ? await Promise.all([
                window.LocalDB.listProfiles(),
                window.LocalDB.listLifeEvents(),
                window.LocalDB.listCompatProfiles()
            ])
            : [loadProfiles(), loadLifeEvents(), loadCompatProfiles()];
        const payload = {
            version: 2,
            exportedAt: new Date().toISOString(),
            aiConfig: loadAiConfig(),
            geoConfig: loadGeoConfig(),
            profiles,
            lifeEvents,
            compatProfiles,
            knowledgeEntries: KnowledgeBaseEngine.loadEntries()
        };
        if (window.LocalDB?.available) {
            try {
                payload.indexedDb = await window.LocalDB.exportAll();
            } catch {
                payload.indexedDb = null;
            }
        }
        downloadTextFile(`tming-backup-${Date.now()}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    }

    async function importAllDataFile(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const parsed = JSON.parse(text);
            const aiConfig = { ...defaultAiConfig(), ...(parsed.aiConfig || parsed.indexedDb?.kv?.[AI_CONFIG_KEY] || {}) };
            const geoConfig = { ...defaultGeoConfig(), ...(parsed.geoConfig || parsed.indexedDb?.kv?.[GEO_CONFIG_KEY] || {}) };
            const profiles = Array.isArray(parsed.profiles) ? parsed.profiles : (parsed.indexedDb?.profiles || []);
            const lifeEvents = Array.isArray(parsed.lifeEvents) ? parsed.lifeEvents : (parsed.indexedDb?.lifeEvents || []);
            const compatProfiles = Array.isArray(parsed.compatProfiles) ? parsed.compatProfiles : (parsed.indexedDb?.compatProfiles || []);
            const knowledgeEntries = Array.isArray(parsed.knowledgeEntries) ? parsed.knowledgeEntries : (parsed.indexedDb?.knowledge || []);
            saveAiConfig(aiConfig);
            saveGeoConfig(geoConfig);
            if (window.LocalDB?.available) {
                const payload = parsed.indexedDb
                    ? parsed.indexedDb
                    : {
                        kv: {
                            [AI_CONFIG_KEY]: aiConfig,
                            [GEO_CONFIG_KEY]: geoConfig
                        },
                        profiles: profiles || [],
                        lifeEvents: lifeEvents || [],
                        compatProfiles: compatProfiles || [],
                        knowledge: knowledgeEntries || []
                    };
                await window.LocalDB.importAll(payload, true);
                saveLifeEvents(await window.LocalDB.listLifeEvents());
                saveProfiles([]);
                saveCompatProfiles([]);
                clearLegacyBusinessStorage();
            } else {
                saveProfiles(profiles || []);
                saveLifeEvents(lifeEvents || []);
                saveCompatProfiles(compatProfiles || []);
            }
            if (Array.isArray(knowledgeEntries)) {
                KnowledgeBaseEngine.saveEntries(knowledgeEntries);
            }
            if (window.LocalDB?.available) {
                const [profileCount, lifeEventCount, compatCount] = await Promise.all([
                    window.LocalDB.countProfiles(),
                    window.LocalDB.countLifeEvents(),
                    window.LocalDB.countCompatProfiles()
                ]);
                state.paging.profiles.total = profileCount;
                state.paging.lifeEvents.total = lifeEventCount;
                state.paging.compatProfiles.total = compatCount;
            } else {
                state.paging.profiles.total = (profiles || []).length;
                state.paging.lifeEvents.total = (lifeEvents || []).length;
                state.paging.compatProfiles.total = (compatProfiles || []).length;
            }
            state.paging.profiles.page = 1;
            state.paging.lifeEvents.page = 1;
            state.paging.compatProfiles.page = 1;
            renderAiConfig(loadAiConfig());
            renderGeoConfig(loadGeoConfig());
            await renderSavedProfiles();
            await renderCompatibilityProfiles();
            await renderLifeEvents();
            refreshKnowledgeBaseMatches();
            alert("数据恢复完成。");
        } catch (error) {
            alert(`导入失败：${error.message}`);
        } finally {
            event.target.value = "";
        }
    }

    function normalizePillarText(value) {
        const text = String(value || "").trim();
        if (text.length < 2) return "";
        return text.slice(0, 2);
    }

    async function runReverseLookup() {
        const resultEl = $("reverse-lookup-result");
        if (!resultEl) return;
        const yearPillar = normalizePillarText($("reverse-year-pillar").value);
        const monthPillar = normalizePillarText($("reverse-month-pillar").value);
        const dayPillar = normalizePillarText($("reverse-day-pillar").value);
        const timePillar = normalizePillarText($("reverse-time-pillar").value);
        if (!yearPillar || !monthPillar || !dayPillar || !timePillar) {
            resultEl.innerHTML = `<div class="mini-card warning-card"><p>请完整填写四柱（如：甲子、乙丑）。</p></div>`;
            return;
        }
        const startYear = Math.max(1900, Math.min(2099, Number($("reverse-start-year").value || 1990)));
        const endYear = Math.max(startYear, Math.min(2099, Number($("reverse-end-year").value || startYear + 10)));
        resultEl.innerHTML = `<div class="mini-card"><p>正在反查 ${startYear}-${endYear}，请稍候...</p></div>`;
        const hits = [];
        const maxHits = 160;
        let stop = false;
        for (let year = startYear; year <= endYear && !stop; year++) {
            for (let month = 1; month <= 12 && !stop; month++) {
                const dayCount = new Date(year, month, 0).getDate();
                for (let day = 1; day <= dayCount && !stop; day++) {
                    for (let hour = 0; hour < 24; hour += 2) {
                        const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
                        const lunar = solar.getLunar();
                        const candidate = {
                            year: lunar.getYearInGanZhiExact(),
                            month: lunar.getMonthInGanZhiExact(),
                            day: lunar.getDayInGanZhiExact(),
                            time: lunar.getTimeInGanZhi()
                        };
                        if (
                            candidate.year === yearPillar
                            && candidate.month === monthPillar
                            && candidate.day === dayPillar
                            && candidate.time === timePillar
                        ) {
                            const shichen = BaziCore.getShichenInfo(hour, 0);
                            hits.push({
                                solar: solar.toYmdHms().slice(0, 16),
                                lunar: lunar.toString(),
                                shichen: shichen.label
                            });
                            if (hits.length >= maxHits) {
                                stop = true;
                                break;
                            }
                        }
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }
        resultEl.innerHTML = hits.length
            ? hits.map((item, index) => `
                <div class="mini-card">
                    <h3>候选 ${index + 1}</h3>
                    <p>公历：${item.solar}</p>
                    <p>农历：${item.lunar}</p>
                    <p>时辰：${item.shichen}</p>
                </div>
            `).join("")
            : `<div class="mini-card"><p>指定区间内未找到匹配四柱，可扩大年份区间或检查四柱输入。</p></div>`;
    }

    async function startApp() {
        await bootstrapStorage();
        await (KnowledgeBaseEngine.ready || Promise.resolve());
        initSelects();
        bindEvents();
        await renderSavedProfiles();
        await renderCompatibilityProfiles();
        await renderLifeEvents();
        renderKnowledgeBase([]);
        renderCaseSimilarity([]);
        updatePreview(PROFILE_CONFIGS.primary);
        updatePreview(PROFILE_CONFIGS.compat);
    }

    startApp();
})();
