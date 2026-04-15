<template>
  <div class="w-full h-full relative bg-black">
    <div ref="container" class="openlime w-full h-full"></div>
    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-black/90 text-red-400 text-sm p-4 text-center">
      {{ error }}
    </div>
    <div class="absolute bottom-3 left-3 bg-black/70 rounded-lg px-3 py-2 text-xs text-gray-300 max-w-[220px]">
      <div class="font-semibold text-gray-200 mb-1">Interactive RTI</div>
      <div class="text-gray-400">Drag with <span class="text-indigo-300">Ctrl/Shift</span> (or use the light button) to change light direction. Scroll to zoom.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
// @ts-ignore — openlime has no TS types
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
  const sub = props.rtiPath || 'relight_altar';
  return `${props.baseUrl}/${sub}/info.json`;
};

const init = async () => {
  if (!container.value) return;
  // Dispose previous instance if any
  if (viewer) {
    try { container.value.innerHTML = ''; } catch (_) {}
    viewer = null;
  }
  error.value = '';

  try {
    viewer = new OpenLIME.Viewer(container.value, {
      background: [0, 0, 0, 1],
      preserveDrawingBuffer: false,
    });

    const layer = new OpenLIME.Layer({
      type: 'rti',
      url: rtiUrl(),
      layout: 'image',
      normals: false,
    });

    viewer.addLayer('rti', layer);

    // eslint-disable-next-line no-new
    new OpenLIME.UIBasic(viewer, {
      showLightDirections: true,
      actions: {
        home: { display: true },
        fullscreen: { display: true },
        light: { display: true },
        zoomin: { display: true },
        zoomout: { display: true },
      },
    });
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
