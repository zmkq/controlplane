/**
 * Cortex Memory System v1.0
 * Stores user preferences for layouts keyed by background fingerprint.
 */

import { Layer } from "@/store/designerStore";
import { ImageAnalysis } from "./vision";

interface StoredLayout {
    fingerprint: string;
    timestamp: number;
    // We store positions as Percentages (0-1) to handle varying resolutions/aspects
    price: { x: number; y: number; width: number; height: number };
    info:  { x: number; y: number; width: number; height: number };
    product: { x: number; y: number; size: number };
}

const MEMORY_KEY = "cortex_brain_memory_v1";

/**
 * Generates a unique "fingerprint" string for a background image
 * based on its analysis stats (Color + Dimensions)
 * Real perceptual hashing would happen in Vision, here we use the metadata.
 */
export function generateFingerprint(analysis: ImageAnalysis): string {
    if (!analysis) return "unknown";
    // Creating a hash from stats
    // E.g. "W200-H300-R120-G50-B200"
    // Rounded to avoid float noise
    const r = Math.round(analysis.averageColor?.r || 0);
    const g = Math.round(analysis.averageColor?.g || 0);
    const b = Math.round(analysis.averageColor?.b || 0);
    // Also include Blob Count to distinguish similar colored images
    const blobs = analysis.blobs?.length || 0;
    
    return `W${analysis.width}-H${analysis.height}-R${r}G${g}B${b}-BL${blobs}`;
}

export function saveMemory(fingerprint: string, layers: Layer[], canvasWidth: number, canvasHeight: number) {
    // Extract key elements
    const priceLayer = layers.find(l => l.content?.toString().includes("JOD") || l.id === "price-tag");
    const infoLayer = layers.find(l => l.id === "info-text");
    const productLayer = layers.find(l => l.type === "image" && l.id !== "bg-auto" && l.id !== "bg-main");
    
    if (!productLayer) return; // No product to learn from?

    const layout: StoredLayout = {
        fingerprint,
        timestamp: Date.now(),
        price: priceLayer ? {
            x: priceLayer.x / canvasWidth,
            y: priceLayer.y / canvasHeight,
            width: priceLayer.width,
            height: priceLayer.height
        } : { x:0, y:0, width:0, height:0 },
        info: infoLayer ? {
            x: infoLayer.x / canvasWidth,
            y: infoLayer.y / canvasHeight,
            width: infoLayer.width,
            height: infoLayer.height
        } : { x:0, y:0, width:0, height:0 },
        product: {
            x: productLayer.x / canvasWidth,
            y: productLayer.y / canvasHeight,
            size: productLayer.width // Product size is usually square
        }
    };

    // Load existing
    const existing = loadMemories();
    // Update or Insert
    const existingIndex = existing.findIndex(m => m.fingerprint === fingerprint);
    if (existingIndex >= 0) {
        existing[existingIndex] = layout;
    } else {
        existing.push(layout);
    }
    
    // Persist
    if (typeof window !== "undefined") {
        localStorage.setItem(MEMORY_KEY, JSON.stringify(existing));
        console.log("🧠 Cortex Leveled Up: Learned new layout for", fingerprint);
    }
}

export function recallMemory(fingerprint: string): StoredLayout | null {
    const existing = loadMemories();
    return existing.find(m => m.fingerprint === fingerprint) || null;
}

function loadMemories(): StoredLayout[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(MEMORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}
