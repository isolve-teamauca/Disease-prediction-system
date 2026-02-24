import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// MedPredict health-themed background: medical cross particles (+) and ECG-style heartbeat line
const BG_COLOR = 0x1a0a08;
const PARTICLE_OPACITY = 0.4;
const MAX_PARTICLES = 60;
const DRIFT_SPEED = 0.2;
const PARTICLE_SIZE = 8;
const ECG_COLOR = 0x6f1d1b;
const ECG_AMPLITUDE = 12;
const ECG_SEGMENTS = 120;

function makeCrossTexture(THREE, size = 32) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const w = Math.max(2, size / 8);
  const cx = size / 2;
  ctx.fillStyle = `rgba(187, 148, 87, ${PARTICLE_OPACITY})`;
  ctx.fillRect(cx - w / 2, 0, w, size);
  ctx.fillRect(0, cx - w / 2, size, w);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

export default function ParticleBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    let scene, camera, renderer;
    let crossPoints, crossPositions;
    let ecgLine, ecgPositions;
    let animationId;
    let startTime = Date.now();
    let width = typeof window !== 'undefined' ? window.innerWidth : 800;
    let height = typeof window !== 'undefined' ? window.innerHeight : 600;

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -10, 10);
      camera.position.z = 5;

      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(BG_COLOR, 1);
      const canvas = renderer.domElement;
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      if (containerRef.current) {
        containerRef.current.appendChild(canvas);
      }

      // Medical cross (+) particles
      const crossGeo = new THREE.BufferGeometry();
      const crossPos = new Float32Array(MAX_PARTICLES * 3);
      for (let i = 0; i < MAX_PARTICLES; i++) {
        crossPos[i * 3] = (Math.random() - 0.5) * width;
        crossPos[i * 3 + 1] = (Math.random() - 0.5) * height;
        crossPos[i * 3 + 2] = 0;
      }
      crossGeo.setAttribute('position', new THREE.BufferAttribute(crossPos, 3));
      crossPositions = crossGeo.attributes.position.array;

      const crossMat = new THREE.PointsMaterial({
        size: PARTICLE_SIZE,
        map: makeCrossTexture(THREE),
        transparent: true,
        opacity: 1,
        depthWrite: false,
        sizeAttenuation: true,
      });
      crossPoints = new THREE.Points(crossGeo, crossMat);
      scene.add(crossPoints);

      // ECG / heartbeat line (sine wave across center)
      const ecgGeo = new THREE.BufferGeometry();
      const ecgPos = new Float32Array((ECG_SEGMENTS + 1) * 3);
      ecgGeo.setAttribute('position', new THREE.BufferAttribute(ecgPos, 3));
      ecgPositions = ecgGeo.attributes.position.array;

      const ecgMat = new THREE.LineBasicMaterial({
        color: ECG_COLOR,
        linewidth: 1,
        transparent: true,
        opacity: 0.8,
      });
      ecgLine = new THREE.Line(ecgGeo, ecgMat);
      scene.add(ecgLine);
    }

    function animate() {
      animationId = requestAnimationFrame(animate);
      const halfH = height / 2;
      const halfW = width / 2;
      const t = (Date.now() - startTime) * 0.001;

      for (let i = 0; i < MAX_PARTICLES * 3; i += 3) {
        crossPositions[i + 1] += DRIFT_SPEED;
        if (crossPositions[i + 1] > halfH + 50) {
          crossPositions[i + 1] = -halfH - 50;
          crossPositions[i] = (Math.random() - 0.5) * width;
        }
      }
      crossPoints.geometry.attributes.position.needsUpdate = true;

      const amplitude = ECG_AMPLITUDE * (0.7 + 0.3 * Math.sin(t * 2));
      for (let i = 0; i <= ECG_SEGMENTS; i++) {
        const x = -halfW + (i / ECG_SEGMENTS) * width;
        const y = amplitude * Math.sin((i / ECG_SEGMENTS) * Math.PI * 4 + t * 1.5);
        ecgPositions[i * 3] = x;
        ecgPositions[i * 3 + 1] = y;
        ecgPositions[i * 3 + 2] = 0;
      }
      ecgLine.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    function onResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    init();
    animate();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationId) cancelAnimationFrame(animationId);
      if (crossPoints) {
        crossPoints.geometry.dispose();
        crossPoints.material.dispose();
      }
      if (ecgLine) {
        ecgLine.geometry.dispose();
        ecgLine.material.dispose();
      }
      if (renderer && containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: -1, pointerEvents: 'none', backgroundColor: '#1a0a08' }}
    />
  );
}
