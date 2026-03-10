(function () {
    function buildReport(chart, dayun, liunian, liuyue, health, targetYear) {
        const favorableYears = liunian.filter((item) => item.score >= 75).map((item) => item.year);
        const sensitiveMonths = liuyue.filter((item) => item.score < 60).map((item) => `${item.month}月`);
        return [
            {
                title: "命局总览",
                body: `${chart.pillars[2].stem}${chart.pillars[2].branch}日主，${chart.structure.strength}。命局核心偏向${chart.structure.maxElement}，短板在${chart.structure.minElement}。从平衡角度看，${chart.structure.usefulElement}为主要调节力量，${chart.structure.supportiveElement}可作为辅助策略。`
            },
            {
                title: "阶段走势",
                body: `当前行运为${dayun.current.label}大运（${dayun.current.yearStart}-${dayun.current.yearEnd}），年龄段约在${dayun.current.ageStart}-${dayun.current.ageEnd}岁。${targetYear}年前后适合将重点放在节奏管理、资源整合与风险筛查。`
            },
            {
                title: "流年流月提示",
                body: favorableYears.length ? `较有利的流年包括：${favorableYears.join("、")}。月度层面需谨慎的时段主要是${sensitiveMonths.join("、")}，宜保守推进。` : "当前十年中明显顺风年份较少，适合稳健布局、降低高杠杆与高压力投入。"
            },
            {
                title: "健康与生活方式",
                body: health.risks.length
                    ? `当前命理健康侧重点在${health.risks.slice(0, 2).map((item) => item.element).join("、")}，常见风险点包括${health.risks[0].risk}。建议以作息稳定、饮食克制、适量运动和情绪减压作为基本盘。`
                    : "五行分布相对均衡，健康上更需要注意长期习惯的维持，避免阶段性透支。"
            }
        ];
    }

    function buildLuckySuggestions(chart, health) {
        const colorMap = { 木: "青绿", 火: "暖红", 土: "米黄", 金: "白金", 水: "深蓝" };
        return [
            `环境取向可偏向${chart.structure.usefulElement}属性，例如配色使用${colorMap[chart.structure.usefulElement]}、工作区加入对应材质或季节性活动。`,
            `日常选择以“补${chart.structure.minElement}、缓${chart.structure.maxElement}”为原则，不必追求神秘化，重点在持续性。`,
            health.suggestions[0] || "优先保证睡眠、运动和饮食节律，这是命理建议真正落地的基础。"
        ];
    }

    window.AIEngine = {
        buildReport,
        buildLuckySuggestions
    };
})();
