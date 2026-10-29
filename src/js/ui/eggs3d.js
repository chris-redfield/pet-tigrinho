import * as THREE from '../../vendor/three.module.min.js';
import { eggSfx } from '../sfx.js';

/**
 * The egg pick in 3D: four eggs spinning on their own axis, each with a
 * soft shadow and the old idle wiggle. On entry they drop one after
 * another onto a 2x2 grid with a couple of soft bounces; a tap on one hatches
 * it: it shakes, bursts into shell pieces with a flash, and the caller
 * shows the pet.
 *
 * Eggs are built in code (a lathe profile and a painted texture from the
 * colours in `EGGS`), so there is no model file to load.
 *
 * @param {HTMLElement} host   positioned element the canvas fills
 * @param {object[]}    eggs   entries of EGGS, in grid order
 * @param {{reduced: boolean, onPick: (egg: object, at: {x: number, y: number, size: number}) => void}} opts
 *   `onPick` runs at the moment the shell bursts, with the pop's position
 *   and the egg's height in CSS pixels.
 */
export function createEggStage(host, eggs, { reduced, onPick }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.className = 'egg-canvas';
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  scene.add(new THREE.HemisphereLight(0xfff1d6, 0x5a0a12, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-3, 4, 5);
  scene.add(sun);

  const geometry = eggGeometry();
  const shadowTex = radialTexture('rgba(20,2,4,.7)', 'rgba(20,2,4,0)');
  const flashTex = radialTexture('rgba(255,244,200,1)', 'rgba(245,194,66,0)');

  const items = eggs.map((egg, i) => {
    const material = new THREE.MeshStandardMaterial({ map: shellTexture(egg), roughness: 0.38, metalness: 0 });
    const mesh = new THREE.Mesh(geometry, material);
    const tilt = new THREE.Group();     // leans the egg toward the camera
    tilt.rotation.x = 0.22;
    tilt.position.y = 1;                // egg centre above the pivot
    tilt.add(mesh);
    const pivot = new THREE.Group();    // at the egg's base: wiggles rock from here
    pivot.add(tilt);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    scene.add(shadow, pivot);
    mesh.userData.index = i;
    return { egg, mesh, tilt, pivot, shadow, material, slot: new THREE.Vector2(), phase: i * 0.9, spin: 0, gone: 0, hits: 0 };
  });

  let view = { w: 1, h: 1, size: 1 };
  function layout() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vh = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const vw = vh * camera.aspect;
    // Egg height in world units: as big as the 2x2 grid allows.
    const size = Math.min(vw * 0.42, vh * 0.3);
    view = { w: vw, h: vh, size };
    const dx = vw * 0.25;
    const dy = size * 0.66;
    items.forEach((it, i) => it.slot.set(i % 2 ? dx : -dx, (i < 2 ? dy : -dy) + size * 0.1));
  }
  const resize = new ResizeObserver(layout);
  resize.observe(host);
  layout();

  // ---------- timing ----------

  const ENTER = reduced ? 0.5 : 1.4;      // seconds per egg: fall and bounces
  const STAGGER = reduced ? 0.12 : 0.2;
  const start = performance.now();
  let picked = null;                      // { item, at }
  let burst = null;                       // shards + flash after the pop
  let raf = 0;

  const ease = (x) => 1 - (1 - x) ** 3;

  /**
   * The drop at progress s (0 start -> 1 at rest): `lift` is the height
   * above the egg's spot as a share of the fall, `squash` how hard it is
   * landing right now. A fall, then two small soft bounces.
   */
  const HOPS = [[0.5, 0.75, 0.07], [0.75, 0.9, 0.018]];   // [from, to, height]
  const IMPACTS = [[0.5, 0.13], [0.75, 0.06], [0.9, 0.025]];
  function drop(s) {
    let lift = 0;
    if (s < 0.5) lift = 1 - (s / 0.5) ** 2;
    for (const [a, b, height] of HOPS) {
      if (s >= a && s < b) { const u = (s - a) / (b - a); lift = height * 4 * u * (1 - u); }
    }
    let squash = 0;
    for (const [at, strength] of IMPACTS) squash = Math.max(squash, strength * Math.max(0, 1 - Math.abs(s - at) / 0.05));
    return { lift, squash };
  }

  let prev = start;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const half = view.size / 2;

    items.forEach((it, i) => {
      const local = t - i * STAGGER;
      const s = Math.min(1, Math.max(0, local / ENTER));
      let x = it.slot.x;
      let y = it.slot.y;
      let scale = 1;
      let sx = 1; let sy = 1;
      let air = 0;                        // 0 on the ground .. 1 at the top of the fall
      if (reduced) {
        scale = 0.85 + 0.15 * ease(s);
        it.material.transparent = s < 1;
        it.material.opacity = s;
      } else {
        // Falls from just above the screen onto its spot. Each touchdown
        // (the fall, then the two bounces) rings the egg's note.
        const { lift, squash } = drop(s);
        if (it.hits < IMPACTS.length && s >= IMPACTS[it.hits][0]) {
          eggSfx.land(i, [1, 0.45, 0.2][it.hits]);
          it.hits += 1;
        }
        air = lift;
        y += lift * (view.h / 2 + view.size - it.slot.y);
        sx = 1 + squash; sy = 1 - squash;
      }
      if (local < 0) scale = 0;

      // A calm turn on its axis the whole time.
      it.spin += (reduced ? 0.5 : 1.1) * dt;
      it.mesh.rotation.y = it.spin;

      // The old idle wiggle: still most of the time, a quick rock now and then.
      const cycle = ((t + it.phase) % 3.6) / 3.6;
      let rock = cycle > 0.9 ? Math.sin(((cycle - 0.9) / 0.1) * Math.PI * 2) * (reduced ? 0.04 : 0.09) : 0;

      // Hatching: the picked egg moves to the middle and shakes harder; the
      // others shrink away.
      if (picked) {
        const p = (now - picked.at) / 1000;
        if (it === picked.item) {
          const k = ease(Math.min(1, p / 0.5));
          x += (0 - x) * k;
          y += (-half * 0.6 - y) * k;
          scale *= 1 + 0.45 * k;
          rock = Math.sin(p * (reduced ? 18 : 34)) * (reduced ? 0.05 : 0.06 + 0.12 * Math.min(1, p / 0.8));
          it.spin += (reduced ? 0 : 6 * Math.min(1, p)) * dt;
        } else {
          it.gone = Math.min(1, p / 0.35);
          scale *= 1 - ease(it.gone);
        }
      }

      // The bottom row sits a layer nearer the camera, so eggs falling into
      // it pass in front of the top row. Position and size are shrunk by
      // the same perspective factor, so on screen both rows look the same.
      const z = i >= 2 ? view.size * 0.8 : 0;
      const k = (camera.position.z - z) / camera.position.z;
      x *= k; y *= k;
      const h = view.size * scale * k;
      it.pivot.position.set(x, y - h / 2, z);
      it.pivot.scale.set(h / 2 * sx, h / 2 * sy, h / 2 * sx);
      it.pivot.rotation.z = rock;
      it.pivot.visible = h > 0.001 && !(burst && it === picked.item);

      // The shadow stays on the ground and grows as the egg comes down.
      const ground = picked ? y - h / 2 : it.slot.y * k - h / 2;
      const near = 1 - Math.min(1, air * 3);
      it.shadow.position.set(x, ground, z - 0.5);
      it.shadow.scale.set(h * (0.5 + 0.45 * near), h * 0.22 * (0.5 + 0.5 * near), 1);
      it.shadow.material.opacity = (reduced ? s : local > 0 ? 0.25 + 0.75 * near : 0) * (it.pivot.visible ? 1 : 0);
    });

    if (picked && !burst && (now - picked.at) / 1000 > 0.85) pop();
    if (burst) stepBurst((now - burst.at) / 1000);

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // ---------- picking ----------

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function onPointer(e) {
    if (picked) return;
    const box = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(items.map((it) => it.mesh))[0];
    if (hit) pick(hit.object.userData.index);
  }
  renderer.domElement.addEventListener('pointerdown', onPointer);

  /** Starts the hatch of egg i (also used by the keyboard buttons). */
  function pick(i) {
    if (picked) return;
    picked = { item: items[i], at: performance.now() };
    eggSfx.shake();
  }

  // ---------- the pop ----------

  function pop() {
    const it = picked.item;
    const centre = new THREE.Vector3(0, -view.size * 0.3, 0.5);
    const shards = [];
    if (!reduced) {
      const colours = [it.egg.shell, it.egg.shell, it.egg.shell, it.egg.band, it.egg.speck];
      for (let i = 0; i < 22; i++) {
        const piece = new THREE.Mesh(
          new THREE.TetrahedronGeometry(view.size * (0.05 + Math.random() * 0.06)),
          new THREE.MeshStandardMaterial({ color: colours[i % colours.length], roughness: 0.4, transparent: true }));
        piece.position.copy(centre);
        const a = Math.random() * Math.PI * 2;
        const v = view.size * (1.6 + Math.random() * 1.8);
        piece.userData.v = new THREE.Vector3(Math.cos(a) * v, Math.abs(Math.sin(a)) * v * 1.1 + view.size, (Math.random() - 0.5) * v);
        piece.userData.r = new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8);
        scene.add(piece);
        shards.push(piece);
      }
    }
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: flashTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    flash.position.copy(centre);
    scene.add(flash);
    burst = { at: performance.now(), shards, flash, last: 0 };
    eggSfx.hatch();

    // Where the pop is on screen, in CSS pixels, for the pet reveal.
    const p = centre.clone().project(camera);
    const px = view.size / view.h * host.clientHeight;
    onPick(it.egg, {
      x: (p.x + 1) / 2 * host.clientWidth,
      y: (1 - p.y) / 2 * host.clientHeight,
      size: px,
    });
  }

  function stepBurst(p) {
    const dt = Math.min(0.05, p - burst.last);
    burst.last = p;
    const gravity = view.size * 5;
    for (const s of burst.shards) {
      s.userData.v.y -= gravity * dt;
      s.position.addScaledVector(s.userData.v, dt);
      s.rotation.x += s.userData.r.x * dt;
      s.rotation.y += s.userData.r.y * dt;
      s.material.opacity = Math.max(0, 1 - p / 1.1);
    }
    const f = Math.min(1, p / (reduced ? 0.9 : 0.6));
    const size = view.size * (reduced ? 1.6 + f : 0.6 + ease(f) * 3.2);
    burst.flash.scale.set(size, size, 1);
    burst.flash.material.opacity = reduced ? Math.sin(f * Math.PI) * 0.9 : 1 - f;
  }

  return {
    pick,
    /** Stops drawing and frees the GPU resources. */
    destroy() {
      cancelAnimationFrame(raf);
      resize.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointer);
      scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.map?.dispose();
        o.material?.dispose();
      });
      renderer.dispose();
      // Hand the GPU memory back now, not whenever the browser gets to it.
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

