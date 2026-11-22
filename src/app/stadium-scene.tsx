"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Club } from "@/lib/game";
import { getStandDesign } from "@/lib/stadium-designs";
import type { StandSide } from "@/lib/stadium-designs";
import type { Draft } from "./stadium-architect";

type Props = { club: Club; draft: Draft; selectedStand: StandSide | null; onSelectStand: (side: StandSide) => void };
type ViewPreset = "Aerial" | "Broadcast" | "Pitch";

const CAMERA: Record<ViewPreset, [number, number, number]> = {
  Aerial: [205, 285, 205],
  Broadcast: [190, 135, 190],
  Pitch: [140, 65, 140],
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
  const insetX = 6;
  const pixelsPerMetre = (canvas.width - insetX * 2) / 105;
  const pitchWidth = 105 * pixelsPerMetre;
  const pitchHeight = 68 * pixelsPerMetre;
  const insetY = (canvas.height - pitchHeight) / 2;
  const centerY = insetY + pitchHeight / 2;
  ctx.strokeStyle = "rgba(244,247,229,.91)";
  ctx.lineWidth = 2;
  ctx.strokeRect(insetX, insetY, pitchWidth, pitchHeight);
  ctx.beginPath(); ctx.moveTo(insetX + pitchWidth / 2, insetY); ctx.lineTo(insetX + pitchWidth / 2, insetY + pitchHeight); ctx.stroke();
  const centreRadius = 9.15 * pixelsPerMetre;
  ctx.beginPath(); ctx.arc(insetX + pitchWidth / 2, centerY, centreRadius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#f0f1df";
  ctx.beginPath(); ctx.arc(insetX + pitchWidth / 2, centerY, 2.2, 0, Math.PI * 2); ctx.fill();
  const penaltyAreaDepth = 16.5 * pixelsPerMetre;
  const penaltyAreaWidth = 40.32 * pixelsPerMetre;
  const goalAreaDepth = 5.5 * pixelsPerMetre;
  const goalAreaWidth = 18.32 * pixelsPerMetre;
  const penaltySpotOffset = 11 * pixelsPerMetre;
  const rightGoalLine = insetX + pitchWidth;
  const penaltySpots = [insetX + penaltySpotOffset, rightGoalLine - penaltySpotOffset];
  ctx.strokeRect(insetX, centerY - penaltyAreaWidth / 2, penaltyAreaDepth, penaltyAreaWidth);
  ctx.strokeRect(rightGoalLine - penaltyAreaDepth, centerY - penaltyAreaWidth / 2, penaltyAreaDepth, penaltyAreaWidth);
  ctx.strokeRect(insetX, centerY - goalAreaWidth / 2, goalAreaDepth, goalAreaWidth);
  ctx.strokeRect(rightGoalLine - goalAreaDepth, centerY - goalAreaWidth / 2, goalAreaDepth, goalAreaWidth);
  ctx.beginPath(); ctx.arc(penaltySpots[0], centerY, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(penaltySpots[1], centerY, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.rect(insetX, insetY, pitchWidth, pitchHeight); ctx.clip();
  ctx.beginPath(); ctx.arc(penaltySpots[0], centerY, centreRadius, -0.88, 0.88); ctx.stroke();
  ctx.beginPath(); ctx.arc(penaltySpots[1], centerY, centreRadius, Math.PI - 0.88, Math.PI + 0.88); ctx.stroke();
  ctx.restore();
  for (const y of [insetY, insetY + pitchHeight]) {
    ctx.beginPath();
    if (y < centerY) ctx.arc(insetX, y, pixelsPerMetre, 0, Math.PI / 2);
    else ctx.arc(insetX, y, pixelsPerMetre, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.beginPath();
    if (y < centerY) ctx.arc(rightGoalLine, y, pixelsPerMetre, Math.PI / 2, Math.PI);
    else ctx.arc(rightGoalLine, y, pixelsPerMetre, Math.PI, Math.PI * 1.5);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function buildParkingTexture(surface: "gravel" | "asphalt") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = surface === "gravel" ? "#847b68" : "#343a37";
  context.fillRect(0, 0, canvas.width, canvas.height);
  let seed = surface === "gravel" ? 8317 : 2191;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const palette = surface === "gravel"
    ? ["#b8aa8a", "#655f51", "#988d75", "#d1c5a4", "#736a58"]
    : ["#414844", "#2b312f", "#4b504c", "#383e3b"];
  for (let pebble = 0; pebble < (surface === "gravel" ? 1800 : 680); pebble += 1) {
    context.globalAlpha = surface === "gravel" ? 0.28 + random() * 0.3 : 0.12 + random() * 0.17;
    context.fillStyle = palette[Math.floor(random() * palette.length)];
    const radius = surface === "gravel" ? 0.45 + random() * 1.8 : 0.6 + random() * 2.4;
    context.beginPath();
    context.ellipse(random() * canvas.width, random() * canvas.height, radius * 1.4, radius, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
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

export default function StadiumScene({ club, draft, selectedStand, onSelectStand }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraPositionRef = useRef<[number, number, number] | null>(null);
  const [preset, setPreset] = useState<ViewPreset>("Aerial");
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const selectedStandRef = useRef<StandSide | null>(selectedStand);
  const selectStandRef = useRef(onSelectStand);
  const selectionIndicatorsRef = useRef<Partial<Record<StandSide, THREE.Object3D>>>({});
  selectedStandRef.current = selectedStand;
  selectStandRef.current = onSelectStand;

  useEffect(() => {
    selectionIndicatorsRef.current = {};
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
    const initialGroundScale = Math.sqrt(THREE.MathUtils.clamp(draft.capacity / 24_600, 0.42, 1.8));
    const initialCameraScale = 0.72 + initialGroundScale * 0.28;
    camera.position.set(...(cameraPositionRef.current ?? CAMERA[preset].map((coordinate) => coordinate * initialCameraScale) as [number, number, number]));
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

    const tiers = draft.standTiers;
    const compactGround = draft.capacity <= 10_000;
    const groundScale = Math.sqrt(THREE.MathUtils.clamp(draft.capacity / 24_600, 0.42, 1.8));
    const contextScale = THREE.MathUtils.clamp(0.66 + groundScale * 0.34, 0.84, 1.18);
    const rows = draft.capacity <= 10_000 ? 6 : draft.capacity <= 16_000 ? 7 : draft.capacity >= 45_000 ? 13 : draft.capacity >= 30_000 ? 11 : 9;
    const rowRun = draft.capacity <= 10_000 ? 0.92 : draft.capacity <= 16_000 ? 0.99 : 1.05;
    const rowRise = draft.capacity <= 10_000 ? 0.42 : draft.capacity <= 16_000 ? 0.45 : draft.capacity >= 30_000 ? 0.5 : 0.48;
    const tierRun = rows * rowRun + (compactGround ? 2.5 : draft.capacity >= 30_000 ? 4.5 : 3.8);
    const tierRise = rows * rowRise + (compactGround ? 3.1 : draft.capacity <= 16_000 ? 3.8 : draft.capacity >= 30_000 ? 4.8 : 4.2);
    const siteInnerX = Math.max(76, 59.5 + (Math.max(tiers.east, tiers.west) - 1) * tierRun + rows * rowRun + 8.5);
    const siteInnerZ = Math.max(57, 41.5 + (Math.max(tiers.north, tiers.south) - 1) * tierRun + rows * rowRun + 8.5);
    const campusWidth = Math.max(260, (siteInnerX + 70) * 2);
    const campusDepth = Math.max(220, (siteInnerZ + 63) * 2);
    const hardscapeWidth = (siteInnerX + 31) * 2;
    const hardscapeDepth = (siteInnerZ + 31) * 2;
    addPlane(campusWidth, campusDepth, 0, -0.62, 0, "#49644c");
    addPlane(hardscapeWidth, hardscapeDepth, 0, -0.47, 0, "#b4b19f");
    addPlane(Math.max(150, hardscapeWidth - 9), Math.max(128, hardscapeDepth - 9), 0, -0.36, 0, "#566352");
    const addOvalRing = (innerX: number, innerZ: number, outerX: number, outerZ: number, color: string, y: number) => {
      const shape = new THREE.Shape();
      shape.absellipse(0, 0, outerX, outerZ, 0, Math.PI * 2, false, 0);
      const cutout = new THREE.Path();
      cutout.absellipse(0, 0, innerX, innerZ, 0, Math.PI * 2, true, 0);
      shape.holes.push(cutout);
      const geometry = new THREE.ShapeGeometry(shape, 128);
      geometry.rotateX(-Math.PI / 2);
      const ring = new THREE.Mesh(geometry, material(color, 0.92, 0.01));
      ring.position.y = y;
      ring.receiveShadow = true;
      scene.add(ring);
    };
    addOvalRing(siteInnerX, siteInnerZ, siteInnerX + 18, siteInnerZ + 17, "#b1b0a1", -0.18);
    addOvalRing(siteInnerX + 18, siteInnerZ + 17, siteInnerX + 26, siteInnerZ + 24, "#515953", -0.16);
    const pathEndX = siteInnerX + 12;
    const pathEndZ = siteInnerZ + 12;
    for (const [x, z, horizontal] of [[0, -pathEndZ, true], [0, pathEndZ, true], [-pathEndX, 0, false], [pathEndX, 0, false]] as const) {
      addBox(horizontal ? 6 : 18, 0.12, horizontal ? 18 : 6, x, -0.14, z, "#999a8d");
    }

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
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.44, 10), goalMaterial);
        post.position.set(goalX, 1.45, z);
        scene.add(post);
        return post;
      });
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.32, 10), goalMaterial);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(goalX, 2.67, 0);
      scene.add(crossbar);
      const netMaterial = new THREE.MeshStandardMaterial({ color: "#d9ddd0", wireframe: true, transparent: true, opacity: 0.36 });
      const net = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.32, 7.24), netMaterial);
      net.position.set(goalX + end * 1.1, 1.4, 0);
      scene.add(net);
      for (const post of posts) post.castShadow = true;
    }

    // The same compact dimensions carry through to the corners and upper decks.
    const terrace = material("#656d65", 0.83, 0.02);
    const chairShape = new THREE.Shape();
    chairShape.moveTo(-0.4, 0); chairShape.lineTo(0.4, 0); chairShape.lineTo(0.4, 0.12); chairShape.lineTo(0.31, 0.17); chairShape.lineTo(0.34, 0.4); chairShape.quadraticCurveTo(0.3, 0.52, 0, 0.52); chairShape.quadraticCurveTo(-0.3, 0.52, -0.34, 0.4); chairShape.lineTo(-0.31, 0.17); chairShape.lineTo(-0.4, 0.12); chairShape.closePath();
    const seatGeometry = new THREE.ExtrudeGeometry(chairShape, { depth: 0.1, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.015, bevelThickness: 0.015 });
    seatGeometry.translate(0, 0, -0.05);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45, metalness: 0.02 });
    const clubPrimary = new THREE.Color(club.colors[0]);
    const seatPalette = [clubPrimary, clubPrimary.clone().lerp(new THREE.Color("#e7eee1"), 0.22), clubPrimary.clone().lerp(new THREE.Color(club.colors[1]), 0.35), clubPrimary.clone().lerp(new THREE.Color("#c8a967"), 0.35)];
    const glass = new THREE.MeshPhysicalMaterial({ color: "#8fb6ad", roughness: 0.2, metalness: 0.12, transparent: true, opacity: 0.54, side: THREE.DoubleSide, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const standPickTargets: THREE.Group[] = [];
    const makeStand = (side: StandSide) => {
      const group = new THREE.Group();
      group.userData.standSide = side;
      standPickTargets.push(group);
      const design = getStandDesign(draft.standDesigns[side]);
      const roofType = draft.standRoofs?.[side] ?? draft.roof;
      const longSide = side === "north" || side === "south";
      const sign = side === "north" || side === "west" ? -1 : 1;
      const tierCount = Math.max(1, Math.min(4, tiers[side]));
      const span = longSide
        ? compactGround ? 108 : draft.capacity <= 16_000 ? 116 : draft.capacity >= 45_000 ? 140 : draft.capacity >= 30_000 ? 132 : 122
        : compactGround ? 70 : draft.capacity <= 16_000 ? 75 : draft.capacity >= 45_000 ? 88 : draft.capacity >= 30_000 ? 83 : 78;
      const halfSpan = span / 2;
      const startRadius = longSide ? 41.5 : 59.5;
      const isHeritage = design.profile === "heritage";
      const shellColor = isHeritage ? "#62675f" : design.profile === "terrace" || design.profile === "standing" ? "#747c70" : "#8b938a";
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
        const pierCount = compactGround ? 5 : 8;
        for (let pier = 0; pier <= pierCount; pier += 1) {
          const x = -span / 2 + pier * span / pierCount;
          addBox(0.78, windowBandHeight + 0.55, 0.62, x, 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.32), isHeritage ? "#9b7756" : "#74857a", group, 0.56);
          addBox(1.5, 0.4, 1.25, x, 2.97 + windowBandHeight, sign * (facadeRadius + 2.34), club.colors[1], group, 0.42);
        }
        addBox(span + 4, 0.7, 4.2, 0, facadeHeight + 0.35, sign * facadeRadius, façadeTint, group, 0.58);
        const selectionStripe = addBox(span, 0.42, 0.5, 0, 3.24, sign * (facadeRadius + 2.22), club.colors[1], group, 0.34);
        selectionStripe.visible = selectedStandRef.current === side;
        selectionIndicatorsRef.current[side] = selectionStripe;
        const entrances = compactGround ? [-0.31, 0, 0.31] : [-0.36, -0.12, 0.12, 0.36];
        for (const fraction of entrances) {
          const entranceX = span * fraction;
          addBox(3.4, 3.1, 0.42, entranceX, 1.82, sign * (facadeRadius + 2.3), "#253a32", group, 0.35);
          addBox(4.3, 0.46, 2.15, entranceX, 3.64, sign * (facadeRadius + 2.75), club.colors[0], group, 0.48);
          addBox(0.24, 2.75, 0.5, entranceX - 1.7, 1.82, sign * (facadeRadius + 2.52), "#d0c49b", group, 0.55);
          addBox(0.24, 2.75, 0.5, entranceX + 1.7, 1.82, sign * (facadeRadius + 2.52), "#d0c49b", group, 0.55);
        }
      } else {
        addBox(4, 2.5, span + 4, sign * facadeRadius, 1.25, 0, façadeTint, group, 0.58);
        addBox(4.4, 0.52, span + 4, sign * facadeRadius, 2.7, 0, "#a3aa9b", group, 0.6);
        const windowBandHeight = Math.max(2.2, facadeHeight - 4.2);
        const glazedBand = new THREE.Mesh(new THREE.BoxGeometry(0.22, windowBandHeight, span - 1.5), glass);
        glazedBand.position.set(sign * (facadeRadius + 2.06), 2.8 + windowBandHeight / 2, 0);
        group.add(glazedBand);
        for (let mullion = -5; mullion <= 5; mullion += 1) addBox(0.34, windowBandHeight + 0.2, 0.32, sign * (facadeRadius + 2.13), 2.8 + windowBandHeight / 2, mullion * (span / 11), "#9ba99f", group, 0.42);
        const pierCount = compactGround ? 4 : 5;
        for (let pier = 0; pier <= pierCount; pier += 1) {
          const z = -span / 2 + pier * span / pierCount;
          addBox(0.62, windowBandHeight + 0.55, 0.78, sign * (facadeRadius + 2.32), 2.8 + windowBandHeight / 2, z, isHeritage ? "#9b7756" : "#74857a", group, 0.56);
          addBox(1.25, 0.4, 1.5, sign * (facadeRadius + 2.34), 2.97 + windowBandHeight, z, club.colors[1], group, 0.42);
        }
        addBox(4.2, 0.7, span + 4, sign * facadeRadius, facadeHeight + 0.35, 0, façadeTint, group, 0.58);
        const selectionStripe = addBox(0.5, 0.42, span, sign * (facadeRadius + 2.22), 3.24, 0, club.colors[1], group, 0.34);
        selectionStripe.visible = selectedStandRef.current === side;
        selectionIndicatorsRef.current[side] = selectionStripe;
        const entrances = compactGround ? [-0.28, 0, 0.28] : [-0.34, 0, 0.34];
        for (const fraction of entrances) {
          const entranceZ = span * fraction;
          addBox(0.42, 3.1, 3.4, sign * (facadeRadius + 2.3), 1.82, entranceZ, "#253a32", group, 0.35);
          addBox(2.15, 0.46, 4.3, sign * (facadeRadius + 2.75), 3.64, entranceZ, club.colors[0], group, 0.48);
          addBox(0.5, 2.75, 0.24, sign * (facadeRadius + 2.52), 1.82, entranceZ - 1.7, "#d0c49b", group, 0.55);
          addBox(0.5, 2.75, 0.24, sign * (facadeRadius + 2.52), 1.82, entranceZ + 1.7, "#d0c49b", group, 0.55);
        }
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
        // Cover the seating decks while leaving a clear central opening above the pitch.
        const lowestRoofTier = Math.max(0, tierCount - 2);
        const roofInner = Math.max(startRadius - 2, startRadius + lowestRoofTier * tierRun - 1.5);
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
          const roofColor = roofType === "Glazed shell" ? "#729a92" : roofType === "Wave canopy" ? "#5d7871" : roofType === "Lattice roof" ? "#65766d" : roofType === "Retractable roof" ? "#637a75" : "#52645c";
          const canopyMaterial = new THREE.MeshStandardMaterial({ color: roofColor, metalness: roofType === "Glazed shell" ? 0.24 : 0.2, roughness: 0.48, side: THREE.DoubleSide, transparent: roofType === "Glazed shell", opacity: roofType === "Glazed shell" ? 0.48 : 1, emissive: club.colors[0], emissiveIntensity: 0.01 });
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

    if (draft.ledBoardsLevel === 0) {
      for (const end of [-1, 1]) {
        addBox(96, 0.85, 0.5, 0, 0.48, end * 36.7, "#d7d8c7", scene, 0.54);
        for (let panel = 0; panel < 8; panel += 1) {
          const x = -42 + panel * 12;
          addBox(10.6, 0.62, 0.12, x, 0.55, end * 37.01, panel % 2 ? club.colors[0] : club.colors[1], scene, 0.48);
        }
        addBox(0.5, 0.85, 60, end * 53.7, 0.48, 0, "#d7d8c7", scene, 0.54);
        for (let panel = 0; panel < 5; panel += 1) {
          const z = -24 + panel * 12;
          addBox(0.12, 0.62, 10.6, end * 54.01, 0.55, z, panel % 2 ? club.colors[1] : club.colors[0], scene, 0.48);
        }
      }
    }
    for (const end of [-1, 1]) {
      const dugoutZ = end * 39.1;
      addBox(16.5, 0.3, 2.7, 0, 2.25, dugoutZ, glass, scene, 0.32);
      addBox(17, 0.28, 3.1, 0, 2.5, dugoutZ, "#31433a", scene, 0.42);
      for (const support of [-7.6, 7.6]) beam(new THREE.Vector3(support, 0.15, dugoutZ), new THREE.Vector3(support, 2.45, dugoutZ), 0.16, "#aab4a4");
      addBox(17.2, 0.2, 3.2, 0, 2.55, dugoutZ, club.colors[0], scene, 0.36);
      for (let seat = -6; seat <= 6; seat += 1) {
        addBox(0.92, 0.12, 0.32, seat * 1.15, 0.74, dugoutZ, "#d5d5c4", scene, 0.4);
        addBox(0.92, 0.52, 0.18, seat * 1.15, 1.02, dugoutZ - end * 0.38, club.colors[seat % 2 ? 0 : 1], scene, 0.48);
      }
      for (const flagX of [-52.5, 52.5]) {
        const flagZ = end * 33.7;
        addBox(0.08, 1.7, 0.08, flagX, 0.86, flagZ, "#ece9d8", scene, 0.5);
        addBox(0.86, 0.55, 0.08, flagX + (flagX < 0 ? 0.4 : -0.4), 1.48, flagZ, club.colors[0], scene, 0.42);
      }
    }

    const sectorGeometry = (innerRadius: number, outerRadius: number, start: number, end: number, centerX = 0, centerZ = 0) => {
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
      geometry.translate(centerX, 0, centerZ);
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
      group.userData.standSide = firstSide;
      group.userData.corner = corner;
      group.userData.cornerStart = start;
      group.userData.cornerEnd = end;
      group.userData.cornerCenter = [corner.includes("West") ? -48 : 48, corner.includes("north") ? -30 : 30];
      group.userData.cornerSides = corner === "northWest" ? ["north", "west"]
        : corner === "northEast" ? ["east", "north"]
        : corner === "southEast" ? ["south", "east"]
        : ["west", "south"];
      standPickTargets.push(group);
      const cornerDesign = getStandDesign(draft.standDesigns[firstSide]);
      const cornerMaterial = material(cornerDesign.profile === "heritage" ? "#815840" : "#78847a", 0.76, 0.07);
      const centerX = corner.includes("West") ? -48 : 48;
      const centerZ = corner.includes("north") ? -30 : 30;
      const cornerSeats: THREE.Matrix4[] = [];
      const cornerColors: THREE.Color[] = [];
      const dummy = new THREE.Object3D();
      const countTiers = Math.max(tiers[firstSide], tiers[secondSide]);
      for (let tier = 0; tier < countTiers; tier += 1) {
        const tierBase = 1.5 + tier * tierRise;
        for (let row = 0; row < rows; row += 1) {
          const inner = 12 + tier * tierRun + row * rowRun;
          const outer = inner + 0.94;
          const tread = new THREE.Mesh(sectorGeometry(inner, outer, start, end, centerX, centerZ), row % 2 ? terrace : cornerMaterial);
          tread.position.y = tierBase + row * rowRise;
          tread.receiveShadow = true;
          tread.castShadow = true;
          group.add(tread);
          if (draft.seats) {
            for (let seat = 0; seat < 32; seat += 1) {
              const angle = start + (end - start) * (seat + 0.5) / 32;
              const radius = inner + 0.48;
              const y = tierBase + row * rowRise + 0.18;
              dummy.position.set(centerX + radius * Math.cos(angle), y, centerZ - radius * Math.sin(angle));
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
              post.position.set(centerX + radius * Math.cos(angle), tierBase + row * rowRise + 0.48, centerZ - radius * Math.sin(angle));
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
      const topY = 1.7 + (countTiers - 1) * tierRise + rows * rowRise;
      const outerRadius = 12 + (countTiers - 1) * tierRun + rows * rowRun;
      const wallSteps = 36;
      const wallRadius = outerRadius + 2.6;
      const arcPoint = (angle: number, y: number, radius = wallRadius) => new THREE.Vector3(centerX + radius * Math.cos(angle), y, centerZ - radius * Math.sin(angle));
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
        const lowestRoofTier = Math.max(0, countTiers - 2);
        const roofInnerRadius = Math.max(8, 12 + lowestRoofTier * tierRun - 1.5);
        const canopy = new THREE.Mesh(sectorGeometry(roofInnerRadius, outerRadius + 6.5, start, end, centerX, centerZ), new THREE.MeshStandardMaterial({ color: cornerDesign.profile === "heritage" ? "#ad8c67" : "#87968a", roughness: 0.68, metalness: 0.06, side: THREE.DoubleSide }));
        canopy.position.y = topY + 4.8;
        group.add(canopy);
        for (const angle of [start, (start + end) / 2, end]) {
          const from = arcPoint(angle, topY + 3, outerRadius + 5);
          const to = arcPoint(angle, topY + 5, roofInnerRadius);
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
    const amenityScale = THREE.MathUtils.clamp(contextScale, 0.78, 1);
    const amenityX = siteInnerX + 32;
    const amenityZ = siteInnerZ * 0.64;
    const outerFacilityX = siteInnerX + 58;
    const outerFacilityZ = siteInnerZ + 20;
    const gravelMaterial = new THREE.MeshStandardMaterial({ map: buildParkingTexture("gravel"), roughness: 1 });
    const asphaltMaterial = new THREE.MeshStandardMaterial({ map: buildParkingTexture("asphalt"), roughness: 0.98 });
    const addVehicle = (x: number, z: number, color: string, scale = 1) => {
      addBox(1.72 * scale, 0.62 * scale, 3.55 * scale, x, 0.38 * scale, z, color, scene, 0.5);
      addBox(1.28 * scale, 0.42 * scale, 1.8 * scale, x, 0.86 * scale, z - 0.05 * scale, "#384844", scene, 0.3);
      addBox(1.08 * scale, 0.08 * scale, 0.62 * scale, x, 1.05 * scale, z - 0.19 * scale, "#8ca8a0", scene, 0.2);
      addBox(1.08 * scale, 0.08 * scale, 0.62 * scale, x, 1.05 * scale, z + 0.53 * scale, "#91aaa0", scene, 0.2);
    };
    const createParkingLot = (x: number, z: number, width: number, depth: number, surface: "gravel" | "asphalt", carCount: number) => {
      const lot = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), surface === "gravel" ? gravelMaterial : asphaltMaterial);
      lot.rotation.x = -Math.PI / 2;
      lot.position.set(x, 0.025, z);
      lot.receiveShadow = true;
      scene.add(lot);
      addBox(width + 1.2, 0.18, 0.85, x, 0.02, z - depth / 2, surface === "gravel" ? "#b2a78d" : "#a0a39a", scene, 0.92);
      if (surface === "asphalt") {
        const bays = Math.max(4, Math.floor(width / 3.15));
        for (let bay = 0; bay <= bays; bay += 1) {
          const bayX = x - width / 2 + bay * (width / bays);
          for (const row of [-1, 1]) addBox(0.11, 0.025, Math.min(4.7, depth * 0.36), bayX, 0.055, z + row * depth * 0.25, "#d8d9cb", scene, 0.74);
        }
        addBox(1.3, 0.03, 0.2, x, 0.06, z, "#d8d9cb", scene, 0.72);
        addBox(0.2, 0.03, 1.3, x, 0.06, z, "#d8d9cb", scene, 0.72);
      } else {
        for (let curb = -1; curb <= 1; curb += 1) addBox(0.38, 0.12, depth - 2, x - width * 0.38 + curb * width * 0.38, 0.12, z, "#9b917b", scene, 0.92);
      }
      const columns = Math.max(3, Math.floor(width / 4));
      const parked = Math.min(carCount, columns * 2);
      const vehicleColors = ["#87928c", club.colors[0], "#bead78", "#e3e3d6", "#5c6a76", "#8d4d42"];
      for (let car = 0; car < parked; car += 1) {
        const column = car % columns;
        const row = Math.floor(car / columns);
        const carX = x - width * 0.42 + (column + 0.5) * (width * 0.84 / columns);
        const carZ = z + (row === 0 ? -1 : 1) * Math.min(4.7, depth * 0.25);
        addVehicle(carX, carZ, vehicleColors[car % vehicleColors.length], surface === "gravel" ? 0.9 : 1);
      }
      for (const lampX of [x - width / 2 + 2, x + width / 2 - 2]) {
        addBox(0.24, 5.4, 0.24, lampX, 2.7, z + depth / 2 - 1.3, "#78847b", scene, 0.48);
        addBox(1.05, 0.16, 0.54, lampX, 5.45, z + depth / 2 - 1.3, "#e8edcf", scene, 0.26);
      }
    };
    if (draft.superstoreLevel > 0) createBuilding("CLUB SUPERSTORE", -amenityX, -amenityZ, (19 + draft.superstoreLevel * 2) * amenityScale, 14 * amenityScale, 2 + draft.superstoreLevel, "#3b4934", [0, 0]);
    if (draft.restaurantLevel > 0) createBuilding("MATCHDAY DINING", amenityX, amenityZ, (20 + draft.restaurantLevel * 2) * amenityScale, 15 * amenityScale, 2 + draft.restaurantLevel, "#4a4431", [2, 0]);
    if (draft.hotelLevel > 0) createBuilding("THE CLUB HOTEL", amenityX, outerFacilityZ, (26 + draft.hotelLevel * 2) * amenityScale, 16 * amenityScale, 3 + draft.hotelLevel, "#38473d", [0, 1]);
    if (draft.fanZoneLevel > 0) createBuilding("FAN ZONE", -amenityX, -outerFacilityZ, (22 + draft.fanZoneLevel * 2) * amenityScale, 15 * amenityScale, 2, "#354532", [2, 1]);
    if (draft.museumLevel > 0) createBuilding("CLUB MUSEUM", 0, siteInnerZ + 39, (21 + draft.museumLevel * 2) * amenityScale, 13 * amenityScale, 2 + draft.museumLevel, "#413d2f", [1, 1]);
    if (draft.transportHubLevel > 0) {
      const hubX = -outerFacilityX;
      createBuilding("RAIL · COACH · WALK", hubX, 0, (18 + draft.transportHubLevel * 3) * amenityScale, 12 * amenityScale, 2, "#35433c", [1, 0]);
      for (let lane = 0; lane < 3; lane += 1) addBox(14 * amenityScale, 0.2, 1.1, hubX, 0.03, 1 + lane * 3, "#b3bf99");
    }
    if (draft.carParkLevel > 0) {
      const officialParking = draft.capacity >= 18_000;
      const parkingSurface = officialParking ? "asphalt" : "gravel";
      const parkingName = officialParking ? "OFFICIAL PARKING · EAST" : "VISITOR PARKING · GRAVEL";
      createBuilding(parkingName, -outerFacilityX, outerFacilityZ + 19, (23 + draft.carParkLevel * 2) * amenityScale, 18 * amenityScale, 2 + draft.carParkLevel, "#39483e", [1, 0]);
      createBuilding(officialParking ? "NORTH CAR PARK" : "COACH & ACCESS PARKING", outerFacilityX, -outerFacilityZ - 19, (23 + draft.carParkLevel * 2) * amenityScale, 18 * amenityScale, 2 + draft.carParkLevel, "#39483e", [1, 0]);
      for (const [x, z] of [[-siteInnerX - 51, siteInnerZ * 0.56], [siteInnerX + 51, -siteInnerZ * 0.56]]) {
        const width = (officialParking ? 48 : 30) * amenityScale + draft.carParkLevel * 7;
        const depth = (officialParking ? 36 : 24) * amenityScale + draft.carParkLevel * 4;
        const parkedCars = Math.round((officialParking ? 18 : 6) * amenityScale + draft.carParkLevel * 3);
        createParkingLot(x, z, width, depth, parkingSurface, parkedCars);
      }
    } else if (compactGround) {
      createParkingLot(-siteInnerX - 42, siteInnerZ * 0.48, 26 * amenityScale, 21 * amenityScale, "gravel", 6);
    } else if (draft.capacity >= 18_000) {
      createParkingLot(-siteInnerX - 51, siteInnerZ * 0.5, 33 * amenityScale, 25 * amenityScale, "asphalt", 8);
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
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.34 * scale, 3.7 * scale, 7), material("#544b38"));
      trunk.position.set(x, 1.85 * scale, z);
      scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(3.05 * scale, 1), material(draft.architecture === "Garden bowl" ? "#507648" : "#3e6747"));
      crown.position.set(x, 5.3 * scale, z);
      crown.castShadow = true;
      scene.add(crown);
    };
    for (let tree = 0; tree < 24; tree += 1) {
      const angle = tree / 24 * Math.PI * 2;
      const x = Math.cos(angle) * (siteInnerX + 57);
      const z = Math.sin(angle) * (siteInnerZ + 43);
      if (Math.abs(x) > siteInnerX + 39 && Math.abs(z) > 24 && Math.abs(z) < siteInnerZ + 36) continue;
      addTree(x, z, (0.78 + (tree % 3) * 0.08) * amenityScale);
    }
    if (["Garden bowl", "Hilltop terraces", "Lakeside canopy"].includes(draft.architecture ?? "")) {
      for (let tree = 0; tree < 18; tree += 1) {
        const x = -siteInnerX * 0.82 + (tree % 9) * (siteInnerX * 0.205);
        const z = tree < 9 ? -(siteInnerZ + 30) : siteInnerZ + 30;
        addTree(x, z, (0.84 + (tree % 3) * 0.1) * amenityScale);
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
    controls.enableRotate = true;
    controls.target.set(0, 8, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 145;
    controls.maxDistance = 520;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.screenSpacePanning = true;
    controls.update();
    controlsRef.current = controls;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: [number, number] | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointerStart = [event.clientX, event.clientY];
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerStart) return;
      const distance = Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]);
      pointerStart = null;
      if (distance > 7) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(standPickTargets, true)[0];
      let target: THREE.Object3D | null = hit?.object ?? null;
      while (target && !target.userData.standSide) target = target.parent;
      if (target?.userData.standSide) {
        const cornerSides = target.userData.cornerSides as [StandSide, StandSide] | undefined;
        if (cornerSides && hit) {
          const [centerX, centerZ] = target.userData.cornerCenter as [number, number];
          const start = target.userData.cornerStart as number;
          const end = target.userData.cornerEnd as number;
          let angle = Math.atan2(centerZ - hit.point.z, hit.point.x - centerX);
          while (angle < start) angle += Math.PI * 2;
          const share = THREE.MathUtils.clamp((angle - start) / (end - start), 0, 1);
          selectStandRef.current(cornerSides[share <= 0.5 ? 0 : 1]);
        } else selectStandRef.current(target.userData.standSide as StandSide);
      }
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
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
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
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

  useEffect(() => {
    for (const side of ["north", "east", "south", "west"] as const) {
      const indicator = selectionIndicatorsRef.current[side];
      if (indicator) indicator.visible = selectedStand === side;
    }
  }, [selectedStand]);

  const resetView = (next: ViewPreset) => {
    setPreset(next);
    const groundScale = Math.sqrt(THREE.MathUtils.clamp(draft.capacity / 24_600, 0.42, 1.8));
    const cameraScale = 0.72 + groundScale * 0.28;
    const position = CAMERA[next].map((coordinate) => coordinate * cameraScale) as [number, number, number];
    cameraPositionRef.current = position;
    const controls = controlsRef.current;
    if (controls) {
      controls.object.position.set(...position);
      controls.target.set(0, 8, 0);
      controls.update();
    }
  };

  return <div className="stadium-scene-shell">
    <div className="stadium-scene-stage" ref={stageRef} />
    {webglUnavailable && <div className="stadium-webgl-fallback" role="status"><strong>3D preview unavailable in this browser</strong><span>The stadium plan is ready. Try enabling hardware acceleration to orbit the 3D ground.</span></div>}
    <div className="stadium-scene-toolbar" role="group" aria-label="Stadium camera views">{(["Aerial", "Broadcast", "Pitch"] as const).map((view) => <button type="button" key={view} aria-pressed={preset === view} className={preset === view ? "active" : ""} onClick={() => resetView(view)}>{view}</button>)}</div>
    <div className="stadium-scene-selection" aria-live="polite">{selectedStand ? `${selectedStand.toUpperCase()} STAND SELECTED · DESIGN IT BELOW` : "CLICK A STAND TO SELECT AND EDIT"}</div>
    <div className="stadium-scene-tip"><span>DRAG TO SPIN 360°</span><i /> SCROLL TO ZOOM</div>
  </div>;
}
