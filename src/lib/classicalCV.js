// Classical Computer Vision engine for particle counting.
// Uses Otsu thresholding + morphological opening + connected component labeling.
// Runs in the browser via Canvas API — no external dependencies.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function otsuThreshold(gray) {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];
  let sumB = 0, wB = 0, maxVariance = 0, threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  return threshold;
}

function erode(binary, width, height) {
  const result = new Uint8Array(binary.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binary[idx] === 0) continue;
      let keep = true;
      if (x > 0 && binary[idx - 1] === 0) keep = false;
      else if (x < width - 1 && binary[idx + 1] === 0) keep = false;
      else if (y > 0 && binary[idx - width] === 0) keep = false;
      else if (y < height - 1 && binary[idx + width] === 0) keep = false;
      result[idx] = keep ? 1 : 0;
    }
  }
  return result;
}

function dilate(binary, width, height) {
  const result = new Uint8Array(binary.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binary[idx] !== 1) continue;
      result[idx] = 1;
      if (x > 0) result[idx - 1] = 1;
      if (x < width - 1) result[idx + 1] = 1;
      if (y > 0) result[idx - width] = 1;
      if (y < height - 1) result[idx + width] = 1;
    }
  }
  return result;
}

function floodFill(binary, labels, startIdx, width, height, label) {
  const stack = [startIdx];
  let size = 0;
  while (stack.length > 0) {
    const idx = stack.pop();
    if (idx < 0 || idx >= binary.length) continue;
    if (labels[idx] !== 0 || binary[idx] !== 1) continue;
    labels[idx] = label;
    size++;
    const x = idx % width;
    const y = Math.floor(idx / width);
    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }
  return size;
}

function sobelMagnitude(gray, width, height) {
  const mag = new Float32Array(gray.length);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const tl = gray[idx - width - 1], t = gray[idx - width], tr = gray[idx - width + 1];
      const l = gray[idx - 1], r = gray[idx + 1];
      const bl = gray[idx + width - 1], b = gray[idx + width], br = gray[idx + width + 1];
      const gx = -tl + tr - 2 * l + 2 * r - bl + br;
      const gy = -tl - 2 * t - tr + bl + 2 * b + br;
      mag[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return mag;
}

function fillHoles(binary, width, height) {
  // Flood fill from border background pixels, then invert
  const marked = new Uint8Array(binary.length);
  for (let i = 0; i < marked.length; i++) marked[i] = binary[i];
  const queue = new Int32Array(marked.length);
  let qHead = 0, qTail = 0;
  for (let x = 0; x < width; x++) {
    if (marked[x] === 0) { marked[x] = 2; queue[qTail++] = x; }
    const bi = (height - 1) * width + x;
    if (marked[bi] === 0) { marked[bi] = 2; queue[qTail++] = bi; }
  }
  for (let y = 0; y < height; y++) {
    if (marked[y * width] === 0) { marked[y * width] = 2; queue[qTail++] = y * width; }
    if (marked[y * width + width - 1] === 0) { marked[y * width + width - 1] = 2; queue[qTail++] = y * width + width - 1; }
  }
  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % width;
    const y = Math.floor(idx / width);
    if (x > 0 && marked[idx - 1] === 0) { marked[idx - 1] = 2; queue[qTail++] = idx - 1; }
    if (x < width - 1 && marked[idx + 1] === 0) { marked[idx + 1] = 2; queue[qTail++] = idx + 1; }
    if (y > 0 && marked[idx - width] === 0) { marked[idx - width] = 2; queue[qTail++] = idx - width; }
    if (y < height - 1 && marked[idx + width] === 0) { marked[idx + width] = 2; queue[qTail++] = idx + width; }
  }
  const result = new Uint8Array(binary.length);
  for (let i = 0; i < result.length; i++) result[i] = marked[i] !== 2 ? 1 : 0;
  return result;
}

/**
 * Counts particles in an image using classical CV (Sobel edges + morphology + CCL).
 * Detects both dark and light particles by finding edges regardless of brightness.
 * @param {string} imageUrl - URL of the image to analyze.
 * @param {{ maxDimension?: number }} options
 * @returns {Promise<{ count: number, totalArea: number, threshold: number, width: number, height: number }>}
 */
