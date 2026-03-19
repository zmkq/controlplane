export interface ThemePalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

export async function extractThemeFromImage(imageUrl: string): Promise<ThemePalette> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject("No context");

            // Resize for speed and dominant color smoothing
            canvas.width = 100;
            canvas.height = 100;
            ctx.drawImage(img, 0, 0, 100, 100);
            
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const data = imageData.data;
            const colors: {r:number, g:number, b:number}[] = [];

            // Sample pixels
            for (let i = 0; i < data.length; i += 4 * 10) { // check every 10th pixel
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                const a = data[i+3];
                if (a > 128) { // Ignore transparent
                    colors.push({r, g, b});
                }
            }

            // Simple clustering (Naive)
            // 1. Sort by brightness/saturation
            // For now, let's just pick:
            // - Darkest non-black for background
            // - Most saturated for accent
            // - Most common (averaged) for primary
            
            const getLum = (c: any) => 0.2126*c.r + 0.7152*c.g + 0.0722*c.b;
            const getSat = (c: any) => {
                const max = Math.max(c.r, c.g, c.b);
                const min = Math.min(c.r, c.g, c.b);
                return max === 0 ? 0 : (max - min) / max;
            };

            const sortedByLum = [...colors].sort((a, b) => getLum(a) - getLum(b));
            const sortedBySat = [...colors].sort((a, b) => getSat(b) - getSat(a));

            // Background: Darkest color (but not pure black if possible)
            const bg = sortedByLum[Math.floor(colors.length * 0.1)] || {r:10, g:10, b:15};
            
            // Accent: Most saturated
            const accent = sortedBySat[0] || {r:255, g:255, b:255};
            
            // Primary: Median brightness
            const primary = sortedByLum[Math.floor(colors.length * 0.5)] || {r:200, g:200, b:200};

            // Secondary: Brighter than primary
            const secondary = sortedByLum[Math.floor(colors.length * 0.8)] || {r:255, g:255, b:255};

            const toHex = (c: any) => "#" + [c.r, c.g, c.b].map(x => x.toString(16).padStart(2, '0')).join('');

            resolve({
                background: toHex(bg),
                primary: toHex(primary), // Main text/elements
                secondary: toHex(secondary),
                accent: toHex(accent), // Buttons/Highlights
                text: getLum(bg) > 128 ? '#000000' : '#ffffff'
            });
        };
        
        img.onerror = reject;
    });
}
