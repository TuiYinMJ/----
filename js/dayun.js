(function () {
    function getDirection(yearStem, gender) {
        const yangStems = ["甲", "丙", "戊", "庚", "壬"];
        const isYang = yangStems.includes(yearStem);
        return (gender === "male" && isYang) || (gender === "female" && !isYang) ? 1 : -1;
    }

    function getStartAge(monthBranchIndex, shichenIndex) {
        return 3 + ((monthBranchIndex + shichenIndex) % 6);
    }

    function buildDaYun(chart, targetYear) {
        const birthYear = chart.input.year;
        const monthPillar = chart.pillars[1];
        const direction = getDirection(chart.pillars[0].stem, chart.input.gender);
        const startAge = getStartAge(BaziCore.BRANCHES.indexOf(monthPillar.branch), chart.solarMeta.effectiveShichen.index);
        const monthStemIndex = BaziCore.STEMS.indexOf(monthPillar.stem);
        const monthBranchIndex = BaziCore.BRANCHES.indexOf(monthPillar.branch);
        const dayun = Array.from({ length: 8 }, (_, i) => {
            const step = i + 1;
            const stem = BaziCore.STEMS[(monthStemIndex + direction * step + 100) % 10];
            const branch = BaziCore.BRANCHES[(monthBranchIndex + direction * step + 120) % 12];
            const ageStart = startAge + i * 10;
            return {
                label: `${stem}${branch}`,
                stem,
                branch,
                ageStart,
                ageEnd: ageStart + 9,
                yearStart: birthYear + ageStart,
                yearEnd: birthYear + ageStart + 9
            };
        });
        const currentAge = targetYear - birthYear;
        const current = dayun.find((item) => currentAge >= item.ageStart && currentAge <= item.ageEnd) || dayun[0];
        return { startAge, direction, currentAge, current, list: dayun };
    }

    function buildLiuNian(chart, dayun, targetYear) {
        return Array.from({ length: 10 }, (_, i) => {
            const year = dayun.current.yearStart + i;
            const cyc = BaziCore.cyclic(year - 1984);
            const score = scoreYear(chart, cyc);
            return {
                year,
                pillar: cyc,
                score,
                summary: year === targetYear ? "当前重点流年" : score >= 75 ? "较顺" : score >= 60 ? "可为" : "波动偏大"
            };
        });
    }

    function buildLiuYue(chart, targetYear) {
        return Array.from({ length: 12 }, (_, monthIndex) => {
            const pillar = BaziCore.cyclic((targetYear - 1984) * 12 + monthIndex);
            const score = scoreYear(chart, pillar);
            return {
                month: monthIndex + 1,
                pillar,
                score,
                focus: score >= 75 ? "推进、表达、合作" : score >= 60 ? "稳步落地、守节奏" : "保守、休整、控风险"
            };
        });
    }

    function scoreYear(chart, cyc) {
        const stem = cyc[0];
        const branch = cyc[1];
        const stemElement = BaziCore.STEM_WUXING[BaziCore.STEMS.indexOf(stem)];
        const branchElement = BaziCore.BRANCH_WUXING[BaziCore.BRANCHES.indexOf(branch)];
        let score = 62;
        [stemElement, branchElement].forEach((element) => {
            if (element === chart.structure.usefulElement) score += 10;
            if (element === chart.structure.supportiveElement) score += 6;
            if (element === chart.structure.dayElement && chart.structure.strength === "身强") score -= 6;
            if (element === BaziCore.controlElement(chart.structure.dayElement) && chart.structure.strength === "身弱") score -= 5;
        });
        return Math.max(35, Math.min(96, score));
    }

    window.DayunEngine = {
        buildDaYun,
        buildLiuNian,
        buildLiuYue
    };
})();
