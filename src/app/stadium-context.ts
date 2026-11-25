import * as THREE from "three";
import type { StadiumLandSide } from "@/lib/stadium-facilities";
import type { StadiumSiteSetting } from "@/lib/game";

type ContextClub = { id: string; city: string; colors: [string, string] };

export function addStadiumContext(
  scene: THREE.Scene,
  club: ContextClub,
  setting: StadiumSiteSetting,
  siteInnerX: number,
  siteInnerZ: number,
  addTree: (x: number, z: number, scale: number) => void,
  acquiredLand: StadiumLandSide[] = [],
) {
  const acquired = new Set(acquiredLand);
  const palette = ["#a8755c", "#b09a7c", "#858b82", "#a9a28d", "#765f51", "#9b9b88", "#718177"];
  const seed = [...club.id].reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const detail = (index: number) => (seed >>> ((index % 4) * 8)) % 11;
  const material = (color: string, roughness = 0.86, metalness = 0.03) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const box = (width: number, height: number, depth: number, x: number, y: number, z: number, color: string, roughness = 0.86) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, roughness));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const beam = (from: THREE.Vector3, to: THREE.Vector3, thickness: number, color: string) => {
    const direction = new THREE.Vector3().subVectors(to, from);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(thickness * 0.58, thickness, direction.length(), 7), material(color, 0.48, 0.3));
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = true;
    scene.add(mesh);
  };
  const createBlock = (x: number, z: number, width: number, depth: number, floors: number, wall: string, roof: string, style: "homes" | "shops" | "warehouse" = "homes") => {
    const floorHeight = style === "warehouse" ? 5.2 : 3.25;
    const height = floors * floorHeight;
    box(width, height, depth, x, height / 2, z, wall);
    box(width + 1.1, 0.68, depth + 1, x, height + 0.28, z, roof);
    const window = style === "warehouse" ? "#566c70" : "#6e8785";
    if (style === "warehouse") {
      box(width * 0.3, height * 0.55, 0.2, x, height * 0.34, z + depth / 2 + 0.13, "#4c5550");
      for (let bay = -1; bay <= 1; bay += 1) box(1.3, 1.2, 0.14, x + bay * width * 0.3, height * 0.78, z + depth / 2 + 0.16, window, 0.28);
    } else {
      const windows = Math.max(2, Math.floor(width / 5.1));
      for (let floor = 0; floor < floors; floor += 1) for (let pane = 0; pane < windows; pane += 1) {
        const wx = x - width * 0.38 + pane * (width * 0.76 / Math.max(1, windows - 1));
        const wy = floor * floorHeight + floorHeight * 0.57;
        box(style === "shops" ? 1.65 : 1.25, style === "shops" ? 1.42 : 1.12, 0.16, wx, wy, z + depth / 2 + 0.1, window, 0.28);
        box(1.55, 0.14, 0.2, wx, wy - 0.66, z + depth / 2 + 0.18, "#c3b9a2", 0.62);
      }
      box(1.7, Math.min(2.6, height * 0.42), 0.24, x, Math.min(1.4, height * 0.3), z + depth / 2 + 0.18, "#564b3e");
      if (style === "shops") {
        box(width + 1.8, 0.52, 2.4, x, floorHeight * 0.84, z + depth / 2 + 0.7, club.colors[0], 0.48);
        box(width * 0.52, 1.05, 0.18, x, floorHeight * 0.62, z + depth / 2 + 0.96, club.colors[1], 0.48);
      }
    }
    box(width + 1.8, 0.38, 0.7, x, 0.22, z + depth / 2 + 0.48, "#77796d");
  };
  const north = -(siteInnerZ + 105);
  const east = siteInnerX + 112;
  const west = -(siteInnerX + 112);

  if (setting === "Dense terraces") {
    const count = 11;
    if (!acquired.has("north")) for (let index = 0; index < count; index += 1) {
      const x = -siteInnerX * 0.9 + index * (siteInnerX * 1.8 / (count - 1));
      createBlock(x, north, 12 + detail(index) * 0.36, 12, 2 + (index + detail(2)) % 2, palette[(index + detail(3)) % palette.length], index % 2 ? "#544c46" : "#66544a");
    }
    if (!acquired.has("east")) for (let index = 0; index < 4; index += 1) createBlock(east, -siteInnerZ * 0.62 + index * 31, 18, 20, 3 + index % 2, palette[(index + 2) % palette.length], "#55534d");
    box(siteInnerX * 2.1, 0.16, 7.5, 0, -0.1, north + 14, "#434844", 0.96);
    return;
  }

  if (setting === "Railway quarter") {
    const trackX = east;
    const trackLength = siteInnerZ * 2 + 180;
    const sleeperStart = -trackLength / 2 + 8;
    box(9, 0.34, trackLength, trackX, 0.12, 0, "#4c514c", 0.98);
    for (const offset of [-1.45, 1.45]) box(0.28, 0.24, trackLength, trackX + offset, 0.32, 0, "#6e7772", 0.48);
    for (let sleeper = 0; sleeper < Math.floor(trackLength / 4.5); sleeper += 1) box(4.8, 0.19, 0.34, trackX, 0.2, sleeperStart + sleeper * 4.5, "#54473c", 0.96);
    box(12, 0.55, trackLength * 0.68, trackX - 8, 0.28, 0, "#b1ab99", 0.88);
    createBlock(trackX - 9, -siteInnerZ - 42, 32, 15, 1, "#8b806b", "#555e59", "shops");
    for (let carriage = 0; carriage < 4; carriage += 1) {
      const z = -siteInnerZ + 5 + carriage * 12;
      box(4.3, 3.2, 11.3, trackX + 2.1, 2.05, z, carriage ? "#899c94" : club.colors[0], 0.42);
      for (const end of [-1, 1]) box(2.9, 1, 0.16, trackX + 2.1, 2.35, z + end * 5.65, "#65817e", 0.26);
    }
    if (!acquired.has("west")) for (let index = 0; index < 6; index += 1) createBlock(west, -siteInnerZ * 0.55 + index * 23, 17, 18, 2 + index % 3, palette[(index + 1) % palette.length], "#575750");
    return;
  }

  if (setting === "Waterside quay" || setting === "Harbour edge" || setting === "Riverside mills") {
    const verticalWater = setting !== "Waterside quay";
    const waterWidth = verticalWater ? 46 : siteInnerX * 2 + 155;
    const waterDepth = verticalWater ? siteInnerZ * 2 + 150 : 52;
    const waterX = setting === "Riverside mills" ? west - 155 : verticalWater ? east + 155 : 0;
    const waterZ = verticalWater ? 0 : north - 155;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(waterWidth, waterDepth), new THREE.MeshPhysicalMaterial({ color: setting === "Waterside quay" ? "#315f68" : "#376a70", metalness: 0.34, roughness: 0.22, clearcoat: 0.8, transparent: true, opacity: 0.92 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(waterX, -0.04, waterZ);
    water.receiveShadow = true;
    scene.add(water);
    if (verticalWater) {
      box(5, 2.1, waterDepth, waterX - Math.sign(waterX) * 27, 0.85, waterZ, "#77786c", 0.92);
      box(9, 0.25, waterDepth - 8, waterX - Math.sign(waterX) * 22, 1.95, waterZ, "#c0b89f", 0.88);
      if (!acquired.has("west")) for (let index = 0; index < 4; index += 1) createBlock(west - 12, -siteInnerZ * 0.62 + index * 37, 28, 24, 2 + index % 2, "#805e47", "#545a54", "warehouse");
    } else {
      box(waterWidth + 8, 2.2, 5.5, 0, 0.9, waterZ + waterDepth / 2 - 1, "#747468", 0.92);
      box(waterWidth - 4, 0.24, 10, 0, 1.95, waterZ + waterDepth / 2 + 4, "#b7b29f", 0.88);
      if (!acquired.has("north")) for (let index = 0; index < 4; index += 1) createBlock(-siteInnerX * 0.8 + index * siteInnerX * 0.53, north - 30, 30, 23, 1 + index % 2, "#815f4b", "#4e5753", "warehouse");
    }
    for (let crane = 0; crane < 2; crane += 1) {
      const x = verticalWater ? waterX - Math.sign(waterX) * 36 : -waterWidth * 0.28 + crane * waterWidth * 0.56;
      const z = verticalWater ? -waterDepth * 0.22 + crane * waterDepth * 0.44 : waterZ + waterDepth / 2 + 7;
      box(0.7, 20, 0.7, x, 10, z, "#b39b67", 0.56);
      beam(new THREE.Vector3(x, 18, z), new THREE.Vector3(x + 11, 18, z), 0.55, "#b39b67");
      beam(new THREE.Vector3(x + 9, 18, z), new THREE.Vector3(x + 9, 6, z), 0.25, "#c1ae7b");
    }
    return;
  }

  if (setting === "Industrial fringe") {
    if (!acquired.has("east")) for (let index = 0; index < 6; index += 1) createBlock(east, -siteInnerZ * 0.65 + index * 26, 38 + detail(index) * 0.7, 26, 1, index % 2 ? "#7f7667" : "#7d786b", "#4c5651", "warehouse");
    if (!acquired.has("east")) for (let chimney = 0; chimney < 3; chimney += 1) {
      const x = east + 28 + chimney * 14;
      const height = 23 + detail(chimney) * 1.7;
      box(3.4, height, 3.4, x, height / 2, north + 40, "#875e4c", 0.82);
      box(5, 1.3, 5, x, height + 0.6, north + 40, "#a38e75", 0.78);
    }
    box(12, 0.2, siteInnerZ * 2.1, east - 14, 0.02, 0, "#414744", 0.98);
    return;
  }

  if (setting === "Parkland" || setting === "Hillside green") {
    for (let tree = 0; tree < 28; tree += 1) {
      const x = west + (tree % 7) * 34;
      const z = north - 28 - Math.floor(tree / 7) * 28;
      const clearWest = acquired.has("west") && x < -siteInnerX - 80;
      const clearNorth = acquired.has("north") && z < -siteInnerZ - 75;
      if (!clearWest && !clearNorth) addTree(x, z, 0.95 + (detail(tree) % 4) * 0.13);
    }
    if (setting === "Hillside green") for (let hill = 0; hill < 5; hill += 1) {
      const mound = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), material(hill % 2 ? "#617b53" : "#526f4b", 0.98, 0));
      mound.scale.set(42 + hill * 3, 15 + detail(hill) * 0.8, 31);
      mound.position.set(north + 10, 2, -siteInnerZ + hill * 16);
      mound.castShadow = true;
      mound.receiveShadow = true;
      scene.add(mound);
    }
    box(siteInnerX * 1.65, 0.14, 7, 0, -0.08, north + 28, "#b6b29d", 0.96);
    return;
  }

  if (setting === "Market streets") {
    if (!acquired.has("north")) for (let index = 0; index < 8; index += 1) {
      const x = -siteInnerX * 0.85 + index * (siteInnerX * 1.7 / 7);
      createBlock(x, north, 19 + detail(index) * 0.45, 17, 2 + index % 2, palette[(index + 3) % palette.length], "#514b45", "shops");
    }
    box(siteInnerX * 2.05, 0.16, 8, 0, -0.08, north + 19, "#444a45", 0.98);
    return;
  }

  for (let home = 0; home < 8; home += 1) {
    const x = west + 18 + (home % 4) * 44;
    const z = north + 18 - Math.floor(home / 4) * 39;
    const homeSide: StadiumLandSide = x < -siteInnerX + 35 ? "west" : "north";
    if (acquired.has(homeSide)) continue;
    createBlock(x, z, 19 + detail(home) * 0.5, 15 + detail(home + 2) * 0.35, 1 + home % 2, palette[(home + detail(1)) % palette.length], home % 2 ? "#554e45" : "#756454");
    addTree(x + 15, z + 13, 0.76);
  }
  box(siteInnerX * 1.6, 0.14, 8, 0, -0.08, north + 27, "#51554d", 0.98);
}
