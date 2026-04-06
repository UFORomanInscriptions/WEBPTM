<template>
  <div class="h-screen w-full bg-gray-950 text-gray-100 flex flex-col font-sans overflow-hidden">
    <!-- Header -->
    <header class="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center shadow-md z-10">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h1 class="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          UFO Roman Inscriptions
        </h1>
      </div>
      <div class="text-sm text-gray-400">
        Interactive RTI Viewer Showcase
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar: Gallery -->
      <Gallery 
        :items="inscriptions" 
        :selectedId="selectedInscription?.id || null" 
        @select="selectInscription" 
      />

      <!-- Center: Viewer Area -->
      <div class="flex-1 p-6 relative flex flex-col items-center justify-center">
        <div class="w-full h-full max-w-6xl max-h-[80vh] flex flex-col">
          <div class="flex justify-between items-end mb-4">
             <h2 class="text-2xl font-semibold text-gray-200">
               {{ selectedInscription ? selectedInscription.title : 'Interactive Viewer' }}
             </h2>
             <div class="text-sm text-gray-400" v-if="selectedInscription">
                Drag on the image to move the light source. Scroll to zoom.
             </div>
          </div>
          <div class="flex-1 relative rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-black">
             <Viewer :modelUrl="selectedInscription?.rtiFile || null" />
          </div>
        </div>
      </div>

      <!-- Right Sidebar: Details and Controls -->
      <Controls :inscription="selectedInscription" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Gallery, { type InscriptionItem } from './components/Gallery.vue';
import Viewer from './components/Viewer.vue';
import Controls from './components/Controls.vue';

const inscriptions = ref<InscriptionItem[]>([]);
const selectedInscription = ref<InscriptionItem | null>(null);

onMounted(async () => {
  try {
    const res = await fetch('/data/inscriptions.json');
    if (!res.ok) throw new Error('Failed to load inscriptions data');
    const data: InscriptionItem[] = await res.json();
    inscriptions.value = data;
    
    // Select the first one by default if available
    if (data.length > 0) {
      selectedInscription.value = data[0];
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
});

const selectInscription = (item: InscriptionItem) => {
  selectedInscription.value = item;
};
</script>