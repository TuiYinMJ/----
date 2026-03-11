(function () {
    const HEALTH_MAP = {
        木: { organs: ["肝", "胆", "筋膜", "眼"], risk: "情绪郁结、熬夜、肝胆代谢负担", advice: "规律睡眠、舒展拉伸、减少高压累积" },
        火: { organs: ["心", "小肠", "血脉", "舌"], risk: "心火偏旺、焦躁、炎性反应", advice: "控辛辣与咖啡因，重视放松和有氧节奏" },
        土: { organs: ["脾", "胃", "肌肉", "口"], risk: "脾胃运化压力、饮食失衡、湿重", advice: "饮食规律、减少寒凉甜腻、关注消化" },
        金: { organs: ["肺", "大肠", "皮肤", "鼻"], risk: "呼吸道敏感、皮肤干燥、免疫波动", advice: "保持湿润、规律呼吸训练、避免烟尘刺激" },
        水: { organs: ["肾", "膀胱", "骨", "耳"], risk: "精力透支、腰膝疲劳、寒湿累积", advice: "避免长期透支，注重保暖与恢复性休息" }
    };

    function analyzeHealth(chart) {
        const total = Object.values(chart.wuxing).reduce((sum, n) => sum + n, 0);
        const organScores = Object.entries(chart.wuxing).map(([element, value]) => {
            const ratio = value / total;
            let score = 82 - Math.abs(ratio - 0.2) * 180;
            if (element === chart.structure.minElement) score -= 8;
            if (element === chart.structure.maxElement) score -= 5;
            score = Math.max(48, Math.min(92, Math.round(score)));
            return {
                element,
                score,
                ...HEALTH_MAP[element]
            };
        });
        const risks = organScores.filter((item) => item.score < 72).sort((a, b) => a.score - b.score);
        return {
            organScores,
            risks,
            suggestions: organScores
                .sort((a, b) => a.score - b.score)
                .slice(0, 3)
                .map((item) => `${item.element}系需重点调理，建议关注${item.organs.join("、")}，以“${item.advice}”为主线。`)
        };
    }

    function describeCycleHealth(chart, evaluation, pillarText, scope) {
        const weakElements = Object.entries(chart.wuxing).sort((a, b) => a[1] - b[1]).map(([element]) => element);
        const cycleElements = [
            BaziCore.STEM_WUXING[BaziCore.STEMS.indexOf(pillarText[0])],
            BaziCore.BRANCH_WUXING[BaziCore.BRANCHES.indexOf(pillarText[1])]
        ];
        const watchElements = [...new Set([...cycleElements, weakElements[0], weakElements[1]])].slice(0, 3);
        const likely = watchElements.map((element) => {
            const info = HEALTH_MAP[element];
            return `${element}系要重点防 ${info.risk}，对应部位是${info.organs.join("、")}`;
        });
        const summary = evaluation.scores.health <= 58
            ? `${scope}健康面压力偏大，这不是只靠忍就能扛过去的阶段。`
            : evaluation.scores.health >= 72
                ? `${scope}恢复力相对较好，但状态好时也容易过度透支。`
                : `${scope}健康面中等，没有大坑，但很怕作息被你自己打乱。`;
        const advice = watchElements.map((element) => HEALTH_MAP[element].advice);
        return { summary, likely, advice };
    }

    window.HealthEngine = {
        analyzeHealth,
        HEALTH_MAP,
        describeCycleHealth
    };
})();
