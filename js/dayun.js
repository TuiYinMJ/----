(function () {
    function getGenderCode(gender) {
        return gender === "male" ? 1 : 0;
    }

    function buildDaYun(chart, targetYear) {
        const yun = chart.source.eightChar.getYun(getGenderCode(chart.input.gender), chart.input.yunSect);
        const list = yun.getDaYun(10).map((item) => ({
            raw: item,
            index: item.getIndex(),
            label: item.getGanZhi() || "童限",
            startYear: item.getStartYear(),
            endYear: item.getEndYear(),
            startAge: item.getStartAge(),
            endAge: item.getEndAge()
        }));
        const current = list.find((item) => targetYear >= item.startYear && targetYear <= item.endYear) || list[list.length - 1];
        return {
            yun,
            startYear: yun.getStartYear(),
            startMonth: yun.getStartMonth(),
            startDay: yun.getStartDay(),
            startHour: yun.getStartHour(),
            startSolar: yun.getStartSolar().toYmd(),
            current,
            list,
            currentAge: targetYear - chart.source.standardSolar.getYear() + 1
        };
    }

    function buildLiuNian(dayunEntry) {
        return dayunEntry.raw.getLiuNian().map((item) => ({
            raw: item,
            year: item.getYear(),
            age: item.getAge(),
            pillar: item.getGanZhi(),
            xun: item.getXun(),
            xunKong: item.getXunKong()
        }));
    }

    function buildLiuYue(liuNianEntry) {
        return liuNianEntry.raw.getLiuYue().map((item) => ({
            raw: item,
            month: item.getIndex() + 1,
            lunarMonth: item.getMonthInChinese(),
            pillar: item.getGanZhi(),
            xun: item.getXun(),
            xunKong: item.getXunKong()
        }));
    }

    window.DayunEngine = {
        buildDaYun,
        buildLiuNian,
        buildLiuYue
    };
})();
