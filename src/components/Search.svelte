<script lang="ts">
import Icon from "@iconify/svelte";
import { getPostUrlBySlug, url } from "@utils/url-utils.ts";
import { onMount } from "svelte";

interface SearchResult {
	url: string;
	meta: {
		title: string;
	};
	excerpt: string;
	urlPath?: string;
}

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
// biome-ignore lint/suspicious/noExplicitAny: Temporary usage of any for posts array
let posts: any[] = [];

const togglePanel = () => {
	const panel = document.getElementById("search-panel");
	panel?.classList.toggle("float-panel-closed");
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) return;

	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

const highlightText = (text: string, keyword: string): string => {
	if (!keyword) return text;
	const regex = new RegExp(`(${keyword})`, "gi");
	return text.replace(regex, "<mark>$1</mark>");
};

const extractSlugFromUrl = (rawUrl: string): string => {
	if (!rawUrl) return "";
	const match = rawUrl.match(/\/posts\/(.+?)\/?$/);
	if (match && match[1]) {
		return match[1].replace(/^\/+|\/+$/g, "");
	}
	return rawUrl.replace(/.*\/posts\//, "").replace(/^\/+|\/+$/g, "");
};

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	if (!keyword) {
		setPanelVisibility(false, isDesktop);
		result = [];
		return;
	}

	isSearching = true;

	try {
		const searchResults = posts
			.filter((post) => {
				const keywordLower = keyword.toLowerCase();
				const searchText =
					`${post.title} ${post.description} ${post.content}`.toLowerCase();
				const urlPath = `/posts/${post.link}/`;

				// 支持内容搜索和URL后缀搜索
				return (
					searchText.includes(keywordLower) ||
					urlPath.toLowerCase().includes(keywordLower) ||
					post.link.toLowerCase().includes(keywordLower)
				);
			})
			.map((post) => {
				const contentLower = post.content.toLowerCase();
				const keywordLower = keyword.toLowerCase();
				const contentIndex = contentLower.indexOf(keywordLower);

				let excerpt = "";
				if (contentIndex !== -1) {
					const start = Math.max(0, contentIndex - 50);
					const end = Math.min(post.content.length, contentIndex + 100);
					excerpt = post.content.substring(start, end);
					if (start > 0) excerpt = `...${excerpt}`;
					if (end < post.content.length) excerpt = `${excerpt}...`;
				} else {
					excerpt = post.description || `${post.content.substring(0, 150)}...`;
				}

				const targetUrl = getPostUrlBySlug(post.link);
				return {
					url: targetUrl,
					meta: {
						title: post.title,
					},
					excerpt: highlightText(excerpt, keyword),
					urlPath: targetUrl,
				};
			});

		result = searchResults;
		setPanelVisibility(result.length > 0, isDesktop);
	} catch (error) {
		console.error("Search error:", error);
		result = [];
		setPanelVisibility(false, isDesktop);
	} finally {
		isSearching = false;
	}
};

onMount(async () => {
	try {
		const response = await fetch("/rss.xml");
		const text = await response.text();
		const parser = new DOMParser();
		const xml = parser.parseFromString(text, "text/xml");
		const items = xml.querySelectorAll("item");

		posts = Array.from(items).map((item) => {
			// 尝试多种方式获取content:encoded内容
			let content = "";
			const contentEncoded =
				item.getElementsByTagNameNS("*", "encoded")[0]?.textContent ||
				item.querySelector("*|encoded")?.textContent ||
				"";

			if (contentEncoded) {
				content = contentEncoded.replace(/<[^>]*>/g, "");
			}

			const rawLink = item.querySelector("link")?.textContent || "";
			return {
				title: item.querySelector("title")?.textContent || "",
				description: item.querySelector("description")?.textContent || "",
				content: content,
				link: extractSlugFromUrl(rawLink),
			};
		});
	} catch (error) {
		console.error("Error fetching RSS:", error);
	}
});

