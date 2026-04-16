<template>
  <div class="h-screen w-full bg-gray-950 text-gray-100 flex flex-col font-sans overflow-hidden">
    <!-- Header (hidden on mobile) -->
    <header class="hidden md:flex bg-gray-900 border-b border-gray-800 px-4 py-3 justify-between items-center shadow-md z-10 shrink-0">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h1 class="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          UFO Roman Inscriptions
        </h1>
      </div>
      <!-- View mode toggle (hidden for now, RTI-only) -->
      <div v-if="false && selected" class="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
        <button
          @click="viewMode = 'rti'"
          :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            viewMode === 'rti' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200']"
        >
          Interactive RTI
        </button>
        <button
          @click="viewMode = 'gallery'"
          :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            viewMode === 'gallery' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200']"
        >
          Technique Gallery
        </button>
      </div>
      <div class="text-sm text-gray-400">Interactive RTI Viewer</div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex overflow-hidden min-h-0">
      <!-- Left Sidebar (hidden on mobile) -->
      <aside class="hidden md:flex w-60 shrink-0 bg-gray-800 border-r border-gray-700 flex-col overflow-hidden">
        <div class="p-3 border-b border-gray-700">
          <h2 class="text-sm font-bold text-gray-300 uppercase tracking-wider">Inscriptions</h2>
        </div>
        <div class="p-2 overflow-y-auto">
          <button
            v-for="item in inscriptions"
            :key="item.id"
            @click="selectInscription(item)"
            :class="['w-full text-left p-2.5 rounded-md transition-colors duration-150 border mb-1.5',
              selected?.id === item.id
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600']"
          >
            <h3 class="font-semibold text-sm">{{ item.title }}</h3>
            <p class="text-xs opacity-70 mt-0.5">{{ item.date }}</p>
          </button>
        </div>

        <!-- Category selector (gallery mode only) -->
        <div v-if="selected && viewMode === 'gallery'" class="border-t border-gray-700 flex flex-col overflow-hidden flex-1 min-h-0">
          <div class="p-3 border-b border-gray-700">
            <h2 class="text-sm font-bold text-gray-300 uppercase tracking-wider">Techniques</h2>
          </div>
          <div class="p-2 overflow-y-auto flex-1">
            <button
              v-for="cat in categoryNames"
              :key="cat"
              @click="activeCategory = cat"
              :class="['w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors duration-150 mb-1',
                activeCategory === cat
                  ? 'bg-cyan-700 text-white font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700']"
            >
              {{ cat }}
              <span class="text-xs opacity-60 ml-1">({{ selected.categories[cat].length }})</span>
            </button>
          </div>
        </div>

        <!-- RTI mode info -->
        <div v-if="selected && viewMode === 'rti'" class="border-t border-gray-700 p-3 flex-1">
          <h2 class="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Interactive RTI</h2>
          <p class="text-xs text-gray-400 leading-relaxed">
            Reflectance Transformation Imaging (RTI) captures a surface under varying light directions and lets you interactively relight the object. This reveals incised letters, tool marks, and surface wear that are invisible under ordinary lighting.
          </p>
          <div class="mt-3 text-xs text-gray-500 space-y-1">
            <div class="flex gap-2"><span class="text-yellow-400">&#9679;</span> Light position</div>
            <div class="flex gap-2"><span class="text-gray-400">&#9675;</span> Ctrl/Shift + drag to relight</div>
            <div class="flex gap-2"><span class="text-gray-400">&#9675;</span> Scroll to zoom</div>
          </div>
          <p class="text-xs text-gray-500 mt-3 leading-relaxed">
            Powered by <span class="text-gray-400">OpenLIME</span> &mdash; an open-source WebGL viewer for multi-resolution light-dependent imagery.
          </p>
        </div>
      </aside>

      <!-- Center: Viewer Area -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- RTI Mode -->
        <template v-if="viewMode === 'rti' && selected">
          <RTIViewer :baseUrl="selected.baseUrl" class="flex-1" />
        </template>

        <!-- Gallery Mode -->
        <template v-else-if="viewMode === 'gallery' && selected">
          <!-- Image Thumbnails Bar -->
          <div class="shrink-0 bg-gray-900 border-b border-gray-700 px-3 py-2">
            <div class="flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="img in activeCategoryImages"
                :key="img.file"
                @click="activeImage = img"
                :class="['shrink-0 flex flex-col items-center rounded-md p-1 transition-all duration-150 border',
                  activeImage?.file === img.file
                    ? 'border-indigo-400 bg-indigo-900/40'
                    : 'border-transparent hover:border-gray-600 hover:bg-gray-800']"
              >
                <img
                  :src="selected.baseUrl + '/' + img.file"
                  :alt="img.label"
                  class="w-16 h-12 object-cover rounded"
                  loading="lazy"
                />
                <span class="text-[10px] text-gray-400 mt-0.5 max-w-[70px] truncate">{{ img.label }}</span>
              </button>
            </div>
          </div>

          <!-- Main Image Viewer -->
          <div class="flex-1 relative flex items-center justify-center bg-black overflow-hidden min-h-0 p-4">
            <img
              v-if="currentImageUrl"
              :src="currentImageUrl"
              :alt="activeImage?.label || 'Inscription'"
              class="max-w-full max-h-full object-contain rounded shadow-2xl"
              @wheel.prevent="onZoom"
              :style="{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.15s ease-out' }"
            />
          </div>

          <!-- Status bar -->
          <div v-if="activeImage" class="shrink-0 bg-gray-900 border-t border-gray-700 px-4 py-1.5 flex justify-between items-center text-xs text-gray-400">
            <span>{{ activeCategory }} / {{ activeImage.label }}</span>
            <span>Scroll to zoom ({{ Math.round(zoom * 100) }}%)</span>
          </div>
        </template>

        <!-- No selection -->
        <div v-else class="flex-1 flex items-center justify-center text-gray-500 text-lg">
          Select an inscription to view.
        </div>
      </div>

      <!-- Right Sidebar: Details & Description (hidden for now) -->
      <aside v-if="false && selected" class="w-72 shrink-0 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
        <h2 class="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Details</h2>
        <div class="flex flex-col gap-3 mb-5">
          <div>
            <h3 class="text-indigo-400 font-semibold text-xs mb-0.5">Title</h3>
            <p class="text-gray-300 text-sm">{{ selected?.title }}</p>
          </div>
          <div>
            <h3 class="text-indigo-400 font-semibold text-xs mb-0.5">Date</h3>
            <p class="text-gray-300 text-sm">{{ selected?.date }}</p>
          </div>
          <div>
            <h3 class="text-indigo-400 font-semibold text-xs mb-0.5">Description</h3>
            <p class="text-gray-300 text-xs leading-relaxed">{{ selected?.description }}</p>
          </div>
        </div>

        <!-- Technique description (gallery mode) -->
        <div v-if="viewMode === 'gallery' && activeImage && techniqueDesc" class="border-t border-gray-700 pt-4">
          <h2 class="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Technique Info</h2>
          <h3 class="text-cyan-400 font-semibold text-sm mb-1">{{ activeImage?.label }}</h3>
          <p class="text-gray-400 text-xs leading-relaxed">{{ techniqueDesc }}</p>
        </div>

        <!-- Category description (gallery mode) -->
        <div v-if="viewMode === 'gallery' && activeCategory && categoryDescs[activeCategory]" class="border-t border-gray-700 pt-4 mt-3">
          <h2 class="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Category</h2>
          <h3 class="text-cyan-400 font-semibold text-sm mb-1">{{ activeCategory }}</h3>
          <p class="text-gray-400 text-xs leading-relaxed">{{ categoryDescs[activeCategory] }}</p>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import RTIViewer from './components/RTIViewer.vue';

