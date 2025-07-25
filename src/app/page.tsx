"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Droplets, Zap, Shield, BarChart3, Globe, ChevronDown, ArrowRight, Play, Star, Check, Menu, X } from 'lucide-react';
import * as THREE from 'three';

const EmapatLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [waterDrops, setWaterDrops] = useState([]);
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [heroParticles, setHeroParticles] = useState([]);
  const threejsRef = useRef();
  const animationIdRef = useRef();
  const sceneRef = useRef();

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / docHeight;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate water drops and particles client-side only
  useEffect(() => {
    // Generate water drops
    const drops = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      width: Math.random() * 6 + 3,
      height: Math.random() * 8 + 4,
      animationDelay: Math.random() * 5,
      animationDuration: 3 + Math.random() * 4,
    }));
    
    // Generate floating particles
    const particles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 4 + Math.random() * 3,
    }));
    
    // Generate hero background particles  
    const heroParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 3,
    }));
    
    setWaterDrops(drops);
    setFloatingParticles(particles);
    setHeroParticles(heroParticles);
  }, []);

  // Fade in effect
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Advanced 3D Water Animation
  useEffect(() => {
    if (!threejsRef.current) return;

    // Clean up previous scene
    if (sceneRef.current) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (threejsRef.current && threejsRef.current.firstChild) {
        threejsRef.current.removeChild(threejsRef.current.firstChild);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Dynamic background based on theme
    scene.background = new THREE.Color(isDarkMode ? 0x000014 : 0xf0f9ff);
    
    const camera = new THREE.PerspectiveCamera(75, threejsRef.current.clientWidth / threejsRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(threejsRef.current.clientWidth, threejsRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threejsRef.current.appendChild(renderer.domElement);
    
    // Dynamic lighting based on theme
    const ambientLight = new THREE.AmbientLight(isDarkMode ? 0x1a1a2e : 0x87ceeb, isDarkMode ? 0.2 : 0.4);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(isDarkMode ? 0x00d4ff : 0x0ea5e9, isDarkMode ? 2 : 1.5);
    mainLight.position.set(10, 10, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const blueLight = new THREE.PointLight(isDarkMode ? 0x0080ff : 0x3b82f6, isDarkMode ? 1.5 : 1, 30);
    blueLight.position.set(-8, 5, 8);
    scene.add(blueLight);
    
    const cyanLight = new THREE.PointLight(isDarkMode ? 0x00ffff : 0x06b6d4, isDarkMode ? 1 : 0.8, 25);
    cyanLight.position.set(8, 8, -5);
    scene.add(cyanLight);

    // Create water tank (main element)
    const createWaterTank = () => {
      const tankGroup = new THREE.Group();
      
      // Tank cylinder
      const tankGeometry = new THREE.CylinderGeometry(2, 2, 3, 32);
      const tankMaterial = new THREE.MeshPhongMaterial({
        color: isDarkMode ? 0x1e40af : 0x3b82f6,
        transparent: true,
        opacity: 0.3,
        shininess: 100
      });
      
      const tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.y = 1;
      tankGroup.add(tank);
      
      // Water inside tank
      const waterGeometry = new THREE.CylinderGeometry(1.8, 1.8, 2.5, 32);
      const waterMaterial = new THREE.MeshPhongMaterial({
        color: isDarkMode ? 0x0ea5e9 : 0x06b6d4,
        transparent: true,
        opacity: 0.8,
        shininess: 100,
        specular: isDarkMode ? 0x87ceeb : 0x0284c7
      });
      
      const water = new THREE.Mesh(waterGeometry, waterMaterial);
      water.position.y = 0.8;
      water.userData = { isWater: true };
      tankGroup.add(water);
      
      return tankGroup;
    };

    const waterTank = createWaterTank();
    scene.add(waterTank);

    // Create water pipes network
    const createWaterPipes = () => {
      const pipesGroup = new THREE.Group();
      
      // Main horizontal pipe
      const mainPipeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 16);
      const pipeMaterial = new THREE.MeshPhongMaterial({
        color: isDarkMode ? 0x1e40af : 0x2563eb,
        shininess: 80
      });
      
      const mainPipe = new THREE.Mesh(mainPipeGeometry, pipeMaterial);
      mainPipe.rotation.z = Math.PI / 2;
      mainPipe.position.y = -1;
      pipesGroup.add(mainPipe);
      
      // Secondary pipes
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const secondaryPipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 2, 12),
          pipeMaterial
        );
        
        secondaryPipe.position.set(
          Math.cos(angle) * 3,
          -2,
          Math.sin(angle) * 3
        );
        pipesGroup.add(secondaryPipe);
        
        // Water meters at pipe ends
        const meterGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.2);
        const meterMaterial = new THREE.MeshPhongMaterial({
          color: isDarkMode ? 0x10b981 : 0x059669
        });
        
        const meter = new THREE.Mesh(meterGeometry, meterMaterial);
        meter.position.set(
          Math.cos(angle) * 3,
          -3,
          Math.sin(angle) * 3
        );
        meter.userData = { isMeter: true, pulseSpeed: 0.02 + Math.random() * 0.02 };
        pipesGroup.add(meter);
      }
      
      return pipesGroup;
    };

    const waterPipes = createWaterPipes();
    scene.add(waterPipes);

    // Create smart meter with signal waves
    const createSmartMeter = () => {
      const meterGroup = new THREE.Group();
      
      // Main meter body
      const meterGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.3);
      const meterMaterial = new THREE.MeshPhongMaterial({
        color: isDarkMode ? 0x1f2937 : 0x374151,
        shininess: 50
      });
      
      const meter = new THREE.Mesh(meterGeometry, meterMaterial);
      meter.position.set(-2, 0, 2);
      meterGroup.add(meter);
      
      // LCD display
      const displayGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.02);
      const displayMaterial = new THREE.MeshPhongMaterial({
        color: isDarkMode ? 0x00ff88 : 0x22c55e,
        emissive: isDarkMode ? 0x004411 : 0x052e16
      });
      
      const display = new THREE.Mesh(displayGeometry, displayMaterial);
      display.position.set(-2, 0, 2.16);
      meterGroup.add(display);
      
      return meterGroup;
    };

    const smartMeter = createSmartMeter();
    scene.add(smartMeter);

    // Create signal waves
    const createSignalWaves = () => {
      const wavesGroup = new THREE.Group();
      
      for (let i = 0; i < 3; i++) {
        const waveGeometry = new THREE.RingGeometry(0.3 + i * 0.2, 0.35 + i * 0.2, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
          color: isDarkMode ? 0x00d4ff : 0x0ea5e9,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.set(-2, 0.5, 2);
        wave.rotation.x = -Math.PI / 2;
        wavesGroup.add(wave);
      }
      
      return wavesGroup;
    };

    const signalWaves = createSignalWaves();
    scene.add(signalWaves);

    // Create communication tower
    const createCommTower = () => {
      const towerGroup = new THREE.Group();
      
      // Tower base
      const baseGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8);
      const baseMaterial = new THREE.MeshPhongMaterial({
        color: isDarkMode ? 0x374151 : 0x6b7280
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(2, -2.75, -2);
      towerGroup.add(base);
      
      // Tower mast
      const mastGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
      const mast = new THREE.Mesh(mastGeometry, baseMaterial);
      mast.position.set(2, -1, -2);
      towerGroup.add(mast);
      
      // Tower light
      const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const lightMaterial = new THREE.MeshPhongMaterial({
        color: isDarkMode ? 0xff4444 : 0xef4444,
        emissive: isDarkMode ? 0x441111 : 0x220000
      });
      
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(2, 0.8, -2);
      light.userData = { isTowerLight: true, pulseSpeed: 0.05 };
      towerGroup.add(light);
      
      return towerGroup;
    };

    const commTower = createCommTower();
    scene.add(commTower);

    // Create data flow particles
    const createDataFlow = () => {
      const flowGroup = new THREE.Group();
      
      for (let i = 0; i < 10; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
          color: isDarkMode ? 0x00ffff : 0x06b6d4,
          transparent: true,
          opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(-2, 0.3, 2);
        particle.userData = {
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.01
        };
        flowGroup.add(particle);
      }
      
      return flowGroup;
    };

    const dataFlow = createDataFlow();
    scene.add(dataFlow);

    // Create internet cloud
    const createInternetCloud = () => {
      const cloudGroup = new THREE.Group();
      
      // Cloud spheres
      const cloudPositions = [
        { x: 0, y: 0, z: 0, scale: 1 },
        { x: -0.3, y: 0.1, z: 0.2, scale: 0.8 },
        { x: 0.3, y: 0.1, z: 0.2, scale: 0.7 },
        { x: 0, y: 0.2, z: 0.1, scale: 0.6 },
        { x: -0.2, y: -0.1, z: -0.1, scale: 0.5 }
      ];
      
      cloudPositions.forEach(pos => {
        const sphereGeometry = new THREE.SphereGeometry(0.3 * pos.scale, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: isDarkMode ? 0x4b5563 : 0x9ca3af,
          transparent: true,
          opacity: 0.7
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(pos.x, pos.y + 3, pos.z);
        cloudGroup.add(sphere);
      });
      
      return cloudGroup;
    };

    const internetCloud = createInternetCloud();
    scene.add(internetCloud);

    // Create end devices
    const createEndDevices = () => {
      const devicesGroup = new THREE.Group();
      
      const devicePositions = [
        { x: -3, y: -2, z: 1 },
        { x: 3, y: -2, z: 1 },
        { x: 0, y: -2, z: 3 }
      ];
      
      devicePositions.forEach(pos => {
        const deviceGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.1);
        const deviceMaterial = new THREE.MeshPhongMaterial({
          color: isDarkMode ? 0x1f2937 : 0x374151,
          emissive: isDarkMode ? 0x002244 : 0x001122
        });
        
        const device = new THREE.Mesh(deviceGeometry, deviceMaterial);
        device.position.set(pos.x, pos.y, pos.z);
        devicesGroup.add(device);
      });
      
      return devicesGroup;
    };

    const endDevices = createEndDevices();
    scene.add(endDevices);

    // Create connection arrows
    const createConnectionArrows = () => {
      const arrowsGroup = new THREE.Group();
      
      const arrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
      const arrowMaterial = new THREE.MeshBasicMaterial({
        color: isDarkMode ? 0x00ff88 : 0x22c55e,
        transparent: true,
        opacity: 0.8
      });
      
      const arrowPositions = [
        { x: -1, y: 1, z: 2 },
        { x: 1, y: 1, z: -1 },
        { x: 0, y: 2, z: 0 }
      ];
      
      arrowPositions.forEach(pos => {
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(pos.x, pos.y, pos.z);
        arrow.rotation.x = Math.PI / 2;
        arrowsGroup.add(arrow);
      });
      
      return arrowsGroup;
    };

    const connectionArrows = createConnectionArrows();
    scene.add(connectionArrows);

    // Create water drops falling
    const createWaterDrops3D = () => {
      const dropsGroup = new THREE.Group();
      
      for (let i = 0; i < 20; i++) {
        const dropGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const dropMaterial = new THREE.MeshPhongMaterial({
          color: isDarkMode ? 0x00bcd4 : 0x0891b2,
          transparent: true,
          opacity: 0.9,
          shininess: 100
        });
        
        const drop = new THREE.Mesh(dropGeometry, dropMaterial);
        drop.position.set(
          (Math.random() - 0.5) * 6,
          Math.random() * 8 + 3,
          (Math.random() - 0.5) * 6
        );
        
        drop.userData = {
          velocity: Math.random() * 0.05 + 0.02,
          originalY: drop.position.y
        };
        
        dropsGroup.add(drop);
      }
      
      return dropsGroup;
    };

    const waterDrops3D = createWaterDrops3D();
    scene.add(waterDrops3D);

    // Create water bubbles
    const createWaterBubbles = () => {
      const bubblesGroup = new THREE.Group();
      
      for (let i = 0; i < 15; i++) {
        const bubbleGeometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 8);
        const bubbleMaterial = new THREE.MeshPhongMaterial({
          color: isDarkMode ? 0x87ceeb : 0x0ea5e9,
          transparent: true,
          opacity: 0.4,
          shininess: 100
        });
        
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.position.set(
          (Math.random() - 0.5) * 4,
          Math.random() * 6 - 2,
          (Math.random() - 0.5) * 4
        );
        
        bubble.userData = {
          velocity: Math.random() * 0.01 + 0.005,
          rotationSpeed: Math.random() * 0.02
        };
        
        bubblesGroup.add(bubble);
      }
      
      return bubblesGroup;
    };

    const waterBubbles = createWaterBubbles();
    scene.add(waterBubbles);

    // Create water flow particles
    const createWaterFlow = () => {
      const flowGeometry = new THREE.BufferGeometry();
      const particleCount = 100;
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = Math.random() * 8 - 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      
      flowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const flowMaterial = new THREE.PointsMaterial({
        color: isDarkMode ? 0x00e5ff : 0x0284c7,
        size: 0.03,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      
      return new THREE.Points(flowGeometry, flowMaterial);
    };

    const waterFlow = createWaterFlow();
    scene.add(waterFlow);

    camera.position.set(6, 3, 8);
    camera.lookAt(1, 1, 0);
    
    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      
      // Animate signal waves expanding from meter
      signalWaves.children.forEach((wave, index) => {
        const scale = 1 + Math.sin(time * 2 - index * 0.5) * 0.3;
        wave.scale.setScalar(scale);
        
        const opacity = 0.8 - Math.abs(Math.sin(time * 2 - index * 0.5)) * 0.6;
        wave.material.opacity = Math.max(0.1, opacity);
      });
      
      // Animate data flow particles from meter to tower
      dataFlow.children.forEach((particle, index) => {
        particle.userData.progress += particle.userData.speed;
        
        if (particle.userData.progress > 1) {
          particle.userData.progress = 0;
        }
        
        const progress = particle.userData.progress;
        particle.position.set(
          -2 + progress * 4,
          0.3 + Math.sin(progress * Math.PI * 2) * 0.4,
          2 + Math.sin(progress * Math.PI * 4) * 0.2
        );
        
        // Fade effect
        particle.material.opacity = Math.sin(progress * Math.PI) * 0.8;
      });
      
      // Animate tower light pulsing
      scene.traverse((child) => {
        if (child.userData.isTowerLight) {
          const scale = 1 + Math.sin(time * child.userData.pulseSpeed * 100) * 0.5;
          child.scale.setScalar(scale);
          
          const intensity = 0.5 + Math.sin(time * 6) * 0.3;
          child.material.emissive.setScalar(intensity);
        }
      });
      
      // Animate LCD display on meter (changing numbers effect)
      if (smartMeter.children[1]) { // LCD display
        const intensity = 0.3 + Math.sin(time * 3) * 0.2;
        smartMeter.children[1].material.emissive.setScalar(intensity);
      }
      
      // Animate internet cloud floating
      internetCloud.children.forEach((sphere, index) => {
        sphere.position.y += Math.sin(time * 2 + index) * 0.003;
        sphere.rotation.x += 0.005;
        sphere.rotation.y += 0.003;
      });
      
      // Animate device screens
      endDevices.children.forEach((device, index) => {
        if (device.material && device.material.emissive) {
          const intensity = 0.2 + Math.sin(time * 4 + index * Math.PI) * 0.15;
          device.material.emissive.setScalar(intensity);
        }
      });
      
      // Animate connection arrows bobbing
      connectionArrows.children.forEach((arrow, index) => {
        arrow.position.y += Math.sin(time * 3 + index * Math.PI) * 0.01;
        arrow.rotation.y = Math.sin(time * 2) * 0.1;
      });
      
      // Animate water drops falling
      waterDrops3D.children.forEach((drop) => {
        drop.position.y -= drop.userData.velocity;
        if (drop.position.y < -5) {
          drop.position.y = drop.userData.originalY;
        }
      });
      
      // Animate water bubbles rising
      waterBubbles.children.forEach((bubble) => {
        bubble.position.y += bubble.userData.velocity;
        bubble.rotation.x += bubble.userData.rotationSpeed;
        bubble.rotation.y += bubble.userData.rotationSpeed;
        
        if (bubble.position.y > 5) {
          bubble.position.y = -5;
        }
      });
      
      // Animate water tank
      const waterMesh = waterTank.children.find(child => child.userData.isWater);
      if (waterMesh) {
        waterMesh.rotation.y += 0.01;
        waterMesh.position.y = 0.8 + Math.sin(time * 2) * 0.1;
      }
      
      // Smooth camera movement around the system
      camera.position.x = 6 + Math.sin(time * 0.1) * 1;
      camera.position.y = 3 + Math.cos(time * 0.08) * 0.5;
      camera.lookAt(1, 1, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    const handleResize = () => {
      if (threejsRef.current) {
        const width = threejsRef.current.clientWidth;
        const height = threejsRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (threejsRef.current && renderer.domElement) {
        threejsRef.current.removeChild(renderer.domElement);
      }
      
      // Clean up Three.js objects
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [isDarkMode]); // Only depend on isDarkMode

  return (
    <div className={`min-h-screen overflow-x-hidden transition-all duration-500 relative ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Animated Water Drops Background */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {waterDrops.map((drop) => (
          <div
            key={drop.id}
            className={`absolute rounded-full animate-water-drop ${
              isDarkMode ? 'bg-cyan-400/20' : 'bg-blue-500/30'
            }`}
            style={{
              left: `${drop.left}%`,
              width: `${drop.width}px`,
              height: `${drop.height}px`,
              animationDelay: `${drop.animationDelay}s`,
              animationDuration: `${drop.animationDuration}s`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%'
            }}
          />
        ))}
      </div>

      {/* Floating Water Particles */}
      <div className="fixed inset-0 pointer-events-none z-5 overflow-hidden">
        {floatingParticles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-1 h-1 rounded-full animate-float-particle ${
              isDarkMode ? 'bg-cyan-300/40' : 'bg-blue-400/50'
            }`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className={`fixed top-0 left-0 w-full h-1 z-50 transition-colors duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-200'
      }`}>
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full backdrop-blur-xl z-40 border-b transition-all duration-500 ${
        isDarkMode 
          ? 'bg-black/80 border-gray-800' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-all duration-300">
                  <Droplets className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className={`text-2xl font-bold transition-colors duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
                }`}>
                  EMAPAT
                </h1>
                <p className={`text-sm transition-colors duration-500 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Smart Water IoT</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
              }`}>Inicio</a>
              <a href="#tecnologia" className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
              }`}>Tecnología</a>
              <a href="#soluciones" className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
              }`}>Soluciones</a>
              <a href="#contacto" className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
              }`}>Contacto</a>
              
              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              <button className="group bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-full hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 font-semibold">
                <span className="group-hover:translate-x-1 transition-transform duration-300 inline-block">
                  Ingresar
                </span>
              </button>
            </div>
            
            <button 
              className={`md:hidden p-2 transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={`fixed inset-0 z-30 pt-20 md:hidden transition-all duration-300 ${
          isDarkMode ? 'bg-black' : 'bg-white'
        }`}>
          <div className="px-6 py-8 space-y-6">
            <a href="#inicio" className={`block py-3 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
            }`}>Inicio</a>
            <a href="#tecnologia" className={`block py-3 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
            }`}>Tecnología</a>
            <a href="#soluciones" className={`block py-3 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
            }`}>Soluciones</a>
            <a href="#contacto" className={`block py-3 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
            }`}>Contacto</a>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center w-full py-3 px-4 rounded-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            
            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-full font-semibold">
              Ingresar al Sistema
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 transition-all duration-500 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-black'
              : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-white'
          }`}></div>
          <div className="absolute inset-0 opacity-20">
            {heroParticles.map((particle) => (
              <div
                key={particle.id}
                className={`absolute w-1 h-1 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'
                }`}
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animationDelay: `${particle.animationDelay}s`,
                  animationDuration: `${particle.animationDuration}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className={`space-y-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="space-y-8">
              <div className={`inline-flex items-center border px-6 py-3 rounded-full text-sm font-semibold backdrop-blur-sm transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700'
              }`}>
                <Zap className="w-4 h-4 mr-2" />
                Tecnología IoT Avanzada 2025
              </div>
              
              <h1 className="text-6xl lg:text-8xl font-black leading-tight">
                <span className={`bg-clip-text text-transparent animate-gradient transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-white via-cyan-200 to-blue-200'
                    : 'bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800'
                }`}>
                  AGUA
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent animate-gradient">
                  INTELIGENTE
                </span>
              </h1>
              
              <p className={`text-2xl leading-relaxed max-w-lg transition-colors duration-500 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Revolucionamos Puerto Maldonado con el sistema IoT más avanzado del Perú. 
                <span className="text-cyan-500 font-semibold">Monitoreo en tiempo real, IA predictiva y eficiencia total.</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <button className="group bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-5 rounded-full hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500 font-bold text-lg flex items-center justify-center transform hover:scale-105">
                Explorar Sistema
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
              <button className={`group backdrop-blur-sm border-2 px-10 py-5 rounded-full transition-all duration-500 font-bold text-lg flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-white/5 border-gray-600 text-white hover:bg-white/10 hover:border-cyan-400'
                  : 'bg-white/80 border-gray-300 text-gray-700 hover:bg-white hover:border-blue-500 hover:text-blue-600'
              }`}>
                <Play className="w-6 h-6 mr-3" />
                Ver Demo
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-8 pt-12">
              <div className="text-center group">
                <div className={`text-4xl font-black mb-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-white group-hover:text-cyan-400'
                    : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  15,847
                </div>
                <div className={`text-sm font-medium transition-colors duration-500 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Medidores IoT</div>
              </div>
              <div className="text-center group">
                <div className={`text-4xl font-black mb-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-white group-hover:text-cyan-400'
                    : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  99.9%
                </div>
                <div className={`text-sm font-medium transition-colors duration-500 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Precisión</div>
              </div>
              <div className="text-center group">
                <div className={`text-4xl font-black mb-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-white group-hover:text-cyan-400'
                    : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  24/7
                </div>
                <div className={`text-sm font-medium transition-colors duration-500 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Operativo</div>
              </div>
            </div>
          </div>
          
          <div className={`relative ${isVisible ? 'animate-fade-in-right' : 'opacity-0'}`}>
            <div className="relative">
              <div 
                ref={threejsRef} 
                className={`w-full h-[700px] rounded-3xl shadow-2xl overflow-hidden border transition-all duration-500 ${
                  isDarkMode 
                    ? 'shadow-cyan-500/20 bg-gradient-to-br from-gray-900 to-black border-gray-800'
                    : 'shadow-blue-500/20 bg-gradient-to-br from-slate-50 to-white border-gray-200'
                }`}
              />
              
              {/* Floating UI Elements */}
              <div className={`absolute top-8 left-8 backdrop-blur-sm rounded-2xl p-6 border animate-float transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-black/60 border-cyan-500/30'
                  : 'bg-white/80 border-blue-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <div className={`font-bold text-lg transition-colors duration-500 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Sistema Activo</div>
                    <div className={`text-sm transition-colors duration-500 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Monitoreo en vivo</div>
                  </div>
                </div>
              </div>
              
              <div className={`absolute bottom-8 right-8 backdrop-blur-sm rounded-2xl p-6 border animate-float-delayed transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-black/60 border-blue-500/30'
                  : 'bg-white/80 border-cyan-200'
              }`}>
                <div className="text-center">
                  <div className="text-3xl font-black text-cyan-500">2.4M</div>
                  <div className={`text-sm transition-colors duration-500 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Litros/Día</div>
                </div>
              </div>
              
              <div className={`absolute top-1/2 -right-4 backdrop-blur-sm rounded-2xl p-4 border animate-pulse transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-black/60 border-purple-500/30'
                  : 'bg-white/80 border-purple-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className={`font-semibold transition-colors duration-500 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>IA Activa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-cyan-400" />
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-32 relative transition-colors duration-500 ${
        isDarkMode ? 'bg-gradient-to-b from-black to-gray-900' : 'bg-gradient-to-b from-white to-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className={`text-5xl lg:text-6xl font-black mb-8 transition-colors duration-500 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                TECNOLOGÍA
              </span>
              <br />
              DE VANGUARDIA
            </h2>
            <p className={`text-xl max-w-3xl mx-auto transition-colors duration-500 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Sistema IoT más avanzado de Sudamérica para gestión inteligente del agua
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Análisis Predictivo con IA",
                description: "Machine Learning avanzado para predecir consumo, detectar anomalías y optimizar distribución automáticamente.",
                gradient: "from-cyan-500 to-blue-600"
              },
              {
                icon: Shield,
                title: "Detección Instantánea",
                description: "Sensores IoT de última generación detectan fugas en milisegundos con precisión del 99.9%.",
                gradient: "from-green-500 to-teal-600"
              },
              {
                icon: Globe,
                title: "Red Neural Distribuida",
                description: "15,847 puntos de monitoreo conectados en tiempo real formando la red más inteligente del país.",
                gradient: "from-purple-500 to-pink-600"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`group backdrop-blur-sm rounded-3xl p-8 border transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-900/50 to-black/50 border-gray-800 hover:border-cyan-500/50'
                    : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-blue-500/50 shadow-lg'
                }`}
              >
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-6 transition-colors ${
                  isDarkMode 
                    ? 'text-white group-hover:text-cyan-400'
                    : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed text-lg transition-colors duration-500 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-cyan-600 via-blue-700 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              IMPACTO REAL
            </h2>
            <p className="text-xl text-blue-100">
              Números que transforman Puerto Maldonado
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "15,847", label: "Medidores Inteligentes", prefix: "" },
              { value: "99.9", label: "Precisión en Lecturas", prefix: "%" },
              { value: "45", label: "Reducción Desperdicio", prefix: "%" },
              { value: "24", label: "Monitoreo Continuo", prefix: "/7" }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div className="text-5xl lg:text-6xl font-black text-white mb-4 group-hover:text-cyan-300 transition-colors">
                    {stat.value}
                    <span className="text-3xl text-cyan-300">{stat.prefix}</span>
                  </div>
                  <div className="text-blue-100 font-medium text-lg">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-32 relative transition-colors duration-500 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="space-y-12">
            <h2 className={`text-6xl lg:text-7xl font-black leading-tight transition-colors duration-500 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <span className={`bg-clip-text text-transparent transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-white to-gray-400'
                  : 'bg-gradient-to-r from-gray-900 to-gray-700'
              }`}>
                EL FUTURO ES
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
                AHORA
              </span>
            </h2>
            
            <p className={`text-2xl max-w-3xl mx-auto leading-relaxed transition-colors duration-500 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Únete a la revolución del agua inteligente en Puerto Maldonado. 
              <span className="text-cyan-500 font-semibold">El sistema IoT más avanzado te espera.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
              <button className="group bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white px-16 py-6 rounded-full hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500 font-black text-xl flex items-center transform hover:scale-105">
                ACCEDER AL SISTEMA
                <ArrowRight className="w-8 h-8 ml-4 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>
            
            <div className={`pt-12 flex justify-center items-center space-x-12 transition-colors duration-500 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3" />
                Implementación gratuita
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3" />
                Soporte 24/7
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-3" />
                Capacitación incluida
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-16 transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Droplets className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold transition-colors duration-500 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>EPS EMAPAT SA</h1>
                  <p className={`transition-colors duration-500 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Smart Water IoT Solutions</p>
                </div>
              </div>
              <p className={`leading-relaxed transition-colors duration-500 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Liderando la transformación digital del agua en la Amazonía peruana con tecnología de vanguardia.
              </p>
            </div>
            
            <div>
              <h3 className={`font-bold text-lg mb-6 transition-colors duration-500 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Tecnología</h3>
              <ul className={`space-y-3 transition-colors duration-500 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li className={`transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:text-cyan-400' : 'hover:text-blue-600'
                }`}>IoT Avanzado</li>
                <li className={`transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:text-cyan-400' : 'hover:text-blue-600'
                }`}>Inteligencia Artificial</li>
                <li className={`transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:text-cyan-400' : 'hover:text-blue-600'
                }`}>Análisis Predictivo</li>
                <li className={`transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:text-cyan-400' : 'hover:text-blue-600'
                }`}>Dashboard en Tiempo Real</li>
              </ul>
            </div>
            
            <div>
              <h3 className={`font-bold text-lg mb-6 transition-colors duration-500 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Contacto</h3>
              <ul className={`space-y-3 transition-colors duration-500 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li>+51 982 456 789</li>
                <li>info@emapat.gob.pe</li>
                <li>soporte@emapat.gob.pe</li>
                <li>Puerto Maldonado, Madre de Dios</li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t pt-8 text-center transition-all duration-500 ${
            isDarkMode 
              ? 'border-gray-800 text-gray-500' 
              : 'border-gray-200 text-gray-600'
          }`}>
            © 2025 EPS EMAPAT SA. Todos los derechos reservados. | Tecnología para el futuro del agua.
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        @keyframes water-drop {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(0px) translateX(-5px);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-15px) translateX(-10px);
            opacity: 0.9;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
        
        .animate-fade-in-right {
          animation: fade-in-right 1s ease-out 0.3s both;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 3s ease-in-out infinite 1.5s;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .animate-water-drop {
          animation: water-drop linear infinite;
        }
        
        .animate-float-particle {
          animation: float-particle ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default EmapatLanding;