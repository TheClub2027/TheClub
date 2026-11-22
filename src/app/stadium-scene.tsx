"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Club } from "@/lib/game";
import { getStandDesign } from "@/lib/stadium-designs";
import type { Draft } from "./stadium-architect";

type Props = { club: Club; draft: Draft };
type ViewPreset = "Aerial" | "Broadcast" | "Pitch";

const CAMERA: Record<ViewPreset, [number, number, number]> = {
  Aerial: [240, 340, 240],
  Broadcast: [220, 265, 220],
  Pitch: [175, 160, 175],
};

function buildPitchTexture(draft: Draft) {
  const canvas = document.createElement("canvas");
  canvas.width = 2100;
  canvas.height = 1360;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const quality = draft.pitchCondition;
  const green = draft.pitchSurface === "Hybrid 5G" ? [46, 118, 64] : quality > 75 ? [50, 116, 61] : quality > 50 ? [93, 116, 61] : [123, 103, 60];
  ctx.fillStyle = `rgb(${green[0]},${green[1]},${green[2]})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let stripe = 0; stripe < 10; stripe += 1) {
    if (stripe % 2 === 0) {
      ctx.fillStyle = draft.pitchSurface === "Hybrid 5G" ? "rgba(111,177,93,.2)" : "rgba(115,163,89,.2)";
      ctx.fillRect(stripe * 210, 0, 210, canvas.height);
    }
  }
  if (quality < 70) {
    ctx.fillStyle = `rgba(171,147,82,${(70 - quality) / 190})`;
    [[560, 470, 122, 78], [980, 780, 110, 61], [1530, 490, 92, 67], [1040, 255, 64, 49]].forEach(([x, y, w, h]) => {
      ctx.beginPath(); ctx.ellipse(x, y, w, h, 0.2, 0, Math.PI * 2); ctx.fill();
    });
  }
  const inset = 56;
  const centerY = canvas.height / 2;
  ctx.strokeStyle = "rgba(244,247,229,.91)";
  ctx.lineWidth = 8;
  ctx.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);
  ctx.beginPath(); ctx.moveTo(canvas.width / 2, inset); ctx.lineTo(canvas.width / 2, canvas.height - inset); ctx.stroke();
  ctx.beginPath(); ctx.arc(canvas.width / 2, centerY, 183, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#f0f1df";
  ctx.beginPath(); ctx.arc(canvas.width / 2, centerY, 9, 0, Math.PI * 2); ctx.fill();
  const boxHeight = 403;
  const boxDepth = 330;
  ctx.strokeRect(inset, centerY - boxHeight / 2, boxDepth, boxHeight);
  ctx.strokeRect(canvas.width - inset - boxDepth, centerY - boxHeight / 2, boxDepth, boxHeight);
  ctx.strokeRect(inset, centerY - 183, 110, 366);
  ctx.strokeRect(canvas.width - inset - 110, centerY - 183, 110, 366);
  ctx.fillStyle = "#f0f1df";
  ctx.beginPath(); ctx.arc(inset + 220, centerY, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(canvas.width - inset - 220, centerY, 8, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.rect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2); ctx.clip();
  ctx.beginPath(); ctx.arc(inset + 220, centerY, 183, -0.88, 0.88); ctx.stroke();
  ctx.beginPath(); ctx.arc(canvas.width - inset - 220, centerY, 183, Math.PI - 0.88, Math.PI + 0.88); ctx.stroke();
  ctx.restore();
  for (const y of [inset + 8, canvas.height - inset - 8]) {
    ctx.beginPath();
    if (y < centerY) ctx.arc(inset, y, 32, 0, Math.PI / 2);
    else ctx.arc(inset, y, 32, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.beginPath();
    if (y < centerY) ctx.arc(canvas.width - inset, y, 32, Math.PI / 2, Math.PI);
    else ctx.arc(canvas.width - inset, y, 32, Math.PI, Math.PI * 1.5);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function labelTexture(text: string, background: string, foreground = "#eef0d8") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = foreground;
    ctx.font = "bold 66px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2, canvas.width - 48);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function StadiumScene({ club, draft }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraPositionRef = useRef<[number, number, number] | null>(null);
  const [preset, setPreset] = useState<ViewPreset>("Aerial");
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const host = stageRef.current;
    if (!host) return;
    setWebglUnavailable(false);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      setWebglUnavailable(true);
      return;
    }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#c5d8dc");
    scene.fog = new THREE.Fog("#c5d8dc", 390, 900);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1200);
    camera.position.set(...(cameraPositionRef.current ?? CAMERA[preset]));
    camera.lookAt(0, 6, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(Math.max(host.clientWidth, 1), Math.max(host.clientHeight, 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    renderer.domElement.className = "stadium-webgl-canvas";
    renderer.domElement.setAttribute("aria-label", `${club.stadium.name} interactive 3D preview. Drag to orbit and use the wheel to zoom.`);
    host.prepend(renderer.domElement);

    let sceneDisposed = false;
    const facilityPhotoTargets: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>; column: number; row: number }[] = [];
    const materials = new Map<string, THREE.MeshStandardMaterial>();
    const material = (color: string, roughness = 0.8, metalness = 0.05) => {
      const key = `${color}:${roughness}:${metalness}`;
      const cached = materials.get(key);
      if (cached) return cached;
      const created = new THREE.MeshStandardMaterial({ color, roughness, metalness });
      materials.set(key, created);
      return created;
    };
    const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, color: string | THREE.Material, parent: THREE.Object3D = scene, roughness = 0.82) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === "string" ? material(color, roughness) : color);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const addPlane = (w: number, h: number, x: number, y: number, z: number, color: string, parent: THREE.Object3D = scene) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material(color));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const addLabel = (text: string, x: number, y: number, z: number, width: number, height: number, background: string, rotateY = 0) => {
      const map = labelTexture(text, background);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, toneMapped: false }));
      sign.position.set(x, y, z);
      sign.rotation.y = rotateY;
      scene.add(sign);
      return sign;
    };
    const beam = (from: THREE.Vector3, to: THREE.Vector3, thickness: number, color: string, parent: THREE.Object3D = scene) => {
      const direction = new THREE.Vector3().subVectors(to, from);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(thickness * 0.58, thickness, direction.length(), 7), material(color, 0.43, 0.55));
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    scene.add(new THREE.HemisphereLight("#e9f4f2", "#536457", 1.45));
    const keyLight = new THREE.DirectionalLight("#fff1d7", 2.15);
    keyLight.position.set(-145, 205, 108);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1536, 1536);
    keyLight.shadow.camera.left = -190;
    keyLight.shadow.camera.right = 190;
    keyLight.shadow.camera.top = 190;
    keyLight.shadow.camera.bottom = -190;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight("#c0ddd7", 0.62);
    fillLight.position.set(130, 85, -145);
    scene.add(fillLight);

    addPlane(420, 360, 0, -0.62, 0, "#49644c");
    addPlane(286, 238, 0, -0.47, 0, "#b4b19f");
    addPlane(266, 218, 0, -0.36, 0, "#566352");
    addPlane(248, 2, 0, -0.24, 0, "#a6a58f");
    addBox(1.2, 0.38, 215, -132, -0.08, 0, "#e0d7b9");
    addBox(1.2, 0.38, 215, 132, -0.08, 0, "#e0d7b9");
    addBox(265, 0.38, 1.2, 0, -0.08, -108, "#e0d7b9");
    addBox(265, 0.38, 1.2, 0, -0.08, 108, "#e0d7b9");

    const pitchTexture = buildPitchTexture(draft);
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(105, 68), new THREE.MeshStandardMaterial({ map: pitchTexture, roughness: 0.94, metalness: draft.pitchSurface === "Hybrid 5G" ? 0.03 : 0 }));
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0.22, 0);
    pitch.receiveShadow = true;
    scene.add(pitch);
    if (draft.drainage >= 55) {
      for (let index = -3; index <= 3; index += 1) {
        addBox(0.08, 0.025, 66, index * 13, 0.27, 0, draft.drainage >= 80 ? "#7d9d72" : "#6e8c67");
      }
    }
    if (draft.underfloorHeating) {
      for (let index = -2; index <= 2; index += 1) addBox(0.16, 0.04, 64, index * 20, 0.3, 0, "#b67a43");
      const heatIndicator = new THREE.PointLight("#d89448", 11, 34, 2);
      heatIndicator.position.set(0, 1, 0);
      scene.add(heatIndicator);
    }

    const goalMaterial = material("#ececdd", 0.42, 0.08);
    for (const end of [-1, 1]) {
      const goalX = end * 52.75;
      const posts = [-3.66, 3.66].map((z) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.44, 10), goalMaterial);
        post.position.set(goalX, 1.45, z);
        scene.add(post);
        return post;
      });
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.32, 10), goalMaterial);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(goalX, 2.67, 0);
      scene.add(crossbar);
      const netMaterial = new THREE.MeshStandardMaterial({ color: "#d9ddd0", wireframe: true, transparent: true, opacity: 0.36 });
      const net = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.32, 7.24), netMaterial);
      net.position.set(goalX + end * 1.1, 1.4, 0);
      scene.add(net);
      for (const post of posts) post.castShadow = true;
    }

    const tiers = draft.standTiers;
    const terrace = material("#656d65", 0.83, 0.02);
    const chairShape = new THREE.Shape();
    chairShape.moveTo(-0.4, 0); chairShape.lineTo(0.4, 0); chairShape.lineTo(0.4, 0.12); chairShape.lineTo(0.31, 0.17); chairShape.lineTo(0.34, 0.4); chairShape.quadraticCurveTo(0.3, 0.52, 0, 0.52); chairShape.quadraticCurveTo(-0.3, 0.52, -0.34, 0.4); chairShape.lineTo(-0.31, 0.17); chairShape.lineTo(-0.4, 0.12); chairShape.closePath();
    const seatGeometry = new THREE.ExtrudeGeometry(chairShape, { depth: 0.1, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.015, bevelThickness: 0.015 });
    seatGeometry.translate(0, 0, -0.05);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45, metalness: 0.02 });
    const clubPrimary = new THREE.Color(club.colors[0]);
    const seatPalette = [clubPrimary, clubPrimary.clone().lerp(new THREE.Color("#e7eee1"), 0.22), clubPrimary.clone().lerp(new THREE.Color(club.colors[1]), 0.35), clubPrimary.clone().lerp(new THREE.Color("#c8a967"), 0.35)];
    const glass = new THREE.MeshPhysicalMaterial({ color: "#8fb6ad", roughness: 0.2, metalness: 0.12, transparent: true, opacity: 0.54, side: THREE.DoubleSide, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const makeStand = (side: "north" | "east" | "south" | "west") => {
      const group = new THREE.Group();
      const design = getStandDesign(draft.standDesigns[side]);
      const roofType = draft.standRoofs?.[side] ?? draft.roof;
      const longSide = side === "north" || side === "south";
      const sign = side === "north" || side === "west" ? -1 : 1;
      const tierCount = Math.max(1, Math.min(4, tiers[side]));
      const span = longSide ? 122 : 78;
      const halfSpan = span / 2;
      const startRadius = longSide ? 41.5 : 59.5;
      const rows = 9;
      const rowRun = 1.05;
      const rowRise = 0.48;
      const tierRun = rows * rowRun + 3.8;
      const tierRise = rows * rowRise + 4.2;
      const isHeritage = design.profile === "heritage";
      const shellColor = isHeritage ? "#755542" : design.profile === "terrace" || design.profile === "standing" ? "#747c70" : "#8b938a";
      const shell = material(shellColor, 0.75, 0.02);
      const seatMatrices: THREE.Matrix4[] = [];
      const seatColorIndices: number[] = [];
      const dummy = new THREE.Object3D();
      const seatYaw = side === "north" ? 0 : side === "south" ? Math.PI : side === "east" ? -Math.PI / 2 : Math.PI / 2;
      for (let tier = 0; tier < tierCount; tier += 1) {
        if (tier > 0) {
          const lowerDeckTop = 1.5 + (tier - 1) * tierRise + (rows - 1) * rowRise + 0.42;
          const upperDeckBottom = 1.5 + tier * tierRise;
          const supportHeight = Math.max(0.8, upperDeckBottom - lowerDeckTop);
          const supportRadius = startRadius + tier * tierRun - 1.9;
          addBox(longSide ? span + 1 : 3.8, supportHeight, longSide ? 3.8 : span + 1, longSide ? 0 : sign * supportRadius, lowerDeckTop + supportHeight / 2, longSide ? sign * supportRadius : 0, shell, group, 0.64);
        }
        for (let row = 0; row < rows; row += 1) {
          const radial = startRadius + tier * tierRun + row * rowRun;
          const y = 1.5 + tier * tierRise + row * rowRise;
          const centerRadial = radial + rowRun * 0.5;
          if (longSide) {
            addBox(span, 0.42, rowRun, 0, y, sign * centerRadial, row % 2 ? terrace : shell, group);
            addBox(span, 0.2, 0.16, 0, y - 0.31, sign * (radial + rowRun - 0.08), "#d2d1c3", group, 0.55);
          } else {
            addBox(rowRun, 0.42, span, sign * centerRadial, y, 0, row % 2 ? terrace : shell, group);
            addBox(0.16, 0.2, span, sign * (radial + rowRun - 0.08), y - 0.31, 0, "#d2d1c3", group, 0.55);
          }
          if (draft.seats) {
            const seatSpacing = 0.94;
            const columns = Math.floor(span / seatSpacing);
            for (let column = 0; column < columns; column += 1) {
              const sectionPosition = column % 24;
              if (sectionPosition === 22 || sectionPosition === 23) continue;
              const along = -((columns - 1) * seatSpacing) / 2 + column * seatSpacing;
              const curved = Math.pow(along / halfSpan, 2) * 1.45;
              const seatRadial = radial + 0.46 + curved;
              dummy.position.set(longSide ? along : sign * seatRadial, y + 0.18, longSide ? sign * seatRadial : along);
              dummy.rotation.set(0, seatYaw, 0);
              dummy.scale.set(1, 1, 1);
              dummy.updateMatrix();
              seatMatrices.push(dummy.matrix.clone());
              seatColorIndices.push((Math.floor(column / 24) + tier + (row % 3 === 0 ? 1 : 0)) % seatPalette.length);
            }
          } else {
            for (const aisle of [-0.4, 0, 0.4]) {
              const aisleRadial = radial + 0.48;
              const aisleAlong = aisle * halfSpan;
              if (longSide) {
                addBox(0.19, 1.35, 0.13, aisleAlong, y + 0.68, sign * aisleRadial, "#d9b45f", group, 0.35);
                addBox(0.95, 0.12, 0.1, aisleAlong, y + 1.3, sign * aisleRadial, "#d9b45f", group, 0.35);
              } else {
                addBox(0.13, 1.35, 0.19, sign * aisleRadial, y + 0.68, aisleAlong, "#d9b45f", group, 0.35);
                addBox(0.1, 0.12, 0.95, sign * aisleRadial, y + 1.3, aisleAlong, "#d9b45f", group, 0.35);
              }
            }
          }
        }
        if (tier < tierCount - 1) {
          const concourseRadius = startRadius + tier * tierRun + rows * rowRun + 1.9;
          const concourseY = 1.7 + tier * tierRise + rows * rowRise + 1.9;
          const concourseFloor = addBox(longSide ? span : 4.4, 0.55, longSide ? 4.4 : span, longSide ? 0 : sign * concourseRadius, concourseY, longSide ? sign * concourseRadius : 0, "#c4c6bb", group, 0.54);
          concourseFloor.receiveShadow = true;
          const outerConcourseEdge = concourseRadius + 1.94;
          const glassWall = new THREE.Mesh(new THREE.BoxGeometry(longSide ? span : 0.35, 3.15, longSide ? 0.35 : span), glass);
          glassWall.position.set(longSide ? 0 : sign * outerConcourseEdge, concourseY + 1.8, longSide ? sign * outerConcourseEdge : 0);
          glassWall.castShadow = true;
          group.add(glassWall);
          for (let mullion = -5; mullion <= 5; mullion += 1) {
            const along = mullion * (span / 11);
            if (longSide) addBox(0.22, 3.35, 0.26, along, concourseY + 1.8, sign * outerConcourseEdge, "#d3ddd2", group, 0.3);
            else addBox(0.26, 3.35, 0.22, sign * outerConcourseEdge, concourseY + 1.8, along, "#d3ddd2", group, 0.3);
          }
        }
      }
      const seats = new THREE.InstancedMesh(seatGeometry, seatMaterial, seatMatrices.length);
      seatMatrices.forEach((matrix, index) => { seats.setMatrixAt(index, matrix); seats.setColorAt(index, seatPalette[seatColorIndices[index]]); });
      seats.instanceMatrix.needsUpdate = true;
      if (seats.instanceColor) seats.instanceColor.needsUpdate = true;
      seats.castShadow = true;
      seats.receiveShadow = true;
      group.add(seats);

      const topY = 1.7 + (tierCount - 1) * tierRise + rows * rowRise;
      const outerRadius = startRadius + (tierCount - 1) * tierRun + rows * rowRun;
      const outerFacadeY = Math.max(3, topY * 0.42);
      const façadeTint = isHeritage ? "#79563f" : "#596761";
      const facadeRadius = outerRadius + 1.8;
      const facadeHeight = Math.max(7, topY * 0.42);
      if (longSide) {
        addBox(span + 4, 2.5, 4, 0, 1.25, sign * facadeRadius, façadeTint, group, 0.58);
        addBox(span + 4, 0.52, 4.4, 0, 2.7, sign * facadeRadius, "#a3aa9b", group, 0.6);
        const windowBandHeight = Math.max(2.2, facadeHeight - 4.2);
        const glazedBand = new THREE.Mesh(new THREE.BoxGeometry(span - 1.5, windowBandHeight, 0.22), glass);
        glazedBand.position.set(0, 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.06));
        group.add(glazedBand);
        for (let mullion = -8; mullion <= 8; mullion += 1) addBox(0.32, windowBandHeight + 0.2, 0.34, mullion * (span / 17), 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.13), "#9ba99f", group, 0.42);
        addBox(span + 4, 0.7, 4.2, 0, facadeHeight + 0.35, sign * facadeRadius, façadeTint, group, 0.58);
      } else {
        addBox(4, 2.5, span + 4, sign * facadeRadius, 1.25, 0, façadeTint, group, 0.58);
        addBox(4.4, 0.52, span + 4, sign * facadeRadius, 2.7, 0, "#a3aa9b", group, 0.6);
        const windowBandHeight = Math.max(2.2, facadeHeight - 4.2);
        const glazedBand = new THREE.Mesh(new THREE.BoxGeometry(0.22, windowBandHeight, span - 1.5), glass);
        glazedBand.position.set(sign * (facadeRadius + 2.06), 2.8 + windowBandHeight / 2, 0);
        group.add(glazedBand);
        for (let mullion = -5; mullion <= 5; mullion += 1) addBox(0.34, windowBandHeight + 0.2, 0.32, sign * (facadeRadius + 2.13), 2.8 + windowBandHeight / 2, mullion * (span / 11), "#9ba99f", group, 0.42);
        addBox(4.2, 0.7, span + 4, sign * facadeRadius, facadeHeight + 0.35, 0, façadeTint, group, 0.58);
      }
      for (let tier = 0; tier < tierCount; tier += 1) {
        const ribbonRadius = startRadius + tier * tierRun - 0.5;
        const ribbonY = 1.7 + tier * tierRise + 0.95;
        if (longSide) addBox(span, 0.48, 0.52, 0, ribbonY, sign * ribbonRadius, club.colors[0], group, 0.35);
        else addBox(0.52, 0.48, span, sign * ribbonRadius, ribbonY, 0, club.colors[0], group, 0.35);
      }
      const boxCount = Math.min(20, draft.executiveBoxesBySide?.[side] ?? 0);
      if (boxCount > 0) {
        const boxTier = tierCount > 1 ? Math.floor(tierCount / 2) : 0;
        const boxY = tierCount > 1 ? 1.7 + Math.max(0, boxTier - 1) * tierRise + rows * rowRise + 2.1 : topY - 1.05;
        const boxRadial = tierCount > 1 ? startRadius + boxTier * tierRun + 1.5 : outerRadius - 1.8;
        for (let suite = 0; suite < boxCount; suite += 1) {
          const along = -halfSpan + (suite + 1) * (span / (boxCount + 1));
          if (longSide) {
            const suiteGlass = new THREE.Mesh(new THREE.BoxGeometry(Math.max(2.2, span / (boxCount + 1) * 0.82), 2.2, 1.75), glass);
            suiteGlass.position.set(along, boxY, sign * boxRadial);
            group.add(suiteGlass);
            addBox(Math.max(2.2, span / (boxCount + 1) * 0.82), 0.18, 2.05, along, boxY - 1.1, sign * boxRadial, "#d2bb76", group, 0.3);
          } else {
            const suiteGlass = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.2, Math.max(2.2, span / (boxCount + 1) * 0.82)), glass);
            suiteGlass.position.set(sign * boxRadial, boxY, along);
            group.add(suiteGlass);
            addBox(2.05, 0.18, Math.max(2.2, span / (boxCount + 1) * 0.82), sign * boxRadial, boxY - 1.1, along, "#d2bb76", group, 0.3);
          }
        }
      }

      if (roofType !== "Open sky") {
        // Keep the roof above the upper deck, not over the full bowl. The previous
        // inner edge began at the pitch and made each stand look like a solid disc.
        const roofInner = Math.max(startRadius + 5, outerRadius - 5.5);
        const roofOuter = outerRadius + (design.profile === "cantilever" ? 9 : 6.5);
        const roofHeight = topY + 4.8;
        const retractable = roofType === "Retractable roof";
        const roofRuns = retractable ? [[-halfSpan, -2.6], [2.6, halfSpan]] : [[-halfSpan, halfSpan]];
        for (const [uStart, uEnd] of roofRuns) {
          const positions: number[] = [];
          const indices: number[] = [];
          const alongSegments = 36;
          const radialSegments = 8;
          for (let alongIndex = 0; alongIndex <= alongSegments; alongIndex += 1) {
            const t = alongIndex / alongSegments;
            const along = uStart + (uEnd - uStart) * t;
            const bow = 1 - Math.pow(along / halfSpan, 2);
            for (let radialIndex = 0; radialIndex <= radialSegments; radialIndex += 1) {
              const r = radialIndex / radialSegments;
              const radius = roofInner + (roofOuter - roofInner) * r;
              const wave = roofType === "Wave canopy" || design.profile === "asymmetric" ? Math.sin(t * Math.PI * 2 + r * 1.4) * 1.5 : 0;
              const arch = roofType === "Continuous bowl" || design.profile === "crescent" || design.profile === "bowl" ? Math.sin(r * Math.PI) * 2.1 : 0;
              const height = roofHeight + bow * 0.9 + arch + wave - r * (roofType === "Cantilever" ? 4.2 : 3.1);
              const x = longSide ? along : sign * radius;
              const z = longSide ? sign * radius : along;
              positions.push(x, height, z);
            }
          }
          for (let alongIndex = 0; alongIndex < alongSegments; alongIndex += 1) {
            for (let radialIndex = 0; radialIndex < radialSegments; radialIndex += 1) {
              const a = alongIndex * (radialSegments + 1) + radialIndex;
              const b = a + radialSegments + 1;
              indices.push(a, b, a + 1, b, b + 1, a + 1);
            }
          }
          const canopyGeometry = new THREE.BufferGeometry();
          canopyGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
          canopyGeometry.setIndex(indices);
          canopyGeometry.computeVertexNormals();
          const roofColor = roofType === "Glazed shell" ? "#87aaa0" : roofType === "Wave canopy" ? "#779787" : roofType === "Lattice roof" ? "#849589" : design.profile === "heritage" ? "#ad8c67" : "#87968a";
          const canopyMaterial = new THREE.MeshStandardMaterial({ color: roofColor, metalness: roofType === "Glazed shell" ? 0.12 : 0.06, roughness: 0.68, side: THREE.DoubleSide, transparent: roofType === "Glazed shell", opacity: roofType === "Glazed shell" ? 0.48 : 1, emissive: club.colors[0], emissiveIntensity: 0.01 });
          const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
          canopy.castShadow = true;
          canopy.receiveShadow = true;
          group.add(canopy);
          for (const ribT of [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45]) {
            if (retractable && Math.abs(ribT) < 0.06) continue;
            const along = ribT * span;
            const outer = new THREE.Vector3(longSide ? along : sign * roofOuter, roofHeight + 1.2, longSide ? sign * roofOuter : along);
            const inner = new THREE.Vector3(longSide ? along : sign * roofInner, roofHeight + 0.9, longSide ? sign * roofInner : along);
            const support = new THREE.Vector3(longSide ? along : sign * (roofOuter + 1.4), topY + 1.3, longSide ? sign * (roofOuter + 1.4) : along);
            beam(support, outer, 0.42, "#687971", group);
            beam(outer, inner, design.profile === "truss" ? 0.28 : 0.2, "#77877d", group);
          }
          if (design.profile === "truss" || roofType === "Lattice roof") {
            for (const offset of [-0.28, 0.28]) {
              const a = new THREE.Vector3(longSide ? offset * span : sign * roofOuter, roofHeight + 0.75, longSide ? sign * roofOuter : offset * span);
              const b = new THREE.Vector3(longSide ? (offset + 0.17) * span : sign * roofInner, roofHeight + 2.2, longSide ? sign * roofInner : (offset + 0.17) * span);
              beam(a, b, 0.16, "#7f8d82", group);
            }
          }
        }
        const fasciaY = topY + 5.3;
        if (longSide) addBox(span + 2, 0.72, 0.82, 0, fasciaY, sign * (roofInner + 0.7), club.colors[0], group, 0.34);
        else addBox(0.82, 0.72, span + 2, sign * (roofInner + 0.7), fasciaY, 0, club.colors[0], group, 0.34);
      }
      const name = side === "north" || side === "south" ? club.stadium.name : club.name;
      const fasciaY = Math.max(4.2, outerFacadeY - 0.6);
      if (longSide) addLabel(name, 0, fasciaY, sign * (outerRadius + 4.1), 30, 2.4, club.colors[0], side === "north" ? 0 : Math.PI);
      else addLabel(name, sign * (outerRadius + 4.1), fasciaY, 0, 30, 2.4, club.colors[0], side === "west" ? Math.PI / 2 : -Math.PI / 2);
      scene.add(group);
    };
    (["north", "east", "south", "west"] as const).forEach(makeStand);

    const sectorGeometry = (innerRadius: number, outerRadius: number, start: number, end: number) => {
      const shape = new THREE.Shape();
      const steps = 36;
      shape.moveTo(outerRadius * Math.cos(start), outerRadius * Math.sin(start));
      for (let step = 1; step <= steps; step += 1) {
        const angle = start + (end - start) * step / steps;
        shape.lineTo(outerRadius * Math.cos(angle), outerRadius * Math.sin(angle));
      }
      for (let step = steps; step >= 0; step -= 1) {
        const angle = start + (end - start) * step / steps;
        shape.lineTo(innerRadius * Math.cos(angle), innerRadius * Math.sin(angle));
      }
      shape.closePath();
      const geometry = new THREE.ShapeGeometry(shape, 2);
      geometry.rotateX(-Math.PI / 2);
      return geometry;
    };
    const cornerKeys = [
      ["northWest", Math.PI / 2, Math.PI], ["northEast", 0, Math.PI / 2],
      ["southEast", Math.PI * 1.5, Math.PI * 2], ["southWest", Math.PI, Math.PI * 1.5],
    ] as const;
    cornerKeys.forEach(([corner, start, end]) => {
      if (!draft.cornerStands[corner]) return;
      const group = new THREE.Group();
      const adjacentSides = { northWest: ["north", "west"], northEast: ["north", "east"], southEast: ["south", "east"], southWest: ["south", "west"] } as const;
      const [firstSide, secondSide] = adjacentSides[corner];
      const cornerDesign = getStandDesign(draft.standDesigns[firstSide]);
      const cornerMaterial = material(cornerDesign.profile === "heritage" ? "#815840" : "#78847a", 0.76, 0.07);
      const cornerSeats: THREE.Matrix4[] = [];
      const cornerColors: THREE.Color[] = [];
      const dummy = new THREE.Object3D();
      const countTiers = Math.max(tiers[firstSide], tiers[secondSide]);
      for (let tier = 0; tier < countTiers; tier += 1) {
        const tierBase = 1.5 + tier * 13.15;
        for (let row = 0; row < 9; row += 1) {
          const inner = 63 + tier * 13.2 + row * 0.98;
          const outer = inner + 0.94;
          const tread = new THREE.Mesh(sectorGeometry(inner, outer, start, end), row % 2 ? terrace : cornerMaterial);
          tread.position.y = tierBase + row * 0.47;
          tread.receiveShadow = true;
          tread.castShadow = true;
          group.add(tread);
          if (draft.seats) {
            for (let seat = 0; seat < 32; seat += 1) {
              const angle = start + (end - start) * (seat + 0.5) / 32;
              const radius = inner + 0.48;
              const y = tierBase + row * 0.47 + 0.16;
              dummy.position.set(radius * Math.cos(angle), y, -radius * Math.sin(angle));
              dummy.lookAt(0, y, 0);
              dummy.updateMatrix();
              cornerSeats.push(dummy.matrix.clone());
              cornerColors.push(seatPalette[(Math.floor(seat / 8) + tier + (row % 3 === 0 ? 1 : 0)) % seatPalette.length]);
            }
          } else if (row % 2 === 0) {
            for (let rail = 0; rail < 8; rail += 1) {
              const angle = start + (end - start) * (rail + 0.5) / 8;
              const radius = inner + 0.52;
              const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.94, 6), material("#d9b45f", 0.4, 0.38));
              post.position.set(radius * Math.cos(angle), tierBase + row * 0.47 + 0.48, -radius * Math.sin(angle));
              group.add(post);
            }
          }
        }
      }
      if (cornerSeats.length) {
        const seats = new THREE.InstancedMesh(seatGeometry, seatMaterial, cornerSeats.length);
        cornerSeats.forEach((matrix, index) => { seats.setMatrixAt(index, matrix); seats.setColorAt(index, cornerColors[index]); });
        seats.instanceMatrix.needsUpdate = true;
        if (seats.instanceColor) seats.instanceColor.needsUpdate = true;
        seats.castShadow = true;
        group.add(seats);
      }
      const topY = 1.5 + (countTiers - 1) * 13.15 + 9 * 0.47;
      const outerRadius = 63 + (countTiers - 1) * 13.2 + 9 * 0.98;
      const wallSteps = 36;
      const wallRadius = outerRadius + 2.6;
      const arcPoint = (angle: number, y: number, radius = wallRadius) => new THREE.Vector3(radius * Math.cos(angle), y, -radius * Math.sin(angle));
      const bandGeometry = (bottom: number, top: number) => {
        const positions: number[] = [];
        const indices: number[] = [];
        for (let step = 0; step <= wallSteps; step += 1) {
          const angle = start + (end - start) * step / wallSteps;
          const point = arcPoint(angle, bottom);
          positions.push(point.x, bottom, point.z, point.x, top, point.z);
          if (step < wallSteps) {
            const base = step * 2;
            indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
          }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
      };
      const stoneBase = new THREE.Mesh(bandGeometry(0.7, 4.7), material(cornerDesign.profile === "heritage" ? "#806044" : "#66766d", 0.84, 0.03));
      stoneBase.castShadow = true;
      stoneBase.receiveShadow = true;
      group.add(stoneBase);

      const glassTop = Math.max(5.8, topY - 1.1);
      const glazingPositions: number[] = [];
      const glazingIndices: number[] = [];
      for (let step = 0; step < wallSteps; step += 1) {
        const a0 = start + (end - start) * step / wallSteps;
        const a1 = start + (end - start) * (step + 1) / wallSteps;
        const p0 = arcPoint(a0, 5.2, wallRadius + 0.08);
        const p1 = arcPoint(a1, 5.2, wallRadius + 0.08);
        const p2 = arcPoint(a0, glassTop, wallRadius + 0.08);
        const p3 = arcPoint(a1, glassTop, wallRadius + 0.08);
        const base = glazingPositions.length / 3;
        glazingPositions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
        glazingIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
      const glazingGeometry = new THREE.BufferGeometry();
      glazingGeometry.setAttribute("position", new THREE.Float32BufferAttribute(glazingPositions, 3));
      glazingGeometry.setIndex(glazingIndices);
      glazingGeometry.computeVertexNormals();
      const glazing = new THREE.Mesh(glazingGeometry, glass);
      glazing.castShadow = true;
      group.add(glazing);

      const mullionMaterial = cornerDesign.profile === "heritage" ? "#a88b6b" : "#9ba99f";
      for (let step = 0; step <= wallSteps; step += 3) {
        const angle = start + (end - start) * step / wallSteps;
        beam(arcPoint(angle, 4.8, wallRadius + 0.2), arcPoint(angle, glassTop + 0.3, wallRadius + 0.2), 0.34, mullionMaterial, group);
      }
      for (const y of [4.9, glassTop + 0.35]) {
        for (let step = 0; step < wallSteps; step += 1) {
          const a0 = start + (end - start) * step / wallSteps;
          const a1 = start + (end - start) * (step + 1) / wallSteps;
          beam(arcPoint(a0, y, wallRadius + 0.22), arcPoint(a1, y, wallRadius + 0.22), 0.3, mullionMaterial, group);
        }
      }
      const parapet = new THREE.Mesh(bandGeometry(glassTop + 0.65, topY + 0.5), material(cornerDesign.profile === "heritage" ? "#9a7858" : "#7b8a80", 0.56, 0.12));
      parapet.castShadow = true;
      group.add(parapet);
      const roofSide = draft.standRoofs[firstSide] === "Open sky" ? secondSide : firstSide;
      if (draft.standRoofs[roofSide] !== "Open sky") {
        const canopy = new THREE.Mesh(sectorGeometry(Math.max(65, outerRadius - 5.5), outerRadius + 6.5, start, end), new THREE.MeshStandardMaterial({ color: cornerDesign.profile === "heritage" ? "#ad8c67" : "#87968a", roughness: 0.68, metalness: 0.06, side: THREE.DoubleSide }));
        canopy.position.y = topY + 4.8;
        group.add(canopy);
        for (const angle of [start, (start + end) / 2, end]) {
          const from = new THREE.Vector3((outerRadius + 5) * Math.cos(angle), topY + 3, -(outerRadius + 5) * Math.sin(angle));
          const to = new THREE.Vector3(60 * Math.cos(angle), topY + 5, -60 * Math.sin(angle));
          beam(from, to, 0.34, "#71827a", group);
        }
      }
      scene.add(group);
    });

    if (draft.scoreboardLevel > 0) {
      addBox(13, 7, 0.8, 0, 20 + draft.standTiers.north * 4, -43 - draft.standTiers.north * 11.2, "#101715", scene, 0.22);
      addLabel(`${club.shortName} · ${draft.scoreboardLevel} HD`, 0, 20 + draft.standTiers.north * 4, -42 - draft.standTiers.north * 11.2, 11.5, 5.2, "#10231c");
    }
    if (draft.ledBoardsLevel > 0) {
      addBox(100, 0.7, 0.6, 0, 1.05, -37, club.colors[0]);
      addBox(100, 0.7, 0.6, 0, 1.05, 37, club.colors[0]);
      addBox(0.6, 0.7, 64, -54, 1.05, 0, club.colors[0]);
      addBox(0.6, 0.7, 64, 54, 1.05, 0, club.colors[0]);
    }

    if (draft.floodlights > 0) {
      for (const [x, z] of [[-72, -57], [72, -57], [-72, 57], [72, 57]]) {
        addBox(0.65, 28, 0.65, x, 13.5, z, "#717e72");
        addBox(4.6, 0.8, 1.2, x, 27.5, z, "#d7dcc2", scene, 0.42);
        for (let led = 0; led < Math.min(6, draft.floodlights + 2); led += 1) addBox(0.38, 0.22, 0.18, x - 1.8 + led * 0.72, 27.5, z + 0.61, "#fff3ca", scene, 0.18);
        const flood = new THREE.SpotLight("#e8f0d4", draft.floodlights * 5.5, 155, 0.72, 0.46, 1.2);
        flood.position.set(x, 27, z);
        flood.target.position.set(0, 0, 0);
        scene.add(flood, flood.target);
      }
    }

    const addFacilityPhoto = (parent: THREE.Object3D, x: number, y: number, z: number, size: number, cell: [number, number], rotation = 0) => {
      const backing = addBox(size + 0.8, size + 0.8, 0.3, x, y, z, "#27342a", parent, 0.48);
      backing.rotation.y = rotation;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color: "#728174", roughness: 0.72, side: THREE.DoubleSide }));
      mesh.position.set(x, y, z + (rotation === 0 ? 0.18 : 0));
      if (rotation !== 0) {
        mesh.position.x += 0.18;
        mesh.rotation.y = rotation;
      }
      mesh.castShadow = false;
      parent.add(mesh);
      facilityPhotoTargets.push({ mesh, column: cell[0], row: cell[1] });
    };
    const createBuilding = (name: string, x: number, z: number, width: number, depth: number, floors: number, color: string, photoCell: [number, number]) => {
      const group = new THREE.Group();
      const floorHeight = 3.2;
      for (let floor = 0; floor < floors; floor += 1) {
        addBox(width, floorHeight, depth, x, floorHeight / 2 + floor * floorHeight, z, floor % 2 ? "#3c4c3d" : color, group, 0.62);
        for (let window = 0; window < Math.max(2, Math.floor(width / 5)); window += 1) {
          const windowX = x - width / 2 + 2.1 + window * ((width - 4.2) / Math.max(1, Math.floor(width / 5) - 1));
          addBox(0.22, 1.05, 0.13, windowX, 1.75 + floor * floorHeight, z - depth / 2 - 0.08, "#d7d7a1", group, 0.2);
        }
      }
      addBox(width + 1.2, 0.8, depth + 1.2, x, floors * floorHeight + 0.4, z, club.colors[0]);
      const nameBoard = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.84, Math.min(2, width * 0.1)), new THREE.MeshBasicMaterial({ map: labelTexture(name, club.colors[0]), side: THREE.DoubleSide }));
      nameBoard.position.set(x, Math.max(1.8, floors * floorHeight / 2), z - depth / 2 - 0.16);
      group.add(nameBoard);
      const photoSize = Math.max(4.6, Math.min(10, width * 0.52, floors * floorHeight * 0.86));
      const photoY = floors * floorHeight * 0.55;
      addFacilityPhoto(group, x, photoY, z + depth / 2 + 0.05, photoSize, photoCell);
      addFacilityPhoto(group, x + width / 2 + 0.05, photoY, z, photoSize, photoCell, Math.PI / 2);
      scene.add(group);
    };
    if (draft.superstoreLevel > 0) createBuilding("CLUB SUPERSTORE", -78, 23, 19 + draft.superstoreLevel * 2, 14, 2 + draft.superstoreLevel, "#3b4934", [0, 0]);
    if (draft.restaurantLevel > 0) createBuilding("MATCHDAY DINING", 78, -23, 20 + draft.restaurantLevel * 2, 15, 2 + draft.restaurantLevel, "#4a4431", [2, 0]);
    if (draft.hotelLevel > 0) createBuilding("THE CLUB HOTEL", 80, 50, 26 + draft.hotelLevel * 2, 16, 3 + draft.hotelLevel, "#38473d", [0, 1]);
    if (draft.fanZoneLevel > 0) createBuilding("FAN ZONE", -80, -50, 22 + draft.fanZoneLevel * 2, 15, 2, "#354532", [2, 1]);
    if (draft.museumLevel > 0) createBuilding("CLUB MUSEUM", 0, 82, 21 + draft.museumLevel * 2, 13, 2 + draft.museumLevel, "#413d2f", [1, 1]);
    if (draft.transportHubLevel > 0) {
      createBuilding("RAIL · COACH · WALK", -110, 8, 18 + draft.transportHubLevel * 3, 12, 2, "#35433c", [1, 0]);
      for (let lane = 0; lane < 3; lane += 1) addBox(14, 0.2, 1.1, -110, 0.03, 1 + lane * 3, "#b3bf99");
    }
    if (draft.carParkLevel > 0) {
      createBuilding("MATCHDAY CAR PARK", -126, -45, 23 + draft.carParkLevel * 2, 18, 2 + draft.carParkLevel, "#39483e", [1, 0]);
      createBuilding("NORTH CAR PARK", 119, -77, 23 + draft.carParkLevel * 2, 18, 2 + draft.carParkLevel, "#39483e", [1, 0]);
      for (const [x, z] of [[-96, -35], [99, 11]]) {
        const width = 34 + draft.carParkLevel * 7;
        const depth = 26 + draft.carParkLevel * 4;
        addPlane(width, depth, x, 0.01, z, "#343a35");
        for (let lane = 0; lane < 7; lane += 1) addBox(0.12, 0.025, depth - 3, x - width / 2 + 3 + lane * ((width - 6) / 6), 0.05, z, "#c4c3a4");
        const cars = Math.min(15, 4 + draft.carParkLevel * 3);
        for (let car = 0; car < cars; car += 1) {
          const lane = car % 5;
          const row = Math.floor(car / 5);
          addBox(1.7, 0.72, 3.3, x - width * 0.31 + lane * width * 0.15, 0.42, z - depth * 0.31 + row * 5.8, ["#87928c", club.colors[0], "#bead78", "#e3e3d6"][car % 4]);
        }
      }
    }

    const facilitySheet = new Image();
    facilitySheet.onload = () => {
      if (sceneDisposed) return;
      const cellWidth = facilitySheet.naturalWidth / 3;
      const cellHeight = facilitySheet.naturalHeight / 2;
      for (const target of facilityPhotoTargets) {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext("2d");
        if (!context) continue;
        context.drawImage(facilitySheet, target.column * cellWidth, target.row * cellHeight, cellWidth, cellHeight, 0, 0, canvas.width, canvas.height);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
        target.mesh.material.map = texture;
        target.mesh.material.color.set("#ffffff");
        target.mesh.material.needsUpdate = true;
      }
    };
    facilitySheet.src = "/stadium-facilities-contact-sheet.png";

    const addTree = (x: number, z: number, scale: number) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.3 * scale, 2.6 * scale, 7), material("#544b38"));
      trunk.position.set(x, 1.3 * scale, z);
      scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 * scale, 1), material(draft.architecture === "Garden bowl" ? "#507648" : "#3e6747"));
      crown.position.set(x, 3.7 * scale, z);
      crown.castShadow = true;
      scene.add(crown);
    };
    if (["Garden bowl", "Hilltop terraces", "Lakeside canopy"].includes(draft.architecture ?? "")) {
      for (let tree = 0; tree < 18; tree += 1) {
        const x = -90 + (tree % 9) * 22;
        const z = tree < 9 ? -91 : 91;
        addTree(x, z, 0.74 + (tree % 3) * 0.12);
      }
    }
    if (draft.architecture === "Clocktower brick" || draft.architecture === "Beacon tower") {
      const towerX = draft.architecture === "Beacon tower" ? -75 : 75;
      const towerZ = draft.architecture === "Beacon tower" ? -80 : 1;
      const towerHeight = draft.architecture === "Beacon tower" ? 39 : 29;
      addBox(7.5, towerHeight, 7.5, towerX, towerHeight / 2, towerZ, draft.architecture === "Clocktower brick" ? "#704e3d" : "#65726a");
      addBox(11, 2.2, 11, towerX, towerHeight - 1, towerZ, club.colors[0]);
      if (draft.architecture === "Clocktower brick") {
        for (const direction of [-1, 1]) {
          const clock = new THREE.Mesh(new THREE.CircleGeometry(2.3, 32), new THREE.MeshStandardMaterial({ color: "#ded6ad", emissive: "#655c37", emissiveIntensity: 0.25 }));
          clock.position.set(towerX + direction * 3.9, towerHeight - 7, towerZ);
          clock.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
          scene.add(clock);
          beam(new THREE.Vector3(towerX + direction * 4, towerHeight - 7, towerZ), new THREE.Vector3(towerX + direction * 4, towerHeight - 7, towerZ + 1.5), 0.14, "#5b4c31");
        }
      }
    }
    if (["Riverside glass", "Lakeside canopy"].includes(draft.architecture ?? "")) {
      if (draft.architecture === "Lakeside canopy") {
        const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshPhysicalMaterial({ color: "#315e61", metalness: 0.35, roughness: 0.2, transparent: true, opacity: 0.8 }));
        water.rotation.x = -Math.PI / 2;
        water.position.set(92, 0.05, -74);
        scene.add(water);
      }
    }
    if (draft.architecture === "Market hall") {
      for (const z of [-72, 72]) {
        for (let stall = 0; stall < 6; stall += 1) {
          const x = -42 + stall * 17;
          addBox(9, 4, 8, x, 2, z, stall % 2 ? "#765d42" : "#65503b");
          const awning = addBox(10, 0.8, 9.2, x, 4.3, z, stall % 2 ? club.colors[0] : "#c7a66b");
          awning.rotation.z = -0.03;
        }
      }
    }

    if (draft.project) {
      addBox(0.65, 30, 0.65, 100, 15, -48, "#b9aa74");
      addBox(33, 0.45, 0.45, 84, 29.6, -48, "#b9aa74");
      beam(new THREE.Vector3(83, 29, -48), new THREE.Vector3(72, 4, -47), 0.19, "#d4c18b");
      beam(new THREE.Vector3(115, 29, -48), new THREE.Vector3(119, 18, -48), 0.19, "#d4c18b");
      addBox(0.35, 9, 0.35, 119, 14, -48, "#d4c18b");
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 8, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 145;
    controls.maxDistance = 520;
    controls.maxPolarAngle = Math.PI * 0.37;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.screenSpacePanning = true;
    controls.update();
    controlsRef.current = controls;
    const resize = new ResizeObserver(() => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    });
    resize.observe(host);
    let animation = 0;
    const renderFrame = () => {
      animation = window.requestAnimationFrame(renderFrame);
      controls.update();
      renderer.render(scene, camera);
    };
    renderFrame();

    return () => {
      sceneDisposed = true;
      cameraPositionRef.current = camera.position.toArray() as [number, number, number];
      window.cancelAnimationFrame(animation);
      resize.disconnect();
      controls.dispose();
      controlsRef.current = null;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
          object.geometry.dispose();
          const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
          meshMaterials.forEach((meshMaterial) => {
            if (meshMaterial.map) meshMaterial.map.dispose();
            meshMaterial.dispose();
          });
        }
      });
      materials.clear();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [club, draft, preset]);

  const resetView = (next: ViewPreset) => {
    setPreset(next);
    cameraPositionRef.current = CAMERA[next];
    const controls = controlsRef.current;
    if (controls) {
      controls.object.position.set(...CAMERA[next]);
      controls.target.set(0, 8, 0);
      controls.update();
    }
  };

  return <div className="stadium-scene-shell">
    <div className="stadium-scene-stage" ref={stageRef} />
    {webglUnavailable && <div className="stadium-webgl-fallback" role="status"><strong>3D preview unavailable in this browser</strong><span>The stadium plan is ready. Try enabling hardware acceleration to orbit the 3D ground.</span></div>}
    <div className="stadium-scene-toolbar" role="group" aria-label="Stadium camera views">{(["Aerial", "Broadcast", "Pitch"] as const).map((view) => <button type="button" key={view} aria-pressed={preset === view} className={preset === view ? "active" : ""} onClick={() => resetView(view)}>{view}</button>)}</div>
    <div className="stadium-scene-tip"><span>DRAG TO ORBIT</span><i /> SCROLL TO ZOOM</div>
  </div>;
}
