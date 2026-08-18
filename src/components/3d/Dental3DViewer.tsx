import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Eye, Grid, Sparkles, Layers, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface Dental3DViewerProps {
  caseId?: string;
  serviceType?: string;
  isUnlocked?: boolean;
  className?: string;
}

export const Dental3DViewer: React.FC<Dental3DViewerProps> = ({
  caseId = 'CD-2026-00001',
  serviceType = 'Crown',
  isUnlocked = true,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [materialType, setMaterialType] = useState<'zirconia' | 'emax' | 'gold' | 'wireframe'>('zirconia');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [occlusionView, setOcclusionView] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // Slate-900

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 360;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 12, 22);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0); // Cyan dental spot
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight2.position.set(-15, -10, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x60a5fa, 1.5, 30);
    pointLight.position.set(0, 8, 10);
    scene.add(pointLight);

    // 4. CAD Platform Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -2.5;
    gridHelper.name = 'cad_grid';
    scene.add(gridHelper);

    // 5. Build High-Precision Dental Crown Geometry (Anatomical molar with 4 cusps)
    const crownGroup = new THREE.Group();

    // Base Prep Cylinder
    const prepGeo = new THREE.CylinderGeometry(3.5, 3.8, 3.5, 32);
    const prepMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
      metalness: 0.1
    });
    const prepMesh = new THREE.Mesh(prepGeo, prepMat);
    prepMesh.position.y = -1;
    crownGroup.add(prepMesh);

    // Occlusal Crown Body with 4 Cusps
    const crownGeo = new THREE.SphereGeometry(4.2, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
    // Deform geometry to sculpt anatomical dental cusps
    const pos = crownGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Cusp ridges: Mesio-buccal, Disto-buccal, Mesio-lingual, Disto-lingual
      const angle = Math.atan2(z, x);
      const cuspWave = Math.sin(angle * 4) * 0.45;
      const centralFossa = Math.exp(-(x * x + z * z) / 4.5) * -0.9;

      pos.setY(i, y + cuspWave + centralFossa);
    }
    crownGeo.computeVertexNormals();

    const crownMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.05,
      transmission: 0.35, // Dental porcelain translucency
      ior: 1.52,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.y = 0.5;
    crownGroup.add(crownMesh);
    meshRef.current = crownMesh;

    // Margin Line Accent ring
    const marginGeo = new THREE.TorusGeometry(3.7, 0.12, 16, 48);
    const marginMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const marginRing = new THREE.Mesh(marginGeo, marginMat);
    marginRing.rotation.x = Math.PI / 2;
    marginRing.position.y = -0.5;
    crownGroup.add(marginRing);

    scene.add(crownGroup);

    // Mouse Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      crownGroup.rotation.y += deltaX * 0.01;
      crownGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch Interaction
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;
        crownGroup.rotation.y += deltaX * 0.01;
        crownGroup.rotation.x += deltaY * 0.01;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };
    const handleTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (autoRotate && !isDragging) {
        crownGroup.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
    };
  }, []);

  // Update Materials
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    if (materialType === 'zirconia') {
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: 0xf8fafc,
        roughness: 0.12,
        metalness: 0.05,
        transmission: 0.4,
        ior: 1.54,
        clearcoat: 1.0
      });
    } else if (materialType === 'emax') {
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: 0xfef9c3,
        roughness: 0.08,
        metalness: 0.02,
        transmission: 0.65,
        ior: 1.51,
        clearcoat: 1.0
      });
    } else if (materialType === 'gold') {
      mesh.material = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.25,
        metalness: 0.95
      });
    } else if (materialType === 'wireframe') {
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true
      });
    }
  }, [materialType]);

  // Toggle Grid
  useEffect(() => {
    if (!sceneRef.current) return;
    const grid = sceneRef.current.getObjectByName('cad_grid');
    if (grid) grid.visible = showGrid;
  }, [showGrid]);

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 12, 22);
      cameraRef.current.lookAt(0, 2, 0);
    }
  };

  const handleZoom = (delta: number) => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(8, Math.min(35, cameraRef.current.position.z + delta));
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col ${className}`}>
      {/* CAD Toolbar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg text-xs font-semibold text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Case: {caseId}</span>
          <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30">
            {serviceType} CAD 3D
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg text-xs transition ${autoRotate ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle Auto Rotation"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg text-xs transition ${showGrid ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            title="Toggle CAD Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-3)}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(3)}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing flex-1" />

      {/* Material & Shading Selector Footer */}
      <div className="bg-slate-900/90 border-t border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Shader:
          </span>
          {(['zirconia', 'emax', 'gold', 'wireframe'] as const).map(mat => (
            <button
              key={mat}
              onClick={() => setMaterialType(mat)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                materialType === mat
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {mat}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Interactive Exocad/3Shape View</span>
        </div>
      </div>
    </div>
  );
};
