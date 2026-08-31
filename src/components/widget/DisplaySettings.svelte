<script lang="ts">
import type { LIGHT_DARK_MODE } from "@/types/config";
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";
import Icon from "@iconify/svelte";
import {
	getBgBlur,
	getDefaultHue,
	getHideBg,
	getHue,
	getRainbowMode,
	getRainbowSpeed,
	getStoredTheme,
	setBgBlur,
	setBgHueRotate,
	setHideBg,
	setHue,
	setRainbowMode,
	setRainbowSpeed,
	setTheme,
} from "@utils/setting-utils";
import { onMount } from "svelte";

let hue = getHue();
let theme = getStoredTheme();
let isRainbowMode = getRainbowMode();
let rainbowSpeed = getRainbowSpeed();
let bgBlur = getBgBlur();
let hideBg = getHideBg();
let animationId: number;

const defaultHue = getDefaultHue();

function resetHue() {
	hue = getDefaultHue();
}

$: if ((hue || hue === 0) && !isRainbowMode) {
	setHue(hue);
}

$: {
	setBgBlur(bgBlur);
}

function switchTheme(newTheme: LIGHT_DARK_MODE) {
	theme = newTheme;
	setTheme(newTheme);
}

function toggleRainbow() {
	isRainbowMode = !isRainbowMode;
	setRainbowMode(isRainbowMode);

	if (isRainbowMode) {
		document.documentElement.classList.add("is-rainbow-mode");
		document.documentElement.style.setProperty("--rainbow-duration", `${120 / rainbowSpeed}s`);
	} else {
		document.documentElement.classList.remove("is-rainbow-mode");
		document.documentElement.style.removeProperty("--rainbow-duration");
		setHue(hue);
	}
}

function toggleHideBg() {
	hideBg = !hideBg;
	setHideBg(hideBg);
}

function onSpeedChange() {
	setRainbowSpeed(rainbowSpeed);
	if (isRainbowMode) {
		document.documentElement.style.setProperty("--rainbow-duration", `${120 / rainbowSpeed}s`);
	}
}

onMount(() => {
	if (isRainbowMode) {
		document.documentElement.classList.add("is-rainbow-mode");
		document.documentElement.style.setProperty("--rainbow-duration", `${120 / rainbowSpeed}s`);
	}
});
</script>

