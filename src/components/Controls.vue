<template>
  <div class="bg-gray-800 p-6 flex flex-col gap-6 shadow-lg border-l border-gray-700 w-80 overflow-y-auto">
    <h2 class="text-xl font-bold text-gray-200 uppercase tracking-wider">Details & Controls</h2>

    <div v-if="inscription" class="flex flex-col gap-4">
      <div>
        <h3 class="text-indigo-400 font-semibold mb-1">Title</h3>
        <p class="text-gray-300">{{ inscription.title }}</p>
      </div>

      <div>
        <h3 class="text-indigo-400 font-semibold mb-1">Date</h3>
        <p class="text-gray-300">{{ inscription.date }}</p>
      </div>

      <div>
        <h3 class="text-indigo-400 font-semibold mb-1">Description</h3>
        <p class="text-gray-300 text-sm leading-relaxed">{{ inscription.description }}</p>
      </div>

      <div>
        <h3 class="text-indigo-400 font-semibold mb-1">Translation</h3>
        <p class="text-gray-300 text-sm italic border-l-2 border-indigo-500 pl-3 py-1">{{ inscription.translation }}</p>
      </div>

      <hr class="border-gray-700 my-2" />

      <div>
        <h3 class="text-indigo-400 font-semibold mb-3">Rendering Mode</h3>
        <select class="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2.5">
          <option>Default (Diffuse)</option>
          <option>Specular Enhancement</option>
          <option>Normals</option>
          <option>Unsharp Masking</option>
        </select>
        <p class="text-xs text-gray-500 mt-2">Note: Rendering mode integration depends on the specific RTI viewer implementation.</p>
      </div>
    </div>
    
    <div v-else class="text-gray-500 italic mt-10 text-center">
      No inscription selected.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InscriptionItem } from './Gallery.vue';

defineProps<{
  inscription: InscriptionItem | null;
}>();
</script>