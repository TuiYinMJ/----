(function () {
    function getWuxingSummary(chart) {
        const entries = Object.entries(chart.wuxing).sort((a, b) => b[1] - a[1]);
        const [strongest, weakest] = [entries[0], entries[entries.length - 1]];
        return `命局以${strongest[0]}势最显，${weakest[0]}相对偏弱；${chart.structure.strength}，宜重点参考${chart.structure.usefulElement}与${chart.structure.supportiveElement}的补偏思路。`;
    }

    function getShishenAnalysis(chart) {
        return chart.pillars.map((pillar) => ({
            title: `${pillar.label} · ${pillar.tenGod}`,
            body: `${pillar.stem}${pillar.branch}，天干属${pillar.stemElement}，地支属${pillar.branchElement}，藏干为${pillar.hidden.join("、")}。十神显示此柱对日主主要体现为${pillar.tenGod}的作用。`
        }));
    }

    function getPatternAnalysis(chart) {
        const { strength, dayElement, usefulElement, supportiveElement, maxElement, minElement } = chart.structure;
        const pattern = `${dayElement}日主，整体呈${strength}格局。局中${maxElement}较旺，${minElement}偏弱。`;
        const advice = strength === "身强"
            ? `宜取${usefulElement}制衡，辅以${supportiveElement}疏泄，避免同类五行进一步堆积。`
            : `宜取${usefulElement}生扶，辅以${supportiveElement}固本，避免克泄耗过重。`;
        return { pattern, advice };
    }

    function getEnvironmentAnalysis(chart, targetYear) {
        const yearPillar = BaziCore.cyclic(targetYear - 1984);
        const yearStem = yearPillar[0];
        const yearBranch = yearPillar[1];
        const yearElement = BaziCore.STEM_WUXING[BaziCore.STEMS.indexOf(yearStem)];
        const resonance = yearElement === chart.structure.usefulElement ? "顺势增强" : yearElement === chart.structure.dayElement ? "同气加重" : "中性波动";
        return {
            title: `${targetYear}年大环境：${yearPillar}`,
            body: `${targetYear} 年天干地支为 ${yearStem}${yearBranch}，岁运主气偏向${yearElement}。相对命局用神判断，此年属于${resonance}型环境，适合结合大运与流月进行节奏管理。`
        };
    }

    window.BaziAnalysis = {
        getWuxingSummary,
        getShishenAnalysis,
        getPatternAnalysis,
        getEnvironmentAnalysis
    };
})();
