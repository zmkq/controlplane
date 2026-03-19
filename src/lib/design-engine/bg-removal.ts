import { removeBackground as removeBg } from "@imgly/background-removal";

/**
 * Removes background from an image URL or Blob using WASM AI.
 * Returns a Blob URL of the transparent PNG.
 */
export async function removeBackground(imageSrc: string | Blob): Promise<string> {
    try {
        console.log("🔪 Isolating subject...");
        
        // Remove background
        // publicPath tells it where to fetch WASM bundles from.
        // using standard CDN (jsdelivr) or default behavior
        const blob = await removeBg(imageSrc, {
            progress: (key, current, total) => {
                console.log(`Downloading ${key}: ${Math.round(current/total * 100)}%`);
            },
            // Use debug: true to see errors if it fails
            debug: false
        });
        
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("BG Removal Failed:", error);
        throw error;
    }
}
