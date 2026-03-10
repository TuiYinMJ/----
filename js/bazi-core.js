(function () {
    const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const STEM_WUXING = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
    const BRANCH_WUXING = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];
    const BRANCH_HIDDEN = {
        子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"], 辰: ["戊", "乙", "癸"],
        巳: ["丙", "戊", "庚"], 午: ["丁", "己"], 未: ["己", "丁", "乙"], 申: ["庚", "壬", "戊"],
        酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"]
    };
    const ELEMENT_COLOR = { 木: "#3f6212", 火: "#b91c1c", 土: "#a16207", 金: "#475569", 水: "#0f766e" };
    const NAYIN = [
        "海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火", "涧下水", "城头土", "白蜡金", "杨柳木",
        "泉中水", "屋上土", "霹雳火", "松柏木", "长流水", "砂石金", "山下火", "平地木", "壁上土", "金箔金",
        "佛灯火", "天河水", "大驿土", "钗钏金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水"
    ];

    const TEN_GODS_TABLE = {
        木: ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"],
        火: ["偏印", "正印", "比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官"],
        土: ["七杀", "正官", "偏印", "正印", "比肩", "劫财", "食神", "伤官", "偏财", "正财"],
        金: ["偏财", "正财", "七杀", "正官", "偏印", "正印", "比肩", "劫财", "食神", "伤官"],
        水: ["食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印", "比肩", "劫财"]
    };

    const monthBranchBySolarMonth = ["丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子"];

    function cyclic(index) {
        return STEMS[(index % 10 + 10) % 10] + BRANCHES[(index % 12 + 12) % 12];
    }

    function parseHourBranch(hourIndex) {
        return BRANCHES[hourIndex % 12];
    }

    function julianDay(date) {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate() + (date.getHours() + date.getMinutes() / 60) / 24;
        const a = Math.floor((14 - m) / 12);
        const y1 = y + 4800 - a;
        const m1 = m + 12 * a - 3;
        return d + Math.floor((153 * m1 + 2) / 5) + 365 * y1 + Math.floor(y1 / 4) - Math.floor(y1 / 100) + Math.floor(y1 / 400) - 32045;
    }

    function getYearPillar(date) {
        const year = date.getMonth() === 0 || (date.getMonth() === 1 && date.getDate() < 4) ? date.getFullYear() - 1 : date.getFullYear();
        const offset = year - 1984;
        return { stem: STEMS[(offset % 10 + 10) % 10], branch: BRANCHES[(offset % 12 + 12) % 12] };
    }

    function getMonthPillar(date, yearStem) {
        const month = date.getMonth();
        const branch = monthBranchBySolarMonth[month];
        const startStemIndex = { 甲: 2, 己: 2, 乙: 4, 庚: 4, 丙: 6, 辛: 6, 丁: 8, 壬: 8, 戊: 0, 癸: 0 }[yearStem];
        const branchIndex = BRANCHES.indexOf(branch);
        const stemIndex = (startStemIndex + ((branchIndex - 2 + 12) % 12)) % 10;
        return { stem: STEMS[stemIndex], branch };
    }

    function getDayPillar(date) {
        const ref = new Date(1984, 1, 2, 0, 0, 0);
        const delta = Math.floor((julianDay(date) - julianDay(ref)) % 60);
        return { stem: STEMS[(delta % 10 + 10) % 10], branch: BRANCHES[(delta % 12 + 12) % 12], index: (delta % 60 + 60) % 60 };
    }

    function getHourPillar(dayStem, hourIndex) {
        const branch = parseHourBranch(hourIndex);
        const startStemIndex = { 甲: 0, 己: 0, 乙: 2, 庚: 2, 丙: 4, 辛: 4, 丁: 6, 壬: 6, 戊: 8, 癸: 8 }[dayStem];
        const stem = STEMS[(startStemIndex + hourIndex) % 10];
        return { stem, branch };
    }

    function getTenGod(dayStem, targetStem) {
        const element = STEM_WUXING[STEMS.indexOf(dayStem)];
        const idx = STEMS.indexOf(targetStem);
        return TEN_GODS_TABLE[element][idx];
    }

    function getNaYin(stem, branch) {
        const stemIndex = STEMS.indexOf(stem);
        const branchIndex = BRANCHES.indexOf(branch);
        const pairIndex = ((branchIndex - stemIndex) % 2 === 0 ? ((stemIndex / 2) | 0) + (((branchIndex - stemIndex + 12) % 12) / 2) * 5 : 0) % 30;
        return NAYIN[(pairIndex + 30) % 30];
    }

    function getWuxingScore(pillars) {
        const score = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
        pillars.forEach((pillar, idx) => {
            score[STEM_WUXING[STEMS.indexOf(pillar.stem)]] += idx === 1 ? 2.2 : 1.4;
            score[BRANCH_WUXING[BRANCHES.indexOf(pillar.branch)]] += idx === 1 ? 1.8 : 1.2;
            BRANCH_HIDDEN[pillar.branch].forEach((hidden, hiddenIndex) => {
                score[STEM_WUXING[STEMS.indexOf(hidden)]] += hiddenIndex === 0 ? 0.7 : 0.35;
            });
        });
        return score;
    }

    function getShensha(pillars) {
        const dayBranch = pillars[2].branch;
        const yearBranch = pillars[0].branch;
        const tags = [];
        if (["申", "子", "辰"].includes(dayBranch)) tags.push("华盖");
        if (["寅", "午", "戌"].includes(yearBranch)) tags.push("将星");
        if (pillars.some((p) => p.branch === "桃" || ["子", "午", "卯", "酉"].includes(p.branch))) tags.push("桃花");
        if (pillars[1].branch === pillars[2].branch) tags.push("月日同支");
        if (new Set(pillars.map((p) => p.branch)).size < 4) tags.push("地支重复");
        return [...new Set(tags)];
    }

    function analyzeStructure(pillars, wuxing) {
        const dayStem = pillars[2].stem;
        const dayElement = STEM_WUXING[STEMS.indexOf(dayStem)];
        const maxElement = Object.entries(wuxing).sort((a, b) => b[1] - a[1])[0][0];
        const minElement = Object.entries(wuxing).sort((a, b) => a[1] - b[1])[0][0];
        const daySupport = wuxing[dayElement];
        const average = Object.values(wuxing).reduce((a, b) => a + b, 0) / 5;
        let strength = "中和";
        if (daySupport > average * 1.25) strength = "身强";
        if (daySupport < average * 0.82) strength = "身弱";
        return {
            dayElement,
            maxElement,
            minElement,
            strength,
            usefulElement: strength === "身强" ? controlElement(dayElement) : generateElement(dayElement),
            supportiveElement: strength === "身强" ? leakElement(dayElement) : sameElement(dayElement)
        };
    }

    function sameElement(element) {
        return element;
    }
    function generateElement(element) {
        return { 木: "水", 火: "木", 土: "火", 金: "土", 水: "金" }[element];
    }
    function leakElement(element) {
        return { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" }[element];
    }
    function controlElement(element) {
        return { 木: "金", 火: "水", 土: "木", 金: "火", 水: "土" }[element];
    }

    function computeBaZi(input) {
        const date = new Date(input.year, input.month - 1, input.day, input.hourIndex * 2);
        const yearPillar = getYearPillar(date);
        const monthPillar = getMonthPillar(date, yearPillar.stem);
        const dayPillar = getDayPillar(date);
        const hourPillar = getHourPillar(dayPillar.stem, input.hourIndex);
        const pillars = [yearPillar, monthPillar, dayPillar, hourPillar].map((pillar, index) => ({
            ...pillar,
            label: ["年柱", "月柱", "日柱", "时柱"][index],
            hidden: BRANCH_HIDDEN[pillar.branch],
            nayin: getNaYin(pillar.stem, pillar.branch),
            tenGod: index === 2 ? "日主" : getTenGod(dayPillar.stem, pillar.stem),
            stemElement: STEM_WUXING[STEMS.indexOf(pillar.stem)],
            branchElement: BRANCH_WUXING[BRANCHES.indexOf(pillar.branch)]
        }));
        const wuxing = getWuxingScore(pillars);
        const structure = analyzeStructure(pillars, wuxing);
        return {
            input,
            pillars,
            stems: STEMS,
            branches: BRANCHES,
            colors: ELEMENT_COLOR,
            wuxing,
            structure,
            shensha: getShensha(pillars)
        };
    }

    window.BaziCore = {
        STEMS,
        BRANCHES,
        STEM_WUXING,
        BRANCH_WUXING,
        ELEMENT_COLOR,
        computeBaZi,
        getTenGod,
        cyclic,
        generateElement,
        controlElement,
        leakElement
    };
})();
