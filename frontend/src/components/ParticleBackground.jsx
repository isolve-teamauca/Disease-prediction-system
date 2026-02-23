import { useEffect, useRef } from 'react';

const CDN_THREE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const PARTICLE_COLOR = 0xBB9457;
const PARTICLE_OPACITY = 0.3;
const MAX_PARTICLES = 80;
const DRIFT_SPEED = 0.15;
const PARTICLE_SIZE = 8;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.THREE) {
      resolve(window.THREE);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(window.THREE);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function makeCircleTexture(size = 32) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `rgba(187, 148, 87, ${PARTICLE_OPACITY})`;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
  const t = new window.THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function makeCrossTexture(size = 32) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const w = Math.max(2, size / 8);
  const cx = size / 2;
  ctx.fillStyle = `rgba(187, 148, 87, ${PARTICLE_OPACITY})`;
  ctx.fillRect(cx - w / 2, 0, w, size);
  ctx.fillRect(0, cx - w / 2, size, w);
  const t = new window.THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

export default function ParticleBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    let THREE;
    let scene, camera, renderer;
    let circlePoints, crossPoints;
    let circlePositions, crossPositions;
    let animationId;
    let width = typeof window !== 'undefined' ? window.innerWidth : 800;
    let height = typeof window !== 'undefined' ? window.innerHeight : 600;

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -10, 10);
      camera.position.z = 5;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

      const circleGeo = new THREE.BufferGeometry();
      const circlePos = new Float32Array((MAX_PARTICLES / 2) * 3);
      for (let i = 0; i < MAX_PARTICLES / 2; i++) {
        circlePos[i * 3] = (Math.random() - 0.5) * width;
        circlePos[i * 3 + 1] = (Math.random() - 0.5) * height;
        circlePos[i * 3 + 2] = 0;
      }
      circleGeo.setAttribute('position', new THREE.BufferAttribute(circlePos, 3));
      circlePositions = circleGeo.attributes.position.array;

      const circleMat = new THREE.PointsMaterial({
        size: PARTICLE_SIZE,
        map: makeCircleTexture(),
        transparent: true,
        opacity: 1,
        depthWrite: false,
        sizeAttenuation: true,
      });
      circlePoints = new THREE.Points(circleGeo, circleMat);
      scene.add(circlePoints);

      const crossGeo = new THREE.BufferGeometry();
      const crossPos = new Float32Array((MAX_PARTICLES / 2) * 3);
      for (let i = 0; i < MAX_PARTICLES / 2; i++) {
        crossPos[i * 3] = (Math.random() - 0.5) * width;
        crossPos[i * 3 + 1] = (Math.random() - 0.5) * height;
        crossPos[i * 3 + 2] = 0;
      }
      crossGeo.setAttribute('position', new THREE.BufferAttribute(crossPos, 3));
      crossPositions = crossGeo.attributes.position.array;

      const crossMat = new THREE.PointsMaterial({
        size: PARTICLE_SIZE,
        map: makeCrossTexture(),
        transparent: true,
        opacity: 1,
        depthWrite: false,
        sizeAttenuation: true,
      });
      crossPoints = new THREE.Points(crossGeo, crossMat);
      scene.add(crossPoints);
    }

    function animate() {
      animationId = requestAnimationFrame(animate);
      const halfH = height / 2;
      const halfW = width / 2;

      for (let i = 0; i < (MAX_PARTICLES / 2) * 3; i += 3) {
        circlePositions[i + 1] += DRIFT_SPEED;
        if (circlePositions[i + 1] > halfH + 50) circlePositions[i + 1] = -halfH - 50;
      }
      circlePoints.geometry.attributes.position.needsUpdate = true;

      for (let i = 0; i < (MAX_PARTICLES / 2) * 3; i += 3) {
        crossPositions[i + 1] += DRIFT_SPEED;
        if (crossPositions[i + 1] > halfH + 50) crossPositions[i + 1] = -halfH - 50;
      }
      crossPoints.geometry.attributes.position.needsUpdate = true;

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

    loadScript(CDN_THREE)
      .then((T) => {
        THREE = T;
        init();
        animate();
        window.addEventListener('resize', onResize);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationId) cancelAnimationFrame(animationId);
      if (circlePoints) {
        circlePoints.geometry.dispose();
        circlePoints.material.dispose();
      }
      if (crossPoints) {
        crossPoints.geometry.dispose();
        crossPoints.material.dispose();
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
      style={{ zIndex: -1, pointerEvents: 'none' }}
    />
  );
}