/** An egg: a lathe of a profile wider below its middle, 2 units tall. */
function eggGeometry() {
  const points = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = -1 + (2 * i) / N;                      // -1 bottom .. 1 top
    const r = Math.sqrt(Math.max(0, 1 - t * t)) * (0.74 - 0.1 * t);
    points.push(new THREE.Vector2(Math.max(r, 0.0001), t));
  }
  return new THREE.LatheGeometry(points, 64);
}

/**
 * The shell painted on a canvas: base colour, the two gold bands at the
 * same heights as the flat SVG egg, and speckles placed by a seeded random
 * so each egg always looks the same.
 */
function shellTexture({ id, shell, band, speck }) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = shell;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = band;
  g.fillRect(0, c.height * 0.46, c.width, c.height * 0.11);
  g.globalAlpha = 0.75;
  g.fillRect(0, c.height * 0.61, c.width, c.height * 0.035);
  g.globalAlpha = 1;

  let seed = [...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  g.fillStyle = speck;
  for (let i = 0; i < 18; i++) {
    const v = rand() < 0.5 ? 0.12 + rand() * 0.3 : 0.68 + rand() * 0.22;
    const x = rand() * c.width;
    const y = v * c.height;
    const r = 5 + rand() * 7;
    for (const dx of [0, c.width, -c.width]) {      // wrap across the seam
      g.beginPath();
      g.ellipse(x + dx, y, r, r * 1.15, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function radialTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
