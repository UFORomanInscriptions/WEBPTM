<template>
  <div class="w-full h-full relative bg-black" ref="container">
    <canvas
      ref="canvas"
      class="w-full h-full cursor-crosshair"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @touchstart.prevent="startTouch"
      @touchmove.prevent="onTouch"
      @touchend="stopDrag"
    />
    <!-- Light direction indicator -->
    <div class="absolute bottom-3 left-3 bg-black/70 rounded-lg p-2 flex items-center gap-2">
      <div class="w-12 h-12 rounded-full border border-gray-500 relative bg-gray-900">
        <div
          class="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
          :style="{
            left: `${50 + lightX * 40}%`,
            top: `${50 - lightY * 40}%`,
            transform: 'translate(-50%, -50%)'
          }"
        />
      </div>
      <div class="text-xs text-gray-400">
        <div>Drag to move light</div>
        <div class="text-gray-500">{{ lightLabel }}</div>
      </div>
    </div>
    <!-- Loading indicator -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/80">
      <div class="text-gray-300 flex flex-col items-center gap-2">
        <svg class="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span class="text-sm">Loading raking light images ({{ loadedCount }}/8)...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';

const props = defineProps<{
  baseUrl: string;
}>();

const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const lightX = ref(0);
const lightY = ref(0.3);
const dragging = ref(false);
const loading = ref(true);
const loadedCount = ref(0);

const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
// Angles in radians for each direction (N=up=90°, going clockwise)
const dirAngles: Record<string, { x: number; y: number }> = {
  N:  { x: 0,    y: 1 },
  NE: { x: 0.707, y: 0.707 },
  E:  { x: 1,    y: 0 },
  SE: { x: 0.707, y: -0.707 },
  S:  { x: 0,    y: -1 },
  SW: { x: -0.707, y: -0.707 },
  W:  { x: -1,   y: 0 },
  NW: { x: -0.707, y: 0.707 },
};

const images: Record<string, HTMLImageElement> = {};
let ctx: CanvasRenderingContext2D | null = null;
let resizeObserver: ResizeObserver | null = null;
let animFrame = 0;

const lightLabel = computed(() => {
  const angle = Math.atan2(lightY.value, lightX.value) * 180 / Math.PI;
  const dist = Math.sqrt(lightX.value ** 2 + lightY.value ** 2);
  if (dist < 0.1) return 'Center (ambient)';
  if (angle > 67.5) return 'North';
  if (angle > 22.5) return lightX.value > 0 ? 'NE' : 'NW';
  if (angle > -22.5) return lightX.value > 0 ? 'East' : 'West';
  if (angle > -67.5) return lightX.value > 0 ? 'SE' : 'SW';
  return 'South';
});

const loadImages = async () => {
  loading.value = true;
  loadedCount.value = 0;
  const promises = directions.map((dir) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        images[dir] = img;
        loadedCount.value++;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = `${props.baseUrl}/rti_raking_${dir}.jpg`;
    });
  });
  await Promise.all(promises);
  loading.value = false;
  render();
};

const render = () => {
  if (!canvas.value || !ctx) return;
  const c = canvas.value;
  const w = c.width;
  const h = c.height;

  // Calculate weights for each direction based on light position
  const weights: Record<string, number> = {};
  let totalWeight = 0;
  const lx = lightX.value;
  const ly = lightY.value;
  const dist = Math.sqrt(lx * lx + ly * ly);

  for (const dir of directions) {
    const d = dirAngles[dir];
    // Cosine similarity between light direction and image direction
    const dot = dist > 0.01 ? (lx * d.x + ly * d.y) / dist : 0;
    // Convert to weight: higher dot product = higher weight
    const w = Math.max(0, dot);
    // Sharpen the falloff
    weights[dir] = w * w * w;
    totalWeight += weights[dir];
  }

  // If light is near center, blend all equally
  if (dist < 0.15) {
    for (const dir of directions) {
      weights[dir] = 1;
    }
    totalWeight = 8;
  }

  // Normalize
  if (totalWeight > 0) {
    for (const dir of directions) {
      weights[dir] /= totalWeight;
    }
  }

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Get image dimensions for proper aspect ratio
  const firstImg = Object.values(images)[0];
  if (!firstImg) return;

  const imgW = firstImg.naturalWidth;
  const imgH = firstImg.naturalHeight;
  const scale = Math.min(w / imgW, h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const offX = (w - drawW) / 2;
  const offY = (h - drawH) / 2;

  // Create ImageData for pixel-level blending
  // For performance, use canvas compositing instead
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  // Sort by weight descending for better visual quality
  const sorted = directions
    .filter(d => weights[d] >= 0.001 && images[d])
    .sort((a, b) => weights[b] - weights[a]);

  if (sorted.length === 0) return;

  // Draw the strongest direction first at full opacity
  ctx.globalAlpha = 1;
  ctx.drawImage(images[sorted[0]], offX, offY, drawW, drawH);

  // Blend in others additively
  ctx.globalCompositeOperation = 'lighter';
  // We need to scale properly: draw main at its weight, others at theirs
  // Reset and use proper weighted approach
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  // Use multiply approach: draw each image with its alpha weight
  let accumulated = 0;
  for (const dir of sorted) {
    const alpha = weights[dir];
    if (accumulated === 0) {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(images[dir], offX, offY, drawW, drawH);
      accumulated = alpha;
    } else {
      // Blend this image on top with appropriate alpha
      ctx.globalAlpha = alpha / (accumulated + alpha);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(images[dir], offX, offY, drawW, drawH);
      accumulated += alpha;
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
};

const startDrag = (e: MouseEvent) => {
  dragging.value = true;
  updateLight(e.clientX, e.clientY);
};

const onDrag = (e: MouseEvent) => {
  if (!dragging.value) return;
  updateLight(e.clientX, e.clientY);
};

const startTouch = (e: TouchEvent) => {
  dragging.value = true;
  updateLight(e.touches[0].clientX, e.touches[0].clientY);
};

const onTouch = (e: TouchEvent) => {
  if (!dragging.value) return;
  updateLight(e.touches[0].clientX, e.touches[0].clientY);
};

const stopDrag = () => {
  dragging.value = false;
};

const updateLight = (clientX: number, clientY: number) => {
  if (!canvas.value) return;
  const rect = canvas.value.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  const dist = Math.sqrt(x * x + y * y);
  const clamp = Math.min(dist, 1);
  if (dist > 0.01) {
    lightX.value = (x / dist) * clamp;
    lightY.value = (y / dist) * clamp;
  } else {
    lightX.value = 0;
    lightY.value = 0;
  }
  cancelAnimationFrame(animFrame);
  animFrame = requestAnimationFrame(render);
};

const resizeCanvas = () => {
  if (!canvas.value || !container.value) return;
  const rect = container.value.getBoundingClientRect();
  canvas.value.width = rect.width * window.devicePixelRatio;
  canvas.value.height = rect.height * window.devicePixelRatio;
  ctx = canvas.value.getContext('2d');
  if (ctx) {
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.value.style.width = rect.width + 'px';
    canvas.value.style.height = rect.height + 'px';
  }
  // Re-set dimensions for CSS-pixel drawing
  canvas.value.width = rect.width;
  canvas.value.height = rect.height;
  ctx = canvas.value.getContext('2d');
  render();
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
  }
  if (container.value) {
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container.value);
  }
  resizeCanvas();
  loadImages();
});

watch(() => props.baseUrl, () => {
  loadImages();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  cancelAnimationFrame(animFrame);
});
</script>
