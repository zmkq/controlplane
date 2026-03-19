import { Layer } from "@/store/designerStore";
import { analyzeImage, ImageAnalysis } from "./vision";
import { recallMemory, generateFingerprint } from "./aiMemoryStore";

/**
 * Cortex Brain v6.0 (The Learner)
 * Combines Memory (RLHF) with Mathematical Architect (v5.0)
 */

interface AutoLayoutRequest {
    backgroundImage: string;
    productImage: string;
    priceText: string;
    infoText: string;
    aspectRatio: "square" | "portrait";
}

export async function generateLayout(request: AutoLayoutRequest): Promise<Layer[]> {
    console.log("🧠 Cortex v6: Checking Memory Bank...");
    
    // 1. Analyze / Identify Background
    const analysis = await analyzeImage(request.backgroundImage).catch(() => null);
    
    const W = 1080;
    const H = request.aspectRatio === 'square' ? 1080 : 1350;
    const scaleX = analysis ? W / analysis.width : 1;
    const scaleY = analysis ? H / analysis.height : 1;
    
    const layers: Layer[] = [];
    
    // -- Layer 0: Background --
    layers.push({
        id: "bg-auto",
        type: "background",
        content: request.backgroundImage,
        x: 0, y: 0, width: W, height: H, rotation: 0, zIndex: 0
    });

    // 2. CHECK MEMORY
    if (analysis) {
        const fingerprint = generateFingerprint(analysis);
        const memory = recallMemory(fingerprint);
        
        if (memory) {
            console.log("🧠 Cortex Memory Hit! Using learned layout for", fingerprint);
            
            /// Apply Learned Layout
            const productSize = memory.product.size * W; // Relative to canvas? No, stored as absolute? 
            // We stored x/y as percentage. Width as atomic value?
            // Re-read storage logic: 
            // width: priceLayer.width (absolute), x: priceLayer.x/canvasWidth (relative)
            // Ideally we should scale everything by the current canvas size.
            
            const prodW = memory.product.size; // Stored as width... wait, our storage logic line 42 was `size: productLayer.width`.
            // If the user taught on 1080x1080, width was e.g. 600.
            // If we are now on 1080x1350, width should still be 600.
            
            layers.push({
                id: "prod-auto",
                type: "image",
                content: request.productImage,
                x: memory.product.x * W,
                y: memory.product.y * H,
                width: memory.product.size,
                height: memory.product.size,
                rotation: 0, zIndex: 5, isProductSlot: true
            });

            layers.push({
                id: "price-tag",
                type: "text",
                content: request.priceText,
                x: memory.price.x * W,
                y: memory.price.y * H,
                width: memory.price.width,
                height: memory.price.height,
                rotation: 0, zIndex: 10,
                style: {
                    fontSize: "48px", fontWeight: "900", color: "#000", textAlign: "center",
                    fontFamily: "var(--font-cairo), sans-serif",
                    backgroundColor: "#FBbf24", // Default yellow, user can change manually if needed
                    borderRadius: "10px", padding: "10px"
                }
            });
            
            layers.push({
                id: "info-text",
                type: "text",
                content: request.infoText,
                x: memory.info.x * W,
                y: memory.info.y * H,
                width: memory.info.width,
                height: memory.info.height,
                rotation: 0, zIndex: 8,
                style: {
                    fontSize: "32px", fontWeight: "700", color: "#fff", textAlign: "center",
                    fontFamily: "var(--font-cairo), sans-serif",
                    textShadow: "0 4px 10px rgba(0,0,0,0.5)"
                }
            });
            
            return layers;
        }
    }

    // 3. Fallback to Math (Cortex 5.0 Logic)
    console.log("🧠 No Memory Found. Using V5 Vector Math.");
    
    // -- Logic: Target the Primary Centroid --
    let priceX = W - 300;
    let priceY = 100;
    let badgeFound = false;
    
    if (analysis && analysis.primaryCentroid) {
        if (analysis.primaryCentroid.y < (analysis.height * 0.7)) {
            priceX = (analysis.primaryCentroid.x * scaleX) - 150; 
            priceY = (analysis.primaryCentroid.y * scaleY) - 50; 
            badgeFound = true;
        }
    }
    
    // -- Logic: The Floor --
    const productSize = 600;
    const productX = (W - productSize) / 2;
    const productY = H * 0.9 - (productSize * 0.9);

    // -- Logic: Info Text --
    let infoX = W/2 - 200;
    let infoY = productY + productSize;
    if (badgeFound) {
        infoY = H - 200;
    }

    layers.push({
        id: "prod-auto",
        type: "image",
        content: request.productImage,
        x: productX, y: productY, width: productSize, height: productSize, rotation: 0, zIndex: 5, isProductSlot: true
    });

    layers.push({
        id: "price-tag",
        type: "text",
        content: request.priceText,
        x: priceX, y: priceY, width: 300, height: 100, rotation: 0, zIndex: 10,
        style: {
            fontSize: "48px", fontWeight: "900", color: "#000", textAlign: "center",
            fontFamily: "var(--font-cairo), sans-serif",
            backgroundColor: badgeFound ? "rgba(0,0,0,0)" : "#FBbf24",
            borderRadius: "10px", padding: "10px"
        }
    });
    
    layers.push({
        id: "info-text",
        type: "text",
        content: request.infoText,
        x: infoX, y: infoY, width: 400, height: 150, rotation: 0, zIndex: 8,
        style: {
            fontSize: "32px", fontWeight: "700", color: "#fff", textAlign: "center",
            fontFamily: "var(--font-cairo), sans-serif",
            textShadow: "0 4px 10px rgba(0,0,0,0.5)"
        }
    });

    return layers;
}
