(function () {
    const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const STEM_WUXING = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
    const BRANCH_WUXING = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];
    const ELEMENT_COLOR = { 木: "#3f6212", 火: "#b91c1c", 土: "#a16207", 金: "#475569", 水: "#0f766e" };
    const SHICHEN_RANGES = [
        { branch: "子", label: "子时", start: "23:00", end: "00:59" },
        { branch: "丑", label: "丑时", start: "01:00", end: "02:59" },
        { branch: "寅", label: "寅时", start: "03:00", end: "04:59" },
        { branch: "卯", label: "卯时", start: "05:00", end: "06:59" },
        { branch: "辰", label: "辰时", start: "07:00", end: "08:59" },
        { branch: "巳", label: "巳时", start: "09:00", end: "10:59" },
        { branch: "午", label: "午时", start: "11:00", end: "12:59" },
        { branch: "未", label: "未时", start: "13:00", end: "14:59" },
        { branch: "申", label: "申时", start: "15:00", end: "16:59" },
        { branch: "酉", label: "酉时", start: "17:00", end: "18:59" },
        { branch: "戌", label: "戌时", start: "19:00", end: "20:59" },
        { branch: "亥", label: "亥时", start: "21:00", end: "22:59" }
    ];

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function formatSolar(solar) {
        return solar.toYmdHms().slice(0, 16);
    }

    function formatSigned(value) {
        return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
    }

    function getDayOfYear(year, month, day) {
        const start = new Date(year, 0, 0);
        const current = new Date(year, month - 1, day);
        return Math.floor((current - start) / 86400000);
    }

    function equationOfTimeMinutes(year, month, day, hour, minute) {
        const dayOfYear = getDayOfYear(year, month, day);
        const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + ((hour - 12) / 24) + (minute / 1440));
        return 229.18 * (
            0.000075
            + 0.001868 * Math.cos(gamma)
            - 0.032077 * Math.sin(gamma)
            - 0.014615 * Math.cos(2 * gamma)
            - 0.040849 * Math.sin(2 * gamma)
        );
    }

    function getSolarFromInput(input) {
        const second = 0;
        if (input.calendarType === "lunar") {
            const lunarMonth = input.lunarLeap ? -input.month : input.month;
            return Lunar.fromYmdHms(input.year, lunarMonth, input.day, input.hour, input.minute, second).getSolar();
        }
        return Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, second);
    }

    function solarFromOffset(solar, offsetMinutes) {
        const totalSeconds = Math.round(offsetMinutes * 60);
        const julianDay = solar.getJulianDay() + totalSeconds / 86400;
        return Solar.fromJulianDay(julianDay);
    }

    function getShichenInfo(solar) {
        const hour = solar.getHour();
        const minute = solar.getMinute();
        const index = LunarUtil.getTimeZhiIndex(`${pad(hour)}:${pad(minute)}`);
        return { index, ...SHICHEN_RANGES[index] };
    }

    function buildSolarTimeMeta(input, standardSolar) {
        const eqMinutes = equationOfTimeMinutes(
            standardSolar.getYear(),
            standardSolar.getMonth(),
            standardSolar.getDay(),
            standardSolar.getHour(),
            standardSolar.getMinute()
        );
        const totalOffsetMinutes = eqMinutes + 4 * input.longitude - 60 * input.timezoneOffset;
        const trueSolar = solarFromOffset(standardSolar, totalOffsetMinutes);
        const standardShichen = getShichenInfo(standardSolar);
        const trueSolarShichen = getShichenInfo(trueSolar);
        const autoUseTrueSolar =
            standardShichen.index !== trueSolarShichen.index
            || standardSolar.toYmd() !== trueSolar.toYmd();
        const useTrueSolar = input.solarTimeMode === "trueSolar" || (input.solarTimeMode === "auto" && autoUseTrueSolar);
        const effectiveSolar = useTrueSolar ? trueSolar : standardSolar;
        return {
            standardSolar,
            trueSolar,
            effectiveSolar,
            equationMinutes: eqMinutes,
            longitudeMinutes: 4 * input.longitude - 60 * input.timezoneOffset,
            totalOffsetMinutes,
            standardShichen,
            trueSolarShichen,
            effectiveShichen: useTrueSolar ? trueSolarShichen : standardShichen,
            autoUseTrueSolar,
            usedMode: useTrueSolar ? "trueSolar" : "standard",
            standardText: formatSolar(standardSolar),
            trueSolarText: formatSolar(trueSolar),
            effectiveText: formatSolar(effectiveSolar)
        };
    }

    function pillarFromEightChar(eightChar, label) {
        const prefix = { 年柱: "Year", 月柱: "Month", 日柱: "Day", 时柱: "Time" }[label];
        const stem = eightChar[`get${prefix}Gan`]();
        const branch = eightChar[`get${prefix}Zhi`]();
        const hide = eightChar[`get${prefix}HideGan`]();
        const zhiShen = eightChar[`get${prefix}ShiShenZhi`]();
        return {
            label,
            stem,
            branch,
            hidden: Array.isArray(hide) ? hide : [hide],
            nayin: eightChar[`get${prefix}NaYin`](),
            tenGod: eightChar[`get${prefix}ShiShenGan`](),
            tenGodZhi: Array.isArray(zhiShen) ? zhiShen : [zhiShen],
            diShi: eightChar[`get${prefix}DiShi`](),
            xun: eightChar[`get${prefix}Xun`](),
            xunKong: eightChar[`get${prefix}XunKong`](),
            stemElement: STEM_WUXING[STEMS.indexOf(stem)],
            branchElement: BRANCH_WUXING[BRANCHES.indexOf(branch)]
        };
    }

    function getWuxingScore(pillars) {
        const score = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
        pillars.forEach((pillar, index) => {
            score[pillar.stemElement] += index === 1 ? 2.6 : 1.6;
            score[pillar.branchElement] += index === 1 ? 2.1 : 1.3;
            pillar.hidden.forEach((hidden, hiddenIndex) => {
                score[STEM_WUXING[STEMS.indexOf(hidden)]] += hiddenIndex === 0 ? 0.9 : 0.45;
            });
        });
        return score;
    }

    function generateElement(element) {
        return { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" }[element];
    }

    function leakElement(element) {
        return { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" }[element];
    }

    function controlElement(element) {
        return { 木: "金", 火: "水", 土: "木", 金: "火", 水: "土" }[element];
    }

    function analyzeStructure(pillars, wuxing) {
        const dayStem = pillars[2].stem;
        const dayElement = STEM_WUXING[STEMS.indexOf(dayStem)];
        const entries = Object.entries(wuxing).sort((a, b) => b[1] - a[1]);
        const maxElement = entries[0][0];
        const minElement = entries[entries.length - 1][0];
        const daySupport = wuxing[dayElement];
        const average = Object.values(wuxing).reduce((a, b) => a + b, 0) / 5;
        let strength = "中和";
        if (daySupport > average * 1.22) strength = "身强";
        if (daySupport < average * 0.82) strength = "身弱";
        return {
            dayElement,
            maxElement,
            minElement,
            strength,
            usefulElement: strength === "身强" ? controlElement(dayElement) : generateElement(dayElement),
            supportiveElement: strength === "身强" ? leakElement(dayElement) : dayElement
        };
    }

    function getShensha(pillars) {
        const yearBranch = pillars[0].branch;
        const dayBranch = pillars[2].branch;
        const allBranches = pillars.map((pillar) => pillar.branch);
        const tags = [];
        if (["申", "子", "辰"].includes(dayBranch)) tags.push("华盖");
        if (["寅", "午", "戌"].includes(yearBranch)) tags.push("将星");
        if (allBranches.some((branch) => ["子", "午", "卯", "酉"].includes(branch))) tags.push("桃花");
        if (new Set(allBranches).size < 4) tags.push("地支重复");
        if (pillars[1].branch === pillars[2].branch) tags.push("月日同支");
        return [...new Set(tags)];
    }

    function getLunarDisplay(lunar) {
        const monthValue = lunar.getMonth();
        return {
            text: `${lunar.getYearInChinese()}年${monthValue < 0 ? "闰" : ""}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
            year: lunar.getYear(),
            month: lunar.getMonth(),
            day: lunar.getDay()
        };
    }

    function buildPreview(input) {
        const standardSolar = getSolarFromInput(input);
        const solarMeta = buildSolarTimeMeta(input, standardSolar);
        const standardLunar = standardSolar.getLunar();
        const effectiveLunar = solarMeta.effectiveSolar.getLunar();
        return {
            standardSolar,
            standardLunar,
            effectiveLunar,
            solarMeta,
            solarText: formatSolar(standardSolar),
            lunarText: getLunarDisplay(standardLunar).text
        };
    }

    function computeBaZi(input) {
        const preview = buildPreview(input);
        const effectiveSolar = preview.solarMeta.effectiveSolar;
        const effectiveLunar = effectiveSolar.getLunar();
        const eightChar = effectiveLunar.getEightChar();
        eightChar.setSect(input.dayBoundarySect);
        const pillars = ["年柱", "月柱", "日柱", "时柱"].map((label) => pillarFromEightChar(eightChar, label));
        const wuxing = getWuxingScore(pillars);
        const structure = analyzeStructure(pillars, wuxing);
        return {
            input,
            pillars,
            stems: STEMS,
            branches: BRANCHES,
            colors: ELEMENT_COLOR,
            wuxing,
            structure,
            shensha: getShensha(pillars),
            solarMeta: preview.solarMeta,
            source: {
                standardSolar: preview.standardSolar,
                effectiveSolar,
                standardLunar: preview.standardLunar,
                effectiveLunar,
                eightChar
            },
            display: {
                standardSolar: formatSolar(preview.standardSolar),
                effectiveSolar: formatSolar(effectiveSolar),
                standardLunar: getLunarDisplay(preview.standardLunar),
                effectiveLunar: getLunarDisplay(effectiveLunar)
            },
            extras: {
                taiYuan: eightChar.getTaiYuan(),
                taiYuanNaYin: eightChar.getTaiYuanNaYin(),
                taiXi: eightChar.getTaiXi(),
                taiXiNaYin: eightChar.getTaiXiNaYin(),
                mingGong: eightChar.getMingGong(),
                mingGongNaYin: eightChar.getMingGongNaYin(),
                shenGong: eightChar.getShenGong(),
                shenGongNaYin: eightChar.getShenGongNaYin()
            }
        };
    }

    window.BaziCore = {
        STEMS,
        BRANCHES,
        STEM_WUXING,
        BRANCH_WUXING,
        ELEMENT_COLOR,
        SHICHEN_RANGES,
        buildPreview,
        computeBaZi,
        equationOfTimeMinutes,
        getSolarFromInput,
        getShichenInfo,
        generateElement,
        leakElement,
        controlElement,
        formatSigned
    };
})();
