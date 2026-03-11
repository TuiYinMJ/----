(function () {
    const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const STEM_WUXING = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
    const BRANCH_WUXING = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];
    const ELEMENT_COLOR = { 木: "#3f6212", 火: "#b91c1c", 土: "#a16207", 金: "#475569", 水: "#0f766e" };
    const LIU_HE = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };
    const CHONG = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
    const HAI = { 子: "未", 未: "子", 丑: "午", 午: "丑", 寅: "巳", 巳: "寅", 卯: "辰", 辰: "卯", 申: "亥", 亥: "申", 酉: "戌", 戌: "酉" };
    const CHUAN = { ...HAI };
    const PO = { 子: "酉", 酉: "子", 卯: "午", 午: "卯", 辰: "丑", 丑: "辰", 未: "戌", 戌: "未", 寅: "亥", 亥: "寅", 巳: "申", 申: "巳" };
    const XING_PAIRS = {
        子: ["卯"], 卯: ["子"], 寅: ["巳", "申"], 巳: ["寅", "申"], 申: ["寅", "巳"],
        丑: ["戌", "未"], 戌: ["丑", "未"], 未: ["丑", "戌"], 辰: ["辰"], 午: ["午"], 酉: ["酉"], 亥: ["亥"]
    };
    const SAN_HE = [
        { branches: ["申", "子", "辰"], element: "水" },
        { branches: ["亥", "卯", "未"], element: "木" },
        { branches: ["寅", "午", "戌"], element: "火" },
        { branches: ["巳", "酉", "丑"], element: "金" }
    ];
    const SAN_HUI = [
        { branches: ["亥", "子", "丑"], element: "水" },
        { branches: ["寅", "卯", "辰"], element: "木" },
        { branches: ["巳", "午", "未"], element: "火" },
        { branches: ["申", "酉", "戌"], element: "金" }
    ];
    const BAN_HE = [
        { branches: ["申", "子"], element: "水" },
        { branches: ["子", "辰"], element: "水" },
        { branches: ["亥", "卯"], element: "木" },
        { branches: ["卯", "未"], element: "木" },
        { branches: ["寅", "午"], element: "火" },
        { branches: ["午", "戌"], element: "火" },
        { branches: ["巳", "酉"], element: "金" },
        { branches: ["酉", "丑"], element: "金" }
    ];
    const LIU_HE_ELEMENT = {
        "子-丑": "土",
        "寅-亥": "木",
        "卯-戌": "火",
        "辰-酉": "金",
        "巳-申": "水",
        "午-未": "土"
    };
    const STEM_HE = {
        甲: { mate: "己", element: "土" },
        乙: { mate: "庚", element: "金" },
        丙: { mate: "辛", element: "水" },
        丁: { mate: "壬", element: "木" },
        戊: { mate: "癸", element: "火" },
        己: { mate: "甲", element: "土" },
        庚: { mate: "乙", element: "金" },
        辛: { mate: "丙", element: "水" },
        壬: { mate: "丁", element: "木" },
        癸: { mate: "戊", element: "火" }
    };
    const STEM_HE_SEASON_RULES = {
        土: ["辰", "戌", "丑", "未"],
        金: ["申", "酉", "丑"],
        水: ["亥", "子", "申", "辰"],
        木: ["亥", "子", "寅", "卯", "未"],
        火: ["寅", "卯", "巳", "午", "戌"]
    };
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
    const SEASONAL_PROFILE = {
        春: { 旺: "木", 相: "火", 休: "水", 囚: "金", 死: "土" },
        夏: { 旺: "火", 相: "土", 休: "木", 囚: "水", 死: "金" },
        秋: { 旺: "金", 相: "水", 休: "土", 囚: "火", 死: "木" },
        冬: { 旺: "水", 相: "木", 休: "金", 囚: "土", 死: "火" },
        四季: { 旺: "土", 相: "金", 休: "火", 囚: "木", 死: "水" }
    };
    const SEASONAL_FACTOR = { 旺: 1.38, 相: 1.18, 休: 0.94, 囚: 0.76, 死: 0.58 };
    const CLIMATE_NEEDS = {
        春: { primary: "火", secondary: "土", reason: "春木渐旺，常见湿重气寒，需要火温土培。", dryness: "偏湿" },
        夏: { primary: "水", secondary: "金", reason: "夏火炎烈，先求水济火，再借金生水。", dryness: "偏燥热" },
        秋: { primary: "火", secondary: "木", reason: "秋金肃杀，常需火炼金、木舒展。", dryness: "偏燥" },
        冬: { primary: "火", secondary: "土", reason: "冬水寒重，先取火暖局，再取土制湿。", dryness: "偏寒湿" },
        四季: { primary: "木", secondary: "水", reason: "四季土旺，容易壅滞，常需木疏土、水润土。", dryness: "偏厚重" }
    };

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function sumValues(map) {
        return Object.values(map).reduce((sum, value) => sum + value, 0);
    }

    function formatSolar(solar) {
        return solar.toYmdHms().slice(0, 16);
    }

    function formatSigned(value) {
        return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
    }

    function toSolarDate(solar) {
        return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), solar.getHour(), solar.getMinute(), solar.getSecond());
    }

    function minutesBetween(a, b) {
        return (b.getTime() - a.getTime()) / 60000;
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

    function getBranchRelation(a, b) {
        if (a === b && ["辰", "午", "酉", "亥"].includes(a)) return { type: "自刑", text: "同支自刑，容易在同一类问题上反复内耗。" };
        if (a === b) return { type: "同支", text: "同支，主题会被重复放大。" };
        if (LIU_HE[a] === b) return { type: "六合", text: "六合，事情有黏合、配合或吸引的一面。" };
        if (CHONG[a] === b) return { type: "相冲", text: "相冲，节奏和立场容易对撞，变化也会更大。" };
        if (CHUAN[a] === b) return { type: "相穿", text: "相穿（害），多为暗伤暗耗，常比明冲更持久，容易穿透关键宫位。", severity: "high" };
        if (PO[a] === b) return { type: "相破", text: "相破，多见合作破局、计划反复、关系和财务出现裂缝。", severity: "medium" };
        if (HAI[a] === b) return { type: "相害", text: "相害，不一定硬碰硬，但容易暗耗和误解。" };
        if ((XING_PAIRS[a] || []).includes(b)) return { type: "相刑", text: "相刑，容易较劲、纠结、压迫或反复折腾。" };
        return null;
    }

    function analyzeBranchMatrix(pillars) {
        const relations = [];
        for (let i = 0; i < pillars.length; i++) {
            for (let j = i + 1; j < pillars.length; j++) {
                const relation = getBranchRelation(pillars[i].branch, pillars[j].branch);
                if (relation) {
                    relations.push({
                        from: pillars[i].label,
                        to: pillars[j].label,
                        branches: `${pillars[i].branch}-${pillars[j].branch}`,
                        ...relation
                    });
                }
            }
        }
        const branchList = pillars.map((pillar) => pillar.branch);
        SAN_HE.forEach((group) => {
            if (group.branches.every((branch) => branchList.includes(branch))) {
                relations.push({ type: "三合", element: group.element, branches: group.branches.join(""), text: `三合${group.element}局，相关主题会明显加强。` });
            }
        });
        SAN_HUI.forEach((group) => {
            if (group.branches.every((branch) => branchList.includes(branch))) {
                relations.push({ type: "三会", element: group.element, branches: group.branches.join(""), text: `三会${group.element}局，环境气势更重，更看整体取向。` });
            }
        });
        return relations;
    }

    function pillarContainsGod(pillar, godList) {
        const gods = [pillar.tenGod, ...pillar.tenGodZhi];
        return gods.some((god) => godList.includes(god));
    }

    function analyzeBlindPatterns(pillars, branchRelations) {
        const adverseTypes = new Set(["相冲", "相穿", "相破", "相刑", "自刑", "相害"]);
        const severityWeight = { 相穿: 4, 相冲: 3, 相刑: 3, 自刑: 3, 相破: 2, 相害: 2 };
        const findings = [];
        branchRelations.forEach((relation) => {
            if (!relation.from || !relation.to || !adverseTypes.has(relation.type)) return;
            const left = pillars.find((pillar) => pillar.label === relation.from);
            const right = pillars.find((pillar) => pillar.label === relation.to);
            if (!left || !right) return;
            const inDayPalace = relation.from === "日柱" || relation.to === "日柱";
            const inMonthPalace = relation.from === "月柱" || relation.to === "月柱";
            const focus = inDayPalace
                ? "夫妻宫 / 居所 / 核心关系"
                : inMonthPalace
                    ? "事业基本盘 / 父母系统 / 现实责任"
                    : "外部名声 / 子女与晚景";
            const details = [];
            if (relation.type === "相穿") {
                if (pillarContainsGod(left, ["正财", "偏财"]) || pillarContainsGod(right, ["正财", "偏财"])) {
                    details.push("财位被穿，容易破财、回款受阻或为关系支出。");
                }
                if (pillarContainsGod(left, ["正官", "七杀"]) || pillarContainsGod(right, ["正官", "七杀"])) {
                    details.push("官杀位被穿，容易遇到规则压力、执法流程或上级掣肘。");
                }
            }
            if (relation.type === "相破") {
                details.push("更像协作破局、承诺破裂或计划反复。");
            }
            findings.push({
                type: relation.type,
                pair: relation.branches,
                from: relation.from,
                to: relation.to,
                focus,
                severity: severityWeight[relation.type] || 1,
                message: `${relation.from}${relation.to}${relation.type}，重点落在${focus}。${details.join("")}`.trim()
            });
        });
        const juePillars = pillars
            .filter((pillar) => pillar.diShi === "绝")
            .map((pillar) => `${pillar.label}${pillar.stem}${pillar.branch}`);
        return {
            findings: findings.sort((a, b) => b.severity - a.severity),
            juePillars,
            summary: juePillars.length
                ? `地势见“绝”在${juePillars.join("、")}，对应宫位遇到冲穿时应期会更明显。`
                : "原局地势未见明显“绝”位集中。"
        };
    }

    function buildTimingTriggers(pillars, branchRelations) {
        const adverseTypes = new Set(["相冲", "相穿", "相破", "相刑", "自刑", "相害"]);
        const triggers = [];
        branchRelations.forEach((relation) => {
            if (!relation.from || !relation.to) return;
            const parts = String(relation.branches || "").split("-");
            if (parts.length !== 2) return;
            const [leftBranch, rightBranch] = parts;
            if (adverseTypes.has(relation.type)) {
                triggers.push({
                    key: `${relation.type}-${leftBranch}-${rightBranch}`,
                    type: relation.type,
                    focus: relation.from === "日柱" || relation.to === "日柱"
                        ? "夫妻宫 / 居所"
                        : relation.from === "月柱" || relation.to === "月柱"
                            ? "事业 / 家庭责任"
                            : "外部环境 / 子女晚景",
                    triggerBranches: [leftBranch, rightBranch],
                    releaseBranches: [LIU_HE[leftBranch], LIU_HE[rightBranch]].filter(Boolean),
                    message: `${relation.from}${relation.to}${relation.type}：逢${leftBranch}/${rightBranch}并临易触发，逢${LIU_HE[leftBranch]}/${LIU_HE[rightBranch]}可缓和。`
                });
            }
        });
        const unique = new Map();
        triggers.forEach((item) => {
            if (!unique.has(item.key)) unique.set(item.key, item);
        });
        return Array.from(unique.values());
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

    function pillarFromEightChar(eightChar, label, override = null) {
        const prefix = { 年柱: "Year", 月柱: "Month", 日柱: "Day", 时柱: "Time" }[label];
        const stem = override?.stem || eightChar[`get${prefix}Gan`]();
        const branch = override?.branch || eightChar[`get${prefix}Zhi`]();
        const hide = override?.hidden || eightChar[`get${prefix}HideGan`]();
        const zhiShen = override?.tenGodZhi || eightChar[`get${prefix}ShiShenZhi`]();
        return {
            label,
            stem,
            branch,
            hidden: Array.isArray(hide) ? hide : [hide],
            nayin: override?.nayin || eightChar[`get${prefix}NaYin`](),
            tenGod: override?.tenGod || eightChar[`get${prefix}ShiShenGan`](),
            tenGodZhi: Array.isArray(zhiShen) ? zhiShen : [zhiShen],
            diShi: override?.diShi || eightChar[`get${prefix}DiShi`](),
            xun: override?.xun || eightChar[`get${prefix}Xun`](),
            xunKong: override?.xunKong || eightChar[`get${prefix}XunKong`](),
            stemElement: STEM_WUXING[STEMS.indexOf(stem)],
            branchElement: BRANCH_WUXING[BRANCHES.indexOf(branch)]
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

    function controlledElement(element) {
        return { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" }[element];
    }

    function getSeasonName(monthBranch) {
        if (["寅", "卯"].includes(monthBranch)) return "春";
        if (["巳", "午"].includes(monthBranch)) return "夏";
        if (["申", "酉"].includes(monthBranch)) return "秋";
        if (["亥", "子"].includes(monthBranch)) return "冬";
        return "四季";
    }

    function getSeasonalState(monthBranch) {
        const season = getSeasonName(monthBranch);
        const profile = SEASONAL_PROFILE[season];
        const state = {};
        Object.entries(profile).forEach(([stage, element]) => {
            state[element] = { stage, factor: SEASONAL_FACTOR[stage] };
        });
        return { season, profile, state };
    }

    function getJieBoundaryInfo(lunar) {
        const solar = lunar.getSolar();
        const prev = lunar.getPrevJie(true);
        const next = lunar.getNextJie(true);
        if (!prev || !next) {
            return {
                prevName: "",
                nextName: "",
                passedDays: 0,
                remainingDays: 0,
                totalDays: 1,
                progress: 0.5,
                passedMinutes: 0,
                remainingMinutes: 0,
                prevDateText: "",
                nextDateText: "",
                criticalBoundary: false,
                criticalText: "无法获取节气边界时间。"
            };
        }
        const currentDate = toSolarDate(solar);
        const prevDate = toSolarDate(prev.getSolar());
        const nextDate = toSolarDate(next.getSolar());
        const totalDays = Math.max(1, (nextDate - prevDate) / 86400000);
        const passedDays = clamp((currentDate - prevDate) / 86400000, 0, totalDays);
        const progress = clamp(passedDays / totalDays, 0, 1);
        const passedMinutes = minutesBetween(prevDate, currentDate);
        const remainingMinutes = minutesBetween(currentDate, nextDate);
        const nearestMinutes = Math.min(Math.abs(passedMinutes), Math.abs(remainingMinutes));
        return {
            prevName: prev.getName(),
            nextName: next.getName(),
            passedDays: Number(passedDays.toFixed(2)),
            remainingDays: Number((totalDays - passedDays).toFixed(2)),
            totalDays: Number(totalDays.toFixed(2)),
            progress: Number(progress.toFixed(4)),
            passedMinutes: Number(passedMinutes.toFixed(2)),
            remainingMinutes: Number(remainingMinutes.toFixed(2)),
            prevDateText: formatSolar(prev.getSolar()),
            nextDateText: formatSolar(next.getSolar()),
            criticalBoundary: nearestMinutes <= 60,
            criticalText: Math.abs(passedMinutes) <= Math.abs(remainingMinutes)
                ? `出生时刻在${prev.getName()}后 ${Math.round(Math.abs(passedMinutes))} 分钟。`
                : `出生时刻在${next.getName()}前 ${Math.round(Math.abs(remainingMinutes))} 分钟。`
        };
    }

    function getDayBoundaryModeText(dayBoundarySect) {
        if (dayBoundarySect === 1) return "子初换日";
        if (dayBoundarySect === 2) return "子正换日";
        if (dayBoundarySect === 3) return "夜子时分日";
        return "子初换日";
    }

    function getEightCharForBoundary(effectiveSolar, dayBoundarySect) {
        const baseLunar = effectiveSolar.getLunar();
        const baseEightChar = baseLunar.getEightChar();
        const sect = dayBoundarySect === 3 ? 2 : dayBoundarySect;
        baseEightChar.setSect(sect);
        const boundaryMeta = {
            mode: dayBoundarySect,
            modeText: getDayBoundaryModeText(dayBoundarySect),
            appliedNightZi: false,
            note: ""
        };
        if (dayBoundarySect !== 3) {
            return { eightChar: baseEightChar, timeOverride: null, boundaryMeta };
        }
        const shichen = getShichenInfo(effectiveSolar);
        if (shichen.branch !== "子") {
            boundaryMeta.note = "夜子时分日仅在子时触发；当前时段未触发，按子正换日处理。";
            return { eightChar: baseEightChar, timeOverride: null, boundaryMeta };
        }
        const nextDaySolar = Solar.fromJulianDay(effectiveSolar.getJulianDay() + 1);
        const nextEightChar = nextDaySolar.getLunar().getEightChar();
        nextEightChar.setSect(2);
        boundaryMeta.appliedNightZi = true;
        boundaryMeta.note = `夜子时分日已触发：日柱按当日，时柱按次日（${nextEightChar.getTimeGan()}${nextEightChar.getTimeZhi()}）。`;
        return {
            eightChar: baseEightChar,
            timeOverride: {
                stem: nextEightChar.getTimeGan(),
                branch: nextEightChar.getTimeZhi(),
                hidden: nextEightChar.getTimeHideGan(),
                tenGod: nextEightChar.getTimeShiShenGan(),
                tenGodZhi: nextEightChar.getTimeShiShenZhi(),
                nayin: nextEightChar.getTimeNaYin(),
                diShi: nextEightChar.getTimeDiShi(),
                xun: nextEightChar.getTimeXun(),
                xunKong: nextEightChar.getTimeXunKong()
            },
            boundaryMeta
        };
    }

    function getMonthCommanderWeights(monthBranch, progress) {
        const hidden = LunarUtil.ZHI_HIDE_GAN[monthBranch].filter(Boolean);
        const centersByLength = {
            1: [0.5],
            2: [0.28, 0.74],
            3: [0.18, 0.52, 0.84]
        };
        const centers = centersByLength[hidden.length] || [0.5];
        const rawWeights = hidden.map((_, index) => {
            const center = centers[index] ?? centers[centers.length - 1];
            const distance = Math.abs(progress - center);
            const focus = Math.max(0.16, 1.2 - distance * 2.1);
            const rankBias = index === 0 ? 1.08 : index === 1 ? 0.92 : 0.76;
            return focus * rankBias;
        });
        const total = rawWeights.reduce((sum, value) => sum + value, 0) || 1;
        const weights = hidden.map((stem, index) => ({
            stem,
            element: STEM_WUXING[STEMS.indexOf(stem)],
            weight: Number((rawWeights[index] / total).toFixed(4))
        }));
        const primary = weights.reduce((best, item) => (item.weight > best.weight ? item : best), weights[0]);
        return {
            hidden,
            weights,
            primaryStem: primary.stem,
            primaryElement: primary.element
        };
    }

    function baseElementMap() {
        return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    }

    function addElementScore(score, contributions, element, weight, source, detail, factor) {
        const finalWeight = weight * factor;
        score[element] += finalWeight;
        contributions.push({
            element,
            source,
            detail,
            baseWeight: Number(weight.toFixed(4)),
            seasonalFactor: Number(factor.toFixed(4)),
            finalWeight: Number(finalWeight.toFixed(4))
        });
    }

    function getFixedHiddenWeights(hiddenLength) {
        if (hiddenLength === 1) return [1];
        if (hiddenLength === 2) return [0.68, 0.32];
        return [0.56, 0.28, 0.16];
    }

    function getWuxingScore(pillars, seasonalState, commanderInfo) {
        const score = baseElementMap();
        const contributions = [];
        const stemBase = [1.25, 1.85, 1.55, 1.1];
        const branchBase = [1.05, 1.55, 1.25, 1.0];
        const hiddenBase = [0.76, 0.42, 0.24];

        pillars.forEach((pillar, index) => {
            addElementScore(
                score,
                contributions,
                pillar.stemElement,
                stemBase[index],
                pillar.label,
                `${pillar.stem}透干`,
                seasonalState.state[pillar.stemElement].factor
            );
            addElementScore(
                score,
                contributions,
                pillar.branchElement,
                branchBase[index],
                pillar.label,
                `${pillar.branch}主气`,
                seasonalState.state[pillar.branchElement].factor
            );
            if (index === 1) {
                commanderInfo.weights.forEach((item) => {
                    addElementScore(
                        score,
                        contributions,
                        item.element,
                        2.15 * item.weight,
                        pillar.label,
                        `${pillar.branch}月令司令 ${item.stem}`,
                        seasonalState.state[item.element].factor
                    );
                });
                return;
            }
            const weights = getFixedHiddenWeights(pillar.hidden.length);
            pillar.hidden.forEach((hidden, hiddenIndex) => {
                const element = STEM_WUXING[STEMS.indexOf(hidden)];
                addElementScore(
                    score,
                    contributions,
                    element,
                    hiddenBase[hiddenIndex] || 0.18,
                    pillar.label,
                    `${pillar.branch}藏干 ${hidden}`,
                    seasonalState.state[element].factor
                );
            });
        });

        return { score, contributions };
    }

    function analyzeRoots(pillars) {
        const elementRoots = baseElementMap();
        const stemRoots = pillars.map((pillar) => {
            const element = pillar.stemElement;
            let strength = 0;
            const roots = [];
            pillars.forEach((other) => {
                other.hidden.forEach((hidden, hiddenIndex) => {
                    const hiddenElement = STEM_WUXING[STEMS.indexOf(hidden)];
                    let value = 0;
                    if (hidden === pillar.stem) {
                        value = hiddenIndex === 0 ? 1 : hiddenIndex === 1 ? 0.72 : 0.48;
                    } else if (hiddenElement === element) {
                        value = hiddenIndex === 0 ? 0.54 : hiddenIndex === 1 ? 0.32 : 0.18;
                    }
                    if (value > 0) {
                        strength += value;
                        roots.push({
                            label: other.label,
                            branch: other.branch,
                            hidden,
                            strength: Number(value.toFixed(2))
                        });
                    }
                });
                if (other.branchElement === element) {
                    strength += 0.16;
                }
            });
            elementRoots[element] += strength;
            return {
                label: pillar.label,
                stem: pillar.stem,
                element,
                strength: Number(strength.toFixed(2)),
                rooted: strength >= 0.85,
                level: strength >= 1.8 ? "强根" : strength >= 0.85 ? "有根" : "浮根",
                roots: roots.slice(0, 6)
            };
        });

        return {
            stemRoots,
            elementRoots: Object.fromEntries(Object.entries(elementRoots).map(([key, value]) => [key, Number(value.toFixed(2))])),
            dayMasterRootStrength: Number((stemRoots.find((item) => item.label === "日柱")?.strength || 0).toFixed(2))
        };
    }

    function applyRootEffects(wuxing, roots) {
        const adjusted = { ...wuxing };
        roots.stemRoots.forEach((item) => {
            adjusted[item.element] += item.strength * 0.38;
        });
        return Object.fromEntries(Object.entries(adjusted).map(([key, value]) => [key, Number(value.toFixed(4))]));
    }

    function averageElementScore(wuxing) {
        return sumValues(wuxing) / 5;
    }

    function hasVisibleElement(pillars, element) {
        return pillars.some((pillar) => pillar.stemElement === element);
    }

    function getStemTransformCondition(element, monthBranch, seasonalState, wuxing, roots, pillars) {
        const monthRules = STEM_HE_SEASON_RULES[element] || [];
        const monthAllowed = monthRules.includes(monthBranch)
            || seasonalState.profile.旺 === element
            || seasonalState.profile.相 === element;
        const visible = hasVisibleElement(pillars, element);
        const rooted = (roots.elementRoots[element] || 0) >= 1.1;
        const counter = controlElement(element);
        const counterTooStrong = wuxing[counter] > wuxing[element] * 1.35 + 1.2;
        return {
            monthAllowed,
            visible,
            rooted,
            counter,
            counterTooStrong,
            satisfied: monthAllowed && (visible || rooted) && !counterTooStrong
        };
    }

    function getTransformSupport(element, seasonalState, wuxing, roots, pillars) {
        const average = averageElementScore(wuxing);
        return seasonalState.state[element].factor
            + (wuxing[element] / Math.max(average, 0.01)) * 0.22
            + (roots.elementRoots[element] || 0) * 0.08
            + (hasVisibleElement(pillars, element) ? 0.12 : 0);
    }

    function sortPair(a, b) {
        return [a, b].sort().join("-");
    }

    function analyzeTransformations(pillars, monthBranch, seasonalState, wuxing, roots) {
        const adjustments = baseElementMap();
        const stemCombos = [];
        const branchCombos = [];
        const usedStemPairs = new Set();
        const usedBranchPairs = new Set();

        for (let i = 0; i < pillars.length; i++) {
            for (let j = i + 1; j < pillars.length; j++) {
                const leftStem = pillars[i].stem;
                const rightStem = pillars[j].stem;
                const stemInfo = STEM_HE[leftStem];
                if (stemInfo && stemInfo.mate === rightStem) {
                    const key = sortPair(leftStem, rightStem);
                    if (!usedStemPairs.has(key)) {
                        const support = getTransformSupport(stemInfo.element, seasonalState, wuxing, roots, pillars);
                        const condition = getStemTransformCondition(stemInfo.element, monthBranch, seasonalState, wuxing, roots, pillars);
                        const success = support >= 1.34 && condition.satisfied;
                        const reasonParts = [];
                        reasonParts.push(`化神${stemInfo.element}支持度 ${support.toFixed(2)}。`);
                        reasonParts.push(condition.monthAllowed ? "月令允许化气。" : "月令不支持该化神，先天条件不足。");
                        reasonParts.push(condition.visible || condition.rooted ? "化神有透出或通根承接。" : "化神既不透也根浅，难成实化。");
                        if (condition.counterTooStrong) {
                            reasonParts.push(`${condition.counter}过旺反制化神，化气被截断。`);
                        }
                        stemCombos.push({
                            pair: `${leftStem}${rightStem}`,
                            labels: [pillars[i].label, pillars[j].label],
                            element: stemInfo.element,
                            success,
                            support: Number(support.toFixed(2)),
                            condition,
                            reason: success
                                ? `${reasonParts.join(" ")} 五合由“牵制”转成“实化”。`
                                : `${reasonParts.join(" ")} 仍以合住、牵扯为主。`
                        });
                        if (success) {
                            adjustments[stemInfo.element] += 1.45;
                            adjustments[STEM_WUXING[STEMS.indexOf(leftStem)]] -= 0.32;
                            adjustments[STEM_WUXING[STEMS.indexOf(rightStem)]] -= 0.32;
                        }
                        usedStemPairs.add(key);
                    }
                }

                const leftBranch = pillars[i].branch;
                const rightBranch = pillars[j].branch;
                const relationKey = sortPair(leftBranch, rightBranch);
                if (LIU_HE[leftBranch] === rightBranch && !usedBranchPairs.has(relationKey)) {
                    const targetElement = LIU_HE_ELEMENT[relationKey];
                    const support = getTransformSupport(targetElement, seasonalState, wuxing, roots, pillars) + (monthBranch === leftBranch || monthBranch === rightBranch ? 0.16 : 0);
                    const visibleOrRooted = hasVisibleElement(pillars, targetElement) || (roots.elementRoots[targetElement] || 0) >= 1.15;
                    const success = support >= 1.28 && visibleOrRooted;
                    branchCombos.push({
                        type: "六合化气",
                        pair: `${leftBranch}${rightBranch}`,
                        labels: [pillars[i].label, pillars[j].label],
                        element: targetElement,
                        success,
                        support: Number(support.toFixed(2)),
                        condition: { visibleOrRooted },
                        reason: success
                            ? `${leftBranch}${rightBranch}六合且${targetElement}气有势，六合不仅成象，还可化气。`
                            : `${leftBranch}${rightBranch}虽六合，但化神${targetElement}没有透根承接，更多表现为黏合与牵制。`
                    });
                    if (success) {
                        adjustments[targetElement] += 0.92;
                    }
                    usedBranchPairs.add(relationKey);
                }
            }
        }

        const branchList = pillars.map((pillar) => pillar.branch);
        SAN_HE.forEach((group) => {
            if (group.branches.every((branch) => branchList.includes(branch))) {
                const support = getTransformSupport(group.element, seasonalState, wuxing, roots, pillars) + (group.branches.includes(monthBranch) ? 0.18 : 0);
                const hasMonthSeat = group.branches.includes(monthBranch);
                const visibleOrRooted = hasVisibleElement(pillars, group.element) || (roots.elementRoots[group.element] || 0) >= 1.3;
                const success = support >= 1.26 && (hasMonthSeat || visibleOrRooted);
                branchCombos.push({
                    type: "三合局",
                    pair: group.branches.join(""),
                    labels: pillars.filter((pillar) => group.branches.includes(pillar.branch)).map((pillar) => pillar.label),
                    element: group.element,
                    success,
                    support: Number(support.toFixed(2)),
                    condition: { hasMonthSeat, visibleOrRooted },
                    reason: success
                        ? `${group.branches.join("")}三合${group.element}局成势，相关五行会明显改写原局重心。`
                        : `${group.branches.join("")}虽成三合形，但${group.element}气不足，更多只是增强，不到彻底化局。`
                });
                if (success) adjustments[group.element] += 2.25;
            }
        });

        SAN_HUI.forEach((group) => {
            if (group.branches.every((branch) => branchList.includes(branch))) {
                const support = getTransformSupport(group.element, seasonalState, wuxing, roots, pillars) + (group.branches.includes(monthBranch) ? 0.18 : 0);
                const hasMonthSeat = group.branches.includes(monthBranch);
                const visibleOrRooted = hasVisibleElement(pillars, group.element) || (roots.elementRoots[group.element] || 0) >= 1.25;
                const success = support >= 1.22 && (hasMonthSeat || visibleOrRooted);
                branchCombos.push({
                    type: "三会方",
                    pair: group.branches.join(""),
                    labels: pillars.filter((pillar) => group.branches.includes(pillar.branch)).map((pillar) => pillar.label),
                    element: group.element,
                    success,
                    support: Number(support.toFixed(2)),
                    condition: { hasMonthSeat, visibleOrRooted },
                    reason: success
                        ? `${group.branches.join("")}三会${group.element}方，环境气会一边倒，局势取向更鲜明。`
                        : `${group.branches.join("")}虽有三会，但气未尽聚，更多是偏向，不到全改。`
                });
                if (success) adjustments[group.element] += 1.8;
            }
        });

        BAN_HE.forEach((group) => {
            const present = group.branches.filter((branch) => branchList.includes(branch));
            if (present.length === 2) {
                const support = getTransformSupport(group.element, seasonalState, wuxing, roots, pillars) + (group.branches.includes(monthBranch) ? 0.12 : 0);
                const hasMonthSeat = group.branches.includes(monthBranch);
                const visibleOrRooted = hasVisibleElement(pillars, group.element) || (roots.elementRoots[group.element] || 0) >= 1.2;
                const success = support >= 1.24 && hasMonthSeat && visibleOrRooted;
                branchCombos.push({
                    type: "半合",
                    pair: group.branches.join(""),
                    labels: pillars.filter((pillar) => group.branches.includes(pillar.branch)).map((pillar) => pillar.label),
                    element: group.element,
                    success,
                    support: Number(support.toFixed(2)),
                    condition: { hasMonthSeat, visibleOrRooted },
                    reason: success
                        ? `${group.branches.join("")}半合${group.element}得到月令或透出扶助，半合可视为有效引动。`
                        : `${group.branches.join("")}虽有半合，但缺少月令或透出承接，只算偏向。`
                });
                if (success) adjustments[group.element] += 0.96;
            }
        });

        return {
            stemCombos,
            branchCombos,
            adjustments: Object.fromEntries(Object.entries(adjustments).map(([key, value]) => [key, Number(value.toFixed(4))]))
        };
    }

    function applyAdjustments(wuxing, adjustments) {
        const merged = {};
        Object.keys(wuxing).forEach((element) => {
            merged[element] = Number(Math.max(0, wuxing[element] + (adjustments[element] || 0)).toFixed(4));
        });
        return merged;
    }

    function getGodStats(pillars) {
        const stats = {};
        pillars.forEach((pillar) => {
            [pillar.tenGod, ...pillar.tenGodZhi].forEach((god) => {
                stats[god] = (stats[god] || 0) + 1;
            });
        });
        return stats;
    }

    function detectSpecialPattern(dayElement, wuxing, roots) {
        const total = sumValues(wuxing);
        const selfSide = wuxing[dayElement] + wuxing[generateElement(dayElement)];
        const output = wuxing[leakElement(dayElement)];
        const wealth = wuxing[controlledElement(dayElement)];
        const officer = wuxing[controlElement(dayElement)];
        const selfRatio = selfSide / Math.max(total, 0.01);

        if (selfRatio >= 0.64 && roots.dayMasterRootStrength >= 1.6) {
            return { name: `专旺格`, orientation: dayElement, reason: `${dayElement}与印比成势，日主不止偏强，而是接近专旺。` };
        }
        if (selfRatio <= 0.22 && roots.dayMasterRootStrength < 0.8) {
            const candidates = [
                { name: "从财格", element: controlledElement(dayElement), value: wealth },
                { name: "从官杀格", element: controlElement(dayElement), value: officer },
                { name: "从儿格", element: leakElement(dayElement), value: output }
            ].sort((a, b) => b.value - a.value);
            if (candidates[0].value / Math.max(total, 0.01) >= 0.28) {
                return { name: candidates[0].name, orientation: candidates[0].element, reason: `日主根浅且反方成势，接近${candidates[0].name}取法。` };
            }
        }
        return null;
    }

    function detectPattern(dayStem, dayElement, pillars, wuxing, commanderInfo, roots) {
        const commanderGod = LunarUtil.SHI_SHEN[dayStem + commanderInfo.primaryStem];
        const basePatternMap = {
            比肩: "建禄格",
            劫财: "劫财格",
            食神: "食神格",
            伤官: "伤官格",
            偏财: "偏财格",
            正财: "正财格",
            七杀: "七杀格",
            正官: "正官格",
            偏印: "偏印格",
            正印: "正印格"
        };
        const stats = getGodStats(pillars);
        const combos = [];
        if ((stats.七杀 || 0) >= 2 && ((stats.正印 || 0) + (stats.偏印 || 0)) >= 2) combos.push("杀印相生格");
        if ((stats.食神 || 0) >= 2 && ((stats.正财 || 0) + (stats.偏财 || 0)) >= 2) combos.push("食神生财格");
        if ((stats.伤官 || 0) >= 2 && ((stats.正财 || 0) + (stats.偏财 || 0)) >= 2) combos.push("伤官生财格");
        if ((stats.正官 || 0) >= 1 && ((stats.正印 || 0) + (stats.偏印 || 0)) >= 2) combos.push("官印相生格");
        if (wuxing[dayElement] / Math.max(sumValues(wuxing), 0.01) >= 0.34 && (stats.比肩 || 0) + (stats.劫财 || 0) >= 3) combos.push("比劫成势");
        const special = detectSpecialPattern(dayElement, wuxing, roots);
        return {
            commanderStem: commanderInfo.primaryStem,
            commanderGod,
            basePattern: basePatternMap[commanderGod] || "杂格",
            comboPatterns: combos,
            specialPattern: special,
            finalPattern: special?.name || combos[0] || basePatternMap[commanderGod] || "杂格"
        };
    }

    function getTongguanElement(controller, target) {
        const cycle = ["木", "火", "土", "金", "水"];
        const controllerIndex = cycle.indexOf(controller);
        const targetIndex = cycle.indexOf(target);
        for (let i = 1; i <= 4; i++) {
            const element = cycle[(controllerIndex + i) % 5];
            if (generateElement(controller) === element && generateElement(element) === target) return element;
            if (leakElement(controller) === element && generateElement(element) === target) return element;
            if (generateElement(controller) === element && controlledElement(element) === target) return element;
        }
        return generateElement(controller);
    }

    function deriveStrength(dayElement, wuxing, roots, seasonalState) {
        const total = sumValues(wuxing);
        const selfSide = wuxing[dayElement] + wuxing[generateElement(dayElement)] + roots.dayMasterRootStrength * 0.9;
        const enemySide = wuxing[controlElement(dayElement)] + wuxing[controlledElement(dayElement)] + wuxing[leakElement(dayElement)] * 0.7;
        const seasonBonus = seasonalState.state[dayElement].factor;
        const ratio = (selfSide * seasonBonus) / Math.max(enemySide, 0.01);
        if (ratio >= 1.3) return { strength: "身强", score: Number(ratio.toFixed(2)) };
        if (ratio <= 0.86) return { strength: "身弱", score: Number(ratio.toFixed(2)) };
        return { strength: "中和", score: Number(ratio.toFixed(2)) };
    }

    function determineYongshen(dayElement, strengthInfo, patternInfo, seasonalState, wuxing) {
        const climate = CLIMATE_NEEDS[seasonalState.season];
        const average = averageElementScore(wuxing);
        const maxElement = Object.entries(wuxing).sort((a, b) => b[1] - a[1])[0][0];
        const minElement = Object.entries(wuxing).sort((a, b) => a[1] - b[1])[0][0];
        const tongguan = maxElement === controlElement(minElement) ? getTongguanElement(maxElement, minElement) : null;
        let primary = strengthInfo.strength === "身强" ? controlElement(dayElement) : generateElement(dayElement);
        let supportive = strengthInfo.strength === "身强" ? leakElement(dayElement) : dayElement;
        let method = "常规格局取法";
        const rationale = [];

        if (patternInfo.specialPattern) {
            primary = patternInfo.specialPattern.orientation;
            supportive = generateElement(primary);
            method = patternInfo.specialPattern.name;
            rationale.push(patternInfo.specialPattern.reason);
        } else if (patternInfo.comboPatterns.includes("杀印相生格")) {
            primary = generateElement(dayElement);
            supportive = controlElement(dayElement);
            method = "杀印相生";
            rationale.push("杀印相生更重印星承杀，取印为先。");
        } else if (patternInfo.comboPatterns.includes("食神生财格")) {
            primary = leakElement(dayElement);
            supportive = controlledElement(dayElement);
            method = "食神生财";
            rationale.push("食神生财以泄秀生财为主，用食伤承财。");
        } else if (patternInfo.comboPatterns.includes("官印相生格")) {
            primary = controlElement(dayElement);
            supportive = generateElement(dayElement);
            method = "官印相生";
            rationale.push("官印相生更重官印流转，先扶官印之用。");
        }

        if (wuxing[climate.primary] < average * 0.82) {
            primary = climate.primary;
            supportive = supportive === primary ? climate.secondary : supportive;
            method = `${method} + 调候`;
            rationale.push(climate.reason);
        } else if (tongguan && wuxing[tongguan] < average * 0.96) {
            supportive = tongguan;
            rationale.push(`原局有明显五行战克，${tongguan}可做通关。`);
        }

        const avoid = [...new Set([maxElement, controlElement(primary), minElement === primary ? controlledElement(primary) : minElement])].slice(0, 3);
        return {
            primary,
            supportive,
            avoid,
            method,
            rationale: [...new Set(rationale)].filter(Boolean),
            climate
        };
    }

    function analyzeStructure(pillars, wuxing, seasonalState, roots, commanderInfo) {
        const dayStem = pillars[2].stem;
        const dayElement = STEM_WUXING[STEMS.indexOf(dayStem)];
        const entries = Object.entries(wuxing).sort((a, b) => b[1] - a[1]);
        const maxElement = entries[0][0];
        const minElement = entries[entries.length - 1][0];
        const strengthInfo = deriveStrength(dayElement, wuxing, roots, seasonalState);
        const patternInfo = detectPattern(dayStem, dayElement, pillars, wuxing, commanderInfo, roots);
        const yongshen = determineYongshen(dayElement, strengthInfo, patternInfo, seasonalState, wuxing);
        return {
            dayElement,
            maxElement,
            minElement,
            strength: strengthInfo.strength,
            strengthScore: strengthInfo.score,
            usefulElement: yongshen.primary,
            supportiveElement: yongshen.supportive,
            seasonalState,
            commanderInfo,
            roots,
            pattern: patternInfo,
            yongshen
        };
    }

    function getExpandedShensha(pillars) {
        const yearBranch = pillars[0].branch;
        const dayBranch = pillars[2].branch;
        const dayStem = pillars[2].stem;
        const dayPillar = `${pillars[2].stem}${pillars[2].branch}`;
        const allBranches = pillars.map((pillar) => pillar.branch);
        const tags = [];
        const tianYi = {
            甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
            乙: ["子", "申"], 己: ["子", "申"],
            丙: ["亥", "酉"], 丁: ["亥", "酉"],
            壬: ["卯", "巳"], 癸: ["卯", "巳"],
            辛: ["寅", "午"]
        };
        const wenChang = { 甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯" };
        const yiMa = {
            申子辰: "寅",
            寅午戌: "申",
            亥卯未: "巳",
            巳酉丑: "亥"
        };
        const yangRen = { 甲: "卯", 乙: "寅", 丙: "午", 丁: "巳", 戊: "午", 己: "巳", 庚: "酉", 辛: "申", 壬: "子", 癸: "亥" };

        if (["申", "子", "辰"].includes(dayBranch)) tags.push("华盖");
        if (["寅", "午", "戌"].includes(yearBranch)) tags.push("将星");
        if (allBranches.some((branch) => ["子", "午", "卯", "酉"].includes(branch))) tags.push("桃花");
        if (new Set(allBranches).size < 4) tags.push("地支重复");
        if (pillars[1].branch === pillars[2].branch) tags.push("月日同支");
        if ((tianYi[dayStem] || []).some((branch) => allBranches.includes(branch))) tags.push("天乙贵人");
        if (allBranches.includes(wenChang[dayStem])) tags.push("文昌贵人");
        Object.entries(yiMa).forEach(([group, horse]) => {
            if (group.includes(dayBranch) && allBranches.includes(horse)) tags.push("驿马");
        });
        if (allBranches.includes(yangRen[dayStem])) tags.push("羊刃");
        if (["庚辰", "庚戌", "壬辰", "戊戌"].includes(dayPillar)) tags.push("魁罡");
        if (pillars.some((pillar) => pillar.xunKong && pillar.xunKong !== "无")) tags.push("空亡");
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
        const boundary = getEightCharForBoundary(effectiveSolar, input.dayBoundarySect);
        const eightChar = boundary.eightChar;
        const pillars = ["年柱", "月柱", "日柱", "时柱"].map((label) => (
            label === "时柱" && boundary.timeOverride
                ? pillarFromEightChar(eightChar, label, boundary.timeOverride)
                : pillarFromEightChar(eightChar, label)
        ));
        const jieQiInfo = getJieBoundaryInfo(effectiveLunar);
        const seasonalState = getSeasonalState(pillars[1].branch);
        const commanderInfo = getMonthCommanderWeights(pillars[1].branch, jieQiInfo.progress);
        commanderInfo.primaryGod = LunarUtil.SHI_SHEN[pillars[2].stem + commanderInfo.primaryStem];
        const baseWuxing = getWuxingScore(pillars, seasonalState, commanderInfo);
        const roots = analyzeRoots(pillars);
        const rootedWuxing = applyRootEffects(baseWuxing.score, roots);
        const transformations = analyzeTransformations(pillars, pillars[1].branch, seasonalState, rootedWuxing, roots);
        const wuxing = applyAdjustments(rootedWuxing, transformations.adjustments);
        const structure = analyzeStructure(pillars, wuxing, seasonalState, roots, commanderInfo);
        const branchRelations = analyzeBranchMatrix(pillars);
        const blindPatterns = analyzeBlindPatterns(pillars, branchRelations);
        const timingTriggers = buildTimingTriggers(pillars, branchRelations);
        return {
            input,
            pillars,
            stems: STEMS,
            branches: BRANCHES,
            colors: ELEMENT_COLOR,
            wuxing,
            baseWuxing: baseWuxing.score,
            wuxingContributions: baseWuxing.contributions,
            structure,
            seasonal: {
                season: seasonalState.season,
                states: seasonalState.state,
                jieQi: jieQiInfo
            },
            roots,
            transformations,
            blindPatterns,
            timingTriggers,
            shensha: getExpandedShensha(pillars),
            branchRelations,
            solarMeta: preview.solarMeta,
            boundaryMeta: boundary.boundaryMeta,
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
        LIU_HE,
        CHONG,
        HAI,
        CHUAN,
        PO,
        XING_PAIRS,
        SAN_HE,
        SAN_HUI,
        buildPreview,
        computeBaZi,
        equationOfTimeMinutes,
        getSolarFromInput,
        getShichenInfo,
        getBranchRelation,
        analyzeBranchMatrix,
        generateElement,
        leakElement,
        controlElement,
        controlledElement,
        formatSigned,
        getDayBoundaryModeText
    };
})();
