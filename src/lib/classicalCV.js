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

/**
 * Counts particles in an image using classical CV (Otsu + morphology + CCL).
 * @param {string} imageUrl - URL of the image to analyze.
 * @param {{ minArea?: number, maxDimension?: number }} options
 * @returns {Promise<{ count: number, threshold: number, width: number, height: number }>}
 */
export async function classicalParticleCount(imageUrl, options = {}) {
  const { minArea = 25, maxDimension = 800 } = options;

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

  // Otsu's threshold
  const threshold = otsuThreshold(gray);

  // Binarize (particles darker than background by default)
  const binary = new Uint8Array(gray.length);
  let fgCount = 0;
  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] < threshold ? 1 : 0;
    if (binary[i]) fgCount++;
  }
  // Heuristic: if most of the image is "foreground", particles are likely lighter
  if (fgCount / gray.length > 0.5) {
    for (let i = 0; i < binary.length; i++) binary[i] = binary[i] ? 0 : 1;
  }

  // Morphological opening (erosion then dilation) — removes noise
  const opened = dilate(erode(binary, width, height), width, height);

  // Connected component labeling via flood fill
  const labels = new Int32Array(opened.length);
  let count = 0;
  for (let i = 0; i < opened.length; i++) {
    if (opened[i] === 1 && labels[i] === 0) {
      const size = floodFill(opened, labels, i, width, height, count + 1);
      if (size >= minArea) count++;
    }
  }

  return { count, threshold, width, height };
}

/**
 * Builds a validation object comparing LLM count vs classical CV count.
 * @param {number} llmCount
 * @param {number|null|undefined} classicalCount
 * @returns {{ classical_count: number, llm_count: number, confidence: string, variance_pct: number } | null}
 */
export function buildValidation(llmCount, classicalCount) {
  if (classicalCount == null) return null;
  const safeLlm = llmCount || 0;
  const safeClassical = classicalCount || 0;

  if (safeLlm === 0 && safeClassical === 0) {
    return { classical_count: 0, llm_count: 0, confidence: 'high', variance_pct: 0 };
  }
  if (safeLlm === 0 || safeClassical === 0) {
    return { classical_count: safeClassical, llm_count: safeLlm, confidence: 'low', variance_pct: 100 };
  }

  const diff = Math.abs(safeLlm - safeClassical);
  const avg = (safeLlm + safeClassical) / 2;
  const variance = avg > 0 ? (diff / avg) * 100 : 100;
  let level;
  if (variance <= 10) level = 'high';
  else if (variance <= 25) level = 'medium';
  else level = 'low';

  return {
    classical_count: safeClassical,
    llm_count: safeLlm,
    confidence: level,
    variance_pct: Math.round(variance * 100) / 100,
  };
}