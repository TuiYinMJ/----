(function () {
    function trimSlash(value) {
        return String(value || "").trim().replace(/\/+$/, "");
    }

    function buildBaseUrl(config, mode) {
        const base = trimSlash(config.baseUrl);
        if (!base) throw new Error("请先填写 Base URL。");
        if (config.provider === "openai") {
            if (base.endsWith("/v1")) return base;
            return `${base}/v1`;
        }
        if (config.provider === "ollama") {
            if (mode === "openai") return `${base}/v1`;
            return base;
        }
        return base;
    }

    function buildHeaders(config) {
        const headers = { "Content-Type": "application/json" };
        if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
        return headers;
    }

    async function parseJson(response) {
        const text = await response.text();
        let payload = null;
        try {
            payload = text ? JSON.parse(text) : null;
        } catch {
            payload = { raw: text };
        }
        if (!response.ok) {
            const message = payload?.error?.message || payload?.message || payload?.raw || `HTTP ${response.status}`;
            throw new Error(message);
        }
        return payload;
    }

    async function listModels(config) {
        if (config.provider === "openai") {
            const response = await fetch(`${buildBaseUrl(config)}/models`, {
                method: "GET",
                headers: buildHeaders(config)
            });
            const payload = await parseJson(response);
            return (payload.data || []).map((item) => item.id).filter(Boolean);
        }
        if (config.provider === "ollama") {
            const response = await fetch(`${buildBaseUrl(config)}/api/tags`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            const payload = await parseJson(response);
            return (payload.models || []).map((item) => item.name).filter(Boolean);
        }
        return [];
    }

    async function chat(config, model, messages, options = {}) {
        if (!model) throw new Error("请先选择分析模型。");
        if (config.provider === "openai") {
            const response = await fetch(`${buildBaseUrl(config)}/chat/completions`, {
                method: "POST",
                headers: buildHeaders(config),
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: options.temperature ?? 0.7
                })
            });
            const payload = await parseJson(response);
            return payload.choices?.[0]?.message?.content || "";
        }
        if (config.provider === "ollama") {
            const response = await fetch(`${buildBaseUrl(config)}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: false,
                    options: { temperature: options.temperature ?? 0.7 }
                })
            });
            const payload = await parseJson(response);
            return payload.message?.content || "";
        }
        throw new Error("当前未启用 LLM 接口。");
    }

    async function embed(config, model, input) {
        if (!model) throw new Error("请先填写向量模型。");
        if (config.provider === "openai") {
            const response = await fetch(`${buildBaseUrl(config)}/embeddings`, {
                method: "POST",
                headers: buildHeaders(config),
                body: JSON.stringify({ model, input })
            });
            const payload = await parseJson(response);
            return payload.data?.[0]?.embedding || [];
        }
        if (config.provider === "ollama") {
            const response = await fetch(`${buildBaseUrl(config)}/api/embed`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model, input })
            });
            const payload = await parseJson(response);
            return payload.embeddings?.[0] || payload.embedding || [];
        }
        throw new Error("当前未启用向量接口。");
    }

    window.LLMClient = {
        listModels,
        chat,
        embed
    };
})();