export async function classicalParticleCount(imageUrl, options = {}) {
  const { maxDimension = 800 } = options;

  const img = await loadImage(imageUrl);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  // Convert to grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Sobel edge detection — finds boundaries of BOTH dark and light particles
  const mag = sobelMagnitude(gray, width, height);

  // Adaptive edge threshold: mean + 2 std dev
  let gradMean = 0;
  for (let i = 0; i < mag.length; i++) gradMean += mag[i];
  gradMean /= mag.length;
  let gradVar = 0;
  for (let i = 0; i < mag.length; i++) gradVar += (mag[i] - gradMean) ** 2;
  const gradStd = Math.sqrt(gradVar / mag.length);
  const threshold = Math.round(gradMean + gradStd * 2);

  // Binarize edges
  const edges = new Uint8Array(mag.length);
  for (let i = 0; i < mag.length; i++) edges[i] = mag[i] > threshold ? 1 : 0;

  // Morphological closing: dilate (×2) then erode (×2) to connect edge fragments
  let closed = dilate(dilate(edges, width, height), width, height);
  closed = erode(erode(closed, width, height), width, height);

  // Fill holes inside closed contours → solid particle masks
  const filled = fillHoles(closed, width, height);

  // Morphological opening: erode then dilate to remove thin noise
  const opened = dilate(erode(filled, width, height), width, height);

  // Adaptive minimum area: scales with image size
  const minArea = Math.max(15, Math.round((width * height) / 6000));

  // Connected component labeling via flood fill
  const labels = new Int32Array(opened.length);
  let count = 0;
  let totalArea = 0;
  let nextLabel = 1;
  for (let i = 0; i < opened.length; i++) {
    if (opened[i] === 1 && labels[i] === 0) {
      const size = floodFill(opened, labels, i, width, height, nextLabel);
      nextLabel++;
      if (size >= minArea) {
        count++;
        totalArea += size;
      }
    }
  }

  return { count, totalArea, threshold, width, height };
}

// === Shared helpers for methodology functions ===

async function loadGrayscale(imageUrl, maxDimension = 800) {
  const img = await loadImage(imageUrl);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = Math.round(0.299 * imageData.data[i * 4] + 0.587 * imageData.data[i * 4 + 1] + 0.114 * imageData.data[i * 4 + 2]);
  }
  return { gray, width, height };
}

function countComponents(binary, width, height, minArea) {
  const labels = new Int32Array(binary.length);
  let count = 0;
  let totalArea = 0;
  let nextLabel = 1;
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === 1 && labels[i] === 0) {
      const size = floodFill(binary, labels, i, width, height, nextLabel);
      nextLabel++;
      if (size >= minArea) { count++; totalArea += size; }
    }
  }
  return { count, totalArea };
}

// === METHODOLOGY A: Otsu baseline (dark particles only) ===
export async function otsuParticleCount(imageUrl, options = {}) {
  const { maxDimension = 800 } = options;
  const { gray, width, height } = await loadGrayscale(imageUrl, maxDimension);

  const threshold = otsuThreshold(gray);
  const binary = new Uint8Array(gray.length);
  let fgCount = 0;
  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] < threshold ? 1 : 0;
    if (binary[i]) fgCount++;
  }
  if (fgCount / gray.length > 0.5) {
    for (let i = 0; i < binary.length; i++) binary[i] = binary[i] ? 0 : 1;
  }

  const opened = dilate(erode(binary, width, height), width, height);
  const minArea = Math.max(15, Math.round((width * height) / 6000));
  const { count, totalArea } = countComponents(opened, width, height, minArea);
  return { count, totalArea, threshold, width, height };
}

// === METHODOLOGY C: Multi-threshold (dark + light particles) ===
export async function multiThresholdCount(imageUrl, options = {}) {
  const { maxDimension = 800 } = options;
  const { gray, width, height } = await loadGrayscale(imageUrl, maxDimension);

  const threshold1 = otsuThreshold(gray);

  // Dark particles: below Otsu threshold
  const dark = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) dark[i] = gray[i] < threshold1 ? 1 : 0;

  // Bright side stats for light particle detection
  let brightCount = 0, brightSum = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] >= threshold1) { brightSum += gray[i]; brightCount++; }
  }
  const brightMean = brightSum / brightCount;
  let brightVarSum = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] >= threshold1) brightVarSum += (gray[i] - brightMean) ** 2;
  }
  const brightStd = Math.sqrt(brightVarSum / brightCount);
  const lightUpper = Math.round(brightMean - brightStd * 1.5);

  // Light particles: between threshold1 and lightUpper
  const light = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    light[i] = (gray[i] >= threshold1 && gray[i] < lightUpper) ? 1 : 0;
  }

  // Combine dark + light
  const combined = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) combined[i] = (dark[i] || light[i]) ? 1 : 0;

  const opened = dilate(erode(combined, width, height), width, height);
  const minArea = Math.max(15, Math.round((width * height) / 6000));
  const { count, totalArea } = countComponents(opened, width, height, minArea);
  return { count, totalArea, threshold: threshold1, width, height };
}

