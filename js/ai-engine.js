(function () {
    const DEFAULT_PROMPT_TEMPLATE = [
        "你是一位精通《滴天髓》《子平真诠》《三命通会》的命理分析师。",
        "你的任务不是夸人，也不是吓人，而是把命局结构、格局、用神、大运流年与现实场景讲清楚。",
        "请遵守这些要求：",
        "1. 先下结论，再解释原因。",
        "2. 既说有利，也说风险，不要只挑好的说。",
        "3. 用通俗中文表达，但保留关键命理术语，并给白话解释。",
        "4. 重点结合职场、财务、感情、家庭、健康、迁移等现代生活场景。",
        "5. 如果岁运冲到夫妻宫、父母宫、子女宫、用神或忌神，请明确点出来。",
        "6. 如果知识库/RAG给了参考，请把它当作佐证，不要机械照抄。",
        "6.1 只要使用了知识库内容，必须在句末标注来源编号，如[引用1]；不可编造来源。",
        "6.2 如果 lifeEvents 提供了历史事件，请先做“校准复盘”，再输出未来判断。",
        "6.3 严禁复读固定句式，必须基于输入数据动态组织语言。",
        "7. 输出结构固定为：总论、命局结构、格局与用神、当前大运、当前流年、当前流月、事业、财运、感情、家庭六亲、健康、行动建议。",
        "8. 语气要温和但直接，不套模板，不空泛，不神叨。"
    ].join("\n");
    const MULTI_AGENT_SEQUENCE = [
        { key: "pattern", title: "格局派 Agent" },
        { key: "blind", title: "盲派 Agent" },
        { key: "climate", title: "调候派 Agent" },
        { key: "master", title: "总结 Agent（道长）" }
    ];
    const AGENT_INSTRUCTIONS = {
        pattern: [
            "你是格局派 Agent。",
            "重点任务：判断格局高低、成格条件、用神体系、社会阶层与职业轨道。",
            "必须明确：是普通格、成局格还是近似从格；用神是否因格局改变。"
        ].join("\n"),
        blind: [
            "你是盲派 Agent。",
            "重点任务：查做功、体用、宾主、穿破冲刑绝、关键风险与突发事件。",
            "必须明确指出：哪一年/哪类年份最可能出大事，按夫妻、财务、健康、官非分类。"
        ].join("\n"),
        climate: [
            "你是调候派 Agent。",
            "重点任务：寒暖燥湿、心理压力、身心负荷与恢复节律。",
            "必须给出按季节和月份可执行的生活节奏建议，不要空话。"
        ].join("\n"),
        master: [
            "你是总结 Agent（道长）。",
            "你要整合前面三个 Agent 的结论，处理冲突，给出辩证结论。",
            "输出必须包含：总断、证据链、关键年份、行动策略、底线预警。"
        ].join("\n")
    };

    function joinList(list) {
        return list && list.length ? list.join("；") : "暂无明显特别项。";
    }

    function buildReport(chart, dayun, currentYearEval, currentMonthEval, health) {
        const dominantGods = chart.pillars
            .flatMap((pillar) => [pillar.tenGod, ...pillar.tenGodZhi])
            .reduce((acc, god) => {
                acc[god] = (acc[god] || 0) + 1;
                return acc;
            }, {});
        const topGods = Object.entries(dominantGods).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([god, count]) => `${god}×${count}`).join("、");
        return [
            {
                title: "结构快照",
                body: [
                    `日主：${chart.pillars[2].stem}${chart.pillars[2].branch}（${chart.structure.strength}）`,
                    `格局：${chart.structure.pattern.finalPattern}`,
                    `用神：${chart.structure.usefulElement}（辅：${chart.structure.supportiveElement}）`,
                    `当前大运：${dayun.current.label}（${dayun.current.startYear}-${dayun.current.endYear}）`,
                    `主导十神：${topGods || "无"}`
                ].join(" | ")
            },
            {
                title: "数据结论（流年）",
                body: [
                    `综合 ${currentYearEval.scores.overall}`,
                    `事业 ${currentYearEval.scores.career}`,
                    `财运 ${currentYearEval.scores.wealth}`,
                    `感情 ${currentYearEval.scores.relation}`,
                    `家庭 ${currentYearEval.scores.family}`,
                    `健康 ${currentYearEval.scores.health}`,
                    `十二长生：${currentYearEval.diShi || "未标记"}`
                ].join(" | ")
            },
            {
                title: "机会面",
                body: joinList(currentYearEval.opportunities)
            },
            {
                title: "风险面",
                body: joinList(currentYearEval.risks)
            },
            {
                title: "数据结论（流月）",
                body: [
                    `综合 ${currentMonthEval.scores.overall}`,
                    `机会 ${joinList(currentMonthEval.opportunities)}`,
                    `风险 ${joinList(currentMonthEval.risks)}`
                ].join(" | ")
            },
            {
                title: "健康侧重点",
                body: health.risks.length
                    ? `${health.risks.slice(0, 2).map((item) => `${item.element}(${item.score})`).join("、")} | ${health.risks[0].risk}`
                    : "当前健康结构相对均衡，建议保持作息与恢复节律。"
            }
        ];
    }

    function buildLuckySuggestions(chart, currentYearEval, currentMonthEval, health) {
        const colorMap = { 木: "青绿", 火: "暖红", 土: "米黄", 金: "白金", 水: "深蓝" };
        return [
            `补偏重点放在${chart.structure.usefulElement}，可以从环境、作息、工作节奏和长期习惯入手，而不是只靠摆件和口号。`,
            `年度最先要守住的是：${joinList(currentYearEval.risks)}。先堵漏，再谈放大机会。`,
            `本月能争取的点：${joinList(currentMonthEval.opportunities)}。但不要为了抓机会把身体和关系一起透支。`,
            health.suggestions[0] || `外部环境可适当用${colorMap[chart.structure.usefulElement]}系调节氛围，但真正有效的还是稳定作息。`
        ];
    }

    function buildKnowledgeQueryText(state) {
        return [
            `${state.chart.pillars[2].stem}${state.chart.pillars[2].branch}日主`,
            `格局 ${state.chart.structure.pattern.finalPattern}`,
            `用神 ${state.chart.structure.usefulElement}`,
            `月令主气 ${state.chart.structure.commanderInfo.primaryStem}${state.chart.structure.commanderInfo.primaryGod}`,
            `当前大运 ${state.dayun.current.label}`,
            `当前流年 ${state.input.targetYear} ${state.currentYearEval.meta}`,
            `重点风险 ${joinList(state.currentYearEval.risks)}`,
            `重点机会 ${joinList(state.currentYearEval.opportunities)}`,
            `事件校准 ${(state.lifeEvents || []).map((item) => `${item.year}${item.type}:${item.note}`).join(" | ") || "无"}`
        ].join("；");
    }

    function buildFactContext(state) {
        const yearEval = state.currentYearEval || {};
        const monthEval = state.currentMonthEval || {};
        const clashSignals = (yearEval.relationSignals || [])
            .filter((entry) => ["相冲", "相穿", "相破", "相刑", "自刑", "相害"].includes(entry.relation?.type))
            .map((entry) => ({
                palace: entry.label,
                relation: entry.relation.type,
                branches: `${entry.relation?.type || ""}:${entry.branch}`
            }));
        return {
            dayMasterPhase: yearEval.diShi || state.chart.pillars?.[2]?.diShi || "",
            wealthStarStrength: Number(((yearEval.scores?.wealth || 0) / 100).toFixed(3)),
            careerStrength: Number(((yearEval.scores?.career || 0) / 100).toFixed(3)),
            monthStrength: Number(((monthEval.scores?.overall || 0) / 100).toFixed(3)),
            clashes: clashSignals,
            palaceTriggers: yearEval.palaceTriggers || [],
            majorShift: yearEval.dynamicEco?.majorShift || false,
            transformedChart: yearEval.dynamicEco?.reconstructed ? yearEval.dynamicEco?.reconstructedWuxing : null,
            transformedDominant: yearEval.dynamicEco?.dominantElement || "",
            nayinInteraction: yearEval.nayinInteraction || null
        };
    }

    function roundScore(value) {
        return Number(Number(value || 0).toFixed(3));
    }

    function slimPillars(pillars = []) {
        return pillars.map((pillar) => ({
            label: pillar.label,
            stem: pillar.stem,
            branch: pillar.branch,
            tenGod: pillar.tenGod,
            tenGodZhi: pillar.tenGodZhi,
            diShi: pillar.diShi,
            nayin: pillar.nayin
        }));
    }

    function slimCycleEval(evaluation, metaLabel = "") {
        if (!evaluation) return null;
        return {
            meta: metaLabel || evaluation.meta || evaluation.label || "",
            scores: {
                overall: roundScore(evaluation.scores?.overall),
                career: roundScore(evaluation.scores?.career),
                wealth: roundScore(evaluation.scores?.wealth),
                relation: roundScore(evaluation.scores?.relation),
                family: roundScore(evaluation.scores?.family),
                health: roundScore(evaluation.scores?.health)
            },
            gods: (evaluation.gods || []).slice(0, 4),
            diShi: evaluation.diShi || "",
            palaceTriggers: (evaluation.palaceTriggers || []).slice(0, 3).map((item) => ({
                palace: item.palace,
                relationType: item.relationType,
                severity: item.severity || 0
            })),
            alerts: (evaluation.specialAlerts || []).slice(0, 4).map((item) => ({
                type: item.type,
                level: item.level,
                severity: item.severity || 0
            })),
            timing: {
                hit: (evaluation.timing?.hit || []).slice(0, 2).map((item) => ({
                    key: item.key,
                    focus: item.focus
                })),
                release: (evaluation.timing?.release || []).slice(0, 2).map((item) => ({
                    key: item.key,
                    focus: item.focus
                }))
            },
            dynamicEco: {
                majorShift: Boolean(evaluation.dynamicEco?.majorShift),
                dominantElement: evaluation.dynamicEco?.dominantElement || "",
                reconstructed: Boolean(evaluation.dynamicEco?.reconstructed)
            }
        };
    }

    function buildExtremeSignals(state) {
        const years = (state.allYearEvaluations || []).map((item) => ({
            year: item.year,
            pillar: item.pillar,
            scores: item.evaluation?.scores || {},
            riskCount: (item.evaluation?.specialAlerts || []).filter((entry) => entry.level !== "chance").length,
            chanceCount: (item.evaluation?.specialAlerts || []).filter((entry) => entry.level === "chance").length,
            palaceRisk: (item.evaluation?.palaceTriggers || []).some((entry) => entry.relationType !== "六合")
        }));
        const riskYears = [...years]
            .filter((item) => item.scores.overall <= 64 || item.riskCount > 0 || item.palaceRisk || item.scores.health <= 58)
            .sort((a, b) => (b.riskCount * 8 + (100 - b.scores.overall)) - (a.riskCount * 8 + (100 - a.scores.overall)))
            .slice(0, 6)
            .sort((a, b) => a.year - b.year)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                overall: roundScore(item.scores.overall),
                health: roundScore(item.scores.health),
                relation: roundScore(item.scores.relation),
                riskCount: item.riskCount
            }));
        const chanceYears = [...years]
            .filter((item) => item.scores.overall >= 70 || item.chanceCount > 0)
            .sort((a, b) => (b.chanceCount * 7 + b.scores.overall) - (a.chanceCount * 7 + a.scores.overall))
            .slice(0, 6)
            .sort((a, b) => a.year - b.year)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                overall: roundScore(item.scores.overall),
                career: roundScore(item.scores.career),
                wealth: roundScore(item.scores.wealth),
                chanceCount: item.chanceCount
            }));
        const months = (state.monthEvaluations || []).map((item) => ({
            month: item.month,
            pillar: item.pillar,
            scores: item.evaluation?.scores || {},
            riskCount: (item.evaluation?.specialAlerts || []).filter((entry) => entry.level !== "chance").length
        }));
        const riskMonths = [...months]
            .filter((item) => item.scores.overall <= 62 || item.riskCount > 0 || item.scores.health <= 56)
            .sort((a, b) => (b.riskCount * 8 + (100 - b.scores.overall)) - (a.riskCount * 8 + (100 - a.scores.overall)))
            .slice(0, 3)
            .map((item) => ({
                month: item.month,
                pillar: item.pillar,
                overall: roundScore(item.scores.overall),
                health: roundScore(item.scores.health),
                relation: roundScore(item.scores.relation)
            }));
        const chanceMonths = [...months]
            .filter((item) => item.scores.overall >= 72)
            .sort((a, b) => b.scores.overall - a.scores.overall)
            .slice(0, 3)
            .map((item) => ({
                month: item.month,
                pillar: item.pillar,
                overall: roundScore(item.scores.overall),
                career: roundScore(item.scores.career),
                wealth: roundScore(item.scores.wealth)
            }));
        return { riskYears, chanceYears, riskMonths, chanceMonths };
    }

    function buildReferencePayload(references = []) {
        return (references || []).slice(0, 5).map((entry) => ({
            citationId: entry.citationId || null,
            citation: entry.citation || "",
            title: entry.title,
            tags: entry.tags,
            source: entry.source,
            locator: entry.locator || "",
            excerpt: (entry.excerpt || entry.content || "").slice(0, 180)
        }));
    }

    function buildCorePayload(state, references) {
        const factContext = buildFactContext(state);
        const extremes = buildExtremeSignals(state);
        const yearEval = slimCycleEval(state.currentYearEval, `${state.input.targetYear}年`);
        const monthEval = slimCycleEval(state.currentMonthEval, `${state.currentMonthEval?.meta || ""}`);
        return {
            profileName: state.input.profileName,
            basic: {
                calendarType: state.input.calendarType,
                region: state.input.regionName,
                solarBasis: state.chart.solarMeta.effectiveText,
                usedTimeMode: state.chart.solarMeta.usedMode
            },
            pillars: slimPillars(state.chart.pillars),
            structure: {
                strength: state.chart.structure.strength,
                strengthScore: state.chart.structure.strengthScore,
                pattern: state.chart.structure.pattern?.finalPattern,
                usefulElement: state.chart.structure.usefulElement,
                supportiveElement: state.chart.structure.supportiveElement,
                maxElement: state.chart.structure.maxElement,
                minElement: state.chart.structure.minElement,
                yongshenMethod: state.chart.structure.yongshen?.method || "",
                avoid: state.chart.structure.yongshen?.avoid || []
            },
            seasonal: {
                season: state.chart.seasonal?.season,
                commander: state.chart.structure.commanderInfo
                    ? {
                        primaryStem: state.chart.structure.commanderInfo.primaryStem,
                        primaryGod: state.chart.structure.commanderInfo.primaryGod,
                        weights: state.chart.structure.commanderInfo.weights
                    }
                    : null
            },
            dayun: {
                current: state.dayun.current?.label || "",
                startYear: state.dayun.current?.startYear,
                endYear: state.dayun.current?.endYear
            },
            dynamicFacts: {
                dayMasterPhase: factContext.dayMasterPhase,
                wealthStarStrength: factContext.wealthStarStrength,
                careerStrength: factContext.careerStrength,
                monthStrength: factContext.monthStrength,
                clashes: factContext.clashes,
                palaceTriggers: factContext.palaceTriggers,
                majorShift: factContext.majorShift,
                transformedDominant: factContext.transformedDominant,
                nayinInteraction: factContext.nayinInteraction
            },
            currentYear: yearEval,
            currentMonth: monthEval,
            extremes,
            health: {
                risks: (state.health?.risks || []).slice(0, 4).map((item) => ({
                    element: item.element,
                    score: item.score,
                    risk: item.risk
                })),
                suggestions: (state.health?.suggestions || []).slice(0, 4)
            },
            compatibility: state.compatibility?.result
                ? {
                    scores: state.compatibility.result.scores,
                    mode: state.compatibility.input?.mode || ""
                }
                : null,
            lifeEvents: (state.lifeEvents || []).slice(0, 10).map((item) => ({
                year: item.year,
                type: item.type,
                note: String(item.note || "").slice(0, 120)
            })),
            references: buildReferencePayload(references)
        };
    }

    function buildPromptMessages(state, promptTemplate, references) {
        const payload = buildCorePayload(state, references);
        return [
            { role: "system", content: promptTemplate || DEFAULT_PROMPT_TEMPLATE },
            { role: "user", content: `请基于以下 JSON 数据生成完整中文分析报告，不要复述“我无法确定”之类的空话。凡引用 references 中内容，必须使用 [引用n] 形式标注 citationId。只围绕 currentYear/currentMonth/extremes/dynamicFacts 的高置信信号展开，避免平庸项堆砌。\n${JSON.stringify(payload, null, 2)}` }
        ];
    }

    function buildAgentPromptMessages(state, promptTemplate, references, agentKey, agentOutputs = {}) {
        const payload = buildCorePayload(state, references);
        const agentInstruction = AGENT_INSTRUCTIONS[agentKey] || "";
        const previous = Object.entries(agentOutputs).map(([key, value]) => `${key}结论：\n${value}`).join("\n\n");
        const userPrompt = [
            `请以“${agentKey}”视角分析以下命盘数据。`,
            previous ? `前置 Agent 结论如下，请吸收但不要盲从：\n${previous}` : "",
            "凡引用 references 中内容，必须在句末标注 [引用n]，n 对应 citationId。",
            `命盘数据：\n${JSON.stringify(payload, null, 2)}`
        ].filter(Boolean).join("\n\n");
        return [
            { role: "system", content: `${promptTemplate || DEFAULT_PROMPT_TEMPLATE}\n\n${agentInstruction}` },
            { role: "user", content: userPrompt }
        ];
    }

    window.AIEngine = {
        DEFAULT_PROMPT_TEMPLATE,
        MULTI_AGENT_SEQUENCE,
        buildReport,
        buildLuckySuggestions,
        buildPromptMessages,
        buildAgentPromptMessages,
        buildKnowledgeQueryText
    };
})();
