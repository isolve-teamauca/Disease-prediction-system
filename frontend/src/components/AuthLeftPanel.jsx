import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AuthLeftPanel() {
  const containerRef = useRef(null);
  const meshRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const W = 280;
    const H = 280;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.z = 4;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    const geometry = new THREE.SphereGeometry(0.6, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x6f1d1b,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);
    startTimeRef.current = Date.now();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = (Date.now() - startTimeRef.current) / 1000;
      const cycle = 1.2;
      const phase = (t % cycle) / cycle;
      const scale = 1 + 0.08 * Math.sin(phase * Math.PI * 2);
      if (meshRef.current) meshRef.current.scale.setScalar(scale);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current && containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="hidden md:flex md:w-2/5 flex-col items-center justify-center px-8 py-12">
      <div className="relative flex flex-col items-center">
        <div
          className="absolute inset-0 rounded-full opacity-40 blur-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(111,29,27,0.6) 0%, transparent 70%)',
            width: 320,
            height: 320,
            marginLeft: -20,
            marginTop: -20,
          }}
        />
        <div ref={containerRef} className="relative" style={{ width: 280, height: 280 }} />
        <svg
          className="mt-6 w-full max-w-xs"
          viewBox="0 0 300 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline
            points="0,20 30,20 40,8 50,32 60,12 70,28 80,20 120,20 130,10 140,30 150,14 160,26 170,20 210,20 220,12 230,28 240,18 250,24 260,20 300,20"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ecg-line"
          />
        </svg>
        <h2
          className="mt-4 text-white font-serif tracking-[0.25em]"
          style={{ fontSize: 28, fontFamily: 'Georgia, serif' }}
        >
          MbereMed
        </h2>
        <p className="mt-2 text-sm" style={{ color: '#BB9457' }}>
          Clinically-informed. Data-driven.
        </p>
      </div>
    </div>
  );
}
