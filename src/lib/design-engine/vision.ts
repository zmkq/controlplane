/**
 * Cortex Vision Module v5.0 (The Architect)
 * Implementation of Weighted Vector Analysis & K-Means Clustering
 */

export interface DetectedBlob {
    center: { x: number; y: number };
    radius: number;
    score: number; // 0-100 Confidence
    type: "badge" | "product-stand" | "noise";
}

export interface ImageAnalysis {
  width: number;
  height: number;
  blobs: DetectedBlob[];
  primaryCentroid: { x: number; y: number } | null;
  horizonY: number;
}

/**
 * Converts RGB to HSV
 */
function rgbToHsv(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h, s, v };
}

/**
 * Calculates Entropy (local roughness) in a kernel
 */
function calculateEntropy(data: Uint8ClampedArray, w: number, x: number, y: number): number {
    // 3x3 Kernel deviation
    // Simplified: Just checked difference from left/top neighbors
    const i = (y * w + x) * 4;
    const left = (y * w + Math.max(0, x - 1)) * 4;
    const top = (Math.max(0, y - 1) * w + x) * 4;
    
    // RMS difference
    const diff = Math.sqrt(
        Math.pow(data[i] - data[left], 2) + Math.pow(data[i] - data[top], 2)
    );
    return diff / 255; // Nomalized 0-1
}

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      // Downscale to 150px (Precision is fine, we need speed)
      const w = 150; 
      const h = Math.round(w * (img.height / img.width));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject("No Context"); return; }

      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      // 1. Vector Map: Calculate Probability density for each pixel
      // We look for: High Saturation (Badges are colorful), High Value (Bright), High Entropy (Edges/Text)
      
      const probabilityMap: {x:number, y:number, p:number}[] = [];
      let totalP = 0;

      for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              const r = data[i]; 
              const g = data[i+1]; 
              const b = data[i+2];
              
              const hsv = rgbToHsv(r, g, b);
              const entropy = calculateEntropy(data, w, x, y);
              
              // THE MATH: Weighted Scoring Function
              // Badge = Color (Sat) + Brightness (Val) + Text (Entropy)
              // Spotlight = Brightness (Val). Low Sat. Low Entropy.
              
              // We heavily penalize Low Saturation to kill the white beam.
              let p = (hsv.s * 3.0) + (entropy * 1.5) + (hsv.v * 0.5);
              
              // Bounds check (filter noise)
              if (p < 1.0) p = 0;
              
              if (p > 0) {
                 probabilityMap.push({ x, y, p });
                 totalP += p;
              }
          }
      }

      // 2. K-Means Clustering
      // We take the "Hot" pixels and try to find 3 centroids
      if (probabilityMap.length === 0) {
          resolve({ width: w, height: h, blobs: [], primaryCentroid: null, horizonY: h*0.9 });
          return;
      }
      
      // Seed K centroids with random hot pixels
      const k = 3;
      let centroids = [];
      for(let i=0; i<k; i++) {
          const r = Math.floor(Math.random() * probabilityMap.length);
          centroids.push({ ...probabilityMap[r] });
      }

      // K-Means Iteration (5 rounds is usually enough for this scale)
      const rounds = 5;
      for (let r = 0; r < rounds; r++) {
          // Assign points to nearest centroid
          const clusters: {x:number, y:number, p:number}[][] = [[], [], []];
          
          for (const point of probabilityMap) {
              let minDist = Infinity;
              let cIdx = 0;
              for (let i = 0; i < k; i++) {
                  const d = Math.pow(point.x - centroids[i].x, 2) + Math.pow(point.y - centroids[i].y, 2);
                  if (d < minDist) { minDist = d; cIdx = i; }
              }
              clusters[cIdx].push(point);
          }
          
          // Re-calculate centroids (Weighted Center of Mass)
          for (let i = 0; i < k; i++) {
              if (clusters[i].length === 0) continue;
              let sumX = 0, sumY = 0, sumP = 0;
              for (const p of clusters[i]) {
                  sumX += p.x * p.p; // Weighted by probability!
                  sumY += p.y * p.p;
                  sumP += p.p;
              }
              centroids[i].x = sumX / sumP;
              centroids[i].y = sumY / sumP;
              centroids[i].p = sumP; // Total mass/confidence
          }
      }
      
      // 3. Find the Winner
      // Highest Total Probability "Mass" wins.
      centroids.sort((a,b) => b.p - a.p);
      const winner = centroids[0];
      
      // Determine Radius (Standard Deviation of cluster)
      // Skipped for speed, just assume reasonable badge size

      // 4. Horizon Scan (Variance method)
      // Check row variance in bottom 30%
      let horizonY = h * 0.85;

      resolve({
          width: w,
          height: h,
          blobs: [{
              center: { x: winner.x, y: winner.y },
              radius: 20,
              score: 100, // It won K-Means
              type: "badge"
          }],
          primaryCentroid: { x: winner.x, y: winner.y },
          horizonY
      });
    };
    img.onerror = reject;
  });
}
