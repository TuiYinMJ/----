(function () {
    const GOD_IMPACT = {
        比肩: { personality: 6, wealth: -3, career: 1, relation: -1, family: 4 },
        劫财: { personality: 4, wealth: -5, career: 0, relation: -2, family: 3 },
        食神: { personality: 5, wealth: 4, career: 4, relation: 3, family: 2 },
        伤官: { personality: 6, wealth: 3, career: 2, relation: -3, family: -1 },
        偏财: { personality: 2, wealth: 8, career: 4, relation: 3, family: 2 },
        正财: { personality: 1, wealth: 10, career: 3, relation: 4, family: 3 },
        七杀: { personality: 2, wealth: 0, career: 7, relation: 1, family: -1 },
        正官: { personality: 2, wealth: 1, career: 9, relation: 3, family: 1 },
        偏印: { personality: 4, wealth: -1, career: 3, relation: -1, family: 4 },
        正印: { personality: 3, wealth: 0, career: 5, relation: 1, family: 5 }
    };

    const DOMAIN_COLORS = {
        overall: "#9a3412",
        career: "#164e63",
        wealth: "#b45309",
        relation: "#be123c",
        family: "#4d7c0f",
        health: "#0f766e"
    };

    function getStemElement(stem) {
        return BaziCore.STEM_WUXING[BaziCore.STEMS.indexOf(stem)];
    }

    function getBranchElement(branch) {
        return BaziCore.BRANCH_WUXING[BaziCore.BRANCHES.indexOf(branch)];
    }

    function getTenGod(dayGan, targetGan) {
        return LunarUtil.SHI_SHEN[dayGan + targetGan];
    }

    function elementBonus(chart, element) {
        let bonus = 0;
        if (element === chart.structure.usefulElement) bonus += 8;
        if (element === chart.structure.supportiveElement) bonus += 5;
        if (element === chart.structure.maxElement) bonus -= chart.structure.strength === "身强" ? 4 : 0;
        if (element === chart.structure.minElement) bonus -= 2;
        return bonus;
    }

    function clampScore(value) {
        return Math.max(35, Math.min(95, Math.round(value)));
    }

    function getGodStats(chart) {
        const dayGan = chart.pillars[2].stem;
        const stats = {};
        chart.pillars.forEach((pillar) => {
            const all = [pillar.tenGod, ...pillar.tenGodZhi];
            all.forEach((god) => {
                stats[god] = (stats[god] || 0) + 1;
            });
        });
        stats.dayGan = dayGan;
        return stats;
    }

    function getWuxingSummary(chart) {
        const entries = Object.entries(chart.wuxing).sort((a, b) => b[1] - a[1]);
        const [strongest, weakest] = [entries[0], entries[entries.length - 1]];
        return `命局以${strongest[0]}势最显，${weakest[0]}相对偏弱；日主为${chart.pillars[2].stem}${chart.pillars[2].branch}，整体判为${chart.structure.strength}，用神偏向${chart.structure.usefulElement}。`;
    }

    function getShishenAnalysis(chart) {
        return chart.pillars.map((pillar) => ({
            title: `${pillar.label} · ${pillar.stem}${pillar.branch}`,
            body: `天干十神为${pillar.tenGod}，地支十神为${pillar.tenGodZhi.join("、")}；藏干${pillar.hidden.join("、")}，纳音${pillar.nayin}，地势${pillar.diShi}，旬空${pillar.xunKong}。`
        }));
    }

    function getPatternAnalysis(chart) {
        const base = [
            `${chart.pillars[2].stem}${chart.pillars[2].branch}日主，${chart.structure.strength}。`,
            `命局旺点在${chart.structure.maxElement}，短板在${chart.structure.minElement}。`,
            `平衡思路宜取${chart.structure.usefulElement}，辅以${chart.structure.supportiveElement}。`
        ].join("");
        const extras = `胎元${chart.extras.taiYuan}、命宫${chart.extras.mingGong}、身宫${chart.extras.shenGong}，可作为职业方向、处世风格和阶段判断的辅助参考。`;
        return { pattern: base, advice: extras };
    }

    function evaluateCycle(chart, pillarText, scope, meta) {
        const dayGan = chart.pillars[2].stem;
        const stem = pillarText[0];
        const branch = pillarText[1];
        const gods = [getTenGod(dayGan, stem), ...LunarUtil.ZHI_HIDE_GAN[branch].map((gan) => getTenGod(dayGan, gan))];
        const scores = { overall: 60, personality: 60, career: 60, wealth: 60, relation: 60, family: 60, health: 60 };
        gods.forEach((god, index) => {
            const impact = GOD_IMPACT[god] || {};
            scores.personality += (impact.personality || 0) * (index === 0 ? 1.2 : 0.65);
            scores.career += (impact.career || 0) * (index === 0 ? 1.15 : 0.6);
            scores.wealth += (impact.wealth || 0) * (index === 0 ? 1.15 : 0.6);
            scores.relation += (impact.relation || 0) * (index === 0 ? 1.1 : 0.6);
            scores.family += (impact.family || 0) * (index === 0 ? 1.05 : 0.55);
        });
        const stemElement = getStemElement(stem);
        const branchElement = getBranchElement(branch);
        [stemElement, branchElement].forEach((element) => {
            const bonus = elementBonus(chart, element);
            scores.career += bonus;
            scores.wealth += bonus * 0.9;
            scores.relation += bonus * 0.8;
            scores.family += bonus * 0.75;
            scores.health += bonus * 0.7;
        });
        if (chart.structure.strength === "身强" && [stemElement, branchElement].includes(chart.structure.dayElement)) {
            scores.health -= 4;
            scores.relation -= 2;
        }
        if (chart.structure.strength === "身弱" && [stemElement, branchElement].includes(BaziCore.controlElement(chart.structure.dayElement))) {
            scores.health -= 5;
            scores.career -= 3;
        }
        scores.overall = (scores.career + scores.wealth + scores.relation + scores.family + scores.health) / 5;
        Object.keys(scores).forEach((key) => {
            scores[key] = clampScore(scores[key]);
        });
        return {
            scope,
            label: pillarText,
            meta,
            scores,
            gods,
            highlights: buildHighlights(chart, scores, gods, scope, meta)
        };
    }

    function buildHighlights(chart, scores, gods, scope, meta) {
        const notes = [];
        if (scores.wealth >= 76) notes.push("财务机会增多，适合谈资源、订单、现金流优化。");
        if (scores.career >= 76) notes.push("事业推进较顺，利岗位上升、项目落地、权责扩大。");
        if (scores.relation >= 76) notes.push("感情与合作窗口较好，适合沟通、确定关系或修复误解。");
        if (scores.wealth <= 58) notes.push("财务支出和人情成本偏高，避免高风险投资和冲动消费。");
        if (scores.career <= 58) notes.push("工作压力偏大，容易出现流程、制度或上级层面的卡点。");
        if (scores.relation <= 58) notes.push("感情和合作容易硬碰硬，表达方式需要更柔和。");
        if (scores.health <= 58) notes.push("身体恢复力下降，注意熬夜、情绪和旧疾波动。");
        if (gods.includes("伤官")) notes.push("表达欲强，适合创作与突破，但要防顶撞规则。");
        if (gods.includes("正财") || gods.includes("偏财")) notes.push("适合关注收入结构、谈判、客户与现金管理。");
        if (gods.includes("正官") || gods.includes("七杀")) notes.push("需要更强执行力和纪律性，也更易遇到考核压力。");
        if (!notes.length) notes.push(`${scope}整体中性，以稳步推进、少犯错为主。`);
        return notes.slice(0, 4);
    }

    function getEnvironmentAnalysis(chart, targetYear) {
        const liuNianSolar = Solar.fromYmdHms(targetYear, 6, 15, 12, 0, 0);
        const pillar = liuNianSolar.getLunar().getYearInGanZhiExact();
        const element = getStemElement(pillar[0]);
        const status = element === chart.structure.usefulElement
            ? "顺势增强"
            : element === chart.structure.dayElement
                ? "同气加重"
                : "偏中性";
        return {
            title: `${targetYear}年大环境：${pillar}`,
            body: `${targetYear} 年岁运主气偏向${element}，相对命局属于${status}型年份。外部环境会放大${element}的主题，适合结合当前大运和流月管理节奏。`
        };
    }

    function buildDetailedAnalysis(chart, currentYearEval) {
        const stats = getGodStats(chart);
        const dayMaster = chart.pillars[2].stem;
        const sections = [
            {
                title: "性格",
                body: `${dayMaster}日主，${chart.structure.strength}。命局${chart.structure.maxElement}偏旺，通常表现为主观能动性较强；${((stats.正印 || 0) + (stats.偏印 || 0)) ? "也带有思考和吸收能力。" : "做事更重行动反馈。"} ${stats.伤官 ? "表达锋芒较足，适合创意与突破，但要防情绪外露。" : "整体表达偏稳。"}`
            },
            {
                title: "财运",
                body: `原局财星出现 ${stats.正财 || 0} 次正财、${stats.偏财 || 0} 次偏财。当前阶段财务分 ${currentYearEval.scores.wealth}，更适合${currentYearEval.scores.wealth >= 72 ? "主动争取资源、谈合作、做结构优化" : "守住现金流、避免高杠杆和短线冒进"}。`
            },
            {
                title: "事业",
                body: `官杀出现 ${stats.正官 || 0} 次正官、${stats.七杀 || 0} 次七杀，印星出现 ${stats.正印 || 0} 次正印、${stats.偏印 || 0} 次偏印。说明你在制度、专业、职位、职责上的课题较明显。当前事业分 ${currentYearEval.scores.career}，${currentYearEval.scores.career >= 72 ? "适合冲岗位、争项目、做结果" : "宜控节奏、减少硬碰硬"}。`
            },
            {
                title: "感情",
                body: `感情与合作分 ${currentYearEval.scores.relation}。${currentYearEval.scores.relation >= 72 ? "当下更适合推进沟通、确认关系、修复连接。" : "当下更要防冷战、误解、标准过高或表达过硬。"} 配偶/伴侣课题通常会被财星、官星和日支状态共同放大。`
            },
            {
                title: "六亲",
                body: `比劫反映同辈与竞争，印星反映长辈支持，食伤反映子女与表达，财星反映父缘与现实资源，官杀反映伴侣与压力结构。当前建议把六亲关系的重点放在“边界、沟通、责任分配”上，而不是单纯情绪反应。`
            }
        ];
        return sections;
    }

    window.BaziAnalysis = {
        DOMAIN_COLORS,
        evaluateCycle,
        buildDetailedAnalysis,
        getWuxingSummary,
        getShishenAnalysis,
        getPatternAnalysis,
        getEnvironmentAnalysis
    };
})();