<div id="display-setting" class="float-panel-closed card-base fixed z-50 w-[19rem] max-w-[calc(100vw-6rem)] p-4 shadow-2xl backdrop-blur-2xl transition-all duration-200">
    <!-- 1. 主题模式 -->
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-full before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.3rem]"
        >
            主题模式
        </div>
        <div class="flex gap-1.5">
            <button aria-label="Light Mode"
                class="w-9 h-7.5 rounded-lg transition flex items-center justify-center active:scale-90
                {theme === LIGHT_MODE ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-[var(--btn-regular-bg)] text-[var(--btn-content)] hover:bg-[var(--btn-regular-bg-hover)]'}"
                on:click={() => switchTheme(LIGHT_MODE)}
            >
                <Icon icon="material-symbols:wb-sunny-rounded" class="text-[1.15rem]"></Icon>
            </button>
            <button aria-label="Dark Mode"
                class="w-9 h-7.5 rounded-lg transition flex items-center justify-center active:scale-90
                {theme === DARK_MODE ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-[var(--btn-regular-bg)] text-[var(--btn-content)] hover:bg-[var(--btn-regular-bg-hover)]'}"
                on:click={() => switchTheme(DARK_MODE)}
            >
                <Icon icon="material-symbols:dark-mode-rounded" class="text-[1.15rem]"></Icon>
            </button>
            <button aria-label="Auto Mode"
                class="w-9 h-7.5 rounded-lg transition flex items-center justify-center active:scale-90
                {theme === AUTO_MODE ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-[var(--btn-regular-bg)] text-[var(--btn-content)] hover:bg-[var(--btn-regular-bg-hover)]'}"
                on:click={() => switchTheme(AUTO_MODE)}
            >
                <Icon icon="material-symbols:hdr-auto-rounded" class="text-[1.15rem]"></Icon>
            </button>
        </div>
    </div>

    <!-- 2. 主题色彩 -->
    <div class="flex flex-row gap-2 mb-2 items-center justify-between">
        <div class="flex gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-full before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.3rem]"
        >
            主题色彩
            <button aria-label="Reset to Default" class="btn-regular w-6 h-6 rounded-md active:scale-90 flex items-center justify-center"
                    class:opacity-0={hue === defaultHue} class:pointer-events-none={hue === defaultHue} on:click={resetHue}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.8rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="flex gap-1">
            <input aria-label="Hue Value" id="hueValue" type="number" min="0" max="360" value={Math.round(hue)} on:input={(e) => hue = e.currentTarget.valueAsNumber} disabled={isRainbowMode}
                   class="transition bg-[var(--btn-regular-bg)] w-12 h-7 rounded-md text-center font-bold text-sm text-[var(--btn-content)] outline-none"
            />
        </div>
    </div>
    <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded-lg select-none mb-3 flex items-center">
        <input aria-label="主题色彩" type="range" min="0" max="360" bind:value={hue} disabled={isRainbowMode}
               class="slider" id="colorSlider" step="1" style="width: 100%">
    </div>

    <!-- 3. 禁用背景 -->
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-full before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.3rem]"
        >
            禁用背景
        </div>
        <input type="checkbox" class="toggle-switch" checked={hideBg} on:change={toggleHideBg} />
    </div>

    <!-- 4. 彩虹模式 -->
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-full before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.3rem]"
        >
            彩虹模式
        </div>
        <input type="checkbox" class="toggle-switch" checked={isRainbowMode} on:change={toggleRainbow} />
    </div>

    <!-- 4.1 彩虹变换速率 -->
    {#if isRainbowMode}
    <div class="flex flex-row gap-2 mb-2 items-center justify-between transition-all" >
        <div class="flex gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-full before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.3rem]"
        >
            变换速率
        </div>
        <div class="flex gap-1">
             <div class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {rainbowSpeed}
            </div>
        </div>
    </div>
    <div class="w-full h-6 bg-[var(--btn-regular-bg)] rounded-lg select-none overflow-hidden mb-3 flex items-center">
        <input aria-label="变换速率" type="range" min="1" max="100" bind:value={rainbowSpeed} on:change={onSpeedChange}
               class="slider" step="1" style="width: 100%; --value-percent: {(rainbowSpeed - 1) / 99 * 100}%">
    </div>
    {/if}

    <!-- 5. 背景模糊 -->
    <div class="flex flex-row gap-2 mb-2 items-center justify-between">
        <div class="flex gap-2 font-bold text-base text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-full before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.3rem]"
        >
            背景模糊
        </div>
        <div class="flex gap-1">
            <div class="transition bg-[var(--btn-regular-bg)] w-12 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {bgBlur}px
            </div>
        </div>
    </div>
    <div class="w-full h-6 bg-[var(--btn-regular-bg)] rounded-lg select-none overflow-hidden flex items-center">
        <input aria-label="背景模糊" type="range" min="0" max="20" bind:value={bgBlur}
               class="slider" step="1" style="width: 100%; --value-percent: {bgBlur / 20 * 100}%">
    </div>
</div>

<style lang="stylus">
    #display-setting
      position fixed
      top auto !important
      height auto !important
      max-height max-content !important
      bottom 5.25rem
      right 5.25rem
      transform-origin bottom right
      border-radius var(--radius-large)
      background var(--card-bg)

      @media (min-width: 1024px)
        bottom 10rem
        right unquote("max(5.5rem, calc(50vw - var(--page-width) / 2 - 0.75rem))")

      &.float-panel-closed
        transform scale(0.92) translateX(0.75rem)
        opacity 0
        pointer-events none

      &:not(.float-panel-closed)
        transform scale(1) translateX(0)
        opacity 1
        pointer-events auto

      input[type="number"]
        -moz-appearance textfield
        &::-webkit-inner-spin-button
        &::-webkit-outer-spin-button
          -webkit-appearance none
          margin 0

      input[type="range"]
        -webkit-appearance none
        height 1.5rem
        background-color transparent
        transition background-image 0.15s ease-in-out

        &:not(#colorSlider)
            background-image linear-gradient(to right, var(--primary) 0%, var(--primary) var(--value-percent), transparent var(--value-percent), transparent 100%)

      #colorSlider
        background-image var(--color-selection-bar)

      input[type="range"]
        /* Input Thumb */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 0
          width 0
          background transparent
          box-shadow none
          border none

        &::-moz-range-thumb
          -webkit-appearance none
          height 0
          width 0
          background transparent
          box-shadow none
          border none

        &::-ms-thumb
          -webkit-appearance none
          height 0
          width 0
          background transparent
          box-shadow none
          border none

      #colorSlider
        background-image var(--color-selection-bar)
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.85)
          box-shadow 0 1px 3px rgba(0,0,0,0.3)
          margin-top 0
          transform none
          transition background 0.15s
          &:hover
            background #ffffff
          &:active
            background rgba(255, 255, 255, 0.7)

        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.85)
          box-shadow 0 1px 3px rgba(0,0,0,0.3)
          transform none
          transition background 0.15s
          &:hover
            background #ffffff
          &:active
            background rgba(255, 255, 255, 0.7)

        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.85)
          box-shadow 0 1px 3px rgba(0,0,0,0.3)
          transform none
          transition background 0.15s
          &:hover
            background #ffffff
          &:active
            background rgba(255, 255, 255, 0.7)

      .toggle-switch
        appearance none
        width 2.75rem
        height 1.4rem
        background var(--btn-regular-bg)
        border-radius 999px
        position relative
        cursor pointer
        transition background 0.3s
        &::after
            content ''
            position absolute
            top 0.2rem
            left 0.2rem
            width 1rem
            height 1rem
            background var(--btn-content)
            border-radius 50%
            transition transform 0.3s
        &:checked
            background var(--primary)
            &::after
                transform translateX(1.35rem)
                background white
</style>
