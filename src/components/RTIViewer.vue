<template>
  <div class="w-full h-full relative bg-black">
    <div ref="container" class="openlime w-full h-full"></div>
    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-black/90 text-red-400 text-sm p-4 text-center">
      {{ error }}
    </div>
    <div class="absolute bottom-3 left-3 bg-black/70 rounded-lg px-3 py-2 text-xs text-gray-300 max-w-[260px]">
      <div class="font-semibold text-gray-200 mb-1">Interactive RTI Viewer</div>
      <div class="text-gray-400 mb-1.5">Roman inscription from Ebersdorf, Styria. Reflectance Transformation Imaging (RTI) enables virtual relighting to reveal surface details invisible under fixed illumination.</div>
      <div class="text-gray-400">Drag with <span class="text-indigo-300">Ctrl/Shift</span> or use the <span class="text-indigo-300">light button</span> to change light direction. Scroll to zoom.</div>
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
    const ui = new OpenLIME.UIBasic(viewer, {
      showLightDirections: true,
    });
    if (ui.actions.zoomin) ui.actions.zoomin.display = true;
    if (ui.actions.zoomout) ui.actions.zoomout.display = true;
    if (ui.actions.light) ui.actions.light.display = true;
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
});
</script>

<style>
/* OpenLIME needs an explicit size on its container */
.openlime { position: relative; }
.openlime canvas { display: block; }
</style>
