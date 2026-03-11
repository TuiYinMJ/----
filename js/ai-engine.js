(function () {
    function joinList(list) {
        return list && list.length ? list.join("；") : "暂无明显特别项。";
    }

    function buildReport(chart, dayun, currentYearEval, currentMonthEval, health, targetYear) {
        return [
            {
                title: "先说结论",
                body: `${chart.pillars[2].stem}${chart.pillars[2].branch}日主，${chart.structure.strength}。你不是单纯运气好或不好，而是命局有明确长板也有明确短板。当前处于${dayun.current.label}大运（${dayun.current.startYear}-${dayun.current.endYear}），整体属于“${currentYearEval.blunt}”的年份。`
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

    window.AIEngine = {
        buildReport,
        buildLuckySuggestions
    };
})();
