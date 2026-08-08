/**
 * Umami 统计服务前端数据抓取脚本
 * 支持免 API Key（通过 Share Token）及 API Key 方式拉取统计数据
 */
((global) => {
	const cacheKey = "umami-share-cache";
	const cacheTTL = 3600_000; // 1 小时缓存

	// 默认保底配置（自建 Umami 服务参数）
	const defaultBaseUrl = "https://umami.yumekai.top";
	const defaultWebsiteId = "967adb81-bb8b-429d-855d-2ac915a6af96";
	const defaultShareId = "46vKiUC2hTE5PytG";

	// 初始化全局缓存 Map
	if (!global.__umamiDataCache) {
		global.__umamiDataCache = new Map();
	}
	if (!global.__umamiShareTokenCache) {
		global.__umamiShareTokenCache = new Map();
	}

	/**
	 * 从 localStorage 获取缓存数据
	 */
	function getFromCache(key) {
		try {
			const cached = localStorage.getItem(`${cacheKey}-${key}`);
			if (cached) {
				const parsed = JSON.parse(cached);
				if (Date.now() - parsed.timestamp < cacheTTL) {
					return parsed.value;
				}
				localStorage.removeItem(`${cacheKey}-${key}`);
			}
		} catch {
			// 忽略缓存错误
		}
		return null;
	}

	/**
	 * 保存数据到缓存
	 */
	function saveToCache(key, value) {
		try {
			localStorage.setItem(
				`${cacheKey}-${key}`,
				JSON.stringify({ timestamp: Date.now(), value }),
			);
		} catch {
			// 忽略缓存错误
		}
	}

	/**
	 * 获取 Umami Share Token（免 API Key 获取公开统计）
	 */
	async function getShareToken(baseUrl, shareId) {
		const targetShareId = shareId || global.__umamiShareId || defaultShareId;
		const targetBaseUrl = baseUrl || global.__umamiBaseUrl || defaultBaseUrl;

		if (!targetShareId) return null;
		const cacheKeyStr = `share-token-${targetShareId}`;
		if (global.__umamiShareTokenCache.has(cacheKeyStr)) {
			return global.__umamiShareTokenCache.get(cacheKeyStr);
		}
		const cachedToken = getFromCache(cacheKeyStr);
		if (cachedToken) {
			global.__umamiShareTokenCache.set(cacheKeyStr, cachedToken);
			return cachedToken;
		}

		try {
			const res = await fetch(`${targetBaseUrl}/api/share/${targetShareId}`);
			if (!res.ok) return null;
			const data = await res.json();
			if (data && data.token) {
				global.__umamiShareTokenCache.set(cacheKeyStr, data.token);
				saveToCache(cacheKeyStr, data.token);
				return data.token;
			}
		} catch (e) {
			console.error("获取 Umami Share Token 失败:", e);
		}
		return null;
	}

	/**
	 * 清除 Umami 缓存
	 */
	global.clearUmamiShareCache = () => {
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key && key.startsWith(cacheKey)) {
				localStorage.removeItem(key);
			}
		}
		global.__umamiDataCache.clear();
		global.__umamiShareTokenCache.clear();
	};

	global.clearUmamiCache = global.clearUmamiShareCache;

	/**
	 * 智能解析全场景调用参数
	 */
	function parseArgs(args) {
		let baseUrl = null;
		let websiteId = null;
		let urlPath = null;
		let shareId = null;

		const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			if (typeof arg !== "string" || !arg.trim()) continue;
			const trimmed = arg.trim();

			if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
				baseUrl = trimmed;
			} else if (uuidRegex.test(trimmed)) {
				websiteId = trimmed;
			} else if (trimmed.startsWith("/")) {
				urlPath = trimmed;
			} else if (!shareId && trimmed.length >= 6 && !trimmed.includes("/")) {
				shareId = trimmed;
			}
		}

		return {
			baseUrl: baseUrl || global.__umamiBaseUrl || defaultBaseUrl,
			websiteId: websiteId || global.__umamiWebsiteId || defaultWebsiteId,
			urlPath: urlPath,
			shareId: shareId || global.__umamiShareId || defaultShareId,
		};
	}

	/**
	 * 获取 Umami 统计核心函数
	 */
	async function fetchStats(baseUrl, websiteId, urlPath = null, shareId = null) {
		const targetWebsiteId = websiteId || defaultWebsiteId;
		const targetBaseUrl = (baseUrl || defaultBaseUrl).replace(/\/+$/, "");

		const cacheKeyStr = urlPath ? `page-stats-${targetWebsiteId}-${urlPath}` : `site-stats-${targetWebsiteId}`;

		// 检查内存缓存
		if (global.__umamiDataCache.has(cacheKeyStr)) {
			return { ...global.__umamiDataCache.get(cacheKeyStr), _fromCache: true };
		}

		// 检查 localStorage 缓存
		const cachedData = getFromCache(cacheKeyStr);
		if (cachedData) {
			global.__umamiDataCache.set(cacheKeyStr, cachedData);
			return { ...cachedData, _fromCache: true };
		}

		try {
			const currentTimestamp = Date.now();
			let statsUrl = `${targetBaseUrl}/api/websites/${targetWebsiteId}/stats?startAt=0&endAt=${currentTimestamp}`;
			if (urlPath) {
				statsUrl += `&path=${encodeURIComponent(urlPath)}`;
			}

			const headers = {};
			const targetShareId = shareId || defaultShareId;
			if (targetShareId) {
				const shareToken = await getShareToken(targetBaseUrl, targetShareId);
				if (shareToken) {
					headers["x-umami-share-token"] = shareToken;
					headers["x-umami-share-context"] = targetShareId;
				}
			}

			let res = await fetch(statsUrl, { headers });

			if (res.status === 404 && !urlPath) {
				const fallbackUrl = `${targetBaseUrl}/v1/websites/${targetWebsiteId}/stats?startAt=0&endAt=${currentTimestamp}`;
				res = await fetch(fallbackUrl, { headers });
			}

			if (res.status === 401 || res.status === 403) {
				if (!global.__umamiApiUnauthorized) {
					console.info("Umami 统计 API 未获得授权，静默跳过数据展示。");
					global.__umamiApiUnauthorized = true;
				}
				return { pageviews: 0, visitors: 0, visits: 0, _fromCache: false };
			}

			if (!res.ok) throw new Error(`API 错误: ${res.status}`);

			const data = await res.json();
			const result = {
				pageviews: data.pageviews ?? 0,
				visitors: data.visitors ?? 0,
				visits: data.visits ?? 0,
			};

			global.__umamiDataCache.set(cacheKeyStr, result);
			saveToCache(cacheKeyStr, result);

			return { ...result, _fromCache: false };
		} catch (error) {
			console.error("获取 Umami 统计失败:", error);
			return { pageviews: 0, visitors: 0, visits: 0, _fromCache: false };
		}
	}

	/**
	 * 获取全站统计数据
	 */
	global.getUmamiWebsiteStats = async (...args) => {
		const { baseUrl, websiteId, shareId } = parseArgs(args);
		return fetchStats(baseUrl, websiteId, null, shareId);
	};

	global.getUmamiSiteStats = global.getUmamiWebsiteStats;

	/**
	 * 获取特定页面的统计数据
	 */
	global.getUmamiPageStats = async (...args) => {
		const { baseUrl, websiteId, urlPath, shareId } = parseArgs(args);
		return fetchStats(baseUrl, websiteId, urlPath, shareId);
	};
})(window);
