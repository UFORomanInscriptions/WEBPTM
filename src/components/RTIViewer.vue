<template>
  <div class="w-full h-full relative bg-black">
    <div ref="container" class="openlime w-full h-full"></div>

    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-black/90 text-red-400 text-sm p-4 text-center">
      {{ error }}
    </div>

    <!-- Light toggle button — always visible, large touch target -->
    <button
      v-if="uiReady"
      @click="toggleLight"
      :class="[
        'absolute top-3 right-3 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg',
        lightActive
          ? 'bg-indigo-600 text-white'
          : 'bg-black/70 text-gray-300 hover:bg-black/90'
      ]"
    >
      <!-- Sun / light icon -->
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="4"/>
        <path stroke-linecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
      {{ lightActive ? 'Drag to relight' : 'Move light' }}
    </button>

    <!-- Info overlay — top-left on desktop, hidden on small mobile to save space -->
    <div class="hidden sm:block absolute top-3 left-3 bg-black/70 rounded-lg px-3 py-2 text-xs text-gray-300 max-w-[240px]">
      <div class="font-semibold text-gray-200 mb-1">Interactive RTI Viewer</div>
      <div class="text-gray-400 mb-1.5">Roman inscription from Ebersdorf, Styria. RTI enables virtual relighting to reveal surface details invisible under fixed illumination.</div>
      <div class="text-gray-400">
        <span class="text-indigo-300">Desktop:</span> Ctrl/Shift + drag · Scroll to zoom<br>
        <span class="text-indigo-300">Touch:</span> Tap <em>Move light</em> then drag
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as OpenLIME from 'openlime';

const props = defineProps<{
  baseUrl: string;
  // Sub-path under baseUrl containing info.json (relight-cli output).
  rtiPath?: string;
}>();

const container = ref<HTMLDivElement | null>(null);
const error = ref<string>('');
let viewer: any = null;
let ui: any = null;
const lightActive = ref(false);
const uiReady = ref(false);

const toggleLight = () => {
  if (!ui) return;
  ui.toggleLightController();
  lightActive.value = !!ui.lightActive;
};

const rtiUrl = () => {
  if (props.rtiPath) {
    return `${props.baseUrl}/${props.rtiPath}/info.json`;
  }
  // Default: Ebersdorf dataset at /data/20260414_Ebersdorf/
  const base = (import.meta as any).env.BASE_URL || '/';
  return `${base}data/20260414_Ebersdorf/info.json`;
};

const init = async () => {
  if (!container.value) return;
  // Dispose previous instance if any
  if (viewer) {
    try { container.value.innerHTML = ''; } catch (_) {}
    viewer = null;
  }
  ui = null;
  uiReady.value = false;
  lightActive.value = false;
  error.value = '';

  // Point OpenLIME at the skin we copied into public/openlime/
  // BASE_URL = '/rti/' in production, '/' in dev
  const base = (import.meta as any).env.BASE_URL || '/';
  OpenLIME.Skin.setUrl(`${base}openlime/skin/skin.svg`);

  try {
    viewer = new OpenLIME.Viewer(container.value, {
      background: [0, 0, 0, 1],
      preserveDrawingBuffer: false,
    });

    const layer = new OpenLIME.Layer({
      type: 'rti',
      url: rtiUrl(),
      layout: 'deepzoom',
      normals: false,
    });

    viewer.addLayer('rti', layer);

    // NOTE: do NOT pass an `actions` option — Object.assign in UIBasic
    // would shallow-replace the default actions object and wipe every
    // action's `task` handler, so icons render + hover but clicks
    // would do nothing. Mutate defaults in place instead.
    ui = new OpenLIME.UIBasic(viewer, {
      showLightDirections: true,
    });
    if (ui.actions.zoomin) ui.actions.zoomin.display = true;
    if (ui.actions.zoomout) ui.actions.zoomout.display = true;
    if (ui.actions.light) ui.actions.light.display = true;
    uiReady.value = true;

    // On touch devices, auto-enable light mode so users can drag immediately
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) {
      // Wait for UIBasic to finish its async init (loadSkin, setupActions)
      setTimeout(() => {
        if (ui && !ui.lightActive) {
          ui.toggleLightController();
          lightActive.value = true;
        }
      }, 500);
    }
  } catch (e: any) {
    console.error('OpenLIME init failed', e);
    error.value = `Failed to load RTI: ${e?.message || e}`;
  }
};

onMounted(init);
watch(() => [props.baseUrl, props.rtiPath], init);
onBeforeUnmount(() => {
  if (container.value) container.value.innerHTML = '';
  viewer = null;
  ui = null;
});
</script>

<style>
/* OpenLIME needs an explicit size on its container */
.openlime { position: relative; }
.openlime canvas { display: block; }
</style>