export let isHeroHome = false;

let isExpanded = false;
let inputEl: HTMLInputElement;

function handleContainerClick() {
	if (!isExpanded) {
		isExpanded = true;
		setTimeout(() => {
			inputEl?.focus();
		}, 60);
	}
}

function handleBlur() {
	if (!keywordDesktop && isExpanded) {
		isExpanded = false;
	}
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape" && isExpanded) {
		keywordDesktop = "";
		isExpanded = false;
	}
}

$: search(keywordDesktop, true);
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="relative flex items-center">
    <!-- 单一无缝 CSS 补展伸缩容器（0 物理销毁，纯 300ms 属性插值） -->
    <div id="search-bar" 
         class="flex items-center h-10 transition-all duration-300 ease-out select-none relative overflow-hidden {isHeroHome ? 'rounded-full' : 'rounded-lg'} {isExpanded ? 'w-48 sm:w-60 bg-black/[0.06] dark:bg-white/15 border border-black/15 dark:border-white/20 shadow-md px-3' : isHeroHome ? 'w-10 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 justify-center cursor-pointer' : 'w-10 md:w-36 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10 px-3 cursor-pointer'}"
         on:click={handleContainerClick}
    >
        <!-- 搜索 Icon：黑暗模式下高亮纯亮 white/90 绝对清晰自适应 -->
        <Icon icon="material-symbols:search" 
              class="text-[1.25rem] transition-colors duration-200 shrink-0 text-neutral-800 dark:text-white/90 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] {!isExpanded && !isHeroHome ? 'mr-0 md:mr-2' : ''}"
        />

        {#if !isHeroHome && !isExpanded}
            <span class="hidden md:inline text-sm text-black/50 dark:text-white/60 pointer-events-none transition-all">搜索</span>
        {/if}

        <!-- 输入框（width 补展 + opacity 渐变平滑显现） -->
        <input bind:this={inputEl} 
               placeholder="搜索文章..." 
               bind:value={keywordDesktop} 
               on:focus={() => search(keywordDesktop, true)}
               on:blur={handleBlur}
               class="text-sm bg-transparent outline-0 transition-all duration-300 text-neutral-800 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-white/40 {isExpanded ? 'w-full ml-2 opacity-100 pointer-events-auto' : 'w-0 opacity-0 pointer-events-none absolute'}"
        />

        {#if isExpanded && keywordDesktop}
            <button on:click|stopPropagation={() => { keywordDesktop = ''; isExpanded = false; }} 
                    class="text-xs text-neutral-400 dark:text-white/50 hover:text-black dark:hover:text-white transition p-1 shrink-0">
                ✕
            </button>
        {/if}
    </div>

    <!-- 搜索结果列表降落面板 -->
    {#if result && result.length > 0 && isExpanded}
        <div id="search-panel" class="search-panel absolute top-12 right-0 w-[85vw] max-w-[28rem] shadow-2xl rounded-2xl p-2 z-50 bg-[var(--card-bg)] border border-black/10 dark:border-white/15 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {#each result as item}
                <a href={item.url}
                   class="transition group block rounded-xl text-sm px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
                    <div class="transition text-black dark:text-white font-bold group-hover:text-[var(--primary)] flex items-center justify-between">
                        <span>{item.meta.title}</span>
                        <Icon icon="fa6-solid:chevron-right" class="text-[0.75rem] text-[var(--primary)] ml-2"></Icon>
                    </div>
                    {#if item.excerpt}
                        <div class="transition text-xs text-black/60 dark:text-white/60 line-clamp-2 mt-1">
                            {@html item.excerpt}
                        </div>
                    {/if}
                </a>
            {/each}
        </div>
    {/if}
</div>

<style>
  input:focus {
    outline: 0;
  }
  .search-panel {
    background-color: var(--float-panel-bg-opaque);
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  .search-panel::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
</style>
