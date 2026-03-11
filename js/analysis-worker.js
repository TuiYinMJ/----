/* eslint-disable no-restricted-globals */
(() => {
    self.window = self;
    importScripts(
        "vendor/lunar.js",
        "bazi-core.js",
        "bazi-analysis.js",
        "compatibility.js",
        "dayun.js",
        "health.js",
        "ai-engine.js"
    );

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

    function getBirthYearFromChart(chart) {
        const direct = Number(chart?.birthYear);
        if (Number.isFinite(direct) && direct > 0) return direct;
        const text = String(chart?.solarMeta?.standardText || "");
        const fromText = Number(text.slice(0, 4));
        if (Number.isFinite(fromText) && fromText > 0) return fromText;
        const inputYear = Number(chart?.input?.year);
        return Number.isFinite(inputYear) ? inputYear : new Date().getFullYear();
    }

    function buildAllYearEvaluations(chart, dayun) {
        const birthYear = getBirthYearFromChart(chart);
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

    function buildHourlyGuide(chart, dayunLabel, dateText) {
        const [year, month, day] = String(dateText || "").split("-").map(Number);
        if (!year || !month || !day) return [];
        const dayPillar = Solar.fromYmdHms(year, month, day, 12, 0, 0).getLunar().getDayInGanZhiExact();
        const dayBranch = dayPillar?.[1];
        const natalDayBranch = chart?.pillars?.[2]?.branch;
        const usefulElements = [chart?.structure?.usefulElement, chart?.structure?.supportiveElement].filter(Boolean);
        const avoidElements = chart?.structure?.yongshen?.avoid || [];
        return HOUR_WINDOWS.map((windowItem) => {
            const solar = Solar.fromYmdHms(year, month, day, windowItem.hour, 0, 0);
            const lunar = solar.getLunar();
            const pillar = lunar.getTimeInGanZhi();
            const hourStem = pillar?.[0];
            const hourBranch = pillar?.[1];
            const evaluation = BaziAnalysis.evaluateCycle(
                chart,
                pillar,
                "流时",
                `${dateText} ${windowItem.label} · ${pillar}`,
                {
                    year,
                    month,
                    day,
                    currentDayunLabel: dayunLabel
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

    function computeAnalysis(payload) {
        const { primaryInput, compatInput, nowYear, nowMonth } = payload || {};
        if (!primaryInput) throw new Error("missing-primary-input");
        const chart = BaziCore.computeBaZi(primaryInput);
        const dayun = DayunEngine.buildDaYun(chart, primaryInput.targetYear);
        const liunian = DayunEngine.buildLiuNian(dayun.current);
        const currentYearEntry = liunian.find((item) => item.year === primaryInput.targetYear) || liunian[0];
        const liuyue = DayunEngine.buildLiuYue(currentYearEntry);
        const focusMonth = primaryInput.targetYear === nowYear ? nowMonth : 1;
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
        const currentYearEval = yearEvaluations.find((item) => item.year === currentYearEntry.year)?.evaluation || yearEvaluations[0]?.evaluation;
        const currentMonthEval = monthEvaluations.find((item) => item.month === currentMonthEntry.month)?.evaluation || monthEvaluations[0]?.evaluation;
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
        return {
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
            report,
            lucky
        };
    }

    function buildDailyGuideRows(payload) {
        const { chart, dayunLabel, year, month, dayCount } = payload || {};
        if (!chart || !dayunLabel || !year || !month || !dayCount) return [];
        return BaziAnalysis.buildDailyGuide(chart, dayunLabel, new Date(year, month - 1, 1), dayCount);
    }

    function toSerializable(data) {
        const dropKeys = new Set([
            "source",
            "raw",
            "yun",
            "standardSolar",
            "trueSolar",
            "effectiveSolar",
            "standardLunar",
            "effectiveLunar",
            "eightChar"
        ]);
        return JSON.parse(JSON.stringify(data, (key, value) => {
            if (dropKeys.has(key)) return undefined;
            if (typeof value === "function") return undefined;
            return value;
        }));
    }

    self.addEventListener("message", (event) => {
        const { taskId, type, payload } = event.data || {};
        if (!taskId || !type) return;
        try {
            let data = null;
            if (type === "compute-analysis") data = computeAnalysis(payload);
            else if (type === "build-hourly-guide") data = buildHourlyGuide(payload?.chart, payload?.dayunLabel, payload?.dateText);
            else if (type === "build-daily-guide") data = buildDailyGuideRows(payload);
            else throw new Error(`unknown-task:${type}`);
            self.postMessage({ taskId, ok: true, data: toSerializable(data) });
        } catch (error) {
            self.postMessage({ taskId, ok: false, error: error?.message || String(error) });
        }
    });
})();
