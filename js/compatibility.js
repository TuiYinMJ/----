(function () {
    const LIU_HE = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };
    const CHONG = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
    const HAI = { 子: "未", 未: "子", 丑: "午", 午: "丑", 寅: "巳", 巳: "寅", 卯: "辰", 辰: "卯", 申: "亥", 亥: "申", 酉: "戌", 戌: "酉" };

    function controlledElement(element) {
        return { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" }[element];
    }

    function branchRelation(a, b) {
        if (a === b) return { type: "同支", score: 3, text: "磁场接近，容易互相懂，但也容易在同一个点上固执。" };
        if (LIU_HE[a] === b) return { type: "六合", score: 8, text: "有吸引和配合的基础，比较容易走到一起。" };
        if (CHONG[a] === b) return { type: "相冲", score: -10, text: "节奏和习惯容易对冲，吸引强时冲突也大。" };
        if (HAI[a] === b) return { type: "相害", score: -7, text: "不是天天吵，而是容易暗耗、误解和别扭。" };
        return { type: "平", score: 0, text: "没有明显强合强冲，更看后天经营。" };
    }

    function elementRelation(a, b) {
        if (a === b) return { score: 3, text: "同元素，容易互相理解，但也容易谁都不肯退。" };
        if (BaziCore.generateElement(a) === b) return { score: 5, text: "一方更容易主动付出、照顾或引导另一方。" };
        if (BaziCore.generateElement(b) === a) return { score: 5, text: "双方有相互滋养空间，关系容易建立温度。" };
        if (BaziCore.controlElement(a) === b) return { score: -5, text: "一方容易压另一方，时间久了会有不平衡感。" };
        if (BaziCore.controlElement(b) === a) return { score: -5, text: "彼此容易在控制权和边界上较劲。" };
        return { score: 0, text: "元素关系中性，更看具体处事方式。" };
    }

    function getPartnerTargetElement(chart) {
        return chart.input.gender === "male"
            ? controlledElement(chart.structure.dayElement)
            : BaziCore.controlElement(chart.structure.dayElement);
    }

    function clamp(value) {
        return Math.max(35, Math.min(95, Math.round(value)));
    }

    function countGod(chart, gods) {
        return chart.pillars.reduce((sum, pillar) => {
            const all = [pillar.tenGod, ...pillar.tenGodZhi];
            return sum + all.filter((god) => gods.includes(god)).length;
        }, 0);
    }

    function buildBusinessInsights(primary, secondary, scores) {
        const aLeader = countGod(primary, ["正官", "七杀"]);
        const bLeader = countGod(secondary, ["正官", "七杀"]);
        const aFinance = countGod(primary, ["正财", "偏财"]);
        const bFinance = countGod(secondary, ["正财", "偏财"]);
        const leader = aLeader === bLeader ? "双方都能主导，建议按项目轮值主责" : (aLeader > bLeader ? "主盘更适合做业务负责人" : "对象盘更适合做业务负责人");
        const financeLead = aFinance === bFinance ? "双方财务敏感度接近，建议独立复核预算与合同" : (aFinance > bFinance ? "主盘更适合抓现金流与结算" : "对象盘更适合抓现金流与结算");
        const aIsBWealth = primary.structure.maxElement === controlledElement(secondary.structure.dayElement);
        const bIsAWealth = secondary.structure.maxElement === controlledElement(primary.structure.dayElement);
        const wealthFlow = aIsBWealth && bIsAWealth
            ? "两边都可能成为对方的财星资源，互带业务的潜力高。"
            : aIsBWealth
                ? "主盘更像对象盘的财星来源，适合主盘对外拓客、对象盘做落地。"
                : bIsAWealth
                    ? "对象盘更像主盘的财星来源，适合对象盘对外拿资源、主盘做经营转化。"
                    : "彼此不属于典型“直接财星补位”，更要靠制度分工而不是默契。";
        const friction = scores.communication <= 60 || scores.finance <= 60
            ? "摩擦点会集中在报价、分成、责任边界和最终拍板权。"
            : "协同基础尚可，但仍要用合同把权责和退出机制写清。";
        return { leader, financeLead, wealthFlow, friction };
    }

    function buildChildEducationInsights(childChart) {
        const kills = countGod(childChart, ["七杀"]);
        const food = countGod(childChart, ["食神", "伤官"]);
        const print = countGod(childChart, ["正印", "偏印"]);
        const officer = countGod(childChart, ["正官"]);
        if (kills >= 3 && officer <= 1) {
            return "孩子盘七杀偏重，通常不吃硬压，建议“先立规则再给空间”，多用任务制和结果反馈，少用情绪压制。";
        }
        if (print >= 3 && food <= 1) {
            return "印星偏重而食伤偏弱，孩子更容易想太多、表达偏慢。适合结构化学习和低噪环境，别用频繁比较制造焦虑。";
        }
        if (food >= 3) {
            return "食伤较亮，孩子表达和创造驱动力更强。适合项目式学习、作品输出和舞台反馈，不适合死记硬背长期压着。";
        }
        return "盘面不走极端，教育策略以“稳定作息 + 清晰边界 + 正反馈”最有效。";
    }

    function buildCompatibility(primary, secondary) {
        const aStem = primary.pillars[2].stem;
        const bStem = secondary.pillars[2].stem;
        const aBranch = primary.pillars[2].branch;
        const bBranch = secondary.pillars[2].branch;
        const aElement = primary.structure.dayElement;
        const bElement = secondary.structure.dayElement;
        const branchInfo = branchRelation(aBranch, bBranch);
        const elementInfo = elementRelation(aElement, bElement);
        const scores = { overall: 60, attraction: 60, communication: 60, marriage: 60, family: 60, finance: 60, child: 60 };

        scores.attraction += branchInfo.score + elementInfo.score;
        scores.communication += elementInfo.score * 1.2;
        scores.marriage += branchInfo.score * 1.3;
        scores.family += branchInfo.score * 0.9;

        if (primary.structure.usefulElement === secondary.structure.maxElement) {
            scores.communication += 5;
            scores.marriage += 4;
        }
        if (secondary.structure.usefulElement === primary.structure.maxElement) {
            scores.communication += 5;
            scores.marriage += 4;
        }
        if (primary.structure.maxElement === secondary.structure.maxElement) {
            scores.communication -= 3;
            scores.family -= 2;
        }
        if (primary.structure.minElement === secondary.structure.maxElement || secondary.structure.minElement === primary.structure.maxElement) {
            scores.attraction += 4;
            scores.child += 3;
        }

        const aPartnerNeed = getPartnerTargetElement(primary);
        const bPartnerNeed = getPartnerTargetElement(secondary);
        if (BaziCore.STEM_WUXING[BaziCore.STEMS.indexOf(bStem)] === aPartnerNeed) scores.marriage += 6;
        if (BaziCore.STEM_WUXING[BaziCore.STEMS.indexOf(aStem)] === bPartnerNeed) scores.marriage += 6;

        if (branchRelation(primary.pillars[0].branch, secondary.pillars[0].branch).score > 0) scores.family += 5;
        if (branchRelation(primary.pillars[0].branch, secondary.pillars[0].branch).score < 0) scores.family -= 6;

        if (primary.structure.usefulElement === secondary.structure.usefulElement) scores.finance += 4;
        if (primary.structure.dayElement === secondary.structure.dayElement) scores.finance -= 2;
        if (branchInfo.type === "相冲") scores.finance -= 3;
        if (branchInfo.type === "六合") scores.child += 5;
        if (branchInfo.type === "相害") scores.child -= 4;

        scores.overall = (scores.attraction + scores.communication + scores.marriage + scores.family + scores.finance + scores.child) / 6;
        Object.keys(scores).forEach((key) => { scores[key] = clamp(scores[key]); });

        const strengths = [];
        const risks = [];
        if (scores.attraction >= 72) strengths.push("彼此有明显吸引力，容易对上感觉。");
        if (scores.communication >= 72) strengths.push("沟通逻辑相对能接上，不是完全鸡同鸭讲。");
        if (scores.marriage >= 72) strengths.push("婚配基础不差，适合往长期关系谈。");
        if (scores.family >= 72) strengths.push("双方进入家庭体系后的摩擦相对可控。");
        if (scores.finance >= 72) strengths.push("现实和金钱观有协同空间，适合谈长期安排。");
        if (scores.child >= 72) strengths.push("对子嗣、养育、后代事务的协同度相对较好。");
        if (scores.attraction <= 58) risks.push("吸引不稳定，靠热情很难长期维持。");
        if (scores.communication <= 58) risks.push("沟通容易变成各说各话，吵点会反复出现。");
        if (scores.marriage <= 58) risks.push("婚姻落地难度较高，关系中的现实摩擦不小。");
        if (scores.family <= 58) risks.push("家庭观、长辈关系、生活节奏容易磨损感情。");
        if (scores.finance <= 58) risks.push("钱、资源、消费和责任分配很容易成为争执点。");
        if (scores.child <= 58) risks.push("对子女、后代或养育责任的节奏不一定一致。");
        if (!strengths.length) strengths.push("没有明显硬伤，能不能走好主要看后天经营。");
        if (!risks.length) risks.push("没有特别大的结构性冲突，但平顺不代表可以不经营。");

        const summary = scores.overall >= 75
            ? "这组盘可以谈长期，但前提是别把相合当成不需要经营。"
            : scores.overall >= 62
                ? "能处，但不是天然省心型，需要靠沟通、边界和现实协同。"
                : "不算轻松型关系，吸引可能有，但磨损也真会大。";

        const sections = [
            {
                title: "结论先说",
                verdict: summary,
                plain: `白话：这不是“天作之合”或“完全不行”这么简单。日支关系是${branchInfo.type}，日主元素关系体现为“${elementInfo.text}”。真正决定能不能走远的，是你们如何处理冲突和现实。`,
                positives: strengths.slice(0, 3),
                negatives: risks.slice(0, 3),
                advice: "合盘看的是相处难点和优势，不是代替现实了解。"
            },
            {
                title: "婚姻与相处",
                verdict: scores.marriage >= 70 ? "有婚配基础，但仍要谈现实。" : "婚姻不是不能谈，而是落地阻力偏大。",
                plain: `夫妻宫对照为${aBranch}与${bBranch}，属于${branchInfo.type}。${branchInfo.text}`,
                positives: [
                    scores.marriage >= 70 ? "关系推进时比较容易形成承诺感。" : "不是完全没机会，先磨合再定结果更稳。",
                    scores.communication >= 70 ? "吵归吵，仍有说开和修复的空间。" : "如果愿意学会表达边界，仍有转圜余地。"
                ],
                negatives: [
                    scores.communication <= 60 ? "对话容易从讨论问题滑向互相否定。" : "即便沟通不差，也别默认对方自然懂你。",
                    scores.family <= 60 ? "一进入现实家庭事务，摩擦会明显变多。" : "婚姻顺的时候也要管好生活分工。"
                ],
                advice: "把钱、家务、边界、承诺方式、是否要孩子这些话题提前讲清楚。"
            },
            {
                title: "现实与家庭",
                verdict: scores.finance >= 70 && scores.family >= 70 ? "一起过日子的可操作性较强。" : "现实层面比情绪层面更考验这段关系。",
                plain: `现实分 ${scores.finance}，家庭分 ${scores.family}。白话说，恋爱和结婚不是一回事，真正难的是怎么一起过日子。`,
                positives: strengths.filter((item) => item.includes("家庭") || item.includes("金钱") || item.includes("子嗣")).slice(0, 2),
                negatives: risks.filter((item) => item.includes("家庭") || item.includes("金钱") || item.includes("子嗣")).slice(0, 2),
                advice: "如果真要长期走，先看两个人对钱、父母、孩子、住哪里、谁负责什么能否达成一致。"
            },
            {
                title: "子嗣与养育协同",
                verdict: scores.child >= 70 ? "对子嗣、养育和后代责任的协同度相对较好。" : "孩子和养育责任可能成为这段关系的现实考题。",
                plain: `子嗣协同分 ${scores.child}。白话说，不只是能不能要孩子，更是要了之后谁负责、怎么养、理念合不合。`,
                positives: [
                    scores.child >= 70 ? "在孩子、教育、传承和未来规划上比较容易谈到一处去。" : "不是完全不行，只是更需要提前谈清楚。",
                    scores.family >= 68 ? "家庭系统如果配合得住，子嗣议题的压力会小很多。" : "只要家庭边界清楚，也能减少外部干扰。"
                ],
                negatives: [
                    scores.child <= 58 ? "一旦进入现实养育阶段，分工、节奏、金钱和精力很容易失衡。" : "即便协同不差，也别默认对方天然跟你想法一致。",
                    scores.finance <= 60 ? "经济安排不清时，子嗣问题会直接放大冲突。" : "孩子相关支出和时间安排仍然要算清楚。"
                ],
                advice: "子嗣问题既看感情，也看身体、现实条件和长期责任，不要只凭一时热情决定。"
            }
        ];

        const business = buildBusinessInsights(primary, secondary, scores);
        sections.push({
            title: "商业合伙视角",
            verdict: scores.finance >= 70 && scores.communication >= 70 ? "有合伙基础，但要制度化运作。" : "能合作，但更依赖清晰分工和契约边界。",
            plain: `白话：${business.wealthFlow} ${business.leader}，${business.financeLead}。`,
            positives: [
                "把“对外拓客、内部交付、财务结算”分开负责，效率通常更高。",
                scores.finance >= 70 ? "财务协同分不低，具备做长期项目的基础。" : "先从小项目试合作，比一次性重仓更稳。"
            ],
            negatives: [
                business.friction,
                "没有退出机制的合伙，往往在关系还没坏时就埋雷。"
            ],
            advice: "合伙先写清分工、分成、拍板权和退出条款，再谈感情与信任。"
        });

        sections.push({
            title: "亲子教育视角（对象盘）",
            verdict: "把对象盘当“孩子盘”看，可快速得到可执行的养育策略。",
            plain: `白话：${buildChildEducationInsights(secondary)}`,
            positives: [
                "先看孩子的驱动力类型，再定管教方式，比一味压服更有效。",
                "教育策略和命盘倾向对齐后，亲子冲突会显著下降。"
            ],
            negatives: [
                "把“克父母”当结论会制造焦虑，不利于真实养育。",
                "忽视作息、环境和沟通方式，再好的天赋也会被消耗。"
            ],
            advice: "教育上先做可执行的日常系统：作息、任务、反馈、边界。"
        });

        return { scores, sections, summary };
    }

    window.CompatibilityEngine = {
        buildCompatibility
    };
})();
