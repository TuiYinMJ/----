(function () {
    const GOD_IMPACT = {
        比肩: { personality: 6, wealth: -3, career: 1, relation: -1, family: 3, child: 0 },
        劫财: { personality: 4, wealth: -5, career: 0, relation: -2, family: 2, child: 0 },
        食神: { personality: 4, wealth: 4, career: 4, relation: 2, family: 2, child: 7 },
        伤官: { personality: 6, wealth: 3, career: 2, relation: -4, family: -1, child: 5 },
        偏财: { personality: 1, wealth: 8, career: 4, relation: 3, family: 2, child: 1 },
        正财: { personality: 1, wealth: 10, career: 3, relation: 4, family: 3, child: 1 },
        七杀: { personality: 1, wealth: 0, career: 7, relation: 0, family: -2, child: -1 },
        正官: { personality: 1, wealth: 1, career: 9, relation: 3, family: 1, child: 0 },
        偏印: { personality: 4, wealth: -1, career: 3, relation: -1, family: 5, child: -2 },
        正印: { personality: 3, wealth: 0, career: 5, relation: 1, family: 6, child: -1 }
    };

    const DOMAIN_COLORS = {
        overall: "#9a3412",
        career: "#164e63",
        wealth: "#b45309",
        relation: "#be123c",
        family: "#4d7c0f",
        health: "#0f766e"
    };
    const TEN_GOD_PLAIN = {
        比肩: "自我、主见、并肩竞争",
        劫财: "同辈、争夺、资源分流",
        食神: "表达、口福、作品、子女缘",
        伤官: "锋芒、创造、突破、叛逆",
        偏财: "机会财、人脉财、外部资源",
        正财: "稳定财、现实责任、经营能力",
        七杀: "压力、决断、风险、执行",
        正官: "规则、职位、名分、责任",
        偏印: "直觉、悟性、非标准路径",
        正印: "学习、保护、依靠、长辈资源"
    };
    const SHENSHA_EXPLANATIONS = {
        华盖: "华盖常见于思考深、审美强、容易孤高或自我封闭的人。好处是悟性和独处力，坏处是容易不合群、想太多。",
        将星: "将星强调主导、担当和想掌控局面。好处是敢扛事，坏处是容易强势和不服输。",
        桃花: "桃花不是单纯烂桃花，更多是吸引力、审美、社交敏感度。好处是有人缘，坏处是关系更容易复杂。",
        地支重复: "地支重复说明某种主题被反复放大。好处是风格鲜明，坏处是优点和缺点都会更极端。",
        月日同支: "月日同支说明原生环境和自我/伴侣课题纠缠较深。好处是稳定，坏处是惯性太强，不容易跳出老模式。"
    };
    const TEN_GOD_EFFECTS = {
        比肩: { gift: "自己做主、扛事、能硬顶", risk: "固执、好胜、资源不让", work: "适合自己掌控节奏", relation: "容易谁都不让谁" },
        劫财: { gift: "人脉广、敢抢机会、反应快", risk: "分财、争抢、被同辈拖累", work: "适合快速抢机会", relation: "容易因利益和边界起冲突" },
        食神: { gift: "温和表达、稳定产出、懂享受", risk: "容易拖、容易松", work: "适合稳定输出和长期积累", relation: "相处时更会照顾氛围" },
        伤官: { gift: "思维活、敢说、敢破局", risk: "太直、顶撞规则、伤关系", work: "适合创作、策略、突破", relation: "嘴硬时很伤人" },
        偏财: { gift: "抓机会、会谈资源、外缘活", risk: "钱来得快也花得快", work: "适合客户、人脉、资源型路径", relation: "有吸引力，但容易心散" },
        正财: { gift: "务实、稳、能经营", risk: "过于现实或保守", work: "适合稳定经营和长期积累", relation: "更重责任和过日子" },
        七杀: { gift: "狠、快、执行力强", risk: "压力大、容易急躁和冒险", work: "适合高压和结果导向环境", relation: "容易把压力带进关系" },
        正官: { gift: "规矩、责任、名分感强", risk: "容易拘谨和怕出错", work: "适合制度化、专业型路径", relation: "重承诺，但不够松弛" },
        偏印: { gift: "悟性、直觉、旁门快", risk: "想太多、走偏门、抽离", work: "适合研究、非标准解法", relation: "有时让人摸不透" },
        正印: { gift: "学习力、保护力、贵人缘", risk: "依赖、拖延、想得多", work: "适合靠专业和资质累积", relation: "愿意照顾人，但也容易过度包裹" },
        日主: { gift: "本人核心气质", risk: "优缺点都在自己身上放大", work: "决定整盘落点", relation: "决定你在亲密关系里的基本态度" }
    };
    const PILLAR_POSITION_PLAIN = {
        年柱: "这根柱子主要管祖上、早年、外界第一印象和你带出来的家族底色。",
        月柱: "这根柱子主要管父母系统、成长环境、职业基本盘和现实习惯。",
        日柱: "这根柱子是你本人，也是夫妻宫和亲密关系最核心的位置。",
        时柱: "这根柱子主要管子女、晚景、后续计划、内心愿望和事情最后落点。"
    };

    function stat(stats, key) {
        return stats[key] || 0;
    }

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
        const stats = {};
        chart.pillars.forEach((pillar) => {
            const all = [pillar.tenGod, ...pillar.tenGodZhi];
            all.forEach((god) => {
                stats[god] = (stats[god] || 0) + 1;
            });
        });
        return stats;
    }

    function getWuxingSummary(chart) {
        const entries = Object.entries(chart.wuxing).sort((a, b) => b[1] - a[1]);
        const [strongest, weakest] = [entries[0], entries[entries.length - 1]];
        return `命局最重的是${strongest[0]}，最弱的是${weakest[0]}。直白说，就是你做事天然会往${strongest[0]}代表的方向偏，优点明显，但短板也会因为${weakest[0]}不足而暴露；所以不是一味追旺，而是要补偏救弊。`;
    }

    function getShishenAnalysis(chart) {
        return chart.pillars.map((pillar) => {
            const hiddenPairs = hiddenGodPairs(pillar);
            const relationSummary = summarizePillarRelations(chart, pillar.label);
            if (pillar.label === "日柱") {
                return buildSection(
                    `${pillar.label} · ${pillar.stem}${pillar.branch}`,
                    `日干是${pillar.stem}，这里不看“天干十神像别人”，而是直接看你自己和夫妻宫。`,
                    `${PILLAR_POSITION_PLAIN[pillar.label]} 日支里藏着${hiddenPairs.join("、")}，说明你在亲密关系里的反应，不是单纯一种模式，而是会把“${pillar.tenGodZhi.map((item) => TEN_GOD_EFFECTS[item]?.gift || item).join("、")}”这些东西一起带进去。${relationSummary.plain}`,
                    [
                        `优点：夫妻宫里有${pillar.tenGodZhi.join("、")}，意味着关系不一定平淡，通常会有推动力。`,
                        `现实面：藏干${pillar.hidden.join("、")}，说明关系不是单线条，外表和内里常常不同步。`,
                        ...relationSummary.positives
                    ],
                    [
                        `风险：日柱最怕把自己的惯性带进关系里，尤其是${pillar.tenGodZhi.map((item) => TEN_GOD_EFFECTS[item]?.risk || item).join("、")}这类问题。`,
                        `提醒：旬空${pillar.xunKong}时，关系和自我感受容易出现“说不清、抓不牢、落地慢”。`,
                        ...relationSummary.negatives
                    ],
                    "看日柱不能只问感情好不好，更要看你自己是什么样的人，以及你会把什么压力带进关系里。"
                );
            }
            const stemEffect = TEN_GOD_EFFECTS[pillar.tenGod] || TEN_GOD_EFFECTS.日主;
            return buildSection(
                `${pillar.label} · ${pillar.stem}${pillar.branch}`,
                `天干十神是${pillar.tenGod}，这表示在${pillar.label.replace("柱", "")}位上，你更容易先拿“${stemEffect.gift}”这一面给别人看。`,
                `${PILLAR_POSITION_PLAIN[pillar.label]} 但地支里真正压着的是${hiddenPairs.join("、")}，所以这根柱子不是一句“${pillar.tenGod}”就能看完的。遇到压力和现实分工时，它会把${pillar.tenGodZhi.map((god) => `${god}的${buildGodNarrative(god, "gift")}`).join("、")}一并带出来。${relationSummary.plain}`,
                [
                    `表层优点：${pillar.tenGod}常带来“${stemEffect.gift}”。`,
                    `落地方式：在${pillar.label}这个位置，更容易体现为${stemEffect.work}。`,
                    ...relationSummary.positives
                ],
                [
                    `底层风险：${pillar.tenGod}过头时会走向“${stemEffect.risk}”。`,
                    `地支补充：${pillar.tenGodZhi.join("、")}说明事情一复杂，就不只是一个十神在发作。`,
                    ...relationSummary.negatives
                ],
                `这根柱子的正确看法，不是把${pillar.tenGod}贴成固定标签，而是看它在${pillar.label.replace("柱", "")}位上具体怎么发力、怎么失控。`
            );
        });
    }

    function getPatternAnalysis(chart) {
        const direct = chart.structure.strength === "身强"
            ? `你不是扛不住事，而是容易太用力，太想自己拿主导。`
            : chart.structure.strength === "身弱"
                ? `你不是没能力，而是容易被环境、关系和任务强度压住。`
                : `整体不算偏激，优缺点都在，但成败很看时运和选择。`;
        const pattern = `${chart.pillars[2].stem}${chart.pillars[2].branch}日主，${chart.structure.strength}。命局旺点在${chart.structure.maxElement}，短板在${chart.structure.minElement}。`;
        const advice = `${direct} 用神偏向${chart.structure.usefulElement}，辅助用${chart.structure.supportiveElement}。${summarizePatternRelations(chart)} 胎元${chart.extras.taiYuan}、命宫${chart.extras.mingGong}、身宫${chart.extras.shenGong}可辅助看职业气质、阶段性压力和内在驱动力。`;
        return { pattern, advice };
    }

    function buildCycleOutcome(scores, gods, scope) {
        const opportunities = [];
        const risks = [];
        if (scores.wealth >= 74) opportunities.push("容易遇到钱、资源、客户、订单、项目回款上的机会。");
        if (scores.career >= 74) opportunities.push("事业面有推进窗口，适合争岗位、争结果、拿主导权。");
        if (scores.relation >= 74) opportunities.push("关系面相对顺，适合谈合作、修复沟通、推进关系。");
        if (scores.family >= 74) opportunities.push("家庭和现实支持度较高，适合处理房产、家庭分工、长辈事务。");
        if (scores.health >= 74) opportunities.push("恢复力较好，做事有劲，但也别因为状态好就硬撑。");
        if (scores.wealth <= 58) risks.push("钱财面容易有高支出、冲动决策、人情成本或回款拖延。");
        if (scores.career <= 58) risks.push("工作面容易卡在规则、流程、上级、考核，推进感会偏差。");
        if (scores.relation <= 58) risks.push("感情和合作容易误判立场，嘴硬、冷战、控制欲都可能加重矛盾。");
        if (scores.family <= 58) risks.push("家里或现实责任感偏重，容易因为长辈、房子、孩子、日常分工耗神。");
        if (scores.health <= 58) risks.push("身体和情绪恢复力会下滑，熬夜、上火、焦虑、旧疾波动都要防。");
        if (gods.includes("伤官")) risks.push("这个阶段说话容易太直，短期爽，长期容易得罪人或破坏合作。");
        if (gods.includes("偏财") || gods.includes("正财")) opportunities.push("适合盯住现金流、报价、客户关系和现实落地。");
        if (gods.includes("正官") || gods.includes("七杀")) risks.push("责任、规矩、考核会压上来，不适合凭情绪硬冲。");
        if (!opportunities.length) opportunities.push(`${scope}没有特别大的顺风，适合稳扎稳打、少犯错。`);
        if (!risks.length) risks.push(`${scope}没有明显硬伤，但别因为平稳就放松边界。`);
        return { opportunities: opportunities.slice(0, 3), risks: risks.slice(0, 3) };
    }

    function collectCycleRelations(chart, branch) {
        const palaces = [
            { label: "年柱", branch: chart.pillars[0].branch, domain: "长辈、外部环境、名声" },
            { label: "月柱", branch: chart.pillars[1].branch, domain: "父母系统、工作基本盘、现实压力" },
            { label: "日柱", branch: chart.pillars[2].branch, domain: "本人、夫妻宫、居住和核心关系" },
            { label: "时柱", branch: chart.pillars[3].branch, domain: "子女、计划、后续结果和晚景" }
        ];
        const signals = [];
        palaces.forEach((palace) => {
            const relation = BaziCore.getBranchRelation(branch, palace.branch);
            if (relation) {
                signals.push({ ...palace, relation });
            }
        });
        return signals;
    }

    function applyCycleRelationScores(scores, relationSignals) {
        relationSignals.forEach((signal) => {
            const { relation, label } = signal;
            const target = label === "日柱" ? "relation" : label === "月柱" ? "career" : "family";
            if (relation.type === "六合") {
                scores[target] += 6;
                scores.family += 2;
            }
            if (relation.type === "相冲") {
                scores[target] -= 9;
                scores.health -= 3;
            }
            if (relation.type === "相害") {
                scores[target] -= 5;
                scores.family -= 2;
            }
            if (relation.type === "相刑" || relation.type === "自刑") {
                scores[target] -= 6;
                scores.health -= 2;
            }
            if (relation.type === "同支") {
                scores[target] += 1;
                scores[target] -= 3;
            }
        });
    }

    function buildRelationNotes(relationSignals) {
        const positives = [];
        const negatives = [];
        relationSignals.forEach((signal) => {
            if (signal.relation.type === "六合") {
                positives.push(`流支与${signal.label}${signal.branch}六合，${signal.domain}更容易出现配合、牵引或机会。`);
            }
            if (signal.relation.type === "相冲") {
                negatives.push(`流支冲到${signal.label}${signal.branch}，${signal.domain}更容易出现变化、冲突、搬动或重组。`);
            }
            if (signal.relation.type === "相害") {
                negatives.push(`流支害到${signal.label}${signal.branch}，${signal.domain}表面不炸，但暗耗和误解会增加。`);
            }
            if (signal.relation.type === "相刑" || signal.relation.type === "自刑") {
                negatives.push(`流支与${signal.label}${signal.branch}${signal.relation.type}，${signal.domain}容易反复较劲、拉扯或内耗。`);
            }
        });
        return { positives: positives.slice(0, 2), negatives: negatives.slice(0, 3) };
    }

    function getBluntLine(scores) {
        if (scores.overall >= 78) return "整体偏顺，但顺的时候也最容易膨胀，别把好运当成自己永远正确。";
        if (scores.overall >= 66) return "有机会，但不是躺赢局，做得对就能拿结果，做错也会付代价。";
        if (scores.overall >= 56) return "好坏掺半，更多是现实博弈，不适合想得太美。";
        return "这段时间不算轻松，硬上容易吃亏，越逞强越容易放大问题。";
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
        [getStemElement(stem), getBranchElement(branch)].forEach((element) => {
            const bonus = elementBonus(chart, element);
            scores.career += bonus;
            scores.wealth += bonus * 0.9;
            scores.relation += bonus * 0.8;
            scores.family += bonus * 0.75;
            scores.health += bonus * 0.7;
        });
        if (chart.structure.strength === "身强" && [getStemElement(stem), getBranchElement(branch)].includes(chart.structure.dayElement)) {
            scores.health -= 4;
            scores.relation -= 2;
        }
        if (chart.structure.strength === "身弱" && [getStemElement(stem), getBranchElement(branch)].includes(BaziCore.controlElement(chart.structure.dayElement))) {
            scores.health -= 5;
            scores.career -= 3;
        }
        const relationSignals = collectCycleRelations(chart, branch);
        applyCycleRelationScores(scores, relationSignals);
        scores.overall = (scores.career + scores.wealth + scores.relation + scores.family + scores.health) / 5;
        Object.keys(scores).forEach((key) => {
            scores[key] = clampScore(scores[key]);
        });
        const outcome = buildCycleOutcome(scores, gods, scope);
        const relationNotes = buildRelationNotes(relationSignals);
        return {
            scope,
            label: pillarText,
            meta,
            scores,
            gods,
            opportunities: [...outcome.opportunities, ...relationNotes.positives].slice(0, 4),
            risks: [...outcome.risks, ...relationNotes.negatives].slice(0, 4),
            relationSignals,
            blunt: getBluntLine(scores)
        };
    }

    function buildSection(title, verdict, plain, positives, negatives, advice) {
        return { title, verdict, plain, positives, negatives, advice };
    }

    function pillarRole(label) {
        return {
            年柱: "年柱更偏向家族背景、早年环境、外界对你的第一印象。",
            月柱: "月柱更偏向成长环境、父母系统、工作习惯和你在现实中的基本盘。",
            日柱: "日柱是你自己，也是婚姻和亲密关系的核心落点。",
            时柱: "时柱偏向晚年、子女、内在愿望、后续计划和事情的结果。"
        }[label];
    }

    function hiddenGodPairs(pillar) {
        return pillar.hidden.map((hidden, index) => `${hidden}${pillar.tenGodZhi[index] ? `（${pillar.tenGodZhi[index]}）` : ""}`);
    }

    function getPillarRelations(chart, label) {
        return chart.branchRelations.filter((item) => item.from === label || item.to === label);
    }

    function buildGodNarrative(god, kind) {
        const meta = TEN_GOD_EFFECTS[god] || TEN_GOD_EFFECTS.日主;
        return meta[kind] || TEN_GOD_PLAIN[god] || god;
    }

    function describeRelationForPillar(label, relation) {
        if (relation.type === "三合" || relation.type === "三会") {
            return `${relation.type}${relation.element}局已经成形，说明盘里这股${relation.element}气不是偶发，是成系统在发力。`;
        }
        const otherLabel = relation.from === label ? relation.to : relation.from;
        const pairText = `${label}和${otherLabel}之间有${relation.type}`;
        if (relation.type === "六合") return `${pairText}，这会让${label.replace("柱", "")}位的事更容易被${otherLabel.replace("柱", "")}位牵动。`;
        if (relation.type === "相冲") return `${pairText}，这类事通常不会一直平，更多是变化、对撞和重组。`;
        if (relation.type === "相害") return `${pairText}，表面未必大吵，但误解、别扭、暗耗会增加。`;
        if (relation.type === "相刑" || relation.type === "自刑") return `${pairText}，事情容易反复拉扯、较劲和内耗。`;
        return `${pairText}，同类主题会被重复放大，好坏都更极端。`;
    }

    function summarizePillarRelations(chart, label) {
        const relations = getPillarRelations(chart, label);
        if (!relations.length) {
            return {
                plain: `${label}内部没有特别强的合冲刑害，相关事务更多看本柱本身的十神和藏干怎么发力。`,
                positives: ["这类柱位少一层外部拉扯，很多事情更看你自己怎么经营。"],
                negatives: ["没有明显硬碰硬不代表没事，只是问题更容易藏在日常习惯里。"]
            };
        }
        const positives = relations
            .filter((item) => ["六合", "三合", "三会"].includes(item.type))
            .map((item) => describeRelationForPillar(label, item))
            .slice(0, 2);
        const negatives = relations
            .filter((item) => !["六合", "三合", "三会"].includes(item.type))
            .map((item) => describeRelationForPillar(label, item))
            .slice(0, 2);
        return {
            plain: relations.map((item) => describeRelationForPillar(label, item)).slice(0, 2).join(" "),
            positives: positives.length ? positives : ["这个柱位没有特别强的助力关系，要靠后天经营把优点做实。"],
            negatives: negatives.length ? negatives : ["这个柱位没有特别硬的结构性冲撞，但该面对的责任不会自动消失。"]
        };
    }

    function summarizePatternRelations(chart) {
        if (!chart.branchRelations.length) return "原局内部没有特别强的合冲刑害成局，重点回到月令、日主强弱和十神布置本身。";
        return chart.branchRelations.map((item) => {
            if (item.type === "三合" || item.type === "三会") {
                return `${item.type}${item.element}局：${item.text}`;
            }
            return `${item.from}${item.to ? `与${item.to}` : ""}${item.type}：${item.text}`;
        }).slice(0, 4).join(" ");
    }

    function buildPillarInterpretations(chart) {
        return chart.pillars.map((pillar) => {
            const relationSummary = summarizePillarRelations(chart, pillar.label);
            const hiddenPairs = hiddenGodPairs(pillar);
            return buildSection(
                `${pillar.label} · ${pillar.stem}${pillar.branch}`,
                `${pillarRole(pillar.label)} 表层天干是${pillar.tenGod}，所以别人最先感受到的，多半是“${buildGodNarrative(pillar.tenGod, "gift")}”；但这并不等于全部。`,
                `这根柱子地支里藏着${hiddenPairs.join("、")}。白话说，你表面走的是${pillar.tenGod}路线，真正卡到利益、压力、关系和现实分工时，内里还会掺进${pillar.tenGodZhi.map((god) => buildGodNarrative(god, "gift")).join("、")}这些动力。${relationSummary.plain}`,
                [
                    `正面看，${pillar.tenGod}在${pillar.label.replace("柱", "")}位上通常意味着“${buildGodNarrative(pillar.tenGod, "work")}”。`,
                    `地势${pillar.diShi}、纳音${pillar.nayin}说明这股气不是空谈，而是会落到真实处境里。`,
                    ...relationSummary.positives
                ].slice(0, 3),
                [
                    `反面看，${pillar.tenGod}过头时会走向“${buildGodNarrative(pillar.tenGod, "risk")}”。`,
                    `旬空${pillar.xunKong}说明这根柱相关事务在某些阶段容易出现“嘴上有、心里有、落实慢”的感觉。`,
                    ...relationSummary.negatives
                ].slice(0, 3),
                `判断这根柱时，至少要同时看天干十神、藏干十神、${pillar.label.replace("柱", "")}位职责和它与其他柱的合冲刑害，少看一层都容易失真。`
            );
        });
    }

    function buildUsefulAnalysis(chart) {
        const avoid = chart.structure.strength === "身强"
            ? [chart.structure.maxElement, chart.structure.dayElement]
            : [BaziCore.controlElement(chart.structure.dayElement), chart.structure.minElement];
        return [
            buildSection(
                "用神重点",
                `当前命局主要用神偏向${chart.structure.usefulElement}，辅助用${chart.structure.supportiveElement}。`,
                "白话说，不是你缺什么就机械补什么，而是要补能让整个结构重新平衡的那股力量。",
                [
                    `${chart.structure.usefulElement}相关的环境、行业、节奏、习惯更容易帮你把盘面拉回正位。`,
                    `${chart.structure.supportiveElement}可以做辅助，但通常不能代替主用神。`
                ],
                [
                    "如果只看表面喜欢什么，不看真正用神，很容易越补越偏。",
                    "用神只是方向，不是万能按钮，现实选择仍然决定结果。"
                ],
                "先把生活方式、工作节奏、人际结构往用神方向调，再看外在开运物。"
            ),
            buildSection(
                "忌神与避讳",
                `当前最需要防的是${avoid.join("、")}被继续放大。`,
                "白话说，你的问题不一定来自“没有”，也可能来自“太多了还继续堆”。",
                [
                    "知道忌神的价值，在于你会知道哪些环境和选择在放大你的短板。",
                    "避讳不是迷信禁忌，而是减少明显对自己不利的决策。"
                ],
                [
                    `如果继续放大${avoid[0]}，原本的优点可能直接转成压力和内耗。`,
                    "忌神旺的时候，人很容易自我感觉没问题，但旁人已经很难受。"
                ],
                "少做会持续放大旧毛病的选择，尤其是在压力大、状态差的时候。"
            ),
            buildSection(
                "实操宜忌",
                "真正有用的宜忌，必须落在日常决策上。",
                "白话说，这不是让你背口诀，而是让你知道什么该多做，什么该少碰。",
                [
                    "宜：顺着用神选节奏、选合作方式、选恢复方法。",
                    "宜：在强项上发力，但别把强项用成压别人和压自己的工具。"
                ],
                [
                    "忌：情绪上头时做大决定。",
                    "忌：只顾眼前爽感，不管长期代价。"
                ],
                "最好的用神策略，不是迷信神秘感，而是做让自己长期更稳的选择。"
            )
        ];
    }

    function buildShenshaDetails(chart) {
        const cards = chart.shensha.map((item) => buildSection(
            item,
            SHENSHA_EXPLANATIONS[item] || `${item}本身不是好坏绝对词，而是某一类主题被放大。`,
            "白话说，神煞不是一票否决，也不是一票保送，而是提示你哪些性格和事件类型会更明显。",
            ["好处：抓住这类神煞的正面表现，可以把它变成风格和优势。"] ,
            ["风险：只看神煞不看全局，很容易误判。"] ,
            "神煞要结合四柱、用神、大运流年一起看，单拿出来意义有限。"
        ));
        chart.branchRelations.forEach((relation) => {
            const title = relation.type === "三合" || relation.type === "三会"
                ? `${relation.type}${relation.element}局`
                : `${relation.from}${relation.to ? `与${relation.to}` : ""}${relation.type}`;
            const verdict = relation.type === "六合" || relation.type === "三合" || relation.type === "三会"
                ? `${title}说明原局内部有明显的联动和成局。`
                : `${title}说明原局内部不是平铺直叙，某些宫位之间会直接互相牵动。`;
            const plain = relation.type === "三合" || relation.type === "三会"
                ? `${relation.text} 白话说，盘里这股${relation.element}气成系统了，相关优点和毛病都会成片出现。`
                : `${relation.text} 白话说，${relation.from}和${relation.to}对应的事务会互相扯着走，不会各算各的。`;
            const positives = relation.type === "六合" || relation.type === "三合" || relation.type === "三会"
                ? ["顺着这股结构去做事，会比逆着干更省力。"]
                : ["这类结构不一定全坏，关键在于你是否提前看懂牵动点。"];
            const negatives = relation.type === "相冲" || relation.type === "相害" || relation.type === "相刑" || relation.type === "自刑"
                ? ["如果忽视这类结构，相关关系和事务通常会在压力期集中爆出来。"]
                : ["即使是合，也可能合住、拖住、黏住，不代表绝对轻松。"];
            cards.push(buildSection(title, verdict, plain, positives, negatives, "结构关系要落实到宫位上看，尤其要看它究竟碰到了年柱、月柱、日柱还是时柱。"));
        });
        cards.push(
            buildSection("命宫与身宫", `命宫${chart.extras.mingGong}，身宫${chart.extras.shenGong}。`, "白话说，命宫更像你的大方向和底色，身宫更像你真正动起来时会往哪种状态跑。", ["命宫适合看人生主题。", "身宫适合看执行状态和真正发力点。"], ["命宫和身宫好的时候不代表不用努力。", "命宫和身宫有压的时候，也不代表注定差。"], "把命宫当方向，把身宫当落地方式，会更实用。")
        );
        return cards;
    }

    function buildFocusNarrative(chart, evaluation, scope) {
        return buildSection(
            `${scope} · ${evaluation.meta}`,
            evaluation.blunt,
            `白话说，这个${scope}不是简单的吉或凶，而是有得有失。综合分 ${evaluation.scores.overall}，事业 ${evaluation.scores.career}，财运 ${evaluation.scores.wealth}，感情 ${evaluation.scores.relation}，家庭 ${evaluation.scores.family}，健康 ${evaluation.scores.health}。`,
            evaluation.opportunities,
            evaluation.risks,
            `处理这个${scope}的关键，不是盲目乐观或悲观，而是先承认现实，再决定怎么取舍。`
        );
    }

    function buildMasterSummary(chart, currentYearEval, currentMonthEval) {
        return [
            buildSection(
                "总断",
                `${chart.structure.strength}，强弱有偏，优缺点都很鲜明。`,
                "白话说，这种盘最怕的不是没有机会，而是机会来时把自己的老毛病也一起放大。",
                [currentYearEval.opportunities[0], currentMonthEval.opportunities[0]].filter(Boolean),
                [currentYearEval.risks[0], currentMonthEval.risks[0]].filter(Boolean),
                "道长视角最看重的是可持续，不是一次冲高。"
            ),
            buildSection(
                "先抓什么",
                "先稳住最容易出问题的那一项，再谈放大优势。",
                "白话说，真正有效的断法不是只说你哪里好，而是先告诉你哪里最容易坏。",
                ["先抓用神方向。", "先抓身体和作息。", "先抓钱和关系边界。"],
                ["别一边透支身体，一边追求表面顺。", "别拿侥幸心理当策略。"],
                "把风险先压住，命局好的那部分自然会开始发力。"
            )
        ];
    }

    function buildDetailedAnalysis(chart, currentYearEval) {
        const stats = getGodStats(chart);
        const food = stat(stats, "食神") + stat(stats, "伤官");
        const wealth = stat(stats, "正财") + stat(stats, "偏财");
        const officer = stat(stats, "正官") + stat(stats, "七杀");
        const print = stat(stats, "正印") + stat(stats, "偏印");
        const peer = stat(stats, "比肩") + stat(stats, "劫财");
        return [
            buildSection(
                "性格",
                chart.structure.strength === "身强" ? "主见重，执行力强，但也容易轴。" : chart.structure.strength === "身弱" ? "敏感、顾虑多，容易先想风险再行动。" : "弹性还可以，但状态受环境影响明显。",
                `白话说，你不是单纯“好”或“坏”，而是优点和短板绑在一起。${chart.structure.maxElement}旺让你在某些场景特别有感觉，但也容易在同一件事上过度。`,
                [
                    peer ? "遇到竞争不太怵，基本不会完全没主见。" : "不太爱跟人硬碰硬，反而更懂观察局势。",
                    print ? "学习、理解、消化信息的能力不差。" : "做事更重现实和结果，不太喜欢空谈。"
                ],
                [
                    stat(stats, "伤官") ? "容易嘴快、看人看事太直，关系里可能伤人不自知。" : "表达虽然稳，但有时会把话憋着，后面一次性爆出来。",
                    chart.structure.minElement ? `${chart.structure.minElement}弱的地方就是你的短板，越累越明显。` : "状态不好时，短板会被放大。"
                ],
                "对自己最有帮助的不是“装圆滑”，而是先知道自己在哪些情境下会过火，再主动收一点。"
            ),
            buildSection(
                "财运",
                wealth >= 3 ? "有赚钱敏感度，但守财和风险控制要另外练。" : "钱不是完全没机会，但更像慢慢积累，不适合赌运气。",
                `当前年度财运分 ${currentYearEval.scores.wealth}。白话说，今年钱的事不是只看有没有机会，更看你会不会因为贪快、要面子、讲义气而漏财。`,
                [
                    wealth ? "原局财星不算弱，现实感和资源意识还在。" : "原局财星不多，反而适合用稳定策略累积，而不是到处追机会。",
                    currentYearEval.scores.wealth >= 70 ? "今年更适合谈合作、调整收入结构、做资源置换。" : "今年适合先守现金流，把漏洞补上。"
                ],
                [
                    peer ? "比劫有力时，容易被同辈竞争、合伙分配、人情开支拖累。" : "看似省心，但也要防对价格和价值判断不够敏锐。",
                    currentYearEval.scores.wealth <= 58 ? "今年花钱容易超过预期，尤其是情绪型消费和被动支出。" : "财务面有波动，别把短期回款当长期稳定。"
                ],
                "钱的判断要比感受更硬，报价、合同、现金流、分工都要写清楚。"
            ),
            buildSection(
                "事业",
                officer >= 3 ? "事业心和责任课题重，越往上走越吃纪律和结构。" : "事业更多靠个人发挥和机缘，不完全靠制度线。",
                `当前年度事业分 ${currentYearEval.scores.career}。白话说，工作能不能上去，不只看你会不会做，还看你能不能长期稳定地把事做成。`,
                [
                    officer ? "有承担事情、进入规则、背任务的能力。" : "灵活性较高，适合项目制、变化快、靠输出见长的路径。",
                    print ? "印星在时，专业积累和学习升级更容易形成壁垒。" : "不太依赖学历话术，更适合靠实战拿结果。"
                ],
                [
                    stat(stats, "七杀") ? "压力一大就容易急、硬、想直接顶过去，容易伤协作。" : "不够狠的时候，机会到了也可能犹豫。",
                    currentYearEval.scores.career <= 58 ? "今年容易碰到卡审批、卡上级、卡流程，不适合纯靠蛮力。" : "今年能推事，但不能忽视组织内的关系和顺序。"
                ],
                "事业真正的分水岭不在灵感，而在能否持续、守规则、扛结果。"
            ),
            buildSection(
                "感情与婚姻",
                currentYearEval.scores.relation >= 72 ? "有推进关系的窗口，但不代表自动稳定。" : "关系课题偏重，好的时候能甜，差的时候也容易很累。",
                "白话说，你在关系里最怕的不是没人，而是两个人都带着自己的硬点，谁都不愿意先让一步。",
                [
                    wealth || officer ? "原局里有一定关系感，不是完全不懂亲密关系。" : "反而不容易被关系绑死，选择上更能看现实。",
                    currentYearEval.scores.relation >= 72 ? "今年更适合坦白沟通、定规则、推进承诺。" : "今年适合先清理误解和边界，不适合强推结果。"
                ],
                [
                    stat(stats, "伤官") ? "说话方式是关系里的高频风险点，容易对人不对事。" : "表面稳定，但内心不满累积久了也会突然翻旧账。",
                    currentYearEval.scores.relation <= 58 ? "今年容易因为工作、金钱、家事和期待差异闹矛盾。" : "关系能走下去，靠的是现实协同，不是热情本身。"
                ],
                "感情不能只看感觉，要看价值观、生活方式、财务观和冲突处理能力。"
            ),
            buildSection(
                "六亲总览",
                "六亲不是单看一颗星，而是看你怎么跟责任、资源和情绪相处。",
                "白话说，家里人和亲密关系会不会成为助力，很多时候取决于你自己怎么设边界、怎么讲话、怎么承担。",
                [
                    print ? "长辈支持、学历资源、被照顾感相对不差。" : "长辈资源不一定强，但更能靠自己练出来。",
                    peer ? "同辈互动多，遇事不至于完全单打独斗。" : "同辈牵扯少一点，省了一部分内耗。"
                ],
                [
                    wealth ? "现实和金钱会成为家里关系的重要议题。" : "不是没有感情，而是现实支持更多靠后天经营。",
                    officer ? "责任感会压到亲密关系和家庭分工上。" : "家里看似轻一点，但也容易没人帮你兜底。"
                ],
                "六亲关系要看长期，不要只拿一次冲突或一次帮忙就下定论。"
            )
        ];
    }

    function buildFamilyAnalysis(chart, currentYearEval) {
        const stats = getGodStats(chart);
        const food = stat(stats, "食神") + stat(stats, "伤官");
        const print = stat(stats, "正印") + stat(stats, "偏印");
        const peer = stat(stats, "比肩") + stat(stats, "劫财");
        const wealth = stat(stats, "正财") + stat(stats, "偏财");
        const officer = stat(stats, "正官") + stat(stats, "七杀");
        const parentRelations = summarizePillarRelations(chart, "月柱");
        const yearRelations = summarizePillarRelations(chart, "年柱");
        const spouseRelations = summarizePillarRelations(chart, "日柱");
        const childRelations = summarizePillarRelations(chart, "时柱");
        return [
            buildSection(
                "父母长辈",
                print >= 3 ? "长辈缘不算薄，但支持往往伴随期待和压力。" : "长辈支持有限，更容易早早靠自己。",
                `白话说，父母长辈能不能帮到你，不只是有没有资源，还看彼此沟通模式会不会让帮忙变成束缚。${parentRelations.plain} ${yearRelations.plain}`,
                [print ? "遇事通常不会完全没人兜底。" : "虽然外援少，但反而更能培养独立性。", ...parentRelations.positives].slice(0, 3),
                [currentYearEval.scores.family <= 60 ? "今年容易因为长辈健康、观念、催促或现实安排耗心。": "家庭事务阶段性会占用精力。", ...yearRelations.negatives].slice(0, 3),
                "对长辈既要讲感情，也要讲边界，别把所有责任都扛成自己的。"
            ),
            buildSection(
                "兄弟姐妹与同辈",
                peer >= 3 ? "同辈联系重，互相影响也重。" : "同辈缘不算特别深，反而少一些拉扯。",
                "白话说，兄弟姐妹、朋友、同辈既可能是你的助推器，也可能是你的消耗源。",
                [peer ? "遇到事更容易找到人商量、结伴、互相借力。" : "同辈竞争和攀比相对少一些。"] ,
                [peer ? "钱、面子、合作分配不清时，最容易在同辈关系里翻脸。" : "人脉虽然清爽，但关键时刻也可能缺少强力队友。"] ,
                "同辈关系最怕模糊，借钱、合作、帮忙都要有边界。"
            ),
            buildSection(
                "子嗣",
                food >= 3 ? "子女缘和表达欲都不弱，但越有缘越要学会耐心。" : "子嗣课题不是没有，只是不会特别早或特别轻松地显现。",
                `白话说，子女这块看的不只是有没有，而是你跟孩子、作品、后代责任之间的关系是否顺。${childRelations.plain}`,
                [food ? "食伤不弱时，通常对子女、作品、教育、传承更有投入感。" : "食伤不旺时，孩子相关事务更看时运和现实安排。", ...childRelations.positives].slice(0, 3),
                [food && stat(stats, "偏印") + stat(stats, "正印") >= 3 ? "想得太多、管得太细时，容易对子女或后辈形成控制感。" : "子嗣课题若启动，现实压力会直接反映在作息和经济上。", ...childRelations.negatives].slice(0, 3),
                "子嗣分析不能替代医学结论，但能提醒你：这块要准备的不只是身体，还有时间、耐心、金钱和责任。"
            ),
            buildSection(
                "伴侣与家庭经营",
                officer + wealth >= 4 ? "关系和家庭课题很难完全绕开，是命里的重点功课。" : "感情家庭不是唯一主线，但处理不好一样会拖全局。",
                `白话说，婚姻不是有缘就行，而是两个人能不能一起扛现实、说人话、守承诺。${spouseRelations.plain}`,
                [currentYearEval.scores.relation >= 70 ? "今年适合把关系往现实层面推进，比如见家长、谈承诺、谈分工。" : "今年更适合先磨合和观察。", ...spouseRelations.positives].slice(0, 3),
                [currentYearEval.scores.relation <= 60 ? "今年关系容易被工作、钱、家事拖累，情绪化处理只会更糟。" : "即便关系顺，也要防一方热、一方累。", ...spouseRelations.negatives].slice(0, 3),
                "家庭经营最怕默认，钱谁管、事谁做、冲突怎么收，都要提前说。"
            )
        ];
    }

    function getEnvironmentAnalysis(chart, targetYear) {
        const liuNianSolar = Solar.fromYmdHms(targetYear, 6, 15, 12, 0, 0);
        const pillar = liuNianSolar.getLunar().getYearInGanZhiExact();
        const element = getStemElement(pillar[0]);
        const status = element === chart.structure.usefulElement
            ? "比较顺手"
            : element === chart.structure.dayElement
                ? "会把你的原有倾向放大"
                : "偏中性";
        return {
            title: `${targetYear}年大环境：${pillar}`,
            body: `${targetYear} 年的岁运主气偏${element}。白话说，这一年外部环境会更强调${element}对应的节奏和议题。对你来说，它整体属于${status}型年份，不会决定一切，但会放大你原来的优缺点。`
        };
    }

    window.BaziAnalysis = {
        DOMAIN_COLORS,
        evaluateCycle,
        buildDetailedAnalysis,
        buildFamilyAnalysis,
        buildPillarInterpretations,
        buildUsefulAnalysis,
        buildShenshaDetails,
        buildFocusNarrative,
        buildMasterSummary,
        getWuxingSummary,
        getShishenAnalysis,
        getPatternAnalysis,
        getEnvironmentAnalysis
    };
})();
