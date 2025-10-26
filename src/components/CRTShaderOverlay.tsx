// src/components/CRTShaderOverlay.tsx
import * as twgl from 'twgl.js';
import React, { useEffect, useRef } from 'react';

export interface CRTShaderConfig {
  curvatureX: number;      // 6.0 - 30.0 (valores más altos = menos curvatura)
  curvatureY: number;      // 4.0 - 20.0
  aberration: number;      // 0.0 - 0.005
  scanlineIntensity: number; // 0.0 - 0.1
  scanlineStrength: number;  // 0.0 - 1.0
  glowIntensity: number;   // 0.0 - 0.3
  vignetteStrength: number; // 10.0 - 30.0
  vignettePower: number;   // 0.05 - 0.5
  grainIntensity: number;  // 0.0 - 0.1
  contrast: number;        // 1.0 - 1.5
  brightness: number;      // 1.0 - 1.3
  maskIntensity: number;   // 0.0 - 1.0 (rejilla de subpíxeles RGB)
  bloomIntensity: number;  // 0.0 - 0.5 (glow mejorado multi-sample)
  flickerIntensity: number; // 0.0 - 0.01 (vibración vertical)
  humIntensity: number;    // 0.0 - 0.05 (pulsación de brillo)
}

export const defaultCRTConfig: CRTShaderConfig = {
  curvatureX: 18.0,
  curvatureY: 12.0,
  aberration: 0.0005,
  scanlineIntensity: 0.6,   // Trinitron: scanlines EXTREMADAMENTE pronunciadas
  scanlineStrength: 1.0,    // Contraste al máximo
  glowIntensity: 0.08,      // Más glow de fósforos
  vignetteStrength: 20.0,
  vignettePower: 0.15,
  grainIntensity: 0.015,
  contrast: 1.08,
  brightness: 1.05,
  maskIntensity: 0.25,      // Trinitron: aperture grille vertical más visible
  bloomIntensity: 0.15,
  flickerIntensity: 0.0005,
  humIntensity: 0.01,
};

interface CRTShaderOverlayProps {
  children: React.ReactNode;
  enabled: boolean;
  config?: CRTShaderConfig;
}

