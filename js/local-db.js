(function () {
    const DB_NAME = "tming-local-db-v1";
    const DB_VERSION = 1;
    const STORES = {
        kv: "kv",
        profiles: "profiles",
        lifeEvents: "lifeEvents",
        compatProfiles: "compatProfiles",
        knowledge: "knowledge"
    };

    function hasIndexedDb() {
        return typeof window !== "undefined" && !!window.indexedDB;
    }

    function requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("IndexedDB 请求失败"));
        });
    }

    function transactionDone(tx) {
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onabort = () => reject(tx.error || new Error("IndexedDB 事务中断"));
            tx.onerror = () => reject(tx.error || new Error("IndexedDB 事务失败"));
        });
    }

    function openDb() {
        if (!hasIndexedDb()) return Promise.resolve(null);
        return new Promise((resolve, reject) => {
            const req = window.indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORES.kv)) {
                    db.createObjectStore(STORES.kv, { keyPath: "key" });
                }
                if (!db.objectStoreNames.contains(STORES.profiles)) {
                    db.createObjectStore(STORES.profiles, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(STORES.lifeEvents)) {
                    db.createObjectStore(STORES.lifeEvents, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(STORES.compatProfiles)) {
                    db.createObjectStore(STORES.compatProfiles, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(STORES.knowledge)) {
                    db.createObjectStore(STORES.knowledge, { keyPath: "id" });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error || new Error("无法打开 IndexedDB"));
        });
    }

    const dbReady = openDb().catch(() => null);

    async function withStore(storeName, mode, executor) {
        const db = await dbReady;
        if (!db) return null;
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const result = await executor(store, tx);
        await transactionDone(tx);
        return result;
    }

    async function getKv(key) {
        const db = await dbReady;
        if (!db) return null;
        const tx = db.transaction(STORES.kv, "readonly");
        const value = await requestToPromise(tx.objectStore(STORES.kv).get(key));
        await transactionDone(tx);
        return value ? value.value : null;
    }

    async function setKv(key, value) {
        return withStore(STORES.kv, "readwrite", (store) => {
            store.put({ key, value, updatedAt: Date.now() });
            return true;
        });
    }

    async function listStore(storeName) {
        const db = await dbReady;
        if (!db) return [];
        const tx = db.transaction(storeName, "readonly");
        const rows = await requestToPromise(tx.objectStore(storeName).getAll());
        await transactionDone(tx);
        return Array.isArray(rows) ? rows : [];
    }

    async function countStore(storeName) {
        const db = await dbReady;
        if (!db) return 0;
        const tx = db.transaction(storeName, "readonly");
        const count = await requestToPromise(tx.objectStore(storeName).count());
        await transactionDone(tx);
        return Number(count || 0);
    }

    async function listStorePage(storeName, options = {}, matcher = null, direction = "prev") {
        const db = await dbReady;
        if (!db) return { rows: [], total: 0 };
        const offset = Math.max(0, Number(options.offset || 0));
        const limit = Math.max(1, Number(options.limit || 20));
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.openCursor(null, direction);
            const rows = [];
            let matched = 0;
            req.onsuccess = () => {
                const cursor = req.result;
                if (!cursor) return;
                const row = cursor.value;
                const pass = typeof matcher === "function" ? matcher(row) : true;
                if (pass) {
                    matched += 1;
                    if (matched > offset && rows.length < limit) rows.push(row);
                }
                cursor.continue();
            };
            req.onerror = () => reject(req.error || new Error("IndexedDB 游标读取失败"));
            tx.oncomplete = () => resolve({ rows, total: matched });
            tx.onerror = () => reject(tx.error || new Error("IndexedDB 分页读取失败"));
            tx.onabort = () => reject(tx.error || new Error("IndexedDB 分页读取中断"));
        });
    }

    async function replaceStore(storeName, rows) {
        const safeRows = Array.isArray(rows) ? rows : [];
        return withStore(storeName, "readwrite", (store) => {
            store.clear();
            safeRows.forEach((row) => {
                if (row && typeof row === "object") store.put(row);
            });
            return safeRows.length;
        });
    }

    async function upsertStore(storeName, row) {
        if (!row || (row.id == null && row.key == null)) return false;
        return withStore(storeName, "readwrite", (store) => {
            store.put(row);
            return true;
        });
    }

    async function removeFromStore(storeName, id) {
        return withStore(storeName, "readwrite", (store) => {
            store.delete(id);
            return true;
        });
    }

    async function clearStore(storeName) {
        return withStore(storeName, "readwrite", (store) => {
            store.clear();
            return true;
        });
    }

    async function listProfiles() {
        return listStore(STORES.profiles);
    }

    async function countProfiles() {
        return countStore(STORES.profiles);
    }

    async function listProfilesPage(options = {}) {
        const group = String(options.group || "").trim();
        const matcher = group
            ? (row) => String(row?.group || row?.input?.profileGroup || "未分组") === group
            : null;
        return listStorePage(STORES.profiles, options, matcher, "prev");
    }

    async function listProfileGroups() {
        const db = await dbReady;
        if (!db) return [];
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORES.profiles, "readonly");
            const store = tx.objectStore(STORES.profiles);
            const req = store.openCursor();
            const groups = new Set();
            req.onsuccess = () => {
                const cursor = req.result;
                if (!cursor) return;
                const row = cursor.value || {};
                groups.add(String(row.group || row.input?.profileGroup || "未分组"));
                cursor.continue();
            };
            req.onerror = () => reject(req.error || new Error("读取档案分组失败"));
            tx.oncomplete = () => resolve(Array.from(groups).sort((a, b) => a.localeCompare(b, "zh-Hans-CN")));
            tx.onerror = () => reject(tx.error || new Error("读取档案分组失败"));
            tx.onabort = () => reject(tx.error || new Error("读取档案分组中断"));
        });
    }

    async function replaceProfiles(rows) {
        return replaceStore(STORES.profiles, rows);
    }

    async function upsertProfile(row) {
        return upsertStore(STORES.profiles, row);
    }

    async function clearProfiles() {
        return clearStore(STORES.profiles);
    }

    async function listLifeEvents() {
        return listStore(STORES.lifeEvents);
    }

    async function countLifeEvents() {
        return countStore(STORES.lifeEvents);
    }

    async function listLifeEventsPage(options = {}) {
        return listStorePage(STORES.lifeEvents, options, null, "prev");
    }

    async function replaceLifeEvents(rows) {
        return replaceStore(STORES.lifeEvents, rows);
    }

    async function upsertLifeEvent(row) {
        return upsertStore(STORES.lifeEvents, row);
    }

    async function removeLifeEvent(id) {
        return removeFromStore(STORES.lifeEvents, id);
    }

    async function listCompatProfiles() {
        return listStore(STORES.compatProfiles);
    }

    async function countCompatProfiles() {
        return countStore(STORES.compatProfiles);
    }

    async function listCompatProfilesPage(options = {}) {
        return listStorePage(STORES.compatProfiles, options, null, "prev");
    }

    async function replaceCompatProfiles(rows) {
        return replaceStore(STORES.compatProfiles, rows);
    }

    async function upsertCompatProfile(row) {
        return upsertStore(STORES.compatProfiles, row);
    }

    async function removeCompatProfile(id) {
        return removeFromStore(STORES.compatProfiles, id);
    }

    async function clearCompatProfiles() {
        return clearStore(STORES.compatProfiles);
    }

    async function listKnowledgeEntries() {
        return listStore(STORES.knowledge);
    }

    async function replaceKnowledgeEntries(rows) {
        return replaceStore(STORES.knowledge, rows);
    }

    async function upsertKnowledgeEntry(row) {
        return upsertStore(STORES.knowledge, row);
    }

    async function removeKnowledgeEntry(id) {
        return removeFromStore(STORES.knowledge, id);
    }

    async function exportAll() {
        const [kvRows, profiles, lifeEvents, compatProfiles, knowledge] = await Promise.all([
            listStore(STORES.kv),
            listProfiles(),
            listLifeEvents(),
            listCompatProfiles(),
            listKnowledgeEntries()
        ]);
        const kv = {};
        kvRows.forEach((row) => {
            kv[row.key] = row.value;
        });
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            kv,
            profiles,
            lifeEvents,
            compatProfiles,
            knowledge
        };
    }

    async function importAll(payload, replace = true) {
        const data = payload || {};
        if (replace) {
            await Promise.all([
                replaceStore(STORES.kv, Object.entries(data.kv || {}).map(([key, value]) => ({ key, value, updatedAt: Date.now() }))),
                replaceProfiles(data.profiles || []),
                replaceLifeEvents(data.lifeEvents || []),
                replaceCompatProfiles(data.compatProfiles || []),
                replaceKnowledgeEntries(data.knowledge || [])
            ]);
            return true;
        }
        const merges = [
            ...(data.profiles || []),
            ...(await listProfiles())
        ];
        await replaceProfiles(merges);
        return true;
    }

    window.LocalDB = {
        ready: dbReady,
        available: hasIndexedDb(),
        getKv,
        setKv,
        listProfiles,
        listProfilesPage,
        listProfileGroups,
        countProfiles,
        replaceProfiles,
        upsertProfile,
        clearProfiles,
        listLifeEvents,
        listLifeEventsPage,
        countLifeEvents,
        replaceLifeEvents,
        upsertLifeEvent,
        removeLifeEvent,
        listCompatProfiles,
        listCompatProfilesPage,
        countCompatProfiles,
        replaceCompatProfiles,
        upsertCompatProfile,
        removeCompatProfile,
        clearCompatProfiles,
        listKnowledgeEntries,
        replaceKnowledgeEntries,
        upsertKnowledgeEntry,
        removeKnowledgeEntry,
        exportAll,
        importAll
    };
})();
