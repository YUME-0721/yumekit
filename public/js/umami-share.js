/**
 * Umami Cloud API 统计脚本
 * 使用 API Key 认证方式调用 Umami Cloud API
 * 
 * 优化说明：
 * - 全站统计使用 /stats 端点
 * - 单页统计使用 /stats 端点 + path 参数（可获取 pageviews 和 visitors）
 */
((global) => {
	const cacheKey = "umami-share-cache";
	const cacheTTL = 3600_000; // 1 小时缓存

	// 初始化全局缓存 Map
	if (!global.__umamiDataCache) {
		global.__umamiDataCache = new Map();
	}

	/**
	 * 从 localStorage 获取缓存数据
	 * @param {string} key - 缓存键
	 * @returns {object|null} 缓存数据或 null
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
	 * @param {string} key - 缓存键
	 * @param {object} value - 要缓存的数据
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
	};

	// 兼容旧函数名
	global.clearUmamiCache = global.clearUmamiShareCache;

	/**
	 * 获取全站统计数据（使用 /stats 端点）
	 * @param {string} baseUrl - Umami Cloud API 基础 URL
	 * @param {string} apiKey - API 密钥
	 * @param {string} websiteId - 网站 ID
	 * @returns {Promise<object>} 统计数据
	 */
	async function fetchWebsiteStats(baseUrl, apiKey, websiteId) {
		const cacheKeyStr = `site-stats-${websiteId}`;

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
			const statsUrl = `${baseUrl}/v1/websites/${websiteId}/stats?startAt=0&endAt=${currentTimestamp}`;

			const res = await fetch(statsUrl, {
				headers: { "x-umami-api-key": apiKey },
			});

			if (!res.ok) throw new Error(`API 错误: ${res.status}`);

			const data = await res.json();
			global.__umamiDataCache.set(cacheKeyStr, data);
			saveToCache(cacheKeyStr, data);

			return {
				pageviews: data.pageviews ?? 0,
				visitors: data.visitors ?? 0,
				visits: data.visits ?? 0,
				_fromCache: false,
			};
		} catch (error) {
			console.error("获取全站统计失败:", error);
			return { pageviews: 0, visitors: 0, visits: 0, _fromCache: false };
		}
	}

	/**
	 * 获取特定页面的统计数据（使用 /stats 端点 + path 参数）
	 * @param {string} baseUrl - Umami Cloud API 基础 URL
	 * @param {string} apiKey - API 密钥
	 * @param {string} websiteId - 网站 ID
	 * @param {string} urlPath - 页面路径（如 /posts/xxx/）
	 * @returns {Promise<object>} 页面统计数据
	 */
	async function fetchPageStats(baseUrl, apiKey, websiteId, urlPath) {
		const cacheKeyStr = `page-stats-${websiteId}-${urlPath}`;

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
			// 使用 /stats 端点 + path 参数获取单页统计（可同时获取 pageviews 和 visitors）
			const statsUrl = `${baseUrl}/v1/websites/${websiteId}/stats?startAt=0&endAt=${currentTimestamp}&path=${encodeURIComponent(urlPath)}`;

			const res = await fetch(statsUrl, {
				headers: { "x-umami-api-key": apiKey },
			});

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
			console.error("获取页面统计失败:", error);
			return { pageviews: 0, visitors: 0, visits: 0, _fromCache: false };
		}
	}

	/**
	 * 获取 Umami 网站统计数据（全站）
	 * @param {string} baseUrl - Umami Cloud API 基础 URL
	 * @param {string} apiKey - API 密钥
	 * @param {string} websiteId - 网站 ID
	 * @returns {Promise<object>} 网站统计数据
	 */
	global.getUmamiWebsiteStats = async (baseUrl, apiKey, websiteId) => {
		return fetchWebsiteStats(baseUrl, apiKey, websiteId);
	};

	// 兼容旧函数名
	global.getUmamiSiteStats = global.getUmamiWebsiteStats;

	/**
	 * 获取特定页面的 Umami 统计数据
	 * @param {string} baseUrl - Umami Cloud API 基础 URL
	 * @param {string} apiKey - API 密钥
	 * @param {string} websiteId - 网站 ID
	 * @param {string} urlPath - 页面路径（可选，不传则返回全站统计）
	 * @returns {Promise<object>} 统计数据
	 */
	global.getUmamiPageStats = async (baseUrl, apiKey, websiteId, urlPath = null) => {
		// 如果没有指定路径，返回全站统计
		if (!urlPath) {
			return fetchWebsiteStats(baseUrl, apiKey, websiteId);
		}
		return fetchPageStats(baseUrl, apiKey, websiteId, urlPath);
	};
})(window);
