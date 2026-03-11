(function () {
    const STORAGE_KEY = "tming-knowledge-base-v1";
    const MAX_ENTRIES = 1200;
    const TEN_GOD_TERMS = ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"];
    const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
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
    let entryCache = null;
    let entryReady = false;
    let persistQueue = Promise.resolve();

    function cloneSeed() {
        return SEED_ENTRIES.map((item) => ({ ...item }));
    }

    function readLegacyEntries() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            if (!Array.isArray(parsed) || !parsed.length) return cloneSeed();
            return parsed.map(normalizeEntry);
        } catch {
            return cloneSeed();
        }
    }

    function clearLegacyEntries() {
        localStorage.removeItem(STORAGE_KEY);
    }

    async function hydrateFromIndexedDb() {
        const legacy = readLegacyEntries();
        entryCache = legacy;
        if (!window.LocalDB?.available) {
            entryReady = true;
            return entryCache;
        }
        await window.LocalDB.ready;
        const dbRows = await window.LocalDB.listKnowledgeEntries();
        if (Array.isArray(dbRows) && dbRows.length) {
            entryCache = dbRows.map(normalizeEntry);
        } else {
            await window.LocalDB.replaceKnowledgeEntries(legacy);
            entryCache = legacy;
        }
        clearLegacyEntries();
        entryReady = true;
        return entryCache;
    }

    const ready = hydrateFromIndexedDb().catch(() => {
        entryCache = readLegacyEntries();
        entryReady = true;
        return entryCache;
    });

    function normalizeEntry(entry) {
        return {
            ...entry,
            title: String(entry.title || "未命名条目"),
            tags: Array.isArray(entry.tags) ? entry.tags.filter(Boolean) : [],
            content: String(entry.content || ""),
            source: String(entry.source || "手动添加"),
            locator: String(entry.locator || ""),
            kind: String(entry.kind || "note"),
            embedding: Array.isArray(entry.embedding) ? entry.embedding : null,
            embeddingModel: String(entry.embeddingModel || "")
        };
    }

    function loadEntries() {
        if (entryCache && Array.isArray(entryCache)) {
            return entryCache.map(normalizeEntry);
        }
        entryCache = cloneSeed();
        return entryCache.map(normalizeEntry);
    }

    function persistEntriesToIndexedDb(entries) {
        if (!window.LocalDB?.available) return;
        persistQueue = persistQueue
            .catch(() => {})
            .then(() => window.LocalDB.replaceKnowledgeEntries(entries))
            .catch(() => {});
    }

    function saveEntries(entries) {
        const normalized = entries.map(normalizeEntry).slice(0, MAX_ENTRIES);
        entryCache = normalized;
        persistEntriesToIndexedDb(normalized);
        return normalized;
    }

    function resetSeed() {
        return saveEntries(cloneSeed());
    }

    function addEntry(entry) {
        const entries = loadEntries();
        entries.unshift(normalizeEntry({
            id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ...entry
        }));
        return saveEntries(entries);
    }

    function removeEntry(id) {
        return saveEntries(loadEntries().filter((item) => item.id !== id));
    }

    function exportEntries() {
        return JSON.stringify(loadEntries(), null, 2);
    }

    function setEntryEmbedding(id, embedding, embeddingModel) {
        const entries = loadEntries().map((entry) => {
            if (entry.id !== id) return entry;
            return {
                ...entry,
                embedding,
                embeddingModel,
                embeddingUpdatedAt: Date.now()
            };
        });
        saveEntries(entries);
        return entries;
    }

    function clearEmbeddings() {
        return saveEntries(loadEntries().map((entry) => ({
            ...entry,
            embedding: null,
            embeddingModel: "",
            embeddingUpdatedAt: null
        })));
    }

    function cosineSimilarity(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) return 0;
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (!normA || !normB) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    function stripHtml(html) {
        const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
        return (doc.body?.textContent || "").replace(/\u00a0/g, " ");
    }

    function normalizeText(text) {
        return String(text || "")
            .replace(/\r/g, "\n")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]{2,}/g, " ")
            .trim();
    }

    function extractChunkTags(text) {
        const tags = new Set();
        const source = String(text || "");
        const stemMonthRegex = new RegExp(`([甲乙丙丁戊己庚辛壬癸])(?:木|火|土|金|水)?生于([${BRANCHES}])月`, "g");
        let match = stemMonthRegex.exec(source);
        while (match) {
            tags.add(`日主:${match[1]}`);
            tags.add(`月令:${match[2]}`);
            match = stemMonthRegex.exec(source);
        }
        TEN_GOD_TERMS.forEach((term) => {
            if (source.includes(term)) tags.add(`十神:${term}`);
        });
        if (source.includes("用神")) tags.add("用神");
        if (source.includes("调候")) tags.add("调候");
        if (source.includes("合化")) tags.add("合化");
        if (source.includes("伤官见官")) tags.add("伤官见官");
        if (source.includes("杀印相生")) tags.add("杀印相生");
        if (source.includes("食神生财")) tags.add("食神生财");
        return Array.from(tags).slice(0, 10);
    }

    function splitLongText(value, maxLength = 1200, overlapLength = 180) {
        if (value.length <= maxLength) return [value.trim()];
        const normalized = normalizeText(value);
        const paragraphs = normalized.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
        if (!paragraphs.length) return [normalized];
        const chunks = [];
        let buffer = "";
        for (const paragraph of paragraphs) {
            const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
            if (candidate.length <= maxLength) {
                buffer = candidate;
                continue;
            }
            if (buffer) {
                chunks.push(buffer.trim());
                const overlap = buffer.slice(Math.max(0, buffer.length - overlapLength)).trim();
                buffer = overlap ? `${overlap}\n\n${paragraph}` : paragraph;
                if (buffer.length <= maxLength) continue;
            }
            let cursor = 0;
            while (cursor < paragraph.length) {
                const remaining = paragraph.length - cursor;
                if (remaining <= 80) {
                    const tail = paragraph.slice(cursor).trim();
                    if (tail) {
                        if (chunks.length && tail.length <= 80) {
                            const merged = `${chunks[chunks.length - 1]}${tail}`;
                            if (merged.length <= maxLength + 120) chunks[chunks.length - 1] = merged;
                            else chunks.push(tail);
                        } else {
                            chunks.push(tail);
                        }
                    }
                    break;
                }
                const end = Math.min(cursor + maxLength, paragraph.length);
                let splitAt = Math.max(
                    paragraph.lastIndexOf("。", end),
                    paragraph.lastIndexOf("！", end),
                    paragraph.lastIndexOf("？", end),
                    paragraph.lastIndexOf("；", end),
                    paragraph.lastIndexOf("，", end)
                );
                if (splitAt <= cursor + 260) splitAt = end;
                const piece = paragraph.slice(cursor, splitAt).trim();
                if (piece) {
                    if (piece.length < 40 && chunks.length) {
                        const merged = `${chunks[chunks.length - 1]}${piece}`;
                        if (merged.length <= maxLength + 120) chunks[chunks.length - 1] = merged;
                        else chunks.push(piece);
                    } else {
                        chunks.push(piece);
                    }
                }
                const nextCursor = splitAt > cursor ? splitAt : Math.min(end + 1, paragraph.length);
                if (nextCursor <= cursor) break;
                cursor = nextCursor;
            }
            buffer = "";
        }
        if (buffer.trim()) chunks.push(buffer.trim());
        return chunks;
    }

    function splitSemanticChunks(text) {
        const headingRegex = new RegExp(
            `^(第[一二三四五六七八九十百0-9]+[章节回篇]|[一二三四五六七八九十]+[、.．]|#{1,3}\\s|[甲乙丙丁戊己庚辛壬癸](?:木|火|土|金|水)?生于[${BRANCHES}]月)`,
            "i"
        );
        const lines = normalizeText(text).split("\n");
        const chunks = [];
        let currentTitle = "";
        let buffer = [];
        const flush = () => {
            const body = buffer.join("\n").trim();
            if (!body) return;
            splitLongText(body).forEach((part, index) => {
                chunks.push({
                    title: currentTitle || (index === 0 ? "命理片段" : `命理片段续${index + 1}`),
                    content: part
                });
            });
        };
        lines.forEach((line) => {
            const trimmed = line.trim();
            const isHeading = headingRegex.test(trimmed) && trimmed.length <= 32 && !/[，。！？；]/.test(trimmed);
            if (isHeading && buffer.length) {
                flush();
                currentTitle = trimmed;
                buffer = [];
                return;
            }
            if (isHeading) {
                currentTitle = trimmed;
                return;
            }
            buffer.push(line);
        });
        flush();
        if (!chunks.length) {
            splitLongText(normalizeText(text)).forEach((part) => {
                chunks.push({ title: "命理片段", content: part });
            });
        }
        return chunks;
    }

    function filenameWithoutExt(name) {
        return String(name || "").replace(/\.[^.]+$/, "");
    }

    function detectEntryKind(fileName, chunk = null) {
        const text = `${fileName} ${chunk?.title || ""} ${chunk?.content || ""}`.toLowerCase();
        if (text.includes("案例") || text.includes("case")) return "case";
        if (text.includes("滴天髓") || text.includes("渊海") || text.includes("子平") || text.includes("通会") || text.includes("宝鉴")) return "book";
        return "note";
    }

    function buildEntriesFromChunks(fileName, chunks) {
        return (chunks || []).map((chunk, index) => ({
            id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
            title: `${filenameWithoutExt(fileName)} · ${chunk.title || `片段${index + 1}`}`,
            tags: extractChunkTags(chunk.content),
            content: chunk.content,
            source: fileName,
            locator: chunk.locator || chunk.title || `片段${index + 1}`,
            kind: detectEntryKind(fileName, chunk)
        }));
    }

    function buildEntriesFromText(fileName, text) {
        return buildEntriesFromChunks(fileName, splitSemanticChunks(text));
    }

    async function parsePdfToChunks(file) {
        try {
            const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs");
            const bytes = new Uint8Array(await file.arrayBuffer());
            const task = pdfjs.getDocument({ data: bytes, disableWorker: true });
            const doc = await task.promise;
            const pages = [];
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();
                const line = normalizeText(content.items.map((item) => item.str).join(" "));
                if (!line) continue;
                pages.push({
                    title: `第${i}页`,
                    locator: `p.${i}`,
                    content: line
                });
            }
            return pages.flatMap((page) => splitSemanticChunks(page.content).map((chunk, index) => ({
                title: `${page.title}${index ? ` · 段${index + 1}` : ""}`,
                locator: page.locator,
                content: chunk.content
            })));
        } catch (error) {
            throw new Error(`PDF 解析失败（${file.name}）：${error.message}`);
        }
    }

    async function parseEpubToChunks(file) {
        try {
            const jszipModule = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm");
            const JSZip = jszipModule.default || jszipModule;
            const zip = await JSZip.loadAsync(await file.arrayBuffer());
            const htmlNames = Object.keys(zip.files)
                .filter((name) => /\.(xhtml|html|htm)$/i.test(name) && !zip.files[name].dir)
                .sort();
            const sections = [];
            for (const name of htmlNames) {
                const html = await zip.file(name).async("string");
                const text = stripHtml(html);
                const normalized = normalizeText(text);
                if (!normalized) continue;
                splitSemanticChunks(normalized).forEach((chunk, index) => {
                    sections.push({
                        title: `${name}${index ? ` · 段${index + 1}` : ""}`,
                        locator: name,
                        content: chunk.content
                    });
                });
            }
            return sections;
        } catch (error) {
            throw new Error(`EPUB 解析失败（${file.name}）：${error.message}`);
        }
    }

    function parseJsonEntries(fileName, jsonText) {
        const parsed = JSON.parse(jsonText);
        const rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.entries) ? parsed.entries : [parsed]);
        return rows.map((item, index) => normalizeEntry({
            id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
            title: item.title || `${filenameWithoutExt(fileName)} #${index + 1}`,
            tags: item.tags || extractChunkTags(item.content || JSON.stringify(item)),
            content: item.content || JSON.stringify(item),
            source: item.source || fileName,
            locator: item.locator || "",
            kind: item.kind || detectEntryKind(fileName, item),
            embedding: item.embedding || null,
            embeddingModel: item.embeddingModel || ""
        }));
    }

    async function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error(`读取失败：${file.name}`));
            reader.readAsText(file);
        });
    }

    async function parseFileToEntries(file) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith(".json")) {
            const text = await readFileAsText(file);
            return parseJsonEntries(file.name, text);
        }
        if (lower.endsWith(".pdf")) {
            const chunks = await parsePdfToChunks(file);
            return buildEntriesFromChunks(file.name, chunks);
        }
        if (lower.endsWith(".epub")) {
            const chunks = await parseEpubToChunks(file);
            return buildEntriesFromChunks(file.name, chunks);
        }
        const text = await readFileAsText(file);
        return buildEntriesFromText(file.name, text);
    }

    async function importFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return loadEntries();
        const groups = await Promise.all(files.map((file) => parseFileToEntries(file)));
        const entries = loadEntries();
        groups.flat().forEach((entry) => entries.unshift(normalizeEntry(entry)));
        saveEntries(entries);
        return entries;
    }

    function getKeywords(chart, currentYearEval, currentMonthEval, compatibility) {
        const keywords = new Set([
            chart.structure.usefulElement,
            chart.structure.maxElement,
            chart.structure.minElement,
            chart.structure.pattern?.finalPattern,
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

    function buildQueryText(chart, currentYearEval, currentMonthEval, compatibility) {
        return [
            `${chart.pillars[2].stem}${chart.pillars[2].branch}日主`,
            `格局 ${chart.structure.pattern?.finalPattern || ""}`,
            `用神 ${chart.structure.usefulElement}`,
            `月令主气 ${chart.structure.commanderInfo?.primaryStem || ""}${chart.structure.commanderInfo?.primaryGod || ""}`,
            `当前流年 ${currentYearEval?.meta || ""}`,
            `当前流月 ${currentMonthEval?.meta || ""}`,
            compatibility ? "合婚 夫妻宫 子嗣" : "",
            getKeywords(chart, currentYearEval, currentMonthEval, compatibility).join(" ")
        ].filter(Boolean).join("；");
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

    function buildCitation(entry, index = 1) {
        const locator = entry.locator ? ` · ${entry.locator}` : "";
        return `[${index}] ${entry.title}（${entry.source}${locator}）`;
    }

    function buildCitedReferences(entries, limit = 6) {
        return (entries || []).slice(0, limit).map((entry, index) => ({
            ...entry,
            citationId: index + 1,
            citation: buildCitation(entry, index + 1),
            excerpt: String(entry.content || "").slice(0, 220)
        }));
    }

    function semanticMatchEntries(queryEmbedding, limit = 8) {
        return loadEntries()
            .filter((entry) => Array.isArray(entry.embedding) && entry.embedding.length)
            .map((entry) => ({
                ...entry,
                score: cosineSimilarity(entry.embedding, queryEmbedding)
            }))
            .filter((entry) => entry.score > 0.15)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    function matchCaseEntries(chart, currentYearEval, currentMonthEval, compatibility, queryEmbedding = null, limit = 5) {
        const keywords = getKeywords(chart, currentYearEval, currentMonthEval, compatibility).map((item) => String(item).toLowerCase());
        return loadEntries()
            .filter((entry) => entry.kind === "case" || /案例|case/i.test(`${entry.title} ${entry.tags.join(" ")}`))
            .map((entry) => {
                const haystack = `${entry.title} ${entry.tags.join(" ")} ${entry.content}`.toLowerCase();
                const keywordScore = keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? 1 : 0), 0);
                const semanticScore = queryEmbedding && Array.isArray(entry.embedding) ? cosineSimilarity(entry.embedding, queryEmbedding) * 10 : 0;
                const score = keywordScore + semanticScore;
                return {
                    ...entry,
                    score,
                    similarity: Math.max(0, Math.min(99, Math.round((score / Math.max(keywords.length || 1, 1)) * 100)))
                };
            })
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    window.KnowledgeBaseEngine = {
        ready,
        isReady: () => entryReady,
        STORAGE_KEY,
        loadEntries,
        saveEntries,
        resetSeed,
        addEntry,
        removeEntry,
        importFiles,
        exportEntries,
        setEntryEmbedding,
        clearEmbeddings,
        cosineSimilarity,
        splitSemanticChunks,
        extractChunkTags,
        buildQueryText,
        buildCitation,
        buildCitedReferences,
        matchEntries,
        matchCaseEntries,
        semanticMatchEntries
    };
})();
