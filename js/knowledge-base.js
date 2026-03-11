(function () {
    const STORAGE_KEY = "tming-knowledge-base-v1";
    const SEED_ENTRIES = [
        {
            id: "seed-1",
            title: "《滴天髓》要点索引",
            tags: ["日主", "用神", "格局", "旺衰"],
            content: "强调先看气势和格局，再谈用神。强弱不是唯一标准，更要看流通、病药和寒暖燥湿。适合用来校正只盯某一个十神下结论的毛病。",
            source: "内置书目"
        },
        {
            id: "seed-2",
            title: "《子平真诠》要点索引",
            tags: ["月令", "用神", "十神", "官杀", "财星"],
            content: "以月令为提纲，重视天干透出和成格成局。适合查职业、财运、官杀印食之间的配置关系。",
            source: "内置书目"
        },
        {
            id: "seed-3",
            title: "《三命通会》要点索引",
            tags: ["神煞", "格局", "流年", "六亲"],
            content: "材料广、条目多，适合作为神煞、格局和六亲条目查阅索引，但不能脱离原局机械套用。",
            source: "内置书目"
        },
        {
            id: "seed-4",
            title: "《穷通宝鉴》要点索引",
            tags: ["调候", "寒暖燥湿", "五行", "用神"],
            content: "重点看季节、寒暖燥湿和调候，不是只看五行个数。适合修正“缺什么补什么”的粗糙思路。",
            source: "内置书目"
        },
        {
            id: "seed-5",
            title: "合婚与夫妻宫笔记模板",
            tags: ["合婚", "夫妻宫", "相冲", "六合", "子嗣"],
            content: "合婚先看夫妻宫和相处结构，再看钱、家庭、子嗣、现实分工，不能只看属相或单一神煞。",
            source: "内置书目"
        }
    ];

    function cloneSeed() {
        return SEED_ENTRIES.map((item) => ({ ...item }));
    }

    function loadEntries() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            if (!parsed || !Array.isArray(parsed) || !parsed.length) return cloneSeed();
            return parsed;
        } catch {
            return cloneSeed();
        }
    }

    function saveEntries(entries) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 80)));
        return entries;
    }

    function resetSeed() {
        return saveEntries(cloneSeed());
    }

    function addEntry(entry) {
        const entries = loadEntries();
        entries.unshift({
            id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: entry.title,
            tags: entry.tags || [],
            content: entry.content,
            source: entry.source || "手动添加"
        });
        return saveEntries(entries);
    }

    function removeEntry(id) {
        return saveEntries(loadEntries().filter((item) => item.id !== id));
    }

    function importFiles(fileList) {
        const files = Array.from(fileList || []);
        return Promise.all(files.map((file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const text = String(reader.result || "").slice(0, 40000);
                if (file.name.endsWith(".json")) {
                    try {
                        const parsed = JSON.parse(text);
                        if (Array.isArray(parsed)) {
                            resolve(parsed.map((item, index) => ({
                                title: item.title || `${file.name} #${index + 1}`,
                                tags: item.tags || [],
                                content: item.content || JSON.stringify(item),
                                source: file.name
                            })));
                            return;
                        }
                    } catch {
                        // fall through to plain text import
                    }
                }
                resolve([{
                    title: file.name,
                    tags: [],
                    content: text,
                    source: file.name
                }]);
            };
            reader.onerror = reject;
            reader.readAsText(file);
        }))).then((groups) => {
            let entries = loadEntries();
            groups.flat().forEach((entry) => {
                entries.unshift({
                    id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    ...entry
                });
            });
            saveEntries(entries);
            return entries;
        });
    }

    function exportEntries() {
        return JSON.stringify(loadEntries(), null, 2);
    }

    function getKeywords(chart, currentYearEval, currentMonthEval, compatibility) {
        const keywords = new Set([
            chart.structure.usefulElement,
            chart.structure.maxElement,
            chart.structure.minElement,
            ...chart.shensha,
            ...chart.pillars.map((pillar) => pillar.tenGod),
            ...chart.pillars.flatMap((pillar) => pillar.tenGodZhi),
            currentYearEval?.scope,
            currentMonthEval?.scope
        ].filter(Boolean));
        if (compatibility) {
            keywords.add("合婚");
            keywords.add("夫妻宫");
            keywords.add("子嗣");
        }
        return Array.from(keywords);
    }

    function matchEntries(chart, currentYearEval, currentMonthEval, compatibility) {
        const keywords = getKeywords(chart, currentYearEval, currentMonthEval, compatibility);
        return loadEntries()
            .map((entry) => {
                const haystack = `${entry.title} ${entry.tags.join(" ")} ${entry.content}`.toLowerCase();
                const score = keywords.reduce((sum, keyword) => sum + (haystack.includes(String(keyword).toLowerCase()) ? 1 : 0), 0);
                return { ...entry, score };
            })
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }

    window.KnowledgeBaseEngine = {
        STORAGE_KEY,
        loadEntries,
        saveEntries,
        resetSeed,
        addEntry,
        removeEntry,
        importFiles,
        exportEntries,
        matchEntries
    };
})();
