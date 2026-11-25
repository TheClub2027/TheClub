"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Club, StadiumSiteSetting } from "@/lib/game";
import { STAND_STRUCTURES, getStandDesign } from "@/lib/stadium-designs";
import type { StandSide } from "@/lib/stadium-designs";
import { campusPlotIsOwned, facilitySiteHasCollision, facilitySizeFactor, getStadiumLandParcel } from "@/lib/stadium-facilities";
import type { FacilitySiteFootprint, StadiumFacilityKey, StadiumLandSide } from "@/lib/stadium-facilities";
import type { Draft } from "./stadium-architect";
import { addStadiumContext } from "./stadium-context";

export type MatchSceneMarker = { id: string; x: number; z: number; color: string; number: number };
type Props = { club: Club; draft: Draft; selectedStand: StandSide | null; onSelectStand: (side: StandSide) => void; placementFacility: StadiumFacilityKey | null; onPlaceFacility: (key: StadiumFacilityKey, position: { x: number; z: number }) => void; mode?: "facilities" | "match"; matchMinute?: number; matchPlayers?: MatchSceneMarker[] };
type ViewPreset = "Aerial" | "Campus" | "Broadcast" | "Pitch" | "Matchday";

const CAMERA: Record<ViewPreset, [number, number, number]> = {
  Aerial: [205, 285, 205],
  Campus: [325, 410, 325],
  Broadcast: [190, 135, 190],
  Pitch: [140, 65, 140],
  Matchday: [113, 92, 122],
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

function buildStadiumSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#587e91");
  sky.addColorStop(0.37, "#91b2ba");
  sky.addColorStop(0.55, "#ccd8d4");
  sky.addColorStop(0.72, "#e0dbca");
  sky.addColorStop(1, "#b8c2ba");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Broad, low-opacity cloud bands keep the 360° background soft and natural
  // without distracting from stand-selection highlights and build previews.
  let seed = 612_047;
  const random = () => { seed = (seed * 48_271) % 2_147_483_647; return seed / 2_147_483_647; };
  context.save();
  context.filter = "blur(18px)";
  for (let cloud = 0; cloud < 34; cloud += 1) {
    const x = random() * canvas.width;
    const y = 95 + random() * 385;
    const width = 75 + random() * 230;
    const height = 9 + random() * 31;
    const alpha = 0.035 + random() * 0.075;
    context.fillStyle = `rgba(247,248,235,${alpha})`;
    context.beginPath();
    context.ellipse(x, y, width, height, (random() - 0.5) * 0.12, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(x - width * 0.38, y + height * 0.26, width * 0.35, height * 0.72, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
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

function buildStandFacadeMaterial(facade: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 384;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.MeshStandardMaterial({ color, roughness: .84 });
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (facade === "Brick & stone") {
    const mortar = "#c7b5a0";
    context.fillStyle = mortar;
    for (let row = 0; row <= 12; row += 1) {
      const y = row * 32;
      context.fillRect(0, y, canvas.width, 3);
      const offset = row % 2 ? 28 : 0;
      for (let column = -1; column <= 14; column += 1) context.fillRect(column * 56 + offset, y, 3, 32);
    }
    context.fillStyle = "#ffffff12";
    for (let row = 0; row < 12; row += 1) for (let column = 0; column < 13; column += 1) {
      context.fillRect(column * 56 + (row % 2 ? 28 : 0) + 5, row * 32 + 5, 43, 2);
    }
  } else if (facade === "Ribbed metal") {
    context.fillStyle = "#ffffff13";
    context.fillRect(0, 0, canvas.width, 5);
    for (let x = 0; x < canvas.width; x += 24) {
      context.fillStyle = x % 48 ? "#101a1835" : "#ffffff20";
      context.fillRect(x, 0, 3, canvas.height);
      context.fillStyle = "#ffffff0b";
      context.fillRect(x + 5, 0, 12, canvas.height);
    }
    for (let y = 28; y < canvas.height; y += 108) {
      context.fillStyle = "#17211e66";
      context.fillRect(0, y, canvas.width, 2);
    }
  } else {
    let seed = 17923;
    const random = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    for (let patch = 0; patch < 3400; patch += 1) {
      context.globalAlpha = .018 + random() * .055;
      context.fillStyle = random() > .48 ? "#ffffff" : "#111a18";
      const size = 2 + random() * 12;
      context.fillRect(random() * canvas.width, random() * canvas.height, size, size * (.2 + random() * .8));
    }
    context.globalAlpha = 1;
    context.strokeStyle = "#111a1844";
    context.lineWidth = 3;
    for (let x = 0; x <= canvas.width; x += 192) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke(); }
    for (let y = 0; y <= canvas.height; y += 128) { context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke(); }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 2.3);
  map.anisotropy = 6;
  return new THREE.MeshStandardMaterial({ map, color: "#ffffff", roughness: facade === "Ribbed metal" ? .63 : .9, metalness: facade === "Ribbed metal" ? .22 : .01 });
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

export default function StadiumScene({ club, draft, selectedStand, onSelectStand, placementFacility, onPlaceFacility, mode = "facilities", matchMinute = 0, matchPlayers = [] }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraPositionRef = useRef<[number, number, number] | null>(null);
  const viewLayoutSignature = `${club.id}:${draft.capacity}:${(draft.acquiredLand ?? []).slice().sort().join(",")}`;
  const cameraLayoutSignatureRef = useRef(viewLayoutSignature);
  cameraLayoutSignatureRef.current = viewLayoutSignature;
  const [preset, setPreset] = useState<ViewPreset>(mode === "match" ? "Matchday" : "Aerial");
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [placementNotice, setPlacementNotice] = useState("");
  const selectedStandRef = useRef<StandSide | null>(selectedStand);
  const selectStandRef = useRef(onSelectStand);
  const placementFacilityRef = useRef<StadiumFacilityKey | null>(placementFacility);
  const placeFacilityRef = useRef(onPlaceFacility);
  const matchMinuteRef = useRef(matchMinute);
  const selectionIndicatorsRef = useRef<Partial<Record<StandSide, THREE.Object3D>>>({});
  selectedStandRef.current = selectedStand;
  selectStandRef.current = onSelectStand;
  placementFacilityRef.current = placementFacility;
  placeFacilityRef.current = onPlaceFacility;
  matchMinuteRef.current = matchMinute;

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
    const sceneCameraSignature = viewLayoutSignature;
    const skyTexture = buildStadiumSkyTexture();
    scene.background = skyTexture ?? new THREE.Color("#c5d8dc");
    scene.fog = new THREE.Fog("#c5d8dc", 390, 900);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1800);
    const acquiredLand = draft.acquiredLand ?? [];
    const initialGroundScale = Math.sqrt(THREE.MathUtils.clamp(draft.capacity / 24_600, 0.42, 1.8));
    const campusExpansionScale = mode === "facilities" ? 1 + Math.min(0.75, acquiredLand.length * 0.22) : 1;
    const initialCameraScale = (mode === "match" ? 0.74 + initialGroundScale * 0.12 : 0.72 + initialGroundScale * 0.28) * campusExpansionScale;
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
    const defaultStandRows = rows;
    const giantRows = compactGround ? 15 : 22;
    const standExtent = (side: StandSide) => {
      const profile = getStandDesign(draft.standDesigns[side]).profile;
      const structure = STAND_STRUCTURES[profile];
      const sideRows = profile === "giant-end" ? giantRows : Math.max(5, Math.round(rows * structure.rowFactor));
      const sideTierRun = sideRows * structure.treadDepth + (compactGround ? 2.5 : draft.capacity >= 30_000 ? 4.5 : 3.8);
      const startRadius = side === "north" || side === "south" ? 41.5 : 59.5;
      return startRadius + (tiers[side] - 1) * sideTierRun + sideRows * structure.treadDepth + 11;
    };
    const siteInnerX = Math.max(76, standExtent("east"), standExtent("west"));
    const siteInnerZ = Math.max(57, standExtent("north"), standExtent("south"));
    const expandedWidth = acquiredLand.some((side) => side === "east" || side === "west");
    const expandedDepth = acquiredLand.some((side) => side === "north" || side === "south");
    const campusWidth = Math.max(440, (siteInnerX + (expandedWidth ? 245 : 190)) * 2);
    const campusDepth = Math.max(380, (siteInnerZ + (expandedDepth ? 245 : 165)) * 2);
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
    const roadLevel = draft.siteRoadLevel ?? 0;
    if (roadLevel >= 1) {
      const road = material(roadLevel >= 2 ? "#343b38" : "#aaa99c", 0.96, 0.01);
      const roadMesh = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 144), road);
      roadMesh.scale.set(siteInnerX + 43, siteInnerZ + 40, 1);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.y = -0.11;
      roadMesh.receiveShadow = true;
      scene.add(roadMesh);
      if (roadLevel >= 2) {
        const centerLine = material("#d7cfa7", 0.85, 0);
        const marking = new THREE.Mesh(new THREE.RingGeometry(0.994, 1, 144), centerLine);
        marking.scale.set(siteInnerX + 43, siteInnerZ + 40, 1);
        marking.rotation.x = -Math.PI / 2;
        marking.position.y = -0.06;
        scene.add(marking);
        for (const [x, z, horizontal] of [[0, -(siteInnerZ + 41), true], [0, siteInnerZ + 41, true], [-(siteInnerX + 44), 0, false], [siteInnerX + 44, 0, false]] as const) {
          addBox(horizontal ? 7 : 20, 0.14, horizontal ? 20 : 7, x, -0.02, z, "#343b38", scene, 0.96);
          addBox(0.18, 0.035, 4.2, x, 0.06, z, "#e0d6aa", scene, 0.85);
        }
      }
      if (roadLevel >= 3) {
        const treeCount = Math.max(12, Math.floor((siteInnerX + siteInnerZ) / 8));
        for (let index = 0; index < treeCount; index += 1) {
          const angle = index / treeCount * Math.PI * 2;
          const x = Math.cos(angle) * (siteInnerX + 51);
          const z = Math.sin(angle) * (siteInnerZ + 48);
          addBox(0.45, 3.1, 0.45, x, 1.45, z, "#705c42", scene, 0.9);
          const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), material(index % 2 ? "#496c48" : "#58794c"));
          crown.position.set(x, 4.1, z);
          crown.castShadow = true;
          scene.add(crown);
        }
      }
    }
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

    const movingPlayers: { group: THREE.Group; x: number; z: number; phase: number }[] = [];
    if (mode === "match") {
      for (const [index, marker] of matchPlayers.entries()) {
        const player = new THREE.Group();
        player.position.set(marker.x, 0.2, marker.z);
        player.userData.baseX = marker.x;
        player.userData.baseZ = marker.z;
        const kit = material(marker.color, 0.48, 0.02);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.66, 1.45, 8), kit);
        body.position.y = 1.12;
        body.castShadow = true;
        player.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.39, 9, 7), material("#c59b76", 0.8, 0));
        head.position.y = 2.05;
        head.castShadow = true;
        player.add(head);
        for (const side of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.62, 6), material("#e0e3da", 0.82, 0));
          leg.position.set(side * 0.22, 0.43, 0.02);
          player.add(leg);
        }
        const number = new THREE.Mesh(new THREE.PlaneGeometry(0.47, 0.52), new THREE.MeshBasicMaterial({ map: labelTexture(String(marker.number), "#f0f1e5"), transparent: true, side: THREE.DoubleSide, toneMapped: false }));
        number.position.set(0, 1.2, -0.52);
        number.rotation.y = Math.PI;
        player.add(number);
        scene.add(player);
        movingPlayers.push({ group: player, x: marker.x, z: marker.z, phase: index * 1.73 });
      }
    }
    const matchBall = mode === "match" ? new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 10), new THREE.MeshStandardMaterial({ color: "#f1f0df", roughness: 0.47, metalness: 0.02 })) : null;
    if (matchBall) {
      matchBall.position.set(0, 0.7, 0);
      matchBall.castShadow = true;
      scene.add(matchBall);
    }

    // The same compact dimensions carry through to the corners and upper decks.
    const terrace = material("#656d65", 0.83, 0.02);
    const chairShape = new THREE.Shape();
    chairShape.moveTo(-0.4, 0); chairShape.lineTo(0.4, 0); chairShape.lineTo(0.4, 0.12); chairShape.lineTo(0.31, 0.17); chairShape.lineTo(0.34, 0.4); chairShape.quadraticCurveTo(0.3, 0.52, 0, 0.52); chairShape.quadraticCurveTo(-0.3, 0.52, -0.34, 0.4); chairShape.lineTo(-0.31, 0.17); chairShape.lineTo(-0.4, 0.12); chairShape.closePath();
    const seatGeometry = new THREE.ExtrudeGeometry(chairShape, { depth: 0.1, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.015, bevelThickness: 0.015 });
    seatGeometry.translate(0, 0, -0.05);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.62, metalness: 0.015 });
    const cornerPrimary = new THREE.Color(club.colors[0]);
    const cornerSeatPalette = [cornerPrimary, cornerPrimary.clone().lerp(new THREE.Color("#e7eee1"), 0.2), cornerPrimary.clone().lerp(new THREE.Color(club.colors[1]), 0.28), cornerPrimary.clone().lerp(new THREE.Color("#c8a967"), 0.25)];
    const glass = new THREE.MeshPhysicalMaterial({ color: "#8fb6ad", roughness: 0.2, metalness: 0.12, transparent: true, opacity: 0.54, side: THREE.DoubleSide, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const standPickTargets: THREE.Group[] = [];
    const makeStand = (side: StandSide) => {
      const group = new THREE.Group();
      group.userData.standSide = side;
      standPickTargets.push(group);
      const design = getStandDesign(draft.standDesigns[side]);
      const structure = STAND_STRUCTURES[design.profile];
      const giantEnd = design.profile === "giant-end";
      const baseRows = defaultStandRows;
      const rows = giantEnd ? giantRows : Math.max(5, Math.round(baseRows * structure.rowFactor));
      const rowRun = structure.treadDepth;
      const rowRise = structure.riserHeight;
      const tierRun = rows * rowRun + (compactGround ? 2.5 : draft.capacity >= 30_000 ? 4.5 : 3.8);
      const tierRise = rows * rowRise + (compactGround ? 3.1 : draft.capacity <= 16_000 ? 3.8 : draft.capacity >= 30_000 ? 4.8 : 4.2);
      const roofType = draft.standRoofs?.[side] ?? draft.roof;
      const longSide = side === "north" || side === "south";
      const sign = side === "north" || side === "west" ? -1 : 1;
      const tierCount = Math.max(1, Math.min(4, tiers[side]));
      const baseSpan = longSide
        ? compactGround ? 108 : draft.capacity <= 16_000 ? 116 : draft.capacity >= 45_000 ? 140 : draft.capacity >= 30_000 ? 132 : 122
        : compactGround ? 70 : draft.capacity <= 16_000 ? 75 : draft.capacity >= 45_000 ? 88 : draft.capacity >= 30_000 ? 83 : 78;
      const span = baseSpan * structure.spanFactor;
      const halfSpan = span / 2;
      const startRadius = longSide ? 41.5 : 59.5;
      const facadeType = draft.standFacades[side];
      const glassFacade = facadeType === "Curtain glass";
      const openFacade = facadeType === "Open terrace";
      const shellColor = facadeType === "Brick & stone" ? "#755541" : facadeType === "Ribbed metal" ? "#667770" : facadeType === "Curtain glass" ? "#91aaa4" : openFacade ? "#798a78" : "#8b938a";
      const shell = material(shellColor, 0.75, 0.02);
      const façadeTint = facadeType === "Brick & stone" ? "#71503e" : facadeType === "Ribbed metal" ? "#4f625e" : facadeType === "Curtain glass" ? "#596761" : openFacade ? "#83917c" : "#777e78";
      // An open terrace still needs a solid seating bowl below its seats. Use a
      // concrete plinth there instead of leaving the seating deck floating.
      const facadeMaterial = buildStandFacadeMaterial(openFacade ? "Exposed concrete" : facadeType, façadeTint);
      const standPrimary = new THREE.Color(draft.standSeatColors[side]);
      const seatPalette = [standPrimary.clone().lerp(new THREE.Color("#f4f1dc"), 0.2), standPrimary.clone().lerp(new THREE.Color("#f4f1dc"), 0.43), standPrimary.clone().lerp(new THREE.Color(club.colors[1]), 0.45), standPrimary.clone().lerp(new THREE.Color("#d8bd75"), 0.34)];
      const seatMatrices: THREE.Matrix4[] = [];
      const seatColorIndices: number[] = [];
      const dummy = new THREE.Object3D();
      const seatYaw = side === "north" ? 0 : side === "south" ? Math.PI : side === "east" ? -Math.PI / 2 : Math.PI / 2;

      // A solid, tapered concrete substructure closes the space beneath each seating deck.
      // It follows the rake, so the stand reads as a constructed building from every orbit angle.
      for (let tier = 0; tier < tierCount; tier += 1) {
        const underDeck = new THREE.Shape();
        underDeck.moveTo(0, 0.45);
        underDeck.lineTo(0, 1.38);
        for (let row = 0; row < rows; row += 1) {
          const radial = row * rowRun;
          const y = 1.5 + tier * tierRise + row * rowRise;
          underDeck.lineTo(radial + rowRun * 0.72, y + 0.05);
          underDeck.lineTo(radial + rowRun, y + rowRise + 0.06);
        }
        underDeck.lineTo(rows * rowRun, 0.45);
        underDeck.closePath();
        const mass = new THREE.Mesh(new THREE.ExtrudeGeometry(underDeck, { depth: span - 2, bevelEnabled: false }), facadeMaterial);
        if (longSide) {
          mass.rotation.y = sign < 0 ? Math.PI / 2 : -Math.PI / 2;
          mass.position.set(sign < 0 ? -(span - 2) / 2 : (span - 2) / 2, 0, sign * (startRadius + tier * tierRun));
        } else {
          mass.scale.x = sign;
          mass.position.set(sign * (startRadius + tier * tierRun), 0, -(span - 2) / 2);
        }
        mass.castShadow = true;
        mass.receiveShadow = true;
        group.add(mass);
      }
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
            if (design.profile === "standing") addBox(span - 2, 0.16, 0.16, 0, y + 0.9, sign * (radial + rowRun - 0.12), "#d8b761", group, 0.38);
          } else {
            addBox(rowRun, 0.42, span, sign * centerRadial, y, 0, row % 2 ? terrace : shell, group);
            addBox(0.16, 0.2, span, sign * (radial + rowRun - 0.08), y - 0.31, 0, "#d2d1c3", group, 0.55);
            if (design.profile === "standing") addBox(0.16, 0.16, span - 2, sign * (radial + rowRun - 0.12), y + 0.9, 0, "#d8b761", group, 0.38);
          }
          if (draft.seats) {
            const seatSpacing = 0.94;
            const columns = Math.floor(span / seatSpacing);
            for (let column = 0; column < columns; column += 1) {
              const sectionPosition = column % 24;
              if (sectionPosition === 22 || sectionPosition === 23) continue;
              const along = -((columns - 1) * seatSpacing) / 2 + column * seatSpacing;
              const curved = Math.pow(along / halfSpan, 2) * structure.curve * 9;
              const seatRadial = radial + 0.46 + curved;
              dummy.position.set(longSide ? along : sign * seatRadial, y + 0.18, longSide ? sign * seatRadial : along);
              dummy.rotation.set(0, seatYaw, 0);
              dummy.scale.set(1.12, 1.18, 1);
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
      const facadeRadius = outerRadius + 1.8;
      const facadeHeight = Math.max(7, topY * 0.42);
      const addMasonryArches = () => {
        if (facadeType !== "Brick & stone") return;
        const bayCount = Math.max(4, Math.floor(span / 9));
        const stone = material("#c29a72", 0.78, 0.02);
        for (let bay = 0; bay < bayCount; bay += 1) {
          const along = -span / 2 + (bay + 0.5) * span / bayCount;
          const arch = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.15, 7, 20, Math.PI), stone);
          arch.position.set(longSide ? along : sign * (facadeRadius + 2.42), 3.55, longSide ? sign * (facadeRadius + 2.42) : along);
          if (!longSide) arch.rotation.y = Math.PI / 2;
          arch.castShadow = true;
          group.add(arch);
          addBox(longSide ? 0.26 : 0.18, 1.25, longSide ? 0.18 : 0.26, longSide ? along - 1.28 : sign * (facadeRadius + 2.42), 2.95, longSide ? sign * (facadeRadius + 2.42) : along - 1.28, stone, group, 0.2);
          addBox(longSide ? 0.26 : 0.18, 1.25, longSide ? 0.18 : 0.26, longSide ? along + 1.28 : sign * (facadeRadius + 2.42), 2.95, longSide ? sign * (facadeRadius + 2.42) : along + 1.28, stone, group, 0.2);
        }
      };
      addMasonryArches();
      if (longSide) {
        addBox(span + 4, openFacade ? 1.1 : 2.5, 4, 0, openFacade ? 0.55 : 1.25, sign * facadeRadius, façadeTint, group, 0.58);
        addBox(span + 4, 0.52, 4.4, 0, 2.7, sign * facadeRadius, "#a3aa9b", group, 0.6);
        const windowBandHeight = Math.max(2.2, facadeHeight - 4.2);
        if (glassFacade) {
          const glazedBand = new THREE.Mesh(new THREE.BoxGeometry(span - 1.5, windowBandHeight, 0.22), glass);
          glazedBand.position.set(0, 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.06));
          group.add(glazedBand);
          for (let mullion = -8; mullion <= 8; mullion += 1) addBox(0.32, windowBandHeight + 0.2, 0.34, mullion * (span / 17), 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.13), "#9ba99f", group, 0.42);
        } else if (openFacade) {
          const posts = Math.max(8, Math.floor(span / 5));
          for (let post = 0; post <= posts; post += 1) {
            const x = -span / 2 + post * span / posts;
            addBox(0.48, windowBandHeight + 0.4, 0.55, x, 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.2), "#d5d0bc", group, 0.62);
          }
          addBox(span, 0.28, 0.42, 0, 2.95, sign * (facadeRadius + 2.32), club.colors[0], group, 0.52);
        } else {
          addBox(span - 1.5, windowBandHeight, 0.28, 0, 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.06), facadeMaterial!, group, facadeType === "Brick & stone" ? 0.93 : 0.68);
          const ribs = facadeType === "Ribbed metal" ? 20 : facadeType === "Exposed concrete" ? 8 : 12;
          for (let rib = 0; rib <= ribs; rib += 1) {
            const x = -span / 2 + rib * (span / ribs);
            addBox(facadeType === "Ribbed metal" ? 0.27 : 0.46, windowBandHeight + 0.18, 0.42, x, 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.19), facadeType === "Brick & stone" ? "#98765d" : facadeType === "Ribbed metal" ? "#85928a" : "#999e96", group, 0.75);
          }
          for (let window = -3; window <= 3; window += 1) addBox(3.4, 1.15, 0.12, window * (span / 8), 4.4, sign * (facadeRadius + 2.34), "#b8c4ad", group, 0.42);
        }
        const pierCount = compactGround ? 5 : 8;
        for (let pier = 0; pier <= pierCount; pier += 1) {
          const x = -span / 2 + pier * span / pierCount;
          addBox(0.78, windowBandHeight + 0.55, 0.62, x, 2.8 + windowBandHeight / 2, sign * (facadeRadius + 2.32), facadeType === "Brick & stone" ? "#b38a67" : "#74857a", group, 0.56);
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
        addBox(4, openFacade ? 1.1 : 2.5, span + 4, sign * facadeRadius, openFacade ? 0.55 : 1.25, 0, façadeTint, group, 0.58);
        addBox(4.4, 0.52, span + 4, sign * facadeRadius, 2.7, 0, "#a3aa9b", group, 0.6);
        const windowBandHeight = Math.max(2.2, facadeHeight - 4.2);
        if (glassFacade) {
          const glazedBand = new THREE.Mesh(new THREE.BoxGeometry(0.22, windowBandHeight, span - 1.5), glass);
          glazedBand.position.set(sign * (facadeRadius + 2.06), 2.8 + windowBandHeight / 2, 0);
          group.add(glazedBand);
          for (let mullion = -5; mullion <= 5; mullion += 1) addBox(0.34, windowBandHeight + 0.2, 0.32, sign * (facadeRadius + 2.13), 2.8 + windowBandHeight / 2, mullion * (span / 11), "#9ba99f", group, 0.42);
        } else if (openFacade) {
          const posts = Math.max(6, Math.floor(span / 5));
          for (let post = 0; post <= posts; post += 1) {
            const z = -span / 2 + post * span / posts;
            addBox(0.55, windowBandHeight + 0.4, 0.48, sign * (facadeRadius + 2.2), 2.8 + windowBandHeight / 2, z, "#d5d0bc", group, 0.62);
          }
          addBox(0.42, 0.28, span, sign * (facadeRadius + 2.32), 2.95, 0, club.colors[0], group, 0.52);
        } else {
          addBox(0.28, windowBandHeight, span - 1.5, sign * (facadeRadius + 2.06), 2.8 + windowBandHeight / 2, 0, facadeMaterial!, group, facadeType === "Brick & stone" ? 0.93 : 0.68);
          const ribs = facadeType === "Ribbed metal" ? 13 : facadeType === "Exposed concrete" ? 6 : 8;
          for (let rib = 0; rib <= ribs; rib += 1) {
            const z = -span / 2 + rib * (span / ribs);
            addBox(0.42, windowBandHeight + 0.18, facadeType === "Ribbed metal" ? 0.27 : 0.46, sign * (facadeRadius + 2.19), 2.8 + windowBandHeight / 2, z, facadeType === "Brick & stone" ? "#b38a67" : facadeType === "Ribbed metal" ? "#85928a" : "#999e96", group, 0.75);
          }
          for (let window = -2; window <= 2; window += 1) addBox(0.12, 1.15, 3.4, sign * (facadeRadius + 2.34), 4.4, window * (span / 6), "#b8c4ad", group, 0.42);
        }
        const pierCount = compactGround ? 4 : 5;
        for (let pier = 0; pier <= pierCount; pier += 1) {
          const z = -span / 2 + pier * span / pierCount;
          addBox(0.62, windowBandHeight + 0.55, 0.78, sign * (facadeRadius + 2.32), 2.8 + windowBandHeight / 2, z, facadeType === "Brick & stone" ? "#b38a67" : "#74857a", group, 0.56);
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
      const faceX = longSide ? 0 : sign * (facadeRadius + 2.55);
      const faceZ = longSide ? sign * (facadeRadius + 2.55) : 0;
      const faceRotation = longSide ? side === "north" ? Math.PI : 0 : side === "west" ? -Math.PI / 2 : Math.PI / 2;
      const standName = draft.standNames[side]?.trim() || `${side[0].toUpperCase()}${side.slice(1)} Stand`;
      addLabel(standName.toUpperCase(), faceX, Math.max(5.8, Math.min(10, facadeHeight - 1)), faceZ, Math.min(span * 0.47, 46), 1.9, club.colors[0], faceRotation);
      const frontage = draft.standFrontages[side];
      if (frontage !== "None") {
        if (longSide) {
          const panelWidth = Math.min(span * 0.44, 30);
          addBox(panelWidth, 4.3, 0.5, 0, 4.5, sign * (facadeRadius + 2.38), frontage === "Club superstore" ? "#c6a35c" : frontage === "Restaurant" ? "#8b5b43" : "#637d69", group, 0.4);
          addBox(panelWidth + 1.4, 0.46, 0.9, 0, 6.9, sign * (facadeRadius + 2.48), club.colors[0], group, 0.38);
          addLabel(frontage.toUpperCase(), 0, 7.02, sign * (facadeRadius + 2.98), panelWidth * 0.84, 1.05, "#183027", side === "north" ? Math.PI : 0);
        } else {
          const panelWidth = Math.min(span * 0.44, 26);
          addBox(0.5, 4.3, panelWidth, sign * (facadeRadius + 2.38), 4.5, 0, frontage === "Club superstore" ? "#c6a35c" : frontage === "Restaurant" ? "#8b5b43" : "#637d69", group, 0.4);
          addBox(0.9, 0.46, panelWidth + 1.4, sign * (facadeRadius + 2.48), 6.9, 0, club.colors[0], group, 0.38);
          addLabel(frontage.toUpperCase(), sign * (facadeRadius + 2.98), 7.02, 0, panelWidth * 0.84, 1.05, "#183027", side === "west" ? -Math.PI / 2 : Math.PI / 2);
        }
      }
      if (giantEnd || design.profile === "modular" || design.profile === "truss" || design.profile === "ribbon") {
        const trussColor = giantEnd ? "#7b8d86" : design.profile === "modular" ? "#adb7a9" : club.colors[1];
        for (const edge of [-1, 1]) {
          const base = new THREE.Vector3(longSide ? edge * halfSpan : sign * (startRadius + rows * rowRun), 3, longSide ? sign * (startRadius + rows * rowRun) : edge * halfSpan);
          const top = new THREE.Vector3(longSide ? edge * halfSpan : sign * (outerRadius + 4), topY + 4, longSide ? sign * (outerRadius + 4) : edge * halfSpan);
          beam(base, top, giantEnd ? 0.85 : 0.45, trussColor, group);
          beam(new THREE.Vector3(base.x, top.y, base.z), new THREE.Vector3(top.x, base.y, top.z), giantEnd ? 0.45 : 0.28, trussColor, group);
        }
      }
      if (design.profile === "modular") {
        const moduleCount = Math.max(4, Math.floor(span / 18));
        for (let module = 0; module <= moduleCount; module += 1) {
          const along = -halfSpan + module * span / moduleCount;
          if (longSide) {
            beam(new THREE.Vector3(along, 1.2, sign * (outerRadius + 1.8)), new THREE.Vector3(along, topY + 2, sign * (outerRadius + 1.8)), 0.35, "#bec8b8", group);
            addBox(0.9, 0.45, 0.6, along, 1.15, sign * (outerRadius + 1.8), "#d4bd77", group, 0.3);
          } else {
            beam(new THREE.Vector3(sign * (outerRadius + 1.8), 1.2, along), new THREE.Vector3(sign * (outerRadius + 1.8), topY + 2, along), 0.35, "#bec8b8", group);
            addBox(0.6, 0.45, 0.9, sign * (outerRadius + 1.8), 1.15, along, "#d4bd77", group, 0.3);
          }
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

      if (roofType !== "Open sky" && mode !== "match") {
        // Cover the seating decks while leaving a clear central opening above the pitch.
        const lowestRoofTier = Math.max(0, tierCount - 2);
        const roofInner = Math.max(startRadius - 2, startRadius + lowestRoofTier * tierRun - 1.5);
        const roofOuter = outerRadius + Math.max(4.5, structure.overhang);
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
              const wave = roofType === "Wave canopy" || design.profile === "asymmetric" ? Math.sin(t * Math.PI * 2 + r * 1.4) * (1.2 + structure.curve * 5) : 0;
              const arch = roofType === "Continuous bowl" || design.profile === "crescent" || design.profile === "bowl" ? Math.sin(r * Math.PI) * (1.8 + structure.curve * 5) : 0;
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
      if (side === "north" && draft.scoreboardLevel > 0) {
        const screenWidth = 13 + Math.min(5, draft.scoreboardLevel * 0.45);
        const screenHeight = 6 + Math.min(2.5, draft.scoreboardLevel * 0.24);
        const screenY = topY + 6.1;
        const screenZ = sign * (outerRadius + structure.overhang + 6.5);
        const attachmentZ = sign * (outerRadius + 2.1);
        const anchorY = Math.max(facadeHeight + 1.2, topY - 3.4);
        addBox(screenWidth + 1.1, screenHeight + 0.9, 1.25, 0, screenY, screenZ, "#252d2a", group, 0.42);
        for (const postX of [-screenWidth * 0.45, screenWidth * 0.45]) {
          beam(new THREE.Vector3(postX, anchorY, attachmentZ), new THREE.Vector3(postX, screenY - screenHeight * 0.44, screenZ), 0.72, "#788880", group);
          beam(new THREE.Vector3(postX, topY + 1.4, attachmentZ), new THREE.Vector3(postX, screenY + screenHeight * 0.45, screenZ), 0.42, club.colors[1], group);
          addBox(1.1, 0.55, 1.5, postX, anchorY, attachmentZ, "#68766e", group, 0.48);
        }
        addBox(screenWidth + 2, 0.46, 1.8, 0, screenY - screenHeight * 0.53, screenZ, club.colors[0], group, 0.42);
        const screenMap = labelTexture(`${club.shortName} · ${draft.scoreboardLevel} HD`, "#10231c");
        const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(screenWidth, screenHeight), new THREE.MeshBasicMaterial({ map: screenMap, side: THREE.DoubleSide, toneMapped: false }));
        screenFace.position.set(0, screenY, screenZ + sign * 0.68);
        if (sign < 0) screenFace.rotation.y = Math.PI;
        group.add(screenFace);
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
              cornerColors.push(cornerSeatPalette[(Math.floor(seat / 8) + tier + (row % 3 === 0 ? 1 : 0)) % cornerSeatPalette.length]);
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
    const createBuilding = (name: string, x: number, z: number, width: number, depth: number, floors: number, color: string, photoCell: [number, number], style = "modern glass") => {
      const group = new THREE.Group();
      const floorHeight = 3.2;
      const glassFront = /glass|atrium|interchange|market hall|performance|learning/i.test(style);
      const brickFront = /brick|heritage|clubhouse|archive|lodge/i.test(style);
      const openFront = /garden|courtyard|street food|covered terrace|plaza/i.test(style);
      const wallColor = glassFront ? "#607e78" : brickFront ? "#75543f" : color;
      const trimColor = brickFront ? "#d0ae79" : club.colors[0];
      for (let floor = 0; floor < floors; floor += 1) {
        const floorY = floorHeight / 2 + floor * floorHeight;
        const facadeWidth = openFront && floor === 0 ? width * 0.72 : width;
        addBox(facadeWidth, floorHeight, depth, x, floorY, z, floor % 2 ? "#394b45" : wallColor, group, brickFront ? 0.88 : 0.5);
        addBox(width + 0.18, 0.24, 0.28, x, floor * floorHeight + 0.28, z - depth / 2 - 0.13, trimColor, group, 0.42);
        const windowCount = Math.max(3, Math.floor(width / 3.6));
        const windowWidth = Math.min(2.7, width / (windowCount + 1) * 0.7);
        for (let window = 0; window < windowCount; window += 1) {
          const windowX = x - width / 2 + (window + 1) * (width / (windowCount + 1));
          const glassColor = glassFront ? "#b1d0ca" : brickFront ? "#d6d8b8" : "#b0c2a9";
          addBox(windowWidth, glassFront ? 2.12 : 1.62, 0.2, windowX, floorY + 0.18, z - depth / 2 - 0.18, glassColor, group, glassFront ? 0.22 : 0.32);
          addBox(0.12, 2.35, 0.24, windowX, floorY + 0.18, z - depth / 2 - 0.2, trimColor, group, 0.5);
        }
        for (const side of [-1, 1]) {
          addBox(0.2, 1.45, Math.min(2.5, depth / 5), x + side * (width / 2 + 0.12), floorY + 0.1, z, glassFront ? "#9ebcb5" : "#aeb8a4", group, 0.4);
        }
      }
      if (brickFront) {
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-width / 2 - 0.7, 0); roofShape.lineTo(0, Math.max(2.2, width * 0.11)); roofShape.lineTo(width / 2 + 0.7, 0); roofShape.lineTo(width / 2 + 0.7, -0.45); roofShape.lineTo(-width / 2 - 0.7, -0.45); roofShape.closePath();
        const roofMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: depth + 1.4, bevelEnabled: false }), material(style.includes("Heritage") || style.includes("brick") ? "#55493b" : trimColor, 0.84, 0.08));
        roofMesh.position.set(x, floors * floorHeight + 0.85, z - depth / 2 - 0.7); roofMesh.castShadow = true; group.add(roofMesh);
      } else {
        addBox(width + 1.4, 0.82, depth + 1.4, x, floors * floorHeight + 0.4, z, trimColor, group, 0.46);
        if (glassFront || /performance|learning/i.test(style)) {
          for (const beamX of [-1, 1]) {
            const canopySupport = addBox(0.24, 1.8, 0.24, x + beamX * width * 0.34, floors * floorHeight + 1.15, z - depth / 2 - 1.4, "#c8d6c8", group, 0.42);
            canopySupport.rotation.z = beamX * -0.08;
          }
          addBox(width * 0.86, 0.24, 3.1, x, floors * floorHeight + 2, z - depth / 2 - 1.1, glassFront ? "#7ea39a" : club.colors[0], group, 0.38);
        }
      }
      if (openFront) {
        for (const side of [-1, 1]) addBox(0.48, 3, 0.48, x + side * width * 0.38, 1.7, z - depth / 2 - 0.7, "#d1c2a1", group, 0.52);
        addBox(width + 2, 0.3, 4.2, x, 3.4, z - depth / 2 - 1.6, trimColor, group, 0.38);
      }
      addBox(Math.min(6, width * 0.24), 2.2, 0.34, x, 1.3, z - depth / 2 - 0.28, "#18241e", group, 0.32);
      addBox(width * 0.52, 0.48, 2.2, x, 3.15, z - depth / 2 - 1.1, glassFront ? "#a5c8c0" : trimColor, group, 0.35);
      const nameBoard = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.84, Math.min(2, width * 0.1)), new THREE.MeshBasicMaterial({ map: labelTexture(name, club.colors[0]), side: THREE.DoubleSide }));
      nameBoard.position.set(x, floors * floorHeight + 1.05, z - depth / 2 - 0.55);
      group.add(nameBoard);
      for (let column = -1; column <= 1; column += 1) {
        const planterX = x + column * Math.min(5.2, width * 0.2);
        addBox(Math.min(3.6, width * 0.16), 0.72, 1.05, planterX, 0.42, z - depth / 2 - 2.7, "#48513a", group, 0.88);
        const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), material("#648254"));
        shrub.position.set(planterX, 1.05, z - depth / 2 - 2.7);
        shrub.castShadow = true;
        group.add(shrub);
      }
      const photoSize = Math.max(6, Math.min(13, width * 0.72, floors * floorHeight * 0.78));
      const photoY = floors * floorHeight * 0.62;
      addFacilityPhoto(group, x, photoY, z + depth / 2 + 0.06, photoSize, photoCell);
      scene.add(group);
    };
    const createParkingGarage = (name: string, x: number, z: number, width: number, depth: number, floors: number) => {
      const group = new THREE.Group();
      const levelHeight = 3.5;
      const posts = Math.max(3, Math.floor(width / 10));
      for (let floor = 0; floor < floors; floor += 1) {
        const deckY = 0.4 + floor * levelHeight;
        addBox(width, 0.5, depth, x, deckY, z, floor % 2 ? "#9b9f91" : "#858d80", group, 0.82);
        for (let post = 0; post <= posts; post += 1) {
          const postX = x - width / 2 + post * (width / posts);
          for (const side of [-1, 1]) addBox(0.55, levelHeight, 0.55, postX, deckY + levelHeight / 2, z + side * (depth / 2 - 0.6), "#d1cec0", group, 0.55);
        }
        for (let rail = 0; rail < posts; rail += 1) {
          const railX = x - width / 2 + (rail + 0.5) * (width / posts);
          addBox(width / posts - 0.35, 0.55, 0.2, railX, deckY + 0.56, z - depth / 2 + 0.4, "#c6c7b6", group, 0.48);
          addBox(width / posts - 0.35, 0.55, 0.2, railX, deckY + 0.56, z + depth / 2 - 0.4, "#c6c7b6", group, 0.48);
        }
      }
      const rampFrom = new THREE.Vector3(x - width * 0.32, 0.55, z + depth * 0.25);
      const rampTo = new THREE.Vector3(x + width * 0.32, 0.55 + (floors - 1) * levelHeight, z + depth * 0.25);
      beam(rampFrom, rampTo, 0.7, "#b8b9aa", group);
      addBox(width * 0.62, 1.3, 0.5, x, floors * levelHeight + 0.2, z - depth / 2 - 0.32, club.colors[0], group, 0.38);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.57, 1.05), new THREE.MeshBasicMaterial({ map: labelTexture(name, club.colors[0]), side: THREE.DoubleSide }));
      sign.position.set(x, floors * levelHeight + 0.2, z - depth / 2 - 0.62);
      group.add(sign);
      scene.add(group);
    };
    const facilityIndex: Record<StadiumFacilityKey, number> = { carPark: 6, superstore: 0, restaurant: 1, hotel: 2, fanZone: 3, museum: 4, transportHub: 5, trainingGround: 7, trainingPitches: 8, academy: 9, youthStadium: 10 };
    const facilityPosition = (key: StadiumFacilityKey, width = 24, depth = 18) => {
      const location = draft.facilityPlan[key].location;
      const index = facilityIndex[key] - 3;
      const edgeX = Math.min(siteInnerX + 36, campusWidth / 2 - width / 2 - 8);
      const edgeZ = Math.min(siteInnerZ + 36, campusDepth / 2 - depth / 2 - 8);
      const northSouthOffset = THREE.MathUtils.clamp(index * 26, -edgeX, edgeX);
      const eastWestOffset = THREE.MathUtils.clamp(index * 22, -edgeZ, edgeZ);
      const defaultPosition = location === "north" ? { x: northSouthOffset, z: -edgeZ } : location === "south" ? { x: northSouthOffset, z: edgeZ } : location === "east" ? { x: edgeX, z: eastWestOffset } : { x: -edgeX, z: eastWestOffset };
      const saved = draft.facilityPlan[key].position;
      let x = THREE.MathUtils.clamp(saved?.x ?? defaultPosition.x, -campusWidth / 2 + width / 2 + 5, campusWidth / 2 - width / 2 - 5);
      let z = THREE.MathUtils.clamp(saved?.z ?? defaultPosition.z, -campusDepth / 2 + depth / 2 + 5, campusDepth / 2 - depth / 2 - 5);
      if (Math.abs(x) < siteInnerX && Math.abs(z) < siteInnerZ) {
        const toX = siteInnerX - Math.abs(x);
        const toZ = siteInnerZ - Math.abs(z);
        if (toX < toZ) x = Math.sign(x || 1) * Math.min(campusWidth / 2 - width / 2 - 5, siteInnerX + width / 2 + 8);
        else z = Math.sign(z || 1) * Math.min(campusDepth / 2 - depth / 2 - 5, siteInnerZ + depth / 2 + 8);
      }
      return { x, z };
    };
    const addAccessPath = (x: number, z: number, width = 5.5) => {
      const fromX = THREE.MathUtils.clamp(x, -siteInnerX - 24, siteInnerX + 24);
      const fromZ = THREE.MathUtils.clamp(z, -siteInnerZ - 24, siteInnerZ + 24);
      const dx = x - fromX;
      const dz = z - fromZ;
      const length = Math.hypot(dx, dz);
      if (length < 3) return;
      const route = addBox(length, 0.12, width, (x + fromX) / 2, -0.035, (z + fromZ) / 2, roadLevel >= 2 ? "#454b47" : "#bab7a6", scene, 0.96);
      route.rotation.y = -Math.atan2(dz, dx);
      route.receiveShadow = true;
      if (roadLevel >= 2) addBox(0.12, 0.035, 2.2, (x + fromX) / 2, 0.035, (z + fromZ) / 2, "#e2d7ad", scene, 0.84);
    };
    const facilitySizeScale = (key: StadiumFacilityKey) => facilitySizeFactor(draft.facilityPlan[key].size);
    const facilityFloors = (key: StadiumFacilityKey, base: number, level: number) => Math.max(1, Math.min(7, base + Math.floor(level / 2) + (draft.facilityPlan[key].size === "Flagship" ? 1 : 0)));
    const amenityScale = THREE.MathUtils.clamp(contextScale, 0.78, 1);
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
    const buildingSpecs: { key: StadiumFacilityKey; level: number; name: string; width: number; depth: number; floors: number; color: string; photo: [number, number] }[] = [
      { key: "superstore", level: draft.superstoreLevel, name: "CLUB SUPERSTORE", width: 20, depth: 14, floors: 2, color: "#9c7652", photo: [0, 0] },
      { key: "restaurant", level: draft.restaurantLevel, name: "MATCHDAY DINING", width: 21, depth: 15, floors: 2, color: "#98754c", photo: [2, 0] },
      { key: "hotel", level: draft.hotelLevel, name: "THE CLUB HOTEL", width: 25, depth: 16, floors: 4, color: "#839a9c", photo: [0, 1] },
      { key: "fanZone", level: draft.fanZoneLevel, name: "SUPPORTERS’ FAN ZONE", width: 23, depth: 15, floors: 1, color: "#879268", photo: [2, 1] },
      { key: "museum", level: draft.museumLevel, name: "CLUB MUSEUM", width: 21, depth: 13, floors: 2, color: "#99714e", photo: [1, 1] },
      { key: "transportHub", level: draft.transportHubLevel, name: "RAIL · COACH · WALK", width: 23, depth: 14, floors: 1, color: "#8d9b88", photo: [1, 0] },
      { key: "trainingGround", level: draft.trainingCentreLevel, name: "PERFORMANCE CENTRE", width: 30, depth: 20, floors: 2, color: "#637f72", photo: [0, 0] },
      { key: "trainingPitches", level: draft.trainingPitchesLevel, name: "TRAINING PITCHES", width: 68, depth: 47, floors: 0, color: "#4f7d4c", photo: [2, 1] },
      { key: "academy", level: draft.academyCampusLevel, name: "ACADEMY CAMPUS", width: 26, depth: 18, floors: 2, color: "#a17b52", photo: [1, 1] },
      { key: "youthStadium", level: draft.youthStadiumLevel, name: "YOUTH STADIUM", width: 58, depth: 44, floors: 0, color: "#506b56", photo: [2, 1] },
    ];
    const createTrainingPitches = (x: number, z: number, width: number, depth: number, style: string, level: number) => {
      const base = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material("#b1aa91", 0.98, 0));
      base.rotation.x = -Math.PI / 2; base.position.set(x, -0.02, z); base.receiveShadow = true; scene.add(base);
      const count = width > 95 ? 3 : width > 65 || level > 1 ? 2 : 1;
      const gap = Math.min(4, width * 0.035);
      const fieldWidth = (width * 0.9 - gap * (count - 1)) / count;
      const fieldDepth = depth * 0.82;
      const surface = /all-weather/i.test(style) ? "#286545" : /hybrid/i.test(style) ? "#38734d" : "#4d8550";
      for (let field = 0; field < count; field += 1) {
        const fieldX = x - ((count - 1) * (fieldWidth + gap)) / 2 + field * (fieldWidth + gap);
        const pitchMesh = new THREE.Mesh(new THREE.PlaneGeometry(fieldWidth, fieldDepth), material(surface, 0.94, /all-weather/i.test(style) ? 0.025 : 0));
        pitchMesh.rotation.x = -Math.PI / 2; pitchMesh.position.set(fieldX, 0.055, z); pitchMesh.receiveShadow = true; scene.add(pitchMesh);
        const stripes = 8;
        for (let strip = 0; strip < stripes; strip += 1) if (strip % 2 === 0) addBox(fieldWidth / stripes, 0.018, fieldDepth - 0.3, fieldX - fieldWidth / 2 + (strip + 0.5) * fieldWidth / stripes, 0.072, z, "#74a96c", scene, 0.98);
        const line = (lineWidth: number, lineDepth: number, lx: number, lz: number) => addBox(lineWidth, 0.026, lineDepth, lx, 0.09, lz, "#e8edcf", scene, 0.66);
        line(fieldWidth - 1, 0.16, fieldX, z - fieldDepth / 2); line(fieldWidth - 1, 0.16, fieldX, z + fieldDepth / 2);
        line(0.16, fieldDepth, fieldX - fieldWidth / 2, z); line(0.16, fieldDepth, fieldX + fieldWidth / 2, z);
        line(fieldWidth - 1, 0.12, fieldX, z);
        const circle = new THREE.Mesh(new THREE.TorusGeometry(Math.min(fieldDepth * 0.095, fieldWidth * 0.11), 0.07, 5, 36), material("#e8edcf"));
        circle.rotation.x = Math.PI / 2; circle.position.set(fieldX, 0.095, z); scene.add(circle);
        const goalWidth = Math.min(4, fieldWidth * 0.13);
        for (const end of [-1, 1]) {
          const goalZ = z + end * (fieldDepth / 2 - 0.25);
          for (const post of [-1, 1]) addBox(0.1, 1.9, 0.1, fieldX + post * goalWidth / 2, 1.0, goalZ, "#eef0dd", scene, 0.5);
          addBox(goalWidth, 0.1, 0.1, fieldX, 1.9, goalZ, "#eef0dd", scene, 0.5);
        }
        for (const side of [-1, 1]) for (let post = 0; post <= 8; post += 1) addBox(0.16, 2.1, 0.16, fieldX + side * (fieldWidth / 2 + 0.8), 1.05, z - fieldDepth / 2 + post * fieldDepth / 8, "#71857a", scene, 0.65);
      }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(width * 0.42, 27), 2.8), new THREE.MeshBasicMaterial({ map: labelTexture("TRAINING CAMPUS", club.colors[0]), side: THREE.DoubleSide }));
      sign.position.set(x, 2.4, z - depth / 2 - 1.8); scene.add(sign);
    };
    const createYouthStadium = (x: number, z: number, width: number, depth: number, style: string, level: number) => {
      const pitchWidth = width * 0.68;
      const pitchDepth = depth * 0.68;
      const pitchMesh = new THREE.Mesh(new THREE.PlaneGeometry(pitchWidth, pitchDepth), material("#4d8050", 0.94, 0));
      pitchMesh.rotation.x = -Math.PI / 2; pitchMesh.position.set(x, 0.1, z); pitchMesh.receiveShadow = true; scene.add(pitchMesh);
      for (let strip = 0; strip < 8; strip += 1) if (strip % 2 === 0) addBox(pitchWidth / 8, 0.02, pitchDepth - 0.3, x - pitchWidth / 2 + (strip + 0.5) * pitchWidth / 8, 0.12, z, "#73a669", scene, 0.96);
      const boundary = (w: number, d: number, bx: number, bz: number) => addBox(w, 0.035, d, bx, 0.145, bz, "#e8edcf", scene, 0.6);
      boundary(pitchWidth, 0.14, x, z - pitchDepth / 2); boundary(pitchWidth, 0.14, x, z + pitchDepth / 2); boundary(0.14, pitchDepth, x - pitchWidth / 2, z); boundary(0.14, pitchDepth, x + pitchWidth / 2, z); boundary(pitchWidth, 0.1, x, z);
      for (const side of [-1, 1]) {
        const endStand = side < 0 && /community bowl/i.test(style);
        const standWidth = endStand ? pitchWidth * 0.48 : width * 0.82;
        const standDepth = Math.max(4, depth * 0.14);
        const standZ = z + side * (depth / 2 - standDepth / 2);
        const standColor = side < 0 ? club.colors[0] : "#6d7770";
        const rows = Math.min(7, 3 + level);
        for (let row = 0; row < rows; row += 1) {
          const rowWidth = standWidth - row * 1.1;
          addBox(rowWidth, 0.75, 1.15, x, 0.75 + row * 0.8, standZ + side * row * 0.32, row % 2 ? "#68736c" : standColor, scene, 0.77);
          for (let seat = 0; seat < Math.floor(rowWidth / 1.7); seat += 1) addBox(0.56, 0.25, 0.62, x - rowWidth / 2 + 0.9 + seat * ((rowWidth - 1.8) / Math.max(1, Math.floor(rowWidth / 1.7) - 1)), 1.2 + row * 0.8, standZ + side * row * 0.32, club.colors[0], scene, 0.55);
        }
        if (!/open/i.test(style)) addBox(standWidth + 3, 0.7, standDepth + 5, x, 4.9 + rows * 0.8, standZ - side * 0.2, /covered|arena/i.test(style) ? club.colors[0] : "#d9d8cb", scene, 0.44);
        for (let post = -1; post <= 1; post += 2) addBox(0.4, 5.2, 0.4, x + post * (standWidth / 2 + 1), 2.6, standZ, "#6d7b70", scene, 0.65);
      }
      addBox(width + 3, 0.14, depth + 3, x, 0, z, "#968f7a", scene, 0.94);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.52, 2.1), new THREE.MeshBasicMaterial({ map: labelTexture("ACADEMY MATCHDAY", club.colors[0]), side: THREE.DoubleSide }));
      sign.position.set(x, 1.9, z - depth / 2 - 1.9); scene.add(sign);
    };
    const occupiedFacilitySites: FacilitySiteFootprint[] = [];
    const footprintFor = (key: StadiumFacilityKey): Omit<FacilitySiteFootprint, "x" | "z" | "key"> => {
      if (key === "carPark") {
        const scale = amenityScale * facilitySizeScale("carPark");
        const officialParking = draft.capacity >= 18_000;
        return { width: (officialParking ? 48 : 32) * scale + draft.carParkLevel * 2.5, depth: (officialParking ? 34 : 24) * scale + draft.carParkLevel * 1.5 };
      }
      const spec = buildingSpecs.find((item) => item.key === key);
      if (!spec) return { width: 24 * amenityScale, depth: 18 * amenityScale };
      const scale = amenityScale * facilitySizeScale(key);
      return { width: (spec.width + spec.level * 1.5) * scale, depth: spec.depth * scale };
    };
    for (const asset of buildingSpecs) {
      if (asset.level <= 0) continue;
      const scale = amenityScale * facilitySizeScale(asset.key);
      const width = (asset.width + asset.level * 1.5) * scale;
      const depth = asset.depth * scale;
      const { x, z } = facilityPosition(asset.key, width, depth);
      occupiedFacilitySites.push({ key: asset.key, x, z, width, depth });
      addAccessPath(x, z, roadLevel >= 1 ? 5.5 : 3.6);
      if (asset.key === "trainingPitches") createTrainingPitches(x, z, width, depth, draft.facilityPlan[asset.key].style, asset.level);
      else if (asset.key === "youthStadium") createYouthStadium(x, z, width, depth, draft.facilityPlan[asset.key].style, asset.level);
      else createBuilding(asset.name, x, z, width, depth, facilityFloors(asset.key, asset.floors, asset.level), asset.color, asset.photo, draft.facilityPlan[asset.key].style);
    }
    if (draft.carParkLevel > 0) {
      const layout = draft.facilityPlan.carPark;
      const scale = amenityScale * facilitySizeScale("carPark");
      const officialParking = draft.capacity >= 18_000;
      const width = (officialParking ? 48 : 32) * scale + draft.carParkLevel * 2.5;
      const depth = (officialParking ? 34 : 24) * scale + draft.carParkLevel * 1.5;
      const { x, z } = facilityPosition("carPark", width, depth);
      occupiedFacilitySites.push({ key: "carPark", x, z, width, depth });
      addAccessPath(x, z, roadLevel >= 1 ? 7 : 4.4);
      const cars = Math.round((officialParking ? 18 : 8) * scale + draft.carParkLevel * 2);
      if (layout.style === "Open parking deck") {
        createParkingGarage(officialParking ? "OFFICIAL PARKING" : "VISITOR PARKING", x, z, width, depth, Math.max(1, Math.min(5, draft.carParkLevel + (layout.size === "Flagship" ? 1 : 0))));
      } else {
        const surface = layout.style === "Gravel terrace" ? "gravel" : "asphalt";
        createParkingLot(x, z, width, depth, surface, cars);
        if (layout.style === "Solar canopy") {
          for (let row = -1; row <= 1; row += 2) {
            const canopyZ = z + row * depth * 0.27;
            addBox(width * 0.88, 0.22, 6.2 * scale, x, 4.4 * scale, canopyZ, "#344b4b", scene, 0.28);
            for (const side of [-1, 1]) addBox(0.25, 4.3 * scale, 0.25, x + side * width * 0.42, 2.15 * scale, canopyZ, "#98a89c", scene, 0.58);
          }
        }
        addBox(Math.min(12, width * 0.32), 1.7, 0.5, x, 1, z - depth / 2 - 0.4, club.colors[0], scene, 0.34);
        const parkingSign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(10, width * 0.27), 1.3), new THREE.MeshBasicMaterial({ map: labelTexture(officialParking ? "OFFICIAL PARKING" : "GRAVEL PARKING", club.colors[0]), side: THREE.DoubleSide }));
        parkingSign.position.set(x, 1, z - depth / 2 - 0.7);
        scene.add(parkingSign);
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
    const siteSetting: StadiumSiteSetting = draft.siteSetting ?? "Suburban campus";
    const urbanSetting = ["Dense terraces", "Railway quarter", "Industrial fringe", "Market streets"].includes(siteSetting);
    for (let tree = 0; tree < (urbanSetting ? 10 : 24); tree += 1) {
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

    addStadiumContext(scene, club, siteSetting, siteInnerX, siteInnerZ, addTree, acquiredLand);
    for (const side of acquiredLand) {
      const { width, depth, centerX, centerZ } = getStadiumLandParcel(siteInnerX, siteInnerZ, side);
      const urbanParcel = ["Dense terraces", "Railway quarter", "Industrial fringe", "Market streets"].includes(siteSetting);
      addPlane(width - 8, depth - 8, centerX, 0.025, centerZ, urbanParcel ? "#7b7766" : "#687c62");
      addBox(width - 4, 0.38, 1.2, centerX, 0.05, centerZ - depth / 2 + 1.5, "#9e9d8d", scene, 0.96);
      addBox(width - 4, 0.38, 1.2, centerX, 0.05, centerZ + depth / 2 - 1.5, "#9e9d8d", scene, 0.96);
      addBox(1.2, 0.38, depth - 4, centerX - width / 2 + 1.5, 0.05, centerZ, "#9e9d8d", scene, 0.96);
      addBox(1.2, 0.38, depth - 4, centerX + width / 2 - 1.5, 0.05, centerZ, "#9e9d8d", scene, 0.96);
      const postMaterial = material("#59645e", 0.6, 0.42);
      const railMaterial = material("#77827a", 0.52, 0.5);
      const postCount = 7;
      for (let index = 0; index <= postCount; index += 1) {
        const t = -0.5 + index / postCount;
        if (side === "north" || side === "south") {
          for (const edge of [-1, 1]) {
            const fenceZ = centerZ + edge * (depth / 2 - 2.2);
            if (edge === (side === "north" ? 1 : -1) && Math.abs(t) < 0.12) continue;
            const postX = centerX + t * (width - 6);
            addBox(0.34, 2.1, 0.34, postX, 1.05, fenceZ, postMaterial, scene, 0.54);
          }
          for (const edge of [-1, 1]) {
            const fenceX = centerX + edge * (width / 2 - 2.2);
            addBox(0.3, 1.7, 0.3, fenceX, 0.85, centerZ + t * (depth - 6), postMaterial, scene, 0.55);
          }
        } else {
          for (const edge of [-1, 1]) {
            const fenceX = centerX + edge * (width / 2 - 2.2);
            if (edge === (side === "east" ? -1 : 1) && Math.abs(t) < 0.12) continue;
            const postZ = centerZ + t * (depth - 6);
            addBox(0.34, 2.1, 0.34, fenceX, 1.05, postZ, postMaterial, scene, 0.54);
          }
          for (const edge of [-1, 1]) {
            const fenceZ = centerZ + edge * (depth / 2 - 2.2);
            addBox(0.3, 1.7, 0.3, centerX + t * (width - 6), 0.85, fenceZ, postMaterial, scene, 0.55);
          }
        }
      }
      const railSections = 14;
      for (const edge of [-1, 1]) {
        for (let segment = 0; segment < railSections; segment += 1) {
          const t = -0.5 + (segment + 0.5) / railSections;
          const horizontalGate = (side === "north" && edge === 1) || (side === "south" && edge === -1);
          if (!(horizontalGate && Math.abs(t) < 0.08)) {
            const horizontalSpan = (width - 6) / railSections - 0.6;
            const fenceZ = centerZ + edge * (depth / 2 - 2.2);
            const fenceX = centerX + t * (width - 6);
            addBox(horizontalSpan, 0.16, 0.16, fenceX, 0.82, fenceZ, railMaterial, scene, 0.52);
            addBox(horizontalSpan, 0.14, 0.14, fenceX, 1.52, fenceZ, railMaterial, scene, 0.52);
          }
          const verticalGate = (side === "east" && edge === -1) || (side === "west" && edge === 1);
          if (!(verticalGate && Math.abs(t) < 0.08)) {
            const verticalSpan = (depth - 6) / railSections - 0.6;
            const fenceX = centerX + edge * (width / 2 - 2.2);
            const fenceZ = centerZ + t * (depth - 6);
            addBox(0.16, 0.16, verticalSpan, fenceX, 0.82, fenceZ, railMaterial, scene, 0.52);
            addBox(0.14, 0.14, verticalSpan, fenceX, 1.52, fenceZ, railMaterial, scene, 0.52);
          }
        }
      }
      if (side === "north" || side === "south") {
        const innerEdge = side === "north" ? centerZ + depth / 2 : centerZ - depth / 2;
        const connection = side === "north" ? -(siteInnerZ + 28) : siteInnerZ + 28;
        const pathLength = Math.abs(innerEdge - connection);
        addBox(7.2, 0.13, pathLength, centerX, -0.045, (innerEdge + connection) / 2, (draft.siteRoadLevel ?? 0) >= 1 ? "#454b47" : "#aaa897", scene, 0.94);
      } else {
        const innerEdge = side === "east" ? centerX - width / 2 : centerX + width / 2;
        const connection = side === "east" ? siteInnerX + 28 : -(siteInnerX + 28);
        const pathLength = Math.abs(innerEdge - connection);
        addBox(pathLength, 0.13, 7.2, (innerEdge + connection) / 2, -0.045, centerZ, (draft.siteRoadLevel ?? 0) >= 1 ? "#454b47" : "#aaa897", scene, 0.94);
      }
      const signX = side === "east" ? centerX - width / 2 - 0.6 : side === "west" ? centerX + width / 2 + 0.6 : centerX;
      const signZ = side === "north" ? centerZ + depth / 2 + 0.6 : side === "south" ? centerZ - depth / 2 - 0.6 : centerZ;
      const signRotation = side === "north" ? 0 : side === "south" ? Math.PI : side === "east" ? -Math.PI / 2 : Math.PI / 2;
      addLabel(`CLUB LAND · ${side.toUpperCase()}`, signX, 2.8, signZ, 26, 2.8, club.colors[0], signRotation);
      for (const [xOffset, zOffset] of [[-width * 0.28, -depth * 0.23], [width * 0.28, -depth * 0.23], [-width * 0.28, depth * 0.23], [width * 0.28, depth * 0.23]] as const) {
        addBox(0.55, 0.8, 0.55, centerX + xOffset, 0.45, centerZ + zOffset, "#d7bf7b", scene, 0.48);
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
    controls.minDistance = mode === "match" ? 78 : 145;
    controls.maxDistance = mode === "match" ? 430 : 1450;
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
      if (mode === "match") return;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const placing = placementFacilityRef.current;
      if (placing) {
        const ground = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
        if (ground) {
          const footprint = footprintFor(placing);
          const xLimit = Math.max(0, campusWidth / 2 - footprint.width / 2 - 8);
          const zLimit = Math.max(0, campusDepth / 2 - footprint.depth / 2 - 8);
          let x = THREE.MathUtils.clamp(ground.x, -xLimit, xLimit);
          let z = THREE.MathUtils.clamp(ground.z, -zLimit, zLimit);
          if (Math.abs(x) < siteInnerX && Math.abs(z) < siteInnerZ) {
            const toX = siteInnerX - Math.abs(x);
            const toZ = siteInnerZ - Math.abs(z);
            if (toX < toZ) x = Math.sign(x || 1) * Math.min(xLimit, siteInnerX + 34);
            else z = Math.sign(z || 1) * Math.min(zLimit, siteInnerZ + 30);
          }
          if (!campusPlotIsOwned(x, z, footprint.width, footprint.depth, siteInnerX, siteInnerZ, draft.acquiredLand ?? [])) {
            setPlacementNotice("That plot is outside club land. Acquire the neighboring parcel under Upgrade → Land & plots first.");
            return;
          }
          if (facilitySiteHasCollision({ key: placing, x, z, ...footprint }, occupiedFacilitySites)) {
            setPlacementNotice("That plot overlaps another facility. Click a clear space around the stadium.");
            return;
          }
          setPlacementNotice("");
          placeFacilityRef.current(placing, { x: Math.round(x), z: Math.round(z) });
        }
        return;
      }
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
    renderer.domElement.style.cursor = placementFacility ? "crosshair" : "grab";
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
      if (matchBall) {
        const time = performance.now() / 1000 + matchMinuteRef.current * 0.035;
        matchBall.position.set(Math.sin(time * 0.47) * 37, 0.62 + Math.abs(Math.sin(time * 1.8)) * 0.12, Math.cos(time * 0.31) * 23);
        movingPlayers.forEach((player) => {
          const timeOffset = time + player.phase;
          player.group.position.x = player.x + Math.sin(timeOffset * 0.72) * 2.8;
          player.group.position.z = player.z + Math.cos(timeOffset * 0.58) * 2.2;
          player.group.rotation.y = Math.sin(timeOffset * 0.32) * 0.18;
        });
      }
      controls.update();
      renderer.render(scene, camera);
    };
    renderFrame();

    return () => {
      sceneDisposed = true;
      cameraPositionRef.current = cameraLayoutSignatureRef.current === sceneCameraSignature
        ? camera.position.toArray() as [number, number, number]
        : null;
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
      skyTexture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [club, draft, matchPlayers, mode, preset, viewLayoutSignature]);

  useEffect(() => {
    for (const side of ["north", "east", "south", "west"] as const) {
      const indicator = selectionIndicatorsRef.current[side];
      if (indicator) indicator.visible = selectedStand === side;
    }
  }, [selectedStand]);

  useEffect(() => {
    const canvas = stageRef.current?.querySelector("canvas");
    if (canvas) canvas.style.cursor = placementFacility ? "crosshair" : "grab";
    setPlacementNotice("");
  }, [placementFacility]);

  const resetView = (next: ViewPreset) => {
    setPreset(next);
    const groundScale = Math.sqrt(THREE.MathUtils.clamp(draft.capacity / 24_600, 0.42, 1.8));
    const cameraScale = 0.72 + groundScale * 0.28;
    const campusExpansionScale = mode === "facilities" ? 1 + Math.min(0.75, (draft.acquiredLand?.length ?? 0) * 0.22) : 1;
    const position = CAMERA[next].map((coordinate) => coordinate * cameraScale * campusExpansionScale) as [number, number, number];
    cameraPositionRef.current = position;
    const controls = controlsRef.current;
    if (controls) {
      controls.object.position.set(...position);
      controls.target.set(0, 8, 0);
      controls.update();
    }
  };

  return <div className={`stadium-scene-shell ${placementFacility ? "facility-placement-mode" : ""} ${mode === "match" ? "stadium-scene-match-mode" : ""}`}>
    <div className="stadium-scene-stage" ref={stageRef} />
    {webglUnavailable && <div className="stadium-webgl-fallback" role="status"><strong>3D preview unavailable in this browser</strong><span>The stadium plan is ready. Try enabling hardware acceleration to orbit the 3D ground.</span></div>}
    {mode === "match" ? <><div className="match-stadium-live-tag"><span /> LIVE MATCH · {matchMinute >= 90 ? "90′" : `${matchMinute}′`}</div><div className="stadium-scene-tip"><span>DRAG TO ORBIT</span><i /> SCROLL TO ZOOM</div></> : <>
      {placementFacility && <div className="stadium-placement-prompt" role="status"><strong>PLACING {placementFacility.replace(/([A-Z])/g, " $1").toUpperCase()}</strong><span>{placementNotice || "Click an open area around the stadium to set its position"}</span></div>}
      <div className="stadium-scene-toolbar" role="group" aria-label="Stadium camera views">{(["Aerial", "Campus", "Broadcast", "Pitch"] as const).map((view) => <button type="button" key={view} aria-pressed={preset === view} className={preset === view ? "active" : ""} onClick={() => resetView(view)}>{view}</button>)}</div>
      <div className="stadium-scene-tip"><span>DRAG TO SPIN 360°</span><i /> SCROLL TO ZOOM</div>
    </>}
  </div>;
}
