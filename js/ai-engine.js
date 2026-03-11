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
        return [
            {
                title: "先说结论",
                body: `${chart.pillars[2].stem}${chart.pillars[2].branch}日主，${chart.structure.strength}。当前主格按${chart.structure.pattern.finalPattern}处理，用神偏${chart.structure.usefulElement}，辅助取${chart.structure.supportiveElement}。当前处于${dayun.current.label}大运（${dayun.current.startYear}-${dayun.current.endYear}），整体属于“${currentYearEval.blunt}”的年份。`
            },
            {
                title: "命局关键点",
                body: `月令主气在${chart.structure.commanderInfo.primaryStem}（${chart.structure.commanderInfo.primaryGod}），节气进度约 ${Math.round(chart.seasonal.jieQi.progress * 100)}%。${chart.structure.yongshen.rationale.join(" ")}`
            },
            {
                title: "这一年的好处",
                body: `有利面：${joinList(currentYearEval.opportunities)}`
            },
            {
                title: "这一年的风险",
                body: `不利面：${joinList(currentYearEval.risks)}`
            },
            {
                title: "这个月最该防什么",
                body: `${currentMonthEval.blunt} 可能发生：${joinList(currentMonthEval.opportunities)} 需要注意：${joinList(currentMonthEval.risks)}`
            },
            {
                title: "健康与执行",
                body: health.risks.length
                    ? `健康侧重点落在${health.risks.slice(0, 2).map((item) => item.element).join("、")}。白话说，状态一掉，你最容易先从作息、情绪、消化或恢复力上出问题。`
                    : "健康盘面不算失衡，但这不等于可以透支。长期习惯决定上限。"
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
            `重点机会 ${joinList(state.currentYearEval.opportunities)}`
        ].join("；");
    }

    function buildCorePayload(state, references) {
        return {
            profileName: state.input.profileName,
            basic: {
                calendarType: state.input.calendarType,
                region: state.input.regionName,
                solarBasis: state.chart.solarMeta.effectiveText,
                usedTimeMode: state.chart.solarMeta.usedMode
            },
            pillars: state.chart.pillars,
            seasonal: state.chart.seasonal,
            structure: state.chart.structure,
            roots: state.chart.roots,
            transformations: state.chart.transformations,
            blindPatterns: state.chart.blindPatterns,
            timingTriggers: state.chart.timingTriggers,
            shensha: state.chart.shensha,
            dayun: state.dayun.current,
            currentYear: state.currentYearEval,
            currentMonth: state.currentMonthEval,
            health: state.health,
            family: state.family,
            compatibility: state.compatibility?.result || null,
            references: references.map((entry) => ({
                title: entry.title,
                tags: entry.tags,
                source: entry.source,
                excerpt: entry.content.slice(0, 360)
            }))
        };
    }

    function buildPromptMessages(state, promptTemplate, references) {
        const payload = buildCorePayload(state, references);
        return [
            { role: "system", content: promptTemplate || DEFAULT_PROMPT_TEMPLATE },
            { role: "user", content: `请基于以下 JSON 数据生成完整中文分析报告，不要复述“我无法确定”之类的空话。\n${JSON.stringify(payload, null, 2)}` }
        ];
    }

    function buildAgentPromptMessages(state, promptTemplate, references, agentKey, agentOutputs = {}) {
        const payload = buildCorePayload(state, references);
        const agentInstruction = AGENT_INSTRUCTIONS[agentKey] || "";
        const previous = Object.entries(agentOutputs).map(([key, value]) => `${key}结论：\n${value}`).join("\n\n");
        const userPrompt = [
            `请以“${agentKey}”视角分析以下命盘数据。`,
            previous ? `前置 Agent 结论如下，请吸收但不要盲从：\n${previous}` : "",
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
