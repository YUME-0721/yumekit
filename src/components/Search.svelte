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

function expandSearch() {
	isExpanded = true;
	setTimeout(() => {
		inputEl?.focus();
	}, 50);
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
    {#if !isExpanded}
        <!-- 唯一响应式搜索按钮：主页为精美纯图标，非主页显示搜索栏 -->
        <button on:click={expandSearch} aria-label="Search" 
                class:list={[
                    "btn-plain scale-animation active:scale-90 flex items-center justify-center transition-all",
                    isHeroHome 
                        ? "w-10 h-10 rounded-full" 
                        : "h-11 w-10 md:w-36 rounded-lg md:justify-start md:px-3 bg-black/[0.04] dark:bg-white/5"
                ]}>
            {#if !isHeroHome}
                <div class="hidden md:flex items-center text-sm text-black/50 dark:text-white/50 w-full pointer-events-none">
                    <Icon icon="material-symbols:search" class="text-[1.25rem] mr-2"></Icon>
                    <span>搜索</span>
                </div>
                <div class="flex md:hidden items-center justify-center">
                    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
                </div>
            {:else}
                <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
            {/if}
        </button>
    {:else}
        <!-- 点击后伸缩展开的输入框 -->
        <div id="search-bar" 
             class="flex transition-all duration-300 items-center h-10 rounded-full relative overflow-hidden
              bg-black/[0.06] hover:bg-black/[0.08] focus-within:bg-black/[0.08]
              dark:bg-white/10 dark:hover:bg-white/15 dark:focus-within:bg-white/15
              w-44 sm:w-60 shadow-md border border-black/10 dark:border-white/15
        ">
            <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 my-auto text-black/40 dark:text-white/40 z-10"></Icon>
            <input bind:this={inputEl} placeholder="搜索文章..." bind:value={keywordDesktop} 
                   on:focus={() => search(keywordDesktop, true)}
                   on:blur={handleBlur}
                   class="pl-9 pr-6 text-sm bg-transparent outline-0 h-full w-full text-black/80 dark:text-white/80"
            >
            {#if keywordDesktop}
                <button on:click={() => { keywordDesktop = ''; isExpanded = false; }} class="absolute right-2 text-xs text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white p-1">✕</button>
            {/if}
        </div>
    {/if}

    <!-- 仅在有搜索结果时浮现结果面板 -->
    {#if result && result.length > 0 && isExpanded}
        <div id="search-panel" class="search-panel absolute top-12 right-0 w-[85vw] max-w-[28rem] shadow-2xl rounded-2xl p-2 z-50 bg-[var(--card-bg)] border border-black/10 dark:border-white/15 backdrop-blur-2xl">
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
