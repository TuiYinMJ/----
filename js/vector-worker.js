/* eslint-disable no-restricted-globals */
(() => {
    const TABLE_COUNT = 10;
    const BITS_PER_TABLE = 12;
    const MIN_CANDIDATE_BASE = 48;

    const state = {
        ready: false,
        stamp: "",
        dim: 0,
        items: [],
        planes: [],
        buckets: []
    };

    function lcg(seed) {
        let value = seed >>> 0;
        return () => {
            value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
            return value / 4294967296;
        };
    }

    function clearIndex() {
        state.ready = false;
        state.stamp = "";
        state.dim = 0;
        state.items = [];
        state.planes = [];
        state.buckets = [];
    }

    function normalizeVector(raw, dim) {
        if (!Array.isArray(raw) || !raw.length) return null;
        const targetDim = dim || raw.length;
        if (raw.length !== targetDim) return null;
        const vector = new Float32Array(targetDim);
        let normSquare = 0;
        for (let i = 0; i < targetDim; i++) {
            const value = Number(raw[i] || 0);
            vector[i] = value;
            normSquare += value * value;
        }
        const norm = Math.sqrt(normSquare);
        if (!norm) return null;
        return { vector, norm };
    }

    function buildPlanes(dim) {
        const rand = lcg(20260311 + dim);
        const planes = [];
        for (let table = 0; table < TABLE_COUNT; table++) {
            const tablePlanes = [];
            for (let bit = 0; bit < BITS_PER_TABLE; bit++) {
                const plane = new Float32Array(dim);
                for (let i = 0; i < dim; i++) {
                    plane[i] = (rand() * 2) - 1;
                }
                tablePlanes.push(plane);
            }
            planes.push(tablePlanes);
        }
        return planes;
    }

    function projectionKey(vector, tablePlanes) {
        let key = 0;
        for (let bit = 0; bit < tablePlanes.length; bit++) {
            const plane = tablePlanes[bit];
            let dot = 0;
            for (let i = 0; i < vector.length; i++) dot += vector[i] * plane[i];
            if (dot >= 0) key |= (1 << bit);
        }
        return key;
    }

    function cosineSimilarity(queryVec, queryNorm, item) {
        let dot = 0;
        const vector = item.vector;
        for (let i = 0; i < queryVec.length; i++) dot += queryVec[i] * vector[i];
        return dot / (queryNorm * item.norm);
    }

    function buildIndex(payload) {
        const entries = Array.isArray(payload?.entries) ? payload.entries : [];
        const stamp = String(payload?.stamp || "");
        if (!entries.length) {
            clearIndex();
            state.stamp = stamp;
            return { count: 0, dim: 0, tables: TABLE_COUNT };
        }
        const first = entries.find((entry) => Array.isArray(entry.embedding) && entry.embedding.length);
        if (!first) {
            clearIndex();
            state.stamp = stamp;
            return { count: 0, dim: 0, tables: TABLE_COUNT };
        }
        const dim = first.embedding.length;
        const items = [];
        entries.forEach((entry) => {
            const packed = normalizeVector(entry.embedding, dim);
            if (!packed) return;
            items.push({
                id: entry.id,
                model: entry.embeddingModel || "",
                vector: packed.vector,
                norm: packed.norm
            });
        });
        const planes = buildPlanes(dim);
        const buckets = Array.from({ length: TABLE_COUNT }, () => new Map());
        items.forEach((item, index) => {
            for (let table = 0; table < TABLE_COUNT; table++) {
                const key = projectionKey(item.vector, planes[table]);
                let row = buckets[table].get(key);
                if (!row) {
                    row = [];
                    buckets[table].set(key, row);
                }
                row.push(index);
            }
        });
        state.ready = true;
        state.stamp = stamp;
        state.dim = dim;
        state.items = items;
        state.planes = planes;
        state.buckets = buckets;
        return { count: items.length, dim, tables: TABLE_COUNT };
    }

    function queryIndex(payload) {
        if (!state.ready || !state.items.length) return [];
        const packed = normalizeVector(payload?.queryEmbedding, state.dim);
        if (!packed) return [];
        const limit = Math.max(1, Number(payload?.limit || 8));
        const minScore = Number.isFinite(Number(payload?.minScore)) ? Number(payload.minScore) : 0.15;
        const candidateSet = new Set();
        for (let table = 0; table < TABLE_COUNT; table++) {
            const key = projectionKey(packed.vector, state.planes[table]);
            const rows = state.buckets[table].get(key);
            if (!rows) continue;
            for (const idx of rows) candidateSet.add(idx);
        }
        const minCandidates = Math.max(MIN_CANDIDATE_BASE, limit * 8);
        if (candidateSet.size < minCandidates) {
            for (let index = 0; index < state.items.length; index++) {
                candidateSet.add(index);
                if (candidateSet.size >= minCandidates) break;
            }
        }
        const results = [];
        candidateSet.forEach((idx) => {
            const item = state.items[idx];
            if (!item) return;
            const score = cosineSimilarity(packed.vector, packed.norm, item);
            if (score > minScore) {
                results.push({ id: item.id, score, model: item.model });
            }
        });
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }

    self.addEventListener("message", (event) => {
        const { taskId, type, payload } = event.data || {};
        if (!taskId || !type) return;
        try {
            let data = null;
            if (type === "build-index") data = buildIndex(payload);
            else if (type === "query-index") data = queryIndex(payload);
            else if (type === "clear-index") {
                clearIndex();
                data = { ok: true };
            } else if (type === "status") {
                data = {
                    ready: state.ready,
                    count: state.items.length,
                    dim: state.dim,
                    stamp: state.stamp
                };
            } else {
                throw new Error(`unknown-task:${type}`);
            }
            self.postMessage({ taskId, ok: true, data });
        } catch (error) {
            self.postMessage({ taskId, ok: false, error: error?.message || String(error) });
        }
    });
})();
