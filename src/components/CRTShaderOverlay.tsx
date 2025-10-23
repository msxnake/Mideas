// src/components/CRTShaderOverlay.tsx
import * as twgl from 'twgl.js';
import React, { useEffect, useRef } from 'react';

interface CRTShaderOverlayProps {
  children: React.ReactNode;
  enabled: boolean;
}

export const CRTShaderOverlay: React.FC<CRTShaderOverlayProps> = ({ children, enabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programInfoRef = useRef<twgl.ProgramInfo | null>(null);
  const bufferInfoRef = useRef<twgl.BufferInfo | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);

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
      void main() {
        vec3 color = texture2D(u_texture, v_texCoord).rgb;
        // Scanlines: oscurecer líneas pares
        float scanline = 0.85 + 0.15 * sin(v_texCoord.y * u_resolution.y * 3.14159);
        color *= scanline;
        // Ligero contraste CRT
        color = pow(color, vec3(1.15));
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
  }, [enabled]);

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