import React, { useRef, useEffect } from 'react';
import { ViewType } from '../types';

interface LeafCanvasProps {
  imageSrc: string;
  type: ViewType;
  className?: string;
  hideLabel?: boolean;
}

const LeafCanvas: React.FC<LeafCanvasProps> = ({ imageSrc, type, className, hideLabel = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const width = canvas.width;
      const height = canvas.height;
      
      // Draw original first
      ctx.drawImage(img, 0, 0);

      if (type === ViewType.ORIGINAL) return;

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Helper for pixel access
      // Clamp x,y to valid range
      const getPixelIndex = (x: number, y: number) => {
        const cx = Math.max(0, Math.min(width - 1, x));
        const cy = Math.max(0, Math.min(height - 1, y));
        return (cy * width + cx) * 4;
      };

      // Helper for converting RGB to Gray
      const getGray = (i: number) => {
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };

      // --- Simple Per-Pixel Filters ---
      if (type === ViewType.GRAYSCALE || type === ViewType.HEATMAP || 
          type === ViewType.XRAY || type === ViewType.ECO || 
          type === ViewType.BINARY || type === ViewType.HSV) {
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const avg = 0.299 * r + 0.587 * g + 0.114 * b;

          if (type === ViewType.GRAYSCALE) {
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
          } 
          else if (type === ViewType.BINARY) {
            const threshold = 128;
            const val = avg > threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
          else if (type === ViewType.HEATMAP) {
            // False color map: Blue (low) -> Green -> Red (high)
            const val = avg / 255;
            let newR = 0, newG = 0, newB = 0;
            if (val < 0.5) {
               newB = 255 * (1 - 2 * val);
               newG = 255 * 2 * val;
            } else {
               newG = 255 * (2 - 2 * val);
               newR = 255 * (2 * val - 1);
            }
            data[i] = newR;
            data[i + 1] = newG;
            data[i + 2] = newB;
          }
          else if (type === ViewType.XRAY) {
            const inverted = 255 - avg;
            const contrast = (inverted - 128) * 2 + 128; 
            data[i] = contrast;
            data[i + 1] = contrast;
            data[i + 2] = contrast;
          }
          else if (type === ViewType.ECO) {
            data[i] = r * 0.8;
            data[i + 1] = g * 1.2;
            data[i + 2] = b * 0.8;
          }
          else if (type === ViewType.HSV) {
            // Convert RGB to HSV then map to RGB for visualization
            // Visualizing HSV components: H -> Red, S -> Green, V -> Blue
            // This creates a "fake" RGB image representing the HSV model
            const rN = r / 255, gN = g / 255, bN = b / 255;
            const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
            let h = 0, s = 0, v = max;
            const d = max - min;
            s = max === 0 ? 0 : d / max;

            if (max !== min) {
              switch (max) {
                case rN: h = (gN - bN) / d + (gN < bN ? 6 : 0); break;
                case gN: h = (bN - rN) / d + 2; break;
                case bN: h = (rN - gN) / d + 4; break;
              }
              h /= 6;
            }

            data[i] = h * 255;      // Hue channel mapped to Red
            data[i + 1] = s * 255;  // Saturation channel mapped to Green
            data[i + 2] = v * 255;  // Value channel mapped to Blue
          }
        }
        ctx.putImageData(imageData, 0, 0);
      } 
      
      // --- Convolution / Structural Filters ---
      else if (type === ViewType.SKELETON || type === ViewType.BLUEPRINT || 
               type === ViewType.GRADIENT_MAGNITUDE || type === ViewType.GRADIENT_DIRECTION ||
               type === ViewType.ZERO_CROSSING || type === ViewType.FEATURE_MAP ||
               type === ViewType.WAVELET) {
        
        const outputData = ctx.createImageData(width, height);
        const output = outputData.data;

        // Wavelet Transform (Haar) is a special case (spatial transformation)
        if (type === ViewType.WAVELET) {
           // We need a temp buffer for the current image data to read from
           // Reuse 'data' from above
           const halfW = Math.floor(width / 2);
           const halfH = Math.floor(height / 2);

           for (let y = 0; y < height; y += 2) {
             for (let x = 0; x < width; x += 2) {
                // Get 2x2 block grayscale
                const i1 = getPixelIndex(x, y);
                const i2 = getPixelIndex(x + 1, y);
                const i3 = getPixelIndex(x, y + 1);
                const i4 = getPixelIndex(x + 1, y + 1);

                const p1 = getGray(i1);
                const p2 = getGray(i2);
                const p3 = getGray(i3);
                const p4 = getGray(i4);

                // Haar Wavelet Formula
                // LL (Approximation) - Top Left
                const LL = (p1 + p2 + p3 + p4) / 4;
                // LH (Horizontal Detail) - Top Right
                const LH = (p1 + p2 - p3 - p4) / 4 + 128; 
                // HL (Vertical Detail) - Bottom Left
                const HL = (p1 - p2 + p3 - p4) / 4 + 128;
                // HH (Diagonal Detail) - Bottom Right
                const HH = (p1 - p2 - p3 + p4) / 4 + 128;

                // Map coordinates
                const xOut = x / 2;
                const yOut = y / 2;

                // LL: (0,0) to (w/2, h/2)
                let idx = (yOut * width + xOut) * 4;
                output[idx] = output[idx+1] = output[idx+2] = LL; output[idx+3] = 255;

                // LH: (w/2, 0)
                idx = (yOut * width + (xOut + halfW)) * 4;
                output[idx] = output[idx+1] = output[idx+2] = LH; output[idx+3] = 255;

                // HL: (0, h/2)
                idx = ((yOut + halfH) * width + xOut) * 4;
                output[idx] = output[idx+1] = output[idx+2] = HL; output[idx+3] = 255;

                // HH: (w/2, h/2)
                idx = ((yOut + halfH) * width + (xOut + halfW)) * 4;
                output[idx] = output[idx+1] = output[idx+2] = HH; output[idx+3] = 255;
             }
           }
        } 
        // Convolution Based Filters
        else {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    
                    if (type === ViewType.FEATURE_MAP) {
                        // Local Variance (Texture)
                        // 3x3 window
                        let sum = 0;
                        let sqSum = 0;
                        let count = 0;
                        
                        for (let ky = -1; ky <= 1; ky++) {
                            for (let kx = -1; kx <= 1; kx++) {
                                const pIdx = getPixelIndex(x + kx, y + ky);
                                const val = getGray(pIdx);
                                sum += val;
                                sqSum += val * val;
                                count++;
                            }
                        }
                        
                        const mean = sum / count;
                        const variance = (sqSum / count) - (mean * mean);
                        // Scale variance for visibility
                        const displayVal = Math.min(255, Math.sqrt(variance) * 4); // Boost it
                        
                        // Use a heatmap-ish look for features: Dark blue (low) to Bright Yellow (high)
                        output[idx] = displayVal;
                        output[idx+1] = displayVal * 0.8; 
                        output[idx+2] = 255 - displayVal;
                        output[idx+3] = 255;
                    }
                    else if (type === ViewType.ZERO_CROSSING) {
                        // Laplacian Operator
                        //  0  1  0
                        //  1 -4  1
                        //  0  1  0
                        const n  = getGray(getPixelIndex(x, y-1));
                        const w  = getGray(getPixelIndex(x-1, y));
                        const c  = getGray(getPixelIndex(x, y));
                        const e  = getGray(getPixelIndex(x+1, y));
                        const s  = getGray(getPixelIndex(x, y+1));
                        
                        let laplacian = n + w + e + s - 4 * c;
                        // Normalize 0 at 128
                        let val = 128 + laplacian * 2; // enhance contrast
                        val = Math.max(0, Math.min(255, val));
                        
                        output[idx] = val; 
                        output[idx+1] = val; 
                        output[idx+2] = val; 
                        output[idx+3] = 255;
                    }
                    else {
                        // Sobel Operators (Gradient)
                        const iTopLeft = getGray(getPixelIndex(x-1, y-1));
                        const iTop = getGray(getPixelIndex(x, y-1));
                        const iTopRight = getGray(getPixelIndex(x+1, y-1));
                        const iLeft = getGray(getPixelIndex(x-1, y));
                        const iRight = getGray(getPixelIndex(x+1, y));
                        const iBottomLeft = getGray(getPixelIndex(x-1, y+1));
                        const iBottom = getGray(getPixelIndex(x, y+1));
                        const iBottomRight = getGray(getPixelIndex(x+1, y+1));

                        const gx = -1*iTopLeft + 1*iTopRight + -2*iLeft + 2*iRight + -1*iBottomLeft + 1*iBottomRight;
                        const gy = -1*iTopLeft + -2*iTop + -1*iTopRight + 1*iBottomLeft + 2*iBottom + 1*iBottomRight;
                        
                        if (type === ViewType.GRADIENT_MAGNITUDE || type === ViewType.SKELETON || type === ViewType.BLUEPRINT) {
                             const magnitude = Math.sqrt(gx * gx + gy * gy);
                             
                             if (type === ViewType.SKELETON) {
                                const val = magnitude > 50 ? magnitude : 0;
                                output[idx] = val; output[idx+1] = val; output[idx+2] = val;
                             } else if (type === ViewType.BLUEPRINT) {
                                const val = magnitude > 30 ? 255 : 0;
                                if (val > 0) {
                                    output[idx] = 255; output[idx + 1] = 255; output[idx + 2] = 255;
                                } else {
                                    output[idx] = 30; output[idx + 1] = 64; output[idx + 2] = 175;
                                }
                             } else {
                                // Magnitude Map
                                output[idx] = magnitude; output[idx+1] = magnitude; output[idx+2] = magnitude;
                             }
                             output[idx+3] = 255;
                        } 
                        else if (type === ViewType.GRADIENT_DIRECTION) {
                             // Angle -PI to PI
                             const angle = Math.atan2(gy, gx);
                             // Map to 0-1 for Hue
                             const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
                             
                             // Convert HSV (H=angle, S=1, V=1) to RGB
                             const s = 1.0;
                             const v = 1.0;
                             
                             let r = 0, g = 0, b = 0;
                             const iH = Math.floor(normalizedAngle * 6);
                             const f = normalizedAngle * 6 - iH;
                             const p = v * (1 - s);
                             const q = v * (1 - f * s);
                             const t = v * (1 - (1 - f) * s);
                             
                             switch (iH % 6) {
                               case 0: r = v; g = t; b = p; break;
                               case 1: r = q; g = v; b = p; break;
                               case 2: r = p; g = v; b = t; break;
                               case 3: r = p; g = q; b = v; break;
                               case 4: r = t; g = p; b = v; break;
                               case 5: r = v; g = p; b = q; break;
                             }
                             
                             // Mask out areas with no gradient (noise)
                             const magnitude = Math.sqrt(gx * gx + gy * gy);
                             if (magnitude < 20) {
                                r = 0; g = 0; b = 0;
                             }

                             output[idx] = r * 255;
                             output[idx+1] = g * 255;
                             output[idx+2] = b * 255;
                             output[idx+3] = 255;
                        }
                    }
                }
            }
        }
        ctx.putImageData(outputData, 0, 0);
      }
    };
  }, [imageSrc, type]);

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl shadow-sm border border-slate-200 bg-white ${className}`}>
        {!hideLabel && (
            <div className="bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 border-b border-slate-200 uppercase tracking-wider flex-none">
                {type}
            </div>
        )}
        <div className="relative flex-1 w-full min-h-0 bg-black">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full object-cover block"
            />
        </div>
    </div>
  );
};

export default LeafCanvas;