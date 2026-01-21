/**
 * EdgeOne Pages 边缘函数中间件
 * 用于处理域名重定向：yumekai.top 和 www.yumekai.top → blog.yumekai.top
 */
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 检查是否需要重定向
    if (hostname === 'yumekai.top' || hostname === 'www.yumekai.top') {
        // 构建新的 URL，保留路径和查询参数
        const redirectUrl = `https://blog.yumekai.top${url.pathname}${url.search}`;

        // 返回 301 永久重定向
        return new Response(null, {
            status: 301,
            headers: {
                'Location': redirectUrl,
                'Cache-Control': 'public, max-age=31536000' // 缓存一年
            }
        });
    }

    // 不需要重定向，继续处理请求
    return context.next();
}
