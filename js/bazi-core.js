(function () {
    const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const STEM_WUXING = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
    const BRANCH_WUXING = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];
    const BRANCH_HIDDEN = {
        子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"], 辰: ["戊", "乙", "癸"],
        巳: ["丙", "戊", "庚"], 午: ["丁", "己"], 未: ["己", "丁", "乙"], 申: ["庚", "壬", "戊"],
        酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"]
    };
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
    const NAYIN = [
        "海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火", "涧下水", "城头土", "白蜡金", "杨柳木",
        "泉中水", "屋上土", "霹雳火", "松柏木", "长流水", "砂石金", "山下火", "平地木", "壁上土", "金箔金",
        "佛灯火", "天河水", "大驿土", "钗钏金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水"
    ];
    const TEN_GODS_TABLE = {
        木: ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"],
        火: ["偏印", "正印", "比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官"],
        土: ["七杀", "正官", "偏印", "正印", "比肩", "劫财", "食神", "伤官", "偏财", "正财"],
        金: ["偏财", "正财", "七杀", "正官", "偏印", "正印", "比肩", "劫财", "食神", "伤官"],
        水: ["食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印", "比肩", "劫财"]
    };
    const monthBranchBySolarMonth = ["丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子"];

    function cyclic(index) {
        return STEMS[(index % 10 + 10) % 10] + BRANCHES[(index % 12 + 12) % 12];
    }

    function makeUtcDate(year, month, day, hour, minute) {
        return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    }

    function addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }

    function formatDateTime(date) {
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function getDayOfYear(date) {
        const start = Date.UTC(date.getUTCFullYear(), 0, 0);
        return Math.floor((date.getTime() - start) / 86400000);
    }

    function equationOfTimeMinutes(date) {
        const dayOfYear = getDayOfYear(date);
        const b = ((360 / 365) * (dayOfYear - 81)) * Math.PI / 180;
        return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    }

    function getHourBranchIndex(hours, minutes) {
        const totalMinutes = (hours * 60 + minutes + 60 + 1440) % 1440;
        return Math.floor(totalMinutes / 120) % 12;
    }

    function getShichenInfo(hours, minutes) {
        const index = getHourBranchIndex(hours, minutes);
        return { index, ...SHICHEN_RANGES[index] };
    }

    function buildSolarTimeMeta(input) {
        const standardDate = makeUtcDate(input.year, input.month, input.day, input.hour, input.minute);
        const eqMinutes = equationOfTimeMinutes(standardDate);
        const standardMeridian = input.timezoneOffset * 15;
        const longitudeMinutes = (input.longitude - standardMeridian) * 4;
        const totalOffsetMinutes = longitudeMinutes + eqMinutes;
        const trueSolarDate = addMinutes(standardDate, totalOffsetMinutes);
        const standardShichen = getShichenInfo(input.hour, input.minute);
        const trueSolarShichen = getShichenInfo(trueSolarDate.getUTCHours(), trueSolarDate.getUTCMinutes());
        const standardDayKey = `${standardDate.getUTCFullYear()}-${standardDate.getUTCMonth()}-${standardDate.getUTCDate()}`;
        const trueSolarDayKey = `${trueSolarDate.getUTCFullYear()}-${trueSolarDate.getUTCMonth()}-${trueSolarDate.getUTCDate()}`;
        const autoUseTrueSolar = standardShichen.index !== trueSolarShichen.index || standardDayKey !== trueSolarDayKey;
        const useTrueSolar = input.solarTimeMode === "trueSolar" || (input.solarTimeMode === "auto" && autoUseTrueSolar);
        return {
            standardDate,
            trueSolarDate,
            effectiveDate: useTrueSolar ? trueSolarDate : standardDate,
            equationMinutes: eqMinutes,
            longitudeMinutes,
            totalOffsetMinutes,
            standardShichen,
            trueSolarShichen,
            effectiveShichen: useTrueSolar ? trueSolarShichen : standardShichen,
            autoUseTrueSolar,
            usedMode: useTrueSolar ? "trueSolar" : "standard"
        };
    }

    function getYearPillar(date) {
        const year = date.getUTCMonth() === 0 || (date.getUTCMonth() === 1 && date.getUTCDate() < 4) ? date.getUTCFullYear() - 1 : date.getUTCFullYear();
        const offset = year - 1984;
        return { stem: STEMS[(offset % 10 + 10) % 10], branch: BRANCHES[(offset % 12 + 12) % 12] };
    }

    function getMonthPillar(date, yearStem) {
        const month = date.getUTCMonth();
        const branch = monthBranchBySolarMonth[month];
        const startStemIndex = { 甲: 2, 己: 2, 乙: 4, 庚: 4, 丙: 6, 辛: 6, 丁: 8, 壬: 8, 戊: 0, 癸: 0 }[yearStem];
        const branchIndex = BRANCHES.indexOf(branch);
        const stemIndex = (startStemIndex + ((branchIndex - 2 + 12) % 12)) % 10;
        return { stem: STEMS[stemIndex], branch };
    }

    function getDayPillar(date) {
        const ref = Date.UTC(1984, 1, 2);
        const pivot = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const adjustedPivot = date.getUTCHours() >= 23 ? pivot + 86400000 : pivot;
        const delta = Math.round((adjustedPivot - ref) / 86400000);
        return {
            stem: STEMS[(delta % 10 + 10) % 10],
            branch: BRANCHES[(delta % 12 + 12) % 12],
            index: (delta % 60 + 60) % 60
        };
    }

    function getHourPillar(dayStem, shichenIndex) {
        const branch = BRANCHES[shichenIndex];
        const startStemIndex = { 甲: 0, 己: 0, 乙: 2, 庚: 2, 丙: 4, 辛: 4, 丁: 6, 壬: 6, 戊: 8, 癸: 8 }[dayStem];
        const stem = STEMS[(startStemIndex + shichenIndex) % 10];
        return { stem, branch };
    }

    function getTenGod(dayStem, targetStem) {
        const element = STEM_WUXING[STEMS.indexOf(dayStem)];
        return TEN_GODS_TABLE[element][STEMS.indexOf(targetStem)];
    }

    function getNaYin(stem, branch) {
        const stemIndex = STEMS.indexOf(stem);
        const branchIndex = BRANCHES.indexOf(branch);
        const pairIndex = ((branchIndex - stemIndex) % 2 === 0 ? ((stemIndex / 2) | 0) + (((branchIndex - stemIndex + 12) % 12) / 2) * 5 : 0) % 30;
        return NAYIN[(pairIndex + 30) % 30];
    }

    function getWuxingScore(pillars) {
        const score = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
        pillars.forEach((pillar, index) => {
            score[STEM_WUXING[STEMS.indexOf(pillar.stem)]] += index === 1 ? 2.2 : 1.4;
            score[BRANCH_WUXING[BRANCHES.indexOf(pillar.branch)]] += index === 1 ? 1.8 : 1.2;
            BRANCH_HIDDEN[pillar.branch].forEach((hidden, hiddenIndex) => {
                score[STEM_WUXING[STEMS.indexOf(hidden)]] += hiddenIndex === 0 ? 0.7 : 0.35;
            });
        });
        return score;
    }

    function getShensha(pillars) {
        const dayBranch = pillars[2].branch;
        const yearBranch = pillars[0].branch;
        const tags = [];
        if (["申", "子", "辰"].includes(dayBranch)) tags.push("华盖");
        if (["寅", "午", "戌"].includes(yearBranch)) tags.push("将星");
        if (pillars.some((pillar) => ["子", "午", "卯", "酉"].includes(pillar.branch))) tags.push("桃花");
        if (pillars[1].branch === pillars[2].branch) tags.push("月日同支");
        if (new Set(pillars.map((pillar) => pillar.branch)).size < 4) tags.push("地支重复");
        return [...new Set(tags)];
    }

    function analyzeStructure(pillars, wuxing) {
        const dayStem = pillars[2].stem;
        const dayElement = STEM_WUXING[STEMS.indexOf(dayStem)];
        const maxElement = Object.entries(wuxing).sort((a, b) => b[1] - a[1])[0][0];
        const minElement = Object.entries(wuxing).sort((a, b) => a[1] - b[1])[0][0];
        const daySupport = wuxing[dayElement];
        const average = Object.values(wuxing).reduce((a, b) => a + b, 0) / 5;
        let strength = "中和";
        if (daySupport > average * 1.25) strength = "身强";
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

    function generateElement(element) {
        return { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" }[element];
    }

    function leakElement(element) {
        return { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" }[element];
    }

    function controlElement(element) {
        return { 木: "金", 火: "水", 土: "木", 金: "火", 水: "土" }[element];
    }

    function computeBaZi(input) {
        const solarMeta = buildSolarTimeMeta(input);
        const effectiveDate = solarMeta.effectiveDate;
        const yearPillar = getYearPillar(effectiveDate);
        const monthPillar = getMonthPillar(effectiveDate, yearPillar.stem);
        const dayPillar = getDayPillar(effectiveDate);
        const hourPillar = getHourPillar(dayPillar.stem, solarMeta.effectiveShichen.index);
        const pillars = [yearPillar, monthPillar, dayPillar, hourPillar].map((pillar, index) => ({
            ...pillar,
            label: ["年柱", "月柱", "日柱", "时柱"][index],
            hidden: BRANCH_HIDDEN[pillar.branch],
            nayin: getNaYin(pillar.stem, pillar.branch),
            tenGod: index === 2 ? "日主" : getTenGod(dayPillar.stem, pillar.stem),
            stemElement: STEM_WUXING[STEMS.indexOf(pillar.stem)],
            branchElement: BRANCH_WUXING[BRANCHES.indexOf(pillar.branch)]
        }));
        const wuxing = getWuxingScore(pillars);
        return {
            input,
            pillars,
            stems: STEMS,
            branches: BRANCHES,
            colors: ELEMENT_COLOR,
            wuxing,
            structure: analyzeStructure(pillars, wuxing),
            shensha: getShensha(pillars),
            solarMeta: {
                ...solarMeta,
                standardText: formatDateTime(solarMeta.standardDate),
                trueSolarText: formatDateTime(solarMeta.trueSolarDate),
                effectiveText: formatDateTime(solarMeta.effectiveDate)
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
        computeBaZi,
        getTenGod,
        cyclic,
        generateElement,
        controlElement,
        leakElement,
        equationOfTimeMinutes,
        getShichenInfo,
        buildSolarTimeMeta
    };
})();
