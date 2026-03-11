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
        月日同支: "月日同支说明原生环境和自我/伴侣课题纠缠较深。好处是稳定，坏处是惯性太强，不容易跳出老模式。",
        天乙贵人: "天乙贵人是常见的贵人神煞，通常代表关键时刻有人愿意搭把手、给渠道、给台阶。",
        文昌贵人: "文昌贵人偏学业、考试、证书、写作和理解力，不等于一定高学历，但通常利于脑力输出。",
        驿马: "驿马主变动、外出、迁移、出差、跳槽和空间转换。好处是动中生机，坏处是动得太频繁也累。",
        羊刃: "羊刃是力量太硬的信号。好处是敢冲、敢扛、能顶压，坏处是容易用力过猛，带来冲突、伤病或手术主题。",
        魁罡: "魁罡强调刚、硬、极端和不服输。好处是有骨头、有执行，坏处是过刚则折，不容易转弯。",
        空亡: "空亡不是绝对没有，而是事情容易出现落空、延迟、预期有但落地慢，或阶段性白忙的感觉。"
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
    const PALACE_PHASE = {
        年柱: "早年与外部名声层",
        月柱: "青年到中年的现实承压层",
        日柱: "核心关系与本人状态层",
        时柱: "中晚年结果与子女层"
    };
    const BLIND_EVENT_HINT = {
        相穿: "穿到位时，往往不是一次爆炸，而是持续消耗，常见为钱和关系被慢慢穿空。",
        相破: "破到位时，多见合作破局、计划推倒重来、承诺失效。",
        相冲: "冲到位时，常见搬动、换岗、分合、关系对撞。",
        相刑: "刑到位时，常见反复较劲、流程卡壳、内耗加剧。",
        自刑: "自刑多为自己拧自己，容易在同类问题上循环。"
    };
    const STEM_HE_RELATIONS = {
        甲: { mate: "己", element: "土" },
        乙: { mate: "庚", element: "金" },
        丙: { mate: "辛", element: "水" },
        丁: { mate: "壬", element: "木" },
        戊: { mate: "癸", element: "火" },
        己: { mate: "甲", element: "土" },
        庚: { mate: "乙", element: "金" },
        辛: { mate: "丙", element: "水" },
        壬: { mate: "丁", element: "木" },
        癸: { mate: "戊", element: "火" }
    };
    const LIU_HE_ELEMENT = {
        "丑-子": "土",
        "亥-寅": "木",
        "卯-戌": "火",
        "辰-酉": "金",
        "申-巳": "水",
        "午-未": "土"
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
            const palaceInsight = getGodPalaceInsight(pillar.tenGod, pillar.label);
            return buildSection(
                `${pillar.label} · ${pillar.stem}${pillar.branch}`,
                `天干十神是${pillar.tenGod}，这表示在${pillar.label.replace("柱", "")}位上，你更容易先拿“${stemEffect.gift}”这一面给别人看。`,
                `${PILLAR_POSITION_PLAIN[pillar.label]} ${palaceInsight} 但地支里真正压着的是${hiddenPairs.join("、")}，所以这根柱子不是一句“${pillar.tenGod}”就能看完的。遇到压力和现实分工时，它会把${pillar.tenGodZhi.map((god) => `${god}的${buildGodNarrative(god, "gift")}`).join("、")}一并带出来。${relationSummary.plain}`,
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
        const commander = chart.structure.commanderInfo;
        const commanderWeights = commander.weights.map((item) => `${item.stem}${item.element} ${Math.round(item.weight * 100)}%`).join("、");
        const pattern = `${chart.pillars[2].stem}${chart.pillars[2].branch}日主，${chart.structure.strength}。月令主气落在${commander.primaryStem}（${commander.primaryGod}），当前主格按${chart.structure.pattern.finalPattern}处理。命局旺点在${chart.structure.maxElement}，短板在${chart.structure.minElement}。`;
        const transformText = [
            ...chart.transformations.stemCombos.filter((item) => item.success).map((item) => `${item.pair}合化${item.element}`),
            ...chart.transformations.branchCombos.filter((item) => item.success).map((item) => `${item.type}${item.element}`)
        ];
        const advice = `${direct} 月令司令分野按“${commanderWeights}”评估，当前节气进度约 ${Math.round(chart.seasonal.jieQi.progress * 100)}%。用神偏向${chart.structure.usefulElement}，辅助用${chart.structure.supportiveElement}，取法属于${chart.structure.yongshen.method}。${chart.structure.yongshen.rationale.join(" ")} ${transformText.length ? `原局已有${transformText.join("、")}，所以不能再只按静态五行个数看。` : ""} ${summarizePatternRelations(chart)} ${chart.blindPatterns?.summary || ""} 胎元${chart.extras.taiYuan}、命宫${chart.extras.mingGong}、身宫${chart.extras.shenGong}可辅助看职业气质、阶段性压力和内在驱动力。`;
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
            if (relation.type === "相穿") {
                scores[target] -= 10;
                scores.wealth -= 4;
                scores.health -= 3;
            }
            if (relation.type === "相破") {
                scores[target] -= 6;
                scores.wealth -= 2;
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
            if (signal.relation.type === "相穿") {
                negatives.push(`流支穿到${signal.label}${signal.branch}，${signal.domain}容易出现“表面没炸、内部持续耗损”的状况。`);
            }
            if (signal.relation.type === "相破") {
                negatives.push(`流支破到${signal.label}${signal.branch}，${signal.domain}容易计划反复、协作断裂或约定失效。`);
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

    function evaluateTimingTriggers(chart, branch) {
        const triggers = chart.timingTriggers || [];
        const hit = triggers.filter((item) => item.triggerBranches.includes(branch));
        const release = triggers.filter((item) => item.releaseBranches.includes(branch));
        const riskNotes = hit.map((item) => `应期触发：${item.message}`);
        const supportNotes = release.map((item) => `应期缓和：${branch}落在${item.key.replace(/^[^-]+-/, "")}对应的六合缓冲位，可做修复、谈判、止损。`);
        const scoreDelta = {
            relation: hit.some((item) => item.focus.includes("夫妻宫")) ? -4 : 0,
            career: hit.some((item) => item.focus.includes("事业")) ? -3 : 0,
            wealth: hit.length ? -2 * hit.length : 0,
            family: hit.length ? -2 : 0,
            health: hit.length ? -1 * hit.length : 0,
            overall: -2 * hit.length + release.length
        };
        return { hit, release, riskNotes, supportNotes, scoreDelta };
    }

    function getBluntLine(scores) {
        if (scores.overall >= 78) return "整体偏顺，但顺的时候也最容易膨胀，别把好运当成自己永远正确。";
        if (scores.overall >= 66) return "有机会，但不是躺赢局，做得对就能拿结果，做错也会付代价。";
        if (scores.overall >= 56) return "好坏掺半，更多是现实博弈，不适合想得太美。";
        return "这段时间不算轻松，硬上容易吃亏，越逞强越容易放大问题。";
    }

    function parsePillarText(pillarText) {
        const stem = String(pillarText || "").slice(0, 1);
        const branch = String(pillarText || "").slice(1, 2);
        if (!BaziCore.STEMS.includes(stem) || !BaziCore.BRANCHES.includes(branch)) return null;
        return { stem, branch };
    }

    function hasGodInChart(chart, targetGod) {
        return chart.pillars.some((pillar) => pillar.tenGod === targetGod || pillar.tenGodZhi.includes(targetGod));
    }

    function stemControls(stemA, stemB) {
        const elementA = getStemElement(stemA);
        const elementB = getStemElement(stemB);
        return BaziCore.controlElement(elementA) === elementB;
    }

    function buildDynamicCycleEco(chart, pillarText, context = {}) {
        const cycle = parsePillarText(pillarText);
        const dayun = parsePillarText(context.currentDayunLabel || "");
        const shift = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
        const notesPositive = [];
        const notesNegative = [];
        const combos = [];
        const avoid = chart.structure.yongshen?.avoid || [];
        const branchPool = [...chart.pillars.map((item) => item.branch)];
        if (dayun) {
            branchPool.push(dayun.branch);
            shift[getStemElement(dayun.stem)] += 0.7;
            shift[getBranchElement(dayun.branch)] += 0.55;
        }
        if (cycle) {
            branchPool.push(cycle.branch);
            shift[getStemElement(cycle.stem)] += 0.95;
            shift[getBranchElement(cycle.branch)] += 0.75;
        }

        [...BaziCore.SAN_HE, ...BaziCore.SAN_HUI].forEach((group) => {
            const full = group.branches.every((branch) => branchPool.includes(branch));
            if (!full || !cycle || !group.branches.includes(cycle.branch)) return;
            const amount = BaziCore.SAN_HE.includes(group) ? 2.45 : 2.1;
            shift[group.element] += amount;
            const withDayun = dayun && group.branches.includes(dayun.branch);
            combos.push({ type: BaziCore.SAN_HE.includes(group) ? "三合局" : "三会方", element: group.element, branches: group.branches.join(""), withDayun });
            if (group.element === chart.structure.usefulElement || group.element === chart.structure.supportiveElement) {
                notesPositive.push(`岁运引动 ${group.branches.join("")}${BaziCore.SAN_HE.includes(group) ? "三合" : "三会"}${group.element}局，原局气势被重构，属于关键转折窗口。`);
            }
            if (avoid.includes(group.element)) {
                notesNegative.push(`岁运引动 ${group.branches.join("")}${BaziCore.SAN_HE.includes(group) ? "三合" : "三会"}${group.element}局，忌神聚势，风险会成片出现。`);
            }
        });

        if (cycle && dayun && BaziCore.LIU_HE[cycle.branch] === dayun.branch) {
            const pair = [cycle.branch, dayun.branch].sort().join("-");
            const element = LIU_HE_ELEMENT[pair];
            if (element) {
                shift[element] += 1.2;
                combos.push({ type: "岁运六合", element, branches: `${cycle.branch}${dayun.branch}`, withDayun: true });
            }
        }

        const majorShift = combos.some((item) => item.element === chart.structure.usefulElement || avoid.includes(item.element));
        return {
            shift,
            combos,
            positive: notesPositive.slice(0, 2),
            negative: notesNegative.slice(0, 2),
            majorShift
        };
    }

    function detectSpecialAlerts(chart, pillarText, context, gods, dynamicEco) {
        const alerts = [];
        const cycle = parsePillarText(pillarText);
        if (cycle) {
            chart.pillars.forEach((pillar) => {
                if (pillar.stem === cycle.stem && pillar.branch === cycle.branch) {
                    alerts.push({
                        type: "伏吟",
                        level: "risk",
                        severity: 3,
                        text: `${pillar.label}${pillar.stem}${pillar.branch}与当前岁运同柱（伏吟），事情容易重复发生或反复拉扯。`
                    });
                }
                if (stemControls(cycle.stem, pillar.stem) && BaziCore.CHONG[cycle.branch] === pillar.branch) {
                    alerts.push({
                        type: "反吟",
                        level: "risk",
                        severity: 3,
                        text: `当前岁运与${pillar.label}${pillar.stem}${pillar.branch}形成天克地冲（反吟），该宫位事项容易剧烈波动。`
                    });
                }
            });
        }
        if (context.currentDayunLabel && context.currentDayunLabel === pillarText) {
            alerts.push({
                type: "岁运并临",
                level: "risk",
                severity: 3,
                text: "流年与当前大运干支完全一致（岁运并临），喜忌都会被放大，事件更集中。"
            });
        }
        if ((gods.includes("伤官") && (gods.includes("正官") || hasGodInChart(chart, "正官")))
            || (gods.includes("正官") && hasGodInChart(chart, "伤官"))) {
            alerts.push({
                type: "伤官见官",
                level: "risk",
                severity: 2,
                text: "岁运触发“伤官见官”，工作规则、上下级关系、合规风险要重点管控。"
            });
        }
        if (dynamicEco.majorShift) {
            const usefulHit = dynamicEco.combos.some((item) => item.element === chart.structure.usefulElement);
            alerts.push({
                type: "气数改写",
                level: usefulHit ? "chance" : "risk",
                severity: usefulHit ? 2 : 3,
                text: usefulHit
                    ? "岁运合化把气势拉到用神侧，属于可借力的转折年。"
                    : "岁运合化把气势推向忌神侧，属于需要提前止损的转折年。"
            });
        }
        if (context.year === context.dayunStartYear || context.year === context.dayunEndYear) {
            alerts.push({
                type: "交脱大运",
                level: "risk",
                severity: 1,
                text: "交脱大运年份，生活与工作节奏通常不稳，适合先稳结构再扩张。"
            });
        }
        return alerts;
    }

    function applySpecialAlertScores(scores, alerts) {
        alerts.forEach((alert) => {
            if (alert.level === "chance") {
                scores.career += 4;
                scores.wealth += 4;
                scores.overall += 3;
                return;
            }
            if (alert.severity >= 3) {
                scores.relation -= 4;
                scores.health -= 4;
                scores.overall -= 6;
            } else if (alert.severity === 2) {
                scores.career -= 3;
                scores.family -= 2;
                scores.overall -= 4;
            } else {
                scores.overall -= 2;
                scores.family -= 1;
            }
        });
    }

    function evaluateCycle(chart, pillarText, scope, meta, context = {}) {
        const dayGan = chart.pillars[2].stem;
        const stem = pillarText[0];
        const branch = pillarText[1];
        const cycleElements = [getStemElement(stem), getBranchElement(branch)];
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
        cycleElements.forEach((element) => {
            const bonus = elementBonus(chart, element);
            scores.career += bonus;
            scores.wealth += bonus * 0.9;
            scores.relation += bonus * 0.8;
            scores.family += bonus * 0.75;
            scores.health += bonus * 0.7;
        });
        if (chart.structure.strength === "身强" && cycleElements.includes(chart.structure.dayElement)) {
            scores.health -= 4;
            scores.relation -= 2;
        }
        if (chart.structure.strength === "身弱" && cycleElements.includes(BaziCore.controlElement(chart.structure.dayElement))) {
            scores.health -= 5;
            scores.career -= 3;
        }
        const elementProfile = getCycleElementProfile(chart, cycleElements);
        if (elementProfile.positive.length) {
            scores.overall += 4;
            scores.career += 3;
            scores.wealth += 2;
            scores.health += 1;
        }
        if (elementProfile.negative.length) {
            scores.overall -= 5;
            scores.relation -= 3;
            scores.family -= 2;
        }
        const dynamicEco = buildDynamicCycleEco(chart, pillarText, context);
        Object.entries(dynamicEco.shift).forEach(([element, amount]) => {
            if (!amount) return;
            if (element === chart.structure.usefulElement) {
                scores.career += amount * 2.2;
                scores.wealth += amount * 2;
                scores.overall += amount * 1.7;
            }
            if (element === chart.structure.supportiveElement) {
                scores.health += amount * 1.6;
                scores.family += amount * 1.2;
                scores.overall += amount * 1.1;
            }
            if ((chart.structure.yongshen?.avoid || []).includes(element)) {
                scores.relation -= amount * 1.8;
                scores.wealth -= amount * 1.5;
                scores.overall -= amount * 1.6;
            }
        });
        const relationSignals = collectCycleRelations(chart, branch);
        applyCycleRelationScores(scores, relationSignals);
        const timing = evaluateTimingTriggers(chart, branch);
        scores.relation += timing.scoreDelta.relation;
        scores.career += timing.scoreDelta.career;
        scores.wealth += timing.scoreDelta.wealth;
        scores.family += timing.scoreDelta.family;
        scores.health += timing.scoreDelta.health;
        scores.overall += timing.scoreDelta.overall;
        const stemCombos = getCycleStemCombos(chart, stem);
        stemCombos.forEach((combo) => {
            if (combo.element === chart.structure.usefulElement) {
                scores.career += 4;
                scores.wealth += 4;
            } else if ((chart.structure.yongshen?.avoid || []).includes(combo.element)) {
                scores.relation -= 3;
                scores.family -= 2;
            } else {
                scores.overall += 1.5;
            }
        });
        const specialAlerts = detectSpecialAlerts(chart, pillarText, context, gods, dynamicEco);
        applySpecialAlertScores(scores, specialAlerts);
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
            opportunities: [
                ...outcome.opportunities,
                ...relationNotes.positives,
                ...elementProfile.positive,
                ...dynamicEco.positive,
                ...timing.supportNotes,
                ...specialAlerts.filter((item) => item.level === "chance").map((item) => item.text)
            ].slice(0, 7),
            risks: [
                ...outcome.risks,
                ...relationNotes.negatives,
                ...elementProfile.negative,
                ...dynamicEco.negative,
                ...timing.riskNotes,
                ...specialAlerts.filter((item) => item.level !== "chance").map((item) => item.text)
            ].slice(0, 8),
            relationSignals,
            stemCombos,
            timing,
            dynamicEco,
            specialAlerts,
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

    function getGodPalaceInsight(god, pillarLabel) {
        const base = TEN_GOD_EFFECTS[god] || TEN_GOD_EFFECTS.日主;
        if (pillarLabel === "年柱") {
            return `${PALACE_PHASE[pillarLabel]}里，${god}更容易表现为“${base.gift}”，早年多见在家庭氛围、他人评价和第一印象上。`;
        }
        if (pillarLabel === "月柱") {
            return `${PALACE_PHASE[pillarLabel]}里，${god}直接落到工作分工和现实责任，常见为“${base.work}”，也容易因“${base.risk}”受压。`;
        }
        if (pillarLabel === "日柱") {
            return `${PALACE_PHASE[pillarLabel]}里，${god}会直接进入伴侣互动与自我状态，优势是“${base.gift}”，失衡时先伤关系。`;
        }
        return `${PALACE_PHASE[pillarLabel]}里，${god}更容易在子女、长期规划和最终结果上体现，优势与风险会在后段兑现。`;
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

    function getBlindNotesForPillar(chart, label) {
        const findings = (chart.blindPatterns?.findings || []).filter((item) => item.from === label || item.to === label);
        if (!findings.length) return [];
        return findings.slice(0, 2).map((item) => item.message);
    }

    function getCycleStemCombos(chart, stem) {
        return chart.pillars
            .filter((pillar) => STEM_HE_RELATIONS[stem]?.mate === pillar.stem)
            .map((pillar) => ({
                label: pillar.label,
                stem: pillar.stem,
                element: STEM_HE_RELATIONS[stem].element
            }));
    }

    function getCycleElementProfile(chart, cycleElements) {
        const useful = chart.structure.usefulElement;
        const supportive = chart.structure.supportiveElement;
        const avoid = chart.structure.yongshen?.avoid || [];
        const positive = [];
        const negative = [];
        if (cycleElements.includes(useful)) {
            positive.push(`岁运五行直接碰到用神${useful}，更容易出现“该来的资源、方向、机会终于接上”的感觉。`);
        }
        if (cycleElements.includes(supportive)) {
            positive.push(`岁运带到辅助用神${supportive}，能帮你把原局里卡住的部分稍微转活。`);
        }
        if (cycleElements.includes(chart.structure.yongshen?.climate?.primary)) {
            positive.push(`这一步岁运也照到了调候重点${chart.structure.yongshen.climate.primary}，对状态、体感和节奏更有帮助。`);
        }
        if (cycleElements.some((element) => avoid.includes(element))) {
            negative.push(`岁运五行碰到了忌神或偏盛元素${cycleElements.filter((element) => avoid.includes(element)).join("、")}，优点和短板会一起被放大。`);
        }
        if (cycleElements.some((element) => element === BaziCore.controlElement(useful))) {
            negative.push(`岁运里有力量直接克你的用神${useful}，事情容易在关键节点卡住或被打断。`);
        }
        return { positive, negative };
    }

    function buildPillarInterpretations(chart) {
        return chart.pillars.map((pillar) => {
            const relationSummary = summarizePillarRelations(chart, pillar.label);
            const hiddenPairs = hiddenGodPairs(pillar);
            const palaceInsight = getGodPalaceInsight(pillar.tenGod, pillar.label);
            const blindNotes = getBlindNotesForPillar(chart, pillar.label);
            return buildSection(
                `${pillar.label} · ${pillar.stem}${pillar.branch}`,
                `${pillarRole(pillar.label)} 表层天干是${pillar.tenGod}，所以别人最先感受到的，多半是“${buildGodNarrative(pillar.tenGod, "gift")}”；但这并不等于全部。`,
                `这根柱子地支里藏着${hiddenPairs.join("、")}。${palaceInsight} 白话说，你表面走的是${pillar.tenGod}路线，真正卡到利益、压力、关系和现实分工时，内里还会掺进${pillar.tenGodZhi.map((god) => buildGodNarrative(god, "gift")).join("、")}这些动力。${relationSummary.plain}${blindNotes.length ? ` ${blindNotes.join(" ")}` : ""}`,
                [
                    `正面看，${pillar.tenGod}在${pillar.label.replace("柱", "")}位上通常意味着“${buildGodNarrative(pillar.tenGod, "work")}”。`,
                    `地势${pillar.diShi}、纳音${pillar.nayin}说明这股气不是空谈，而是会落到真实处境里。`,
                    ...relationSummary.positives
                ].slice(0, 3),
                [
                    `反面看，${pillar.tenGod}过头时会走向“${buildGodNarrative(pillar.tenGod, "risk")}”。`,
                    `旬空${pillar.xunKong}说明这根柱相关事务在某些阶段容易出现“嘴上有、心里有、落实慢”的感觉。`,
                    ...blindNotes,
                    ...relationSummary.negatives
                ].slice(0, 3),
                `判断这根柱时，至少要同时看天干十神、藏干十神、${pillar.label.replace("柱", "")}位职责和它与其他柱的合冲刑害，少看一层都容易失真。`
            );
        });
    }

    function buildUsefulAnalysis(chart) {
        const avoid = chart.structure.yongshen?.avoid || (
            chart.structure.strength === "身强"
                ? [chart.structure.maxElement, chart.structure.dayElement]
                : [BaziCore.controlElement(chart.structure.dayElement), chart.structure.minElement]
        );
        return [
            buildSection(
                "用神重点",
                `当前命局主要用神偏向${chart.structure.usefulElement}，辅助用${chart.structure.supportiveElement}，取法属于${chart.structure.yongshen.method}。`,
                `白话说，不是你缺什么就机械补什么，而是要补能让整个结构重新平衡、同时照顾格局和调候的那股力量。${chart.structure.yongshen.rationale.join(" ")}`,
                [
                    `${chart.structure.usefulElement}相关的环境、行业、节奏、习惯更容易帮你把盘面拉回正位。`,
                    `${chart.structure.supportiveElement}可以做辅助，但通常不能代替主用神。`,
                    `当前季节调候重点偏${chart.structure.yongshen.climate.primary}，因为${chart.structure.yongshen.climate.reason}`
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
                "白话说，你的问题不一定来自“没有”，也可能来自“太多了还继续堆”。如果这些元素刚好又在岁运里被触发，问题会比静态原局更明显。",
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
        (chart.blindPatterns?.findings || []).slice(0, 4).forEach((item) => {
            cards.push(buildSection(
                `盲派断点 · ${item.type} ${item.pair}`,
                item.message,
                `白话说：${BLIND_EVENT_HINT[item.type] || "这是应期触发点，遇到岁运并临时通常会出具体事件。"} 重点宫位是${item.focus}。`,
                ["提前做边界和预案，能把损失变成可控代价。"],
                ["如果忽视这一类断点，往往不是一次性爆雷，而是连续性消耗。"],
                "盲派看“做功”和“体用”，关键是找真正会出事的宫位与时间点。"
            ));
        });
        if (chart.blindPatterns?.juePillars?.length) {
            cards.push(buildSection(
                "地势见绝",
                chart.blindPatterns.summary,
                "白话说：地势见“绝”不代表必凶，但对应宫位抗压余量更薄，遇到冲穿破时更容易直接应事。",
                ["提前做缓冲（资金、健康、关系沟通）比事后补救有效。"],
                ["逢高压年份如果继续硬顶，容易把小问题拖成系统性问题。"],
                "见绝位的年份，建议优先做止损和结构调整。"
            ));
        }
        chart.transformations.stemCombos.forEach((item) => {
            cards.push(buildSection(
                `${item.pair}天干五合`,
                item.success ? `${item.pair}这组合不只是相合，已经朝${item.element}化气去看。` : `${item.pair}虽有五合，但更像牵制和合住，未到彻底化气。`,
                item.reason,
                [item.success ? `化气${item.element}成功后，原局五行重心会朝${item.element}移动。` : "即使未化，也会让相关宫位彼此牵扯，不再各走各的。"] ,
                [item.success ? "合化成功不代表全吉，只是力量归属改变了。" : "把五合直接当“必化”会误判格局和用神。"] ,
                "五合一定要看月令、根气和透出，不是看到甲己、丙辛就直接判化。"
            ));
        });
        chart.transformations.branchCombos.forEach((item) => {
            cards.push(buildSection(
                `${item.type} · ${item.pair}`,
                item.success ? `${item.pair}在原局里已经能按${item.element}气去看。` : `${item.pair}有合局之形，但还没强到完全改气。`,
                item.reason,
                [item.success ? `${item.element}气被明显放大，相关事件类型会更集中。` : "即使未完全化气，原局取向也已经往这一边偏了。"] ,
                [item.success ? "合局成功后，原来单独看每一支的办法会失真。" : "只看成组不看成不成局，最容易把吉凶看反。"] ,
                "三合、三会、六合、半合都要看‘有没有形’和‘有没有气’，两者缺一都不能乱断。"
            ));
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

    function buildCriticalYears(chart, yearEvaluations) {
        const list = (yearEvaluations || []).map((item) => {
            const triggerCount = item.evaluation?.timing?.hit?.length || 0;
            const releaseCount = item.evaluation?.timing?.release?.length || 0;
            const alertRiskCount = (item.evaluation?.specialAlerts || []).filter((entry) => entry.level !== "chance").length;
            const alertChanceCount = (item.evaluation?.specialAlerts || []).filter((entry) => entry.level === "chance").length;
            const riskScore = (100 - item.evaluation.scores.overall) * 0.35
                + (100 - item.evaluation.scores.relation) * 0.25
                + (100 - item.evaluation.scores.health) * 0.2
                + triggerCount * 8
                + alertRiskCount * 9
                - releaseCount * 3;
            const chanceScore = item.evaluation.scores.overall * 0.3
                + item.evaluation.scores.career * 0.25
                + item.evaluation.scores.wealth * 0.25
                + item.evaluation.scores.relation * 0.2
                + releaseCount * 4
                + alertChanceCount * 7
                - triggerCount * 3;
            return {
                ...item,
                riskScore: Math.round(riskScore),
                chanceScore: Math.round(chanceScore)
            };
        });
        const risky = [...list]
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 8)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                reason: item.evaluation.specialAlerts?.find((entry) => entry.level !== "chance")?.text || item.evaluation.risks[0] || item.evaluation.blunt,
                focus: item.evaluation.timing?.hit?.[0]?.focus || "综合"
            }));
        const favorable = [...list]
            .sort((a, b) => b.chanceScore - a.chanceScore)
            .slice(0, 8)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                reason: item.evaluation.specialAlerts?.find((entry) => entry.level === "chance")?.text || item.evaluation.opportunities[0] || item.evaluation.blunt,
                focus: item.evaluation.timing?.release?.[0]?.focus || "综合"
            }));
        return { risky, favorable };
    }

    function buildEventDashboard(chart, yearEvaluations, monthEvaluations) {
        const years = yearEvaluations || [];
        const months = monthEvaluations || [];
        const marriageWindows = [...years]
            .sort((a, b) => b.evaluation.scores.relation - a.evaluation.scores.relation)
            .slice(0, 4)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                note: `关系分 ${item.evaluation.scores.relation}，${item.evaluation.opportunities[0]}`
            }));
        const marriageRisk = [...years]
            .filter((item) => item.evaluation.scores.relation <= 62 || (item.evaluation.timing?.hit || []).some((hit) => hit.focus.includes("夫妻宫")))
            .sort((a, b) => a.evaluation.scores.relation - b.evaluation.scores.relation)
            .slice(0, 4)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                note: item.evaluation.risks[0]
            }));
        const wealthPeaks = [...years]
            .sort((a, b) => b.evaluation.scores.wealth - a.evaluation.scores.wealth)
            .slice(0, 4)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                note: `财运分 ${item.evaluation.scores.wealth}，${item.evaluation.opportunities[0]}`
            }));
        const wealthPits = [...years]
            .sort((a, b) => a.evaluation.scores.wealth - b.evaluation.scores.wealth)
            .slice(0, 4)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                note: item.evaluation.risks[0]
            }));
        const healthTraffic = [...months]
            .sort((a, b) => a.evaluation.scores.health - b.evaluation.scores.health)
            .slice(0, 4)
            .map((item) => ({
                month: item.month,
                pillar: item.pillar,
                level: item.evaluation.scores.health <= 58 ? "红灯" : item.evaluation.scores.health <= 66 ? "黄灯" : "绿灯",
                note: item.evaluation.risks[0]
            }));
        const warningRadar = [...years]
            .filter((item) => (item.evaluation.specialAlerts || []).length)
            .sort((a, b) => (b.evaluation.specialAlerts || []).length - (a.evaluation.specialAlerts || []).length)
            .slice(0, 5)
            .map((item) => ({
                year: item.year,
                pillar: item.pillar,
                note: (item.evaluation.specialAlerts || []).map((entry) => entry.type).join("、")
            }));
        return {
            marriageWindows,
            marriageRisk,
            wealthPeaks,
            wealthPits,
            healthTraffic,
            warningRadar
        };
    }

    function buildModernLifeAdvice(chart, compatibility, targetYear) {
        const directionMap = {
            木: { seat: "东 / 东南", sleep: "床头朝东或东南", style: "多用木质、绿植、分层收纳，强调生长感。" },
            火: { seat: "南", sleep: "床头朝南", style: "增加采光与暖色，减少潮湿阴暗角落。" },
            土: { seat: "中宫 / 东北 / 西南", sleep: "床头朝东北或西南", style: "重稳定和秩序，减少杂乱、堆积和动线阻塞。" },
            金: { seat: "西 / 西北", sleep: "床头朝西北", style: "偏简洁、规则、留白，避免过多软装干扰。", },
            水: { seat: "北", sleep: "床头朝北", style: "重安静、湿度和恢复环境，减少高噪音与强光。", }
        };
        const useful = directionMap[chart.structure.usefulElement];
        const support = directionMap[chart.structure.supportiveElement];
        const elementHourMap = {
            木: ["寅", "卯"],
            火: ["巳", "午"],
            土: ["辰", "戌", "丑", "未"],
            金: ["申", "酉"],
            水: ["亥", "子"]
        };
        const avoidElement = BaziCore.controlElement(chart.structure.usefulElement);
        const usefulHours = elementHourMap[chart.structure.usefulElement] || [];
        const avoidHours = elementHourMap[avoidElement] || [];
        const teamLine = compatibility
            ? `当前双人合盘里，沟通分 ${compatibility.scores.communication}、财务分 ${compatibility.scores.finance}。团队协作时让沟通分高的人做接口，让财务分高的人抓预算和结算。`
            : "未启用合盘。若后续扩展到团队合盘，建议用“沟通分+财务分+冲突位”三维评价成员协同。";
        return [
            buildSection(
                "风水与方位建议",
                `用神偏${chart.structure.usefulElement}，今年办公位建议朝向${useful.seat}，睡眠位建议${useful.sleep}。`,
                `白话说，方位不是迷信加成，而是帮你把长期节律放到更稳的位置。辅助元素${chart.structure.supportiveElement}可用${support.seat}做补位。`,
                [`办公空间建议：${useful.style}`, `辅助补位可参考：${support.style}`],
                ["忌神方向不必完全禁用，但不建议长期主坐。", "环境再好，作息和边界不稳也会失效。"],
                "先固定工位和睡眠朝向，再微调灯光、通风、噪音和动线。"
            ),
            buildSection(
                "团队与人际协同",
                "关系与协作不只看感觉，更要看分工。",
                teamLine,
                ["把“对外沟通、对内执行、财务把关”分给不同强项的人，组织更稳。"],
                ["让同一人同时扛沟通和对抗，最容易在压力期崩盘。"],
                "团队合盘建议后续扩展到多人录入，按角色自动给排班和冲突预警。"
            ),
            buildSection(
                `${targetYear}年日课与时段提示`,
                `今年对你更顺的时段是${usefulHours.join("、")}时，冲突高发时段多在${avoidHours.join("、")}时。`,
                "白话说，重要会谈、签约、复盘尽量放在顺时段；高压沟通、硬碰硬会议尽量避开忌时段。",
                [`宜：把关键沟通安排在${usefulHours.join("、")}时。`, "宜：把恢复和深度工作安排在固定时段。"],
                [`忌：${avoidHours.join("、")}时做高冲突会议。`, "忌：熬夜后立刻做重大财务和关系决策。"],
                "择吉的核心是降低失误率，不是追求神奇收益。"
            )
        ];
    }

    function buildDailyGuide(chart, dayunLabel, startDate = new Date(), days = 30) {
        const avoid = chart.structure.yongshen?.avoid || [];
        const startSolar = Solar.fromDate(startDate);
        const rows = [];
        for (let i = 0; i < days; i++) {
            const solar = Solar.fromJulianDay(startSolar.getJulianDay() + i);
            const lunar = solar.getLunar();
            const pillar = lunar.getDayInGanZhiExact();
            const stem = pillar[0];
            const branch = pillar[1];
            const elements = [getStemElement(stem), getBranchElement(branch)];
            const evalResult = evaluateCycle(chart, pillar, "流日", `${solar.toYmd()} · ${pillar}`, {
                year: solar.getYear(),
                month: solar.getMonth(),
                currentDayunLabel: dayunLabel
            });
            const usefulHit = elements.includes(chart.structure.usefulElement) || elements.includes(chart.structure.supportiveElement);
            const avoidHit = elements.some((element) => avoid.includes(element));
            const level = evalResult.scores.overall >= 75 || usefulHit
                ? "宜"
                : evalResult.scores.overall <= 58 || avoidHit
                    ? "慎"
                    : "平";
            rows.push({
                date: solar.toYmd(),
                pillar,
                score: evalResult.scores.overall,
                level,
                note: level === "宜"
                    ? evalResult.opportunities[0]
                    : level === "慎"
                        ? evalResult.risks[0]
                        : "以稳为主，按计划推进。"
            });
        }
        return rows;
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
        getEnvironmentAnalysis,
        buildCriticalYears,
        buildEventDashboard,
        buildModernLifeAdvice,
        buildDailyGuide
    };
})();
