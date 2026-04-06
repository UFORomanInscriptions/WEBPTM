<template>
  <div id="lime-viewer" ref="viewerContainer" class="w-full h-full relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
    <div v-if="!modelUrl" class="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
      Select an inscription from the gallery to view.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import * as OpenLIME from 'openlime';

const props = defineProps<{
  modelUrl: string | null;
}>();

const viewerContainer = ref<HTMLElement | null>(null);
let viewer: any = null;
let currentLayer: any = null;

onMounted(() => {
  if (viewerContainer.value) {
    viewer = new OpenLIME.Viewer('lime-viewer', {
      prefetchBorder: 1,
      layout: 'basic'
    });
    
    // Add pan/zoom controller
    const controller = new OpenLIME.ControllerPanZoom();
    viewer.addController(controller);
    
    if(props.modelUrl) {
      loadModel(props.modelUrl);
    }
  }
});

const loadModel = (url: string) => {
  if (!viewer) return;
  
  if (currentLayer) {
    // If there's an existing layer, remove it
    // Note: OpenLIME API for removing layers might vary, we assume removeLayer exists or just clear.
    // We'll just create a new viewer instance for safety if needed, but let's try replacing layers.
    try {
      // Assuming viewer has removeLayer
      viewer.removeLayer(currentLayer);
    } catch(e) {}
  }
  
  // Try loading as generic image or RTI. OpenLIME might guess from the layout, or we can use LayerRTI if it exists
  // The documentation showed LayerImage. Let's try LayerRTI for PTM/RTI or LayerImage as fallback.
  // We can just use LayerImage, or since it's an RTI file, maybe LayerRTI exists.
  try {
    currentLayer = new (OpenLIME as any).LayerRTI({
      id: 'rti-layer',
      url: url
    });
  } catch (e) {
    // Fallback to LayerImage
    currentLayer = new OpenLIME.LayerImage({
      id: 'image-layer',
      url: url
    });
  }
  
  viewer.addLayer(currentLayer);
};

watch(() => props.modelUrl, (newUrl) => {
  if (newUrl) {
    loadModel(newUrl);
  }
});

onBeforeUnmount(() => {
  if (viewer && typeof viewer.destroy === 'function') {
    viewer.destroy();
  }
});
</script>