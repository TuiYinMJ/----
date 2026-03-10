(function () {
    function buildReport(chart, dayun, currentYearEval, currentMonthEval, health, targetYear) {
        const yearHighlights = currentYearEval.highlights.join("；");
        const monthHighlights = currentMonthEval.highlights.join("；");
        return [
            {
                title: "命局总览",
                body: `${chart.pillars[2].stem}${chart.pillars[2].branch}日主，${chart.structure.strength}，命局旺点在${chart.structure.maxElement}，弱点在${chart.structure.minElement}。从平衡角度看，用神偏向${chart.structure.usefulElement}，辅助五行为${chart.structure.supportiveElement}。`
            },
            {
                title: "当前阶段",
                body: `当前处于${dayun.current.label}大运（${dayun.current.startYear}-${dayun.current.endYear}），起运日期约为${dayun.startSolar}。${targetYear} 年更适合围绕“节奏、资源、关系、身体恢复”四条线同时管理。`
            },
            {
                title: "年度提示",
                body: `${targetYear} 年对应 ${currentYearEval.label}，综合分 ${currentYearEval.scores.overall}。重点提示：${yearHighlights}`
            },
            {
                title: "月度提示",
                body: `当前参考月对应 ${currentMonthEval.label}，综合分 ${currentMonthEval.scores.overall}。重点提示：${monthHighlights}`
            },
            {
                title: "健康与执行",
                body: health.risks.length
                    ? `当前命理健康侧重点在${health.risks.slice(0, 2).map((item) => item.element).join("、")}，建议先稳住睡眠、饮食、情绪和运动恢复，再谈高强度突破。`
                    : "五行分布相对均衡，健康重心在长期习惯管理，避免阶段性透支。"
            }
        ];
    }

    function buildLuckySuggestions(chart, currentYearEval, currentMonthEval, health) {
        const colorMap = { 木: "青绿", 火: "暖红", 土: "米黄", 金: "白金", 水: "深蓝" };
        return [
            `外部环境可优先引入${chart.structure.usefulElement}属性，例如使用${colorMap[chart.structure.usefulElement]}、安排对应季节活动或空间布局。`,
            `年度重点放在分数最低的维度补短板：今年依次是事业 ${currentYearEval.scores.career}、财运 ${currentYearEval.scores.wealth}、感情 ${currentYearEval.scores.relation}、家庭 ${currentYearEval.scores.family}、健康 ${currentYearEval.scores.health}。`,
            `本月建议围绕“${currentMonthEval.highlights[0] || "稳节奏"}”执行，避免一边透支身体一边追求高强度结果。`,
            health.suggestions[0] || "先把睡眠和恢复节律稳住，再谈开运。"
        ];
    }

    window.AIEngine = {
        buildReport,
        buildLuckySuggestions
    };
})();