interface ImageEntry {
  label: string;
  file: string;
}

interface Inscription {
  id: string;
  title: string;
  date: string;
  translation: string;
  description: string;
  baseUrl: string;
  defaultImage: string;
  categories: Record<string, ImageEntry[]>;
}

const inscriptions = ref<Inscription[]>([]);
const selected = ref<Inscription | null>(null);
const viewMode = ref<'rti' | 'gallery'>('rti');
const activeCategory = ref('');
const activeImage = ref<ImageEntry | null>(null);
const zoom = ref(1);

const categoryNames = computed(() => selected.value ? Object.keys(selected.value.categories) : []);

const activeCategoryImages = computed(() => {
  if (!selected.value || !activeCategory.value) return [];
  return selected.value.categories[activeCategory.value] || [];
});

const currentImageUrl = computed(() => {
  if (!selected.value || !activeImage.value) return '';
  return selected.value.baseUrl + '/' + activeImage.value.file;
});

// ---- Technique descriptions ----
const categoryDescs: Record<string, string> = {
  'Summary': 'Key overview renderings that combine multiple techniques. These provide the best single-image representations of the inscription for quick assessment.',
  'Raking Light': 'Simulated oblique illumination from 8 compass directions. Raking light reveals surface relief by casting shadows across incised letters, a classical epigraphy technique.',
  'Core Fusions': 'Fundamental multi-image fusion algorithms that combine all source photographs into optimized single outputs, each emphasizing different surface properties.',
  'Edges': 'Edge detection and line enhancement filters that isolate boundaries and strokes in the inscription, making letter forms more legible.',
  'Enhancement': 'Advanced image enhancement filters including frequency-domain processing, deconvolution, and adaptive filtering to improve inscription legibility.',
  'Binarization': 'Thresholding techniques that convert the inscription to black-and-white, isolating text from background. Useful for OCR and automated transcription.',
  'Morphology': 'Mathematical morphology operations that analyze shape structure at multiple scales, revealing features based on their geometric properties.',
  'PCA': 'Principal Component Analysis decomposes the image stack into orthogonal components ordered by variance. PC1 captures overall appearance; higher PCs reveal subtle surface variations.',
  'Neural': 'Machine learning-based decompositions including Non-negative Matrix Factorization (NMF) for material separation and photometric stereo for 3D surface reconstruction.',
  'Advanced': 'Specialized analyses including optical flow, stroke width transform, and topological feature detection for detailed inscription structure analysis.',
  'Experimental': 'Research-stage techniques including shock filters, rolling guidance, Fourier analysis, and structure tensors for cutting-edge inscription enhancement.',
};

