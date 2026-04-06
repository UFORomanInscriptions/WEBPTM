<template>
  <div class="h-full overflow-y-auto bg-gray-800 border-r border-gray-700 p-4 w-64 flex flex-col gap-4 shadow-lg">
    <h2 class="text-xl font-bold text-gray-200 uppercase tracking-wider mb-2">Inscriptions</h2>
    
    <button 
      v-for="item in items" 
      :key="item.id"
      @click="$emit('select', item)"
      :class="['text-left p-3 rounded-md transition-colors duration-200 border', selectedId === item.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600']"
    >
      <h3 class="font-semibold">{{ item.title }}</h3>
      <p class="text-sm opacity-80 mt-1">{{ item.date }}</p>
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

export interface InscriptionItem {
  id: string;
  title: string;
  date: string;
  translation: string;
  rtiFile: string;
  description: string;
}

const props = defineProps<{
  items: InscriptionItem[];
  selectedId: string | null;
}>();

defineEmits<{
  (e: 'select', item: InscriptionItem): void
}>();
</script>