// === METHODOLOGY E: Progressive erosion ===
export async function progressiveErosionCount(imageUrl, options = {}) {
  const { maxDimension = 800 } = options;
  const { gray, width, height } = await loadGrayscale(imageUrl, maxDimension);

  // Start with Sobel-based detection
  const mag = sobelMagnitude(gray, width, height);
  let gradMean = 0;
  for (let i = 0; i < mag.length; i++) gradMean += mag[i];
  gradMean /= mag.length;
  let gradVar = 0;
  for (let i = 0; i < mag.length; i++) gradVar += (mag[i] - gradMean) ** 2;
  const gradStd = Math.sqrt(gradVar / mag.length);
  const edgeThreshold = Math.round(gradMean + gradStd * 2);

  const edges = new Uint8Array(mag.length);
  for (let i = 0; i < mag.length; i++) edges[i] = mag[i] > edgeThreshold ? 1 : 0;

  let closed = dilate(dilate(edges, width, height), width, height);
  closed = erode(erode(closed, width, height), width, height);
  const filled = fillHoles(closed, width, height);

  const minArea = Math.max(15, Math.round((width * height) / 6000));

  // Count at each erosion level to find plateau
  const countsByLevel = [];
  let current = filled;
  for (let level = 0; level <= 5; level++) {
    const { count } = countComponents(current, width, height, minArea);
    countsByLevel.push(count);
    if (level < 5) current = erode(current, width, height);
  }

  // Find first plateau (count stabilizes)
  let bestCount = countsByLevel[0];
  for (let i = 1; i < countsByLevel.length; i++) {
    if (countsByLevel[i] === countsByLevel[i - 1]) { bestCount = countsByLevel[i]; break; }
  }
  if (bestCount === countsByLevel[0]) bestCount = Math.max(...countsByLevel);

  const { totalArea } = countComponents(filled, width, height, minArea);
  return { count: bestCount, totalArea, threshold: edgeThreshold, width, height, countsByLevel };
}

// === HYBRID: Validate LLM regions with classical CV ===
// For each LLM bounding box, checks if there's a real particle (local contrast)
// Returns { confirmed, total } — how many LLM regions have detectable particles
export async function validateRegions(imageUrl, regions, options = {}) {
  const { maxDimension = 800 } = options;
  const img = await loadImage(imageUrl);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDimension / Math.max(origWidth, origHeight));
  const width = Math.max(1, Math.round(origWidth * scale));
  const height = Math.max(1, Math.round(origHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = Math.round(0.299 * imageData.data[i * 4] + 0.587 * imageData.data[i * 4 + 1] + 0.114 * imageData.data[i * 4 + 2]);
  }

  let confirmed = 0;
  for (const region of regions) {
    const rx = Math.round((region.x || 0) * scale);
    const ry = Math.round((region.y || 0) * scale);
    const rw = Math.round((region.width || 0) * scale);
    const rh = Math.round((region.height || 0) * scale);
    if (rw < 2 || rh < 2) continue;

    let sum = 0, sumSq = 0, count = 0;
    for (let y = Math.max(0, ry); y < Math.min(height, ry + rh); y++) {
      for (let x = Math.max(0, rx); x < Math.min(width, rx + rw); x++) {
        const v = gray[y * width + x];
        sum += v;
        sumSq += v * v;
        count++;
      }
    }
    if (count < 4) continue;
    const mean = sum / count;
    const std = Math.sqrt(Math.max(0, sumSq / count - mean * mean));
    if (std > 8) confirmed++;
  }

  return { confirmed, total: regions.length };
}

/**
 * Builds a validation object from the multi-grid LLM ensemble.
 * Confidence is based on the coefficient of variation across grid runs.
 *
 * @param {number} llmCount - Median count from LLM ensemble
 * @param {number[]} llmRuns - Individual counts from each grid run
 * @param {number} [llmStdDev=0] - Std dev across LLM runs
 */
export function buildValidation(llmCount, llmRuns, llmStdDev = 0) {
  const safeLlm = llmCount || 0;
  const safeStdDev = llmStdDev || 0;
  const roundedStdDev = Math.round(safeStdDev * 100) / 100;
  const safeRuns = llmRuns || [];

  const consistency = safeLlm > 0 ? (safeStdDev / safeLlm) * 100 : 100;
  const level = consistency <= 5 ? 'high' : consistency <= 15 ? 'medium' : 'low';

  return {
    llm_count: safeLlm,
    llm_runs: safeRuns,
    llm_std_dev: roundedStdDev,
    confidence: level,
    variance_pct: Math.round(consistency * 100) / 100,
  };
}