const techniqueDescs: Record<string, string> = {
  // Summary
  'fusion_combined_best.jpg': 'Optimized combination of the best-performing fusion techniques, providing maximum inscription legibility.',
  'fusion_pca_relief.jpg': 'PCA-derived relief visualization that emphasizes surface depth variations in the stone.',
  'rti_albedo.jpg': 'Surface reflectance (albedo) extracted from RTI data, showing the stone\'s base color independent of lighting.',
  'rti_albedo_detail.jpg': 'Enhanced albedo with fine detail amplification to reveal subtle surface texture.',
  'rti_combined_best.jpg': 'Best composite rendering from RTI polynomial coefficients, optimized for inscription readability.',
  'rti_curvature.jpg': 'Surface curvature computed from normal maps. Bright areas are convex (ridges), dark areas are concave (grooves).',
  'rti_curvature_mean.jpg': 'Mean curvature averaging principal curvatures, highlighting areas of overall surface bending.',
  'rti_epigraphy_best.jpg': 'Rendering specifically tuned for epigraphic analysis, maximizing letter stroke contrast.',
  'rti_mean_stack.jpg': 'Simple average of all source photographs, approximating diffuse ambient illumination.',
  'rti_normal_map.jpg': 'RGB-encoded surface normal vectors. R=X, G=Y, B=Z direction of surface orientation at each pixel.',
  'rti_skylight.jpg': 'Simulated hemispherical sky illumination producing soft, even lighting across the surface.',
  'rti_specular.jpg': 'Specular (mirror-like) reflection component isolated from the surface, revealing surface polish and wear.',
  // Raking Light
  'rti_raking_N.jpg': 'Oblique light from the North. Shadows fall southward, revealing horizontal strokes and features.',
  'rti_raking_NE.jpg': 'Oblique light from the Northeast, casting shadows to the southwest.',
  'rti_raking_E.jpg': 'Oblique light from the East. Shadows fall westward, emphasizing vertical strokes.',
  'rti_raking_SE.jpg': 'Oblique light from the Southeast, casting shadows to the northwest.',
  'rti_raking_S.jpg': 'Oblique light from the South. Shadows fall northward, revealing horizontal strokes.',
  'rti_raking_SW.jpg': 'Oblique light from the Southwest, casting shadows to the northeast.',
  'rti_raking_W.jpg': 'Oblique light from the West. Shadows fall eastward, emphasizing vertical strokes.',
  'rti_raking_NW.jpg': 'Oblique light from the Northwest, casting shadows to the southeast.',
  'rti_raking_max.jpg': 'Maximum intensity across all raking light directions. Every feature lit from its optimal angle.',
  'rti_raking_mean.jpg': 'Average of all raking light directions, providing balanced oblique illumination.',
  // Core Fusions
  'core/fusion_denoised.jpg': 'Multi-image denoised fusion reducing photographic noise while preserving surface detail.',
  'core/fusion_focus_map.jpg': 'Focus confidence map showing which regions are sharpest across the image stack.',
  'core/fusion_focus_stack.jpg': 'Extended depth-of-field fusion combining best-focused regions from each photograph.',
  'core/fusion_gradient_field.jpg': 'Gradient field fusion combining edge information from all illumination angles.',
  'core/fusion_laplacian_pyramid.jpg': 'Multi-scale Laplacian pyramid fusion preserving details at every spatial frequency.',
  'core/fusion_max_projection.jpg': 'Maximum intensity projection: brightest pixel from each position across all images.',
  'core/fusion_optimized.jpg': 'Mathematically optimized fusion weights for maximum surface detail extraction.',
  'core/fusion_photometric_stereo.jpg': 'Photometric stereo reconstruction showing surface shape from varying illumination.',
  'core/fusion_retinex.jpg': 'Retinex-based fusion separating illumination from reflectance for even surface appearance.',
  // Edges
  'edges/coherence_enhanced.jpg': 'Coherence-enhancing diffusion smooths along edges while sharpening across them.',
  'edges/coherence_frangi.jpg': 'Frangi vesselness filter after coherence enhancement, detecting elongated structures.',
  'edges/frangi_strokes_bright.jpg': 'Frangi filter tuned for bright (raised) stroke-like features on the stone.',
  'edges/frangi_strokes_combined.jpg': 'Combined bright and dark Frangi stroke detection for complete letter identification.',
  'edges/fusion_unsharp.jpg': 'Unsharp masking applied to fused image, enhancing local contrast at edges.',
  'edges/fusion_unsharp_strong.jpg': 'Aggressive unsharp masking with higher gain for maximum edge enhancement.',
  'edges/fusion_dog.jpg': 'Difference of Gaussians (DoG) band-pass filter isolating features at inscription scale.',
  'edges/phase_congruency.jpg': 'Phase congruency edge detection, invariant to illumination and contrast changes.',
  'edges/normal_map.png': 'High-resolution surface normal map computed via photometric stereo from all source images.',
  // Enhancement
  'enhance2/enh2_diffuse.jpg': 'Enhanced diffuse component with boosted surface texture visibility.',
  'enhance2/enh2_guided_sharp.jpg': 'Guided filter sharpening that enhances edges while preserving flat regions.',
  'enhance2/enh2_homomorphic.jpg': 'Homomorphic filtering separating illumination from reflectance in the frequency domain.',
  'enhance2/enh2_kuwahara.jpg': 'Kuwahara filter providing edge-preserving smoothing with a painterly effect.',
  'enhance2/enh2_monogenic_amplitude.jpg': 'Monogenic signal amplitude showing local energy/feature strength at each pixel.',
  'enhance2/enh2_monogenic_incised.jpg': 'Monogenic analysis tuned to detect incised (carved) features in the stone.',
  'enhance2/enh2_path_opening.jpg': 'Path opening morphological filter detecting elongated connected features (letter strokes).',
  'enhance2/enh2_rl_deconv.jpg': 'Richardson-Lucy deconvolution sharpening the image by reversing optical blur.',
  'enhance2/enh2_ultimate_opening.jpg': 'Ultimate morphological opening extracting features at their characteristic scale.',
  // Binarization
  'binarization/binary_otsu.jpg': 'Otsu\'s method: automatic global threshold minimizing within-class variance.',
  'binarization/binary_sauvola.jpg': 'Sauvola local thresholding adapting to local mean and standard deviation.',
  'binarization/binary_adaptive_gaussian.jpg': 'Gaussian-weighted local adaptive threshold for varying background intensity.',
  'binarization/binary_adaptive_mean.jpg': 'Mean-based local adaptive threshold adjusting to neighborhood brightness.',
  'binarization/binary_dibco_ensemble.jpg': 'DIBCO competition ensemble combining multiple binarization methods for best results.',
  'binarization/binary_dibco_nick.jpg': 'Nick binarization from DIBCO benchmark, robust to uneven illumination.',
  'binarization/binary_dibco_wolf_jolion.jpg': 'Wolf-Jolion method from DIBCO, handling degraded document/stone surfaces.',
  // Morphology
  'morphology/fusion_annular_blackhat.jpg': 'Annular black-hat transform detecting dark circular features (drill marks, damage).',
  'morphology/fusion_annular_multiscale.jpg': 'Multi-scale annular morphology analyzing circular features across different sizes.',
  'morphology/fusion_multiscale_bright.jpg': 'Multi-scale bright feature extraction: raised areas and ridges at various scales.',
  'morphology/fusion_multiscale_dark.jpg': 'Multi-scale dark feature extraction: grooves, incisions, and valleys at various scales.',
  'morphology/fusion_retinex_multiscale.jpg': 'Morphological retinex at multiple scales for illumination-invariant feature extraction.',
  'morphology/fusion_valleys_blackhat.jpg': 'Black-hat transform isolating dark valleys (letter grooves) from the surface.',
  // PCA
  'pca/fusion_pca_pc1.jpg': 'First principal component: captures the dominant variation (overall illumination pattern).',
  'pca/fusion_pca_pc2.jpg': 'Second principal component: second-strongest variation, often surface relief orientation.',
  'pca/fusion_pca_pc3.jpg': 'Third principal component: subtle variation typically revealing surface micro-texture.',
  'pca/fusion_pca_pc4.jpg': 'Fourth principal component: fine detail variation and residual surface features.',
  // Neural
  'neural/ensemble_mean.jpg': 'Mean of neural network ensemble predictions for robust feature estimation.',
  'neural/confidence_map.jpg': 'Per-pixel confidence of neural network predictions. Bright = high certainty.',
  'neural/ps_albedo.jpg': 'Photometric stereo albedo: learned surface reflectance independent of lighting.',
  'neural/ps_depth.jpg': 'Estimated depth map from photometric stereo. Bright = closer to viewer.',
  'neural/nmf_surface_relief.jpg': 'NMF component capturing surface relief and carved letter geometry.',
  'neural/nmf_carving_edge.jpg': 'NMF component isolating the edges of carved letters and tool marks.',
  'neural/nmf_component_substrate.jpg': 'NMF component representing the base stone material/substrate.',
  'neural/nmf_component_lichen.jpg': 'NMF component separating biological growth (lichen/moss) from the stone surface.',
  // Advanced
  'advanced/adv_flow_direction.jpg': 'Optical flow direction map showing dominant surface texture orientation.',
  'advanced/adv_flow_magnitude.jpg': 'Optical flow magnitude indicating strength of directional surface features.',
  'advanced/adv_swt_map.jpg': 'Stroke Width Transform estimating letter stroke width at each pixel.',
  'advanced/adv_topo_combined.jpg': 'Combined topological features: connected components, holes, and structural patterns.',
  'advanced/adv_topo_filtered.jpg': 'Filtered topological features removing noise while preserving significant structures.',
  'advanced/adv_topo_persistence.jpg': 'Topological persistence diagram highlighting the most stable structural features.',
  // Experimental
  'experimental/exp_rolling_guidance.jpg': 'Rolling guidance filter separating structure from texture at a chosen scale.',
  'experimental/exp_shock_filter.jpg': 'Shock filter sharpening edges into step functions, enhancing letter boundaries.',
  'experimental/exp_intrinsic_reflectance.jpg': 'Intrinsic image decomposition extracting surface reflectance free of shading.',
  'experimental/exp_fourier_band_relief.jpg': 'Fourier band-pass filtering isolating spatial frequencies matching inscription relief.',
  'experimental/exp_structure_tensor_field.jpg': 'Structure tensor field visualizing local orientation and anisotropy of surface texture.',
  'experimental/exp_tv_shock_cascade.jpg': 'Cascaded total variation + shock filter for progressive edge sharpening.',
};

const techniqueDesc = computed(() => {
  if (!activeImage.value) return '';
  return techniqueDescs[activeImage.value.file] || '';
});

const selectInscription = (item: Inscription) => {
  selected.value = item;
  const cats = Object.keys(item.categories);
  activeCategory.value = cats[0] || '';
  activeImage.value = item.categories[cats[0]]?.[0] || null;
  zoom.value = 1;
};

watch(activeCategory, (cat) => {
  if (selected.value && cat) {
    activeImage.value = selected.value.categories[cat]?.[0] || null;
    zoom.value = 1;
  }
});

const onZoom = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  zoom.value = Math.min(5, Math.max(0.2, zoom.value + delta));
};

onMounted(async () => {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/inscriptions.json');
    if (!res.ok) throw new Error('Failed to load inscriptions data');
    const data: Inscription[] = await res.json();
    // Rewrite absolute paths to be relative to base URL
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    for (const item of data) {
      item.baseUrl = base + item.baseUrl;
      item.defaultImage = base + item.defaultImage;
    }
    inscriptions.value = data;
    if (data.length > 0) {
      selectInscription(data[0]);
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
});
</script>