export const CRTShaderOverlay: React.FC<CRTShaderOverlayProps> = ({ children, enabled, config = defaultCRTConfig }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programInfoRef = useRef<twgl.ProgramInfo | null>(null);
  const bufferInfoRef = useRef<twgl.BufferInfo | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const gameCanvas = container.querySelector('canvas') as HTMLCanvasElement;
    if (!gameCanvas) return;

    const glCanvas = glCanvasRef.current!;
    const gl = glCanvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;
    glRef.current = gl;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      glCanvas.width = width;
      glCanvas.height = height;
      gl.viewport(0, 0, width, height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Shaders
    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_position * 0.5 + 0.5;
        v_texCoord.y = 1.0 - v_texCoord.y;
      }
    `;

    const fs = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_curvatureX;
      uniform float u_curvatureY;
      uniform float u_aberration;
      uniform float u_scanlineIntensity;
      uniform float u_scanlineStrength;
      uniform float u_glowIntensity;
      uniform float u_vignetteStrength;
      uniform float u_vignettePower;
      uniform float u_grainIntensity;
      uniform float u_contrast;
      uniform float u_brightness;
      uniform float u_maskIntensity;
      uniform float u_bloomIntensity;
      uniform float u_flickerIntensity;
      uniform float u_humIntensity;

      // Curvatura de pantalla CRT realista (basada en tangente)
      vec2 curveScreen(vec2 uv) {
        uv = (uv - 0.5) * 2.0;
        uv.x *= 1.0 + pow(abs(uv.y) / u_curvatureY, 2.0);
        uv.y *= 1.0 + pow(abs(uv.x) / u_curvatureX, 2.0);
        uv = uv * 0.5 + 0.5;
        return uv;
      }

      // Ruido/grain
      float noise(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }

      // Aperture Grille tipo Trinitron (líneas verticales sutiles)
      vec3 maskPattern(vec2 uv) {
        // Trinitron usa aperture grille: líneas verticales muy finas
        float x = uv.x * u_resolution.x;
        float mask = fract(x / 3.0);

        // Crear patrón RGB vertical suave (no tan duro como shadow mask)
        vec3 maskRGB = vec3(
          smoothstep(0.0, 0.15, mask) * smoothstep(0.45, 0.3, mask),
          smoothstep(0.25, 0.4, mask) * smoothstep(0.7, 0.55, mask),
          smoothstep(0.55, 0.7, mask) * smoothstep(1.0, 0.85, mask)
        );

        // Líneas de aperture grille (muy sutiles, verticales)
        float grille = sin(x * 3.14159 / 3.0);
        maskRGB *= 0.85 + 0.15 * grille;

        return mix(vec3(1.0), maskRGB * 0.95 + 0.05, u_maskIntensity);
      }

      // Phosphor glow mejorado (multi-sample blur)
      vec3 phosphorGlow(vec2 uv) {
        vec3 col = texture2D(u_texture, uv).rgb * 0.4;
        col += texture2D(u_texture, uv + vec2(0.002, 0.0)).rgb * 0.2;
        col += texture2D(u_texture, uv + vec2(-0.002, 0.0)).rgb * 0.2;
        col += texture2D(u_texture, uv + vec2(0.0, 0.002)).rgb * 0.1;
        col += texture2D(u_texture, uv + vec2(0.0, -0.002)).rgb * 0.1;
        return col;
      }

      void main() {
        vec2 uv = v_texCoord;

        // Vibración vertical sutil (flicker)
        uv.y += sin(u_time * 60.0) * u_flickerIntensity;

        // Aplicar curvatura
        uv = curveScreen(uv);

        // Borde negro si estamos fuera de los límites curvados
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        // Lecturas optimizadas de textura (reusar samples)
        vec4 baseSample = texture2D(u_texture, uv);
        vec4 sampleLeft = texture2D(u_texture, uv - vec2(u_aberration, 0.0));
        vec4 sampleRight = texture2D(u_texture, uv + vec2(u_aberration, 0.0));

        // Separación RGB (chromatic aberration) optimizada
        vec3 color = vec3(sampleRight.r, baseSample.g, sampleLeft.b);

        // Scanlines horizontales tipo Trinitron (EXTREMADAMENTE visibles)
        // Cada 2 píxeles = una línea oscura
        float scanlineY = floor(uv.y * u_resolution.y / 2.0);
        float scanlineMod = mod(scanlineY, 2.0);

        // Líneas alternas: una brillante, una oscura (muy pronunciado)
        float scanlineMask = scanlineMod;

        // Aplicar scanlines con intensidad extrema
        color *= 1.0 - u_scanlineIntensity * scanlineMask;

        // Phosphor bloom mejorado
        if (u_bloomIntensity > 0.0) {
          vec3 bloom = phosphorGlow(uv);
          color += bloom * u_bloomIntensity;
        }

        // Phosphor glow simple (además del bloom)
        color += baseSample.rgb * u_glowIntensity;

        // Vignette
        vec2 vignetteUV = v_texCoord * (1.0 - v_texCoord.yx);
        float vignette = vignetteUV.x * vignetteUV.y * u_vignetteStrength;
        vignette = pow(vignette, u_vignettePower);
        color *= vignette;

        // Mask pattern (rejilla de subpíxeles)
        color *= maskPattern(uv);

        // Ruido/grain animado
        float grain = noise(uv * u_time * 0.5) * u_grainIntensity;
        color += vec3(grain);

        // "Hum" de brillo (pulsación sutil)
        color *= 1.0 + u_humIntensity * sin(u_time * 100.0);

        // Contraste y brillo
        color = pow(color, vec3(u_contrast));
        color *= u_brightness;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    programInfoRef.current = programInfo;

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, 1, 1] },
      indices: { numComponents: 3, data: [0, 1, 2, 2, 1, 3] },
    });
    bufferInfoRef.current = bufferInfo;

    const texture = twgl.createTexture(gl, { src: gameCanvas, mag: gl.NEAREST, min: gl.NEAREST });
    textureRef.current = texture;

    const render = () => {
      const gl = glRef.current;
      const programInfo = programInfoRef.current;
      const bufferInfo = bufferInfoRef.current;
      const texture = textureRef.current;
      if (!gl || !programInfo || !bufferInfo || !texture) return;

      twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      twgl.setTextureFromElement(gl, texture, gameCanvas);

      const uniforms = {
        u_texture: texture,
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_time: (Date.now() - startTimeRef.current) / 1000.0,
        u_curvatureX: config.curvatureX,
        u_curvatureY: config.curvatureY,
        u_aberration: config.aberration,
        u_scanlineIntensity: config.scanlineIntensity,
        u_scanlineStrength: config.scanlineStrength,
        u_glowIntensity: config.glowIntensity,
        u_vignetteStrength: config.vignetteStrength,
        u_vignettePower: config.vignettePower,
        u_grainIntensity: config.grainIntensity,
        u_contrast: config.contrast,
        u_brightness: config.brightness,
        u_maskIntensity: config.maskIntensity,
        u_bloomIntensity: config.bloomIntensity,
        u_flickerIntensity: config.flickerIntensity,
        u_humIntensity: config.humIntensity,
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLES);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [enabled, config]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
      {enabled && (
        <canvas
          ref={glCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            imageRendering: 'pixelated',
          }}
        />
      )}
    </div>
  );
};