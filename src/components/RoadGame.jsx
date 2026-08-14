"use client";

/* R3F animation loops intentionally mutate Three.js object refs each frame. */
/* eslint-disable react-hooks/immutability */

import { memo, Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const LANE_X = [-2.55, 0, 2.55];
const PLAYER_Z = 1.35;
const WORLD_SPEED = 16;
const DASHES_PER_LANE = 44;
const STUDS_PER_SIDE = 36;
const OBJECT_PATTERN = ["sign", "traffic", "traffic", "traffic", "sign", "traffic", "traffic", "traffic", "sign", "traffic"];
const CAR_COLORS = ["#7e302d", "#284c5a", "#bd934b", "#333637", "#d9d0bd"];
const CAMERA_SETTINGS = { fov: 50, near: 0.1, far: 280, position: [0, 3.75, 10.5] };
const GL_SETTINGS = { antialias: true, powerPreference: "high-performance", alpha: false };
const DPR_RANGE = [1, 1.5];

function configureRenderer({ gl }) {
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 0.93;
}

function random01(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function CameraRig({ crashed, lane, playing }) {
  const { camera } = useThree();
  const shake = useRef(0);

  useEffect(() => {
    if (crashed) shake.current = 1;
  }, [crashed]);

  useFrame((state, delta) => {
    shake.current = THREE.MathUtils.damp(shake.current, 0, 7, delta);
    const time = state.clock.elapsedTime;
    const jitter = shake.current * 0.11;
    const roadBob = playing ? Math.sin(time * 8.5) * 0.012 : 0;
    const followX = LANE_X[lane] * 0.07;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, followX, 4, delta) + Math.sin(time * 48) * jitter;
    camera.position.y = 3.75 + roadBob + Math.cos(time * 40) * jitter;
    camera.lookAt(camera.position.x * 0.18, -0.22, -15);
  });

  return null;
}

function Wheel({ position, wheelRef }) {
  return (
    <group ref={wheelRef} position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.19, 20]} />
        <meshStandardMaterial color="#101111" roughness={0.88} />
      </mesh>
      <mesh position={[position[0] > 0 ? 0.105 : -0.105, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.025, 16]} />
        <meshStandardMaterial color="#918c82" metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Car({ color = "#d8d0bd", player = false, moving = true }) {
  const wheelRefs = useRef([]);

  useFrame((_, delta) => {
    if (!moving) return;
    wheelRefs.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x -= delta * 9;
    });
  });

  return (
    <group scale={player ? 0.96 : 0.86}>
      <RoundedBox castShadow receiveShadow args={[1.55, 0.4, 2.72]} radius={0.16} smoothness={3} position={[0, 0.08, 0]}>
        <meshPhysicalMaterial color={color} metalness={0.58} roughness={0.27} clearcoat={0.75} clearcoatRoughness={0.18} />
      </RoundedBox>
      {player ? (
        <>
          <RoundedBox args={[1.18, 0.12, 1.08]} radius={0.08} smoothness={2} position={[0, 0.31, -0.12]}>
            <meshStandardMaterial color="#282522" roughness={0.74} />
          </RoundedBox>
          {[-0.34, 0.34].map((x) => (
            <group key={`seat-${x}`} position={[x, 0.47, -0.12]}>
              <RoundedBox castShadow args={[0.34, 0.47, 0.3]} radius={0.08} smoothness={2} rotation={[-0.08, 0, 0]}>
                <meshStandardMaterial color="#704d37" roughness={0.82} />
              </RoundedBox>
              <RoundedBox castShadow args={[0.28, 0.2, 0.23]} radius={0.07} smoothness={2} position={[0, 0.28, 0.02]}>
                <meshStandardMaterial color="#6a4935" roughness={0.84} />
              </RoundedBox>
            </group>
          ))}
          <mesh position={[0, 0.61, -0.72]} rotation={[-0.14, 0, 0]}>
            <planeGeometry args={[1.08, 0.4]} />
            <meshPhysicalMaterial color="#72939a" metalness={0.1} roughness={0.06} transmission={0.35} transparent opacity={0.56} />
          </mesh>
          <mesh position={[0, 0.61, -0.735]}>
            <boxGeometry args={[1.18, 0.035, 0.04]} />
            <meshStandardMaterial color="#b4aea4" metalness={0.86} roughness={0.18} />
          </mesh>
        </>
      ) : (
        <>
          <RoundedBox castShadow args={[1.2, 0.53, 1.3]} radius={0.15} smoothness={3} position={[0, 0.46, -0.18]}>
            <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.3} clearcoat={0.62} />
          </RoundedBox>
          <mesh position={[0, 0.5, 0.32]} rotation={[-0.1, 0, 0]}>
            <planeGeometry args={[1.02, 0.36]} />
            <meshPhysicalMaterial color="#55767d" metalness={0.2} roughness={0.08} transmission={0.18} transparent opacity={0.84} />
          </mesh>
          <mesh position={[0, 0.5, -0.86]} rotation={[0.08, Math.PI, 0]}>
            <planeGeometry args={[1.01, 0.34]} />
            <meshPhysicalMaterial color="#45656b" metalness={0.2} roughness={0.08} transparent opacity={0.78} />
          </mesh>
        </>
      )}
      <mesh position={[0, -0.05, 1.39]}>
        <boxGeometry args={[1.38, 0.1, 0.08]} />
        <meshStandardMaterial color="#b6b0a6" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, -0.05, -1.39]}>
        <boxGeometry args={[1.38, 0.1, 0.08]} />
        <meshStandardMaterial color="#aaa59c" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.3, -1.02]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[1.18, 0.018, 0.52]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.25} />
      </mesh>
      {[-0.86, 0.86].map((x) => (
        <RoundedBox key={`mirror-${x}`} args={[0.17, 0.09, 0.23]} radius={0.04} smoothness={2} position={[x, 0.36, -0.47]}>
          <meshPhysicalMaterial color={color} metalness={0.55} roughness={0.25} clearcoat={0.6} />
        </RoundedBox>
      ))}
      {[-0.5, 0.5].map((x) => (
        <mesh key={`tail-${x}`} position={[x, 0.14, 1.37]}>
          <boxGeometry args={[0.28, 0.13, 0.045]} />
          <meshStandardMaterial color="#ffbb80" emissive="#ff5526" emissiveIntensity={player ? 2.4 : 1.1} toneMapped={false} />
        </mesh>
      ))}
      {[-0.5, 0.5].map((x) => (
        <mesh key={`head-${x}`} position={[x, 0.14, -1.38]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.11, 16]} />
          <meshStandardMaterial color="#fff3ce" emissive="#ffe4a1" emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      ))}
      {[
        [-0.79, -0.11, -0.82],
        [0.79, -0.11, -0.82],
        [-0.79, -0.11, 0.86],
        [0.79, -0.11, 0.86],
      ].map((position, index) => (
        <Wheel
          key={`${position[0]}-${position[2]}`}
          position={position}
          wheelRef={(node) => { wheelRefs.current[index] = node; }}
        />
      ))}
      {player && (
        <>
          <mesh position={[0, -0.015, 1.405]}>
            <boxGeometry args={[0.45, 0.18, 0.035]} />
            <meshStandardMaterial color="#ede7d7" emissive="#ede7d7" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 0.35, 1.39]}>
            <boxGeometry args={[0.04, 0.35, 0.035]} />
            <meshStandardMaterial color="#d9d3c8" metalness={0.75} roughness={0.25} />
          </mesh>
        </>
      )}
    </group>
  );
}

const MemoCar = memo(Car);

function SignToken() {
  const texture = useTexture("/logo.svg");

  return (
    <Float speed={3.2} rotationIntensity={0.12} floatIntensity={0.36}>
      <group position={[0, 1.05, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.04, 0.028, 12, 56]} />
          <meshStandardMaterial color="#ffe5c8" emissive="#ff9f63" emissiveIntensity={1.7} toneMapped={false} />
        </mesh>
        <RoundedBox args={[1.3, 1.5, 0.11]} radius={0.045} smoothness={3}>
          <meshStandardMaterial color="#e9e4d8" metalness={0.16} roughness={0.32} />
        </RoundedBox>
        {[1, -1].map((side) => (
          <mesh key={side} position={[0, 0, side * 0.061]} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
            <planeGeometry args={[0.88, 1.02]} />
            <meshBasicMaterial map={texture} transparent toneMapped={false} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

const palmTrunkCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.08, 1.7, 0.02),
  new THREE.Vector3(-0.08, 3.5, 0.04),
  new THREE.Vector3(-0.24, 5.1, 0),
]);
const palmFrondCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.08, 0.02, 0.8),
  new THREE.Vector3(0.04, -0.16, 1.65),
  new THREE.Vector3(0, -0.58, 2.55),
]);
const PALM_TRUNK_GEOMETRY = new THREE.TubeGeometry(palmTrunkCurve, 12, 0.18, 7, false);
const PALM_FROND_GEOMETRY = new THREE.TubeGeometry(palmFrondCurve, 10, 0.055, 5, false);

function mergePalmFronds(indices) {
  const geometries = indices.map((index) => {
    const geometry = PALM_FROND_GEOMETRY.clone();
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(
      0.06 + (index % 3) * 0.07,
      (index / 9) * Math.PI * 2,
      index % 2 ? -0.08 : 0.04,
    )));
    return geometry;
  });
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  return merged;
}

const PALM_DARK_FRONDS_GEOMETRY = mergePalmFronds([1, 3, 5, 7]);
const PALM_LIGHT_FRONDS_GEOMETRY = mergePalmFronds([0, 2, 4, 6, 8]);

function Palm({ scale = 1, phase = 0 }) {
  const crownRef = useRef();

  useFrame((state) => {
    if (!crownRef.current) return;
    crownRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + phase) * 0.045;
    crownRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.65 + phase) * 0.025;
  });

  return (
    <group scale={scale}>
      <mesh geometry={PALM_TRUNK_GEOMETRY}>
        <meshStandardMaterial color="#705039" roughness={0.96} />
      </mesh>
      <group ref={crownRef} position={[-0.24, 5.05, 0]}>
        <mesh geometry={PALM_DARK_FRONDS_GEOMETRY}>
          <meshStandardMaterial color="#264b39" roughness={0.9} />
        </mesh>
        <mesh geometry={PALM_LIGHT_FRONDS_GEOMETRY}>
          <meshStandardMaterial color="#376044" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function createRoadTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = "#55534d";
  context.fillRect(0, 0, 256, 256);
  for (let index = 0; index < 2600; index += 1) {
    const shade = 48 + Math.floor(random01(index * 4 + 1) * 30);
    context.fillStyle = `rgba(${shade},${shade},${shade},${0.08 + random01(index * 4 + 2) * 0.16})`;
    const size = random01(index * 4 + 3) * 1.8 + 0.35;
    context.fillRect(random01(index * 5 + 9) * 256, random01(index * 7 + 13) * 256, size, size);
  }
  for (let index = 0; index < 10; index += 1) {
    context.strokeStyle = `rgba(18,18,17,${0.1 + random01(index + 31) * 0.1})`;
    context.lineWidth = 0.5;
    context.beginPath();
    context.moveTo(random01(index + 42) * 256, random01(index + 52) * 256);
    context.bezierCurveTo(random01(index + 62) * 256, random01(index + 72) * 256, random01(index + 82) * 256, random01(index + 92) * 256, random01(index + 102) * 256, random01(index + 112) * 256);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 74);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBarrierPostsGeometry() {
  const posts = Array.from({ length: 25 }, (_, index) => {
    const geometry = new THREE.BoxGeometry(0.075, 0.75, 0.075);
    geometry.translate(0, -0.25, 4 - index * 7);
    return geometry;
  });
  const merged = mergeGeometries(posts, false);
  posts.forEach((geometry) => geometry.dispose());
  return merged;
}

const BARRIER_RAIL_GEOMETRY = new THREE.BoxGeometry(0.07, 0.07, 168).translate(0, 0.02, -80);
const BARRIER_POSTS_GEOMETRY = createBarrierPostsGeometry();

const Highway = memo(function Highway({ playing }) {
  const dashInstancesRef = useRef();
  const studInstancesRef = useRef();
  const barrierRefs = useRef([]);
  const roadTexture = useMemo(() => createRoadTexture(), []);
  const instanceDummy = useMemo(() => new THREE.Object3D(), []);
  const dashPositions = useMemo(() => Float32Array.from(
    { length: DASHES_PER_LANE * 2 },
    (_, index) => 7 - (index % DASHES_PER_LANE) * 5.4,
  ), []);
  const studPositions = useMemo(() => Float32Array.from(
    { length: STUDS_PER_SIDE * 2 },
    (_, index) => 5 - (index % STUDS_PER_SIDE) * 6.6,
  ), []);

  useEffect(() => {
    dashPositions.forEach((z, index) => {
      instanceDummy.position.set(index < DASHES_PER_LANE ? -1.7 : 1.7, -0.66, z);
      instanceDummy.updateMatrix();
      dashInstancesRef.current?.setMatrixAt(index, instanceDummy.matrix);
    });
    studPositions.forEach((z, index) => {
      instanceDummy.position.set(index < STUDS_PER_SIDE ? -5.02 : 5.02, -0.62, z);
      instanceDummy.updateMatrix();
      studInstancesRef.current?.setMatrixAt(index, instanceDummy.matrix);
    });
    if (dashInstancesRef.current) dashInstancesRef.current.instanceMatrix.needsUpdate = true;
    if (studInstancesRef.current) studInstancesRef.current.instanceMatrix.needsUpdate = true;
  }, [dashPositions, instanceDummy, studPositions]);

  useFrame((_, delta) => {
    if (!playing) return;
    if (roadTexture) roadTexture.offset.y -= delta * 0.42;
    dashPositions.forEach((z, index) => {
      const nextZ = z + delta * WORLD_SPEED;
      dashPositions[index] = nextZ > 10 ? nextZ - 237.6 : nextZ;
      instanceDummy.position.set(index < DASHES_PER_LANE ? -1.7 : 1.7, -0.66, dashPositions[index]);
      instanceDummy.updateMatrix();
      dashInstancesRef.current?.setMatrixAt(index, instanceDummy.matrix);
    });
    studPositions.forEach((z, index) => {
      const nextZ = z + delta * WORLD_SPEED;
      studPositions[index] = nextZ > 9 ? nextZ - 237.6 : nextZ;
      instanceDummy.position.set(index < STUDS_PER_SIDE ? -5.02 : 5.02, -0.62, studPositions[index]);
      instanceDummy.updateMatrix();
      studInstancesRef.current?.setMatrixAt(index, instanceDummy.matrix);
    });
    if (dashInstancesRef.current) dashInstancesRef.current.instanceMatrix.needsUpdate = true;
    if (studInstancesRef.current) studInstancesRef.current.instanceMatrix.needsUpdate = true;
    barrierRefs.current.forEach((barrier) => {
      if (!barrier) return;
      barrier.position.z += delta * WORLD_SPEED;
      if (barrier.position.z >= 168) barrier.position.z -= 336;
    });
  });

  useEffect(() => () => roadTexture?.dispose(), [roadTexture]);

  return (
    <group>
      <mesh receiveShadow position={[0, -0.72, -188]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 420]} />
        <meshStandardMaterial color="#c8c2b4" map={roadTexture} roughness={0.96} metalness={0.02} />
      </mesh>
      <mesh receiveShadow position={[-55.5, -0.78, -188]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 420]} />
        <meshStandardMaterial color="#916a4b" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[11.75, -0.77, -188]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12.5, 420]} />
        <meshStandardMaterial color="#a67b53" roughness={1} />
      </mesh>
      {[-5.25, 5.25].map((x) => (
        <mesh key={x} position={[x, -0.67, -188]}>
          <boxGeometry args={[0.12, 0.04, 420]} />
          <meshStandardMaterial color="#ded8c9" roughness={0.7} />
        </mesh>
      ))}
      <instancedMesh ref={dashInstancesRef} args={[null, null, DASHES_PER_LANE * 2]} frustumCulled={false}>
        <boxGeometry args={[0.09, 0.035, 2.15]} />
        <meshStandardMaterial color="#ded8c9" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={studInstancesRef} args={[null, null, STUDS_PER_SIDE * 2]} frustumCulled={false}>
        <boxGeometry args={[0.11, 0.045, 0.22]} />
        <meshStandardMaterial color="#f2c982" emissive="#bd7536" emissiveIntensity={0.35} />
      </instancedMesh>
      {[-6.05, 6.05].flatMap((x, sideIndex) => [0, -168].map((offset, chunkIndex) => (
        <group
          key={`${x}-${chunkIndex}`}
          ref={(node) => { barrierRefs.current[sideIndex * 2 + chunkIndex] = node; }}
          position={[x, 0, offset]}
        >
          <mesh geometry={BARRIER_RAIL_GEOMETRY}>
            <meshStandardMaterial color="#9c9992" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh geometry={BARRIER_POSTS_GEOMETRY}>
            <meshStandardMaterial color="#85827c" metalness={0.72} roughness={0.38} />
          </mesh>
        </group>
      )))}
    </group>
  );
});

function Ocean() {
  return (
    <group>
      <mesh position={[84, -0.89, -188]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[132, 440]} />
        <meshStandardMaterial color="#435a59" roughness={0.86} metalness={0.04} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[11.4 + index * 3.9, -0.83, -16 - index * 21]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2 + (index % 3), 0.055]} />
          <meshBasicMaterial color="#d8c8a6" transparent opacity={0.22} />
        </mesh>
      ))}
      <mesh position={[20, 7.5, -128]}>
        <circleGeometry args={[2.1, 48]} />
        <meshBasicMaterial color="#fff0a2" transparent opacity={0.88} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CloudBank() {
  const cloudRef = useRef();
  useFrame((_, delta) => {
    if (!cloudRef.current) return;
    cloudRef.current.position.x += delta * 0.12;
    if (cloudRef.current.position.x > 30) cloudRef.current.position.x = -28;
  });

  return (
    <group ref={cloudRef} position={[-18, 12, -112]}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh key={index} position={[index * 4.6, Math.sin(index) * 0.8, index % 2]} scale={[3.6, 1.15, 1.2]}>
          <sphereGeometry args={[1, 20, 12]} />
          <meshBasicMaterial color="#eef1e7" transparent opacity={0.15} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function CoastalCliffs({ playing }) {
  const rockRefs = useRef([]);
  const rocks = useMemo(() => Array.from({ length: 18 }, (_, index) => ({
    x: -9.5 - (index % 3) * 2.9,
    y: -0.12 + (index % 4) * 0.22,
    z: -10 - index * 13.2,
    scale: [2.2 + (index % 4) * 0.72, 1.25 + (index % 3) * 0.65, 1.8 + (index % 5) * 0.55],
    rotation: [0.08 * (index % 3), 0.37 * index, -0.06 * (index % 4)],
    color: index % 3 === 0 ? "#6d472f" : index % 3 === 1 ? "#7f5335" : "#91613e",
  })), []);

  useFrame((_, delta) => {
    if (!playing) return;
    rockRefs.current.forEach((rock) => {
      if (!rock) return;
      rock.position.z += delta * WORLD_SPEED;
      if (rock.position.z > 8) rock.position.z -= rocks.length * 13.2;
    });
  });

  return (
    <group>
      {rocks.map((rock, index) => (
        <mesh
          key={index}
          ref={(node) => { rockRefs.current[index] = node; }}
          position={[rock.x, rock.y, rock.z]}
          scale={rock.scale}
          rotation={rock.rotation}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 24, 14]} />
          <meshStandardMaterial color={rock.color} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function MovingScenery({ playing }) {
  const palmRefs = useRef([]);
  const palms = useMemo(() => Array.from({ length: 22 }, (_, index) => ({
    x: index % 2 ? 8.5 + (index % 3) * 0.72 : -8.0 - (index % 3) * 0.4,
    z: -12 - index * 10.5,
    scale: 0.62 + (index % 5) * 0.09,
    phase: index * 0.73,
  })), []);

  useFrame((_, delta) => {
    if (!playing) return;
    palmRefs.current.forEach((palm) => {
      if (!palm) return;
      palm.position.z += delta * WORLD_SPEED;
      if (palm.position.z > 3.5) palm.position.z -= palms.length * 10.5;
    });
  });

  return (
    <group>
      {palms.map((palm, index) => (
        <group
          key={index}
          ref={(node) => { palmRefs.current[index] = node; }}
          position={[palm.x, -0.79, palm.z]}
        >
          <Palm scale={palm.scale} phase={palm.phase} />
        </group>
      ))}
    </group>
  );
}

function Dust({ playing }) {
  const pointsRef = useRef();
  const positions = useMemo(() => {
    const values = new Float32Array(240 * 3);
    for (let index = 0; index < 240; index += 1) {
      values[index * 3] = -(5.8 + random01(index * 3 + 1) * 8.5);
      values[index * 3 + 1] = -0.15 + random01(index * 3 + 2) * 2.4;
      values[index * 3 + 2] = 8 - random01(index * 3 + 3) * 125;
    }
    return values;
  }, []);

  useFrame((_, delta) => {
    if (!playing || !pointsRef.current) return;
    const attribute = pointsRef.current.geometry.attributes.position;
    for (let index = 0; index < attribute.count; index += 1) {
      const nextZ = attribute.getZ(index) + delta * WORLD_SPEED * 0.8;
      attribute.setZ(index, nextZ > 10 ? nextZ - 128 : nextZ);
    }
    attribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e8d8b7" size={0.045} transparent opacity={0.19} depthWrite={false} sizeAttenuation />
    </points>
  );
}

const Landscape = memo(function Landscape({ playing }) {
  return (
    <group>
      <Ocean />
      <CloudBank />
      <CoastalCliffs playing={playing} />
      <MovingScenery playing={playing} />
      <Dust playing={playing} />
    </group>
  );
});

function MovingWorld({ lane, playing, resetKey, onCollect, onCrash }) {
  const playerRef = useRef();
  const objectRefs = useRef([]);
  const objectData = useRef([]);
  const crashedRef = useRef(false);
  const respawnCounter = useRef(0);

  function respawnObject(object, index) {
    const otherObjects = objectData.current.filter((candidate) => candidate !== object && Number.isFinite(candidate.z));
    const backmostZ = otherObjects.length > 0
      ? Math.min(...otherObjects.map((candidate) => candidate.z))
      : -100;
    respawnCounter.current += 1;
    object.z = Math.min(-104, backmostZ - 16 - (respawnCounter.current % 3) * 2.5);
    object.lane = (index + respawnCounter.current * 2) % LANE_X.length;
    object.handled = false;

    const mesh = objectRefs.current[index];
    if (mesh) {
      mesh.position.x = LANE_X[object.lane];
      mesh.position.z = object.z;
    }
  }

  useEffect(() => {
    crashedRef.current = false;
    respawnCounter.current = 0;
    objectData.current = OBJECT_PATTERN.map((kind, index) => ({
      kind,
      lane: (index * 2 + 1) % 3,
      z: -18 - index * 12,
      handled: false,
    }));
    objectData.current.forEach((object, index) => {
      const mesh = objectRefs.current[index];
      if (mesh) {
        mesh.position.x = LANE_X[object.lane];
        mesh.position.z = object.z;
        mesh.visible = true;
      }
    });
  }, [resetKey]);

  useFrame((state, delta) => {
    if (playerRef.current) {
      const targetX = LANE_X[lane];
      playerRef.current.position.x = THREE.MathUtils.damp(playerRef.current.position.x, targetX, 8, delta);
      const difference = targetX - playerRef.current.position.x;
      playerRef.current.rotation.z = THREE.MathUtils.damp(playerRef.current.rotation.z, -difference * 0.09, 7, delta);
      playerRef.current.rotation.y = THREE.MathUtils.damp(playerRef.current.rotation.y, difference * 0.035, 7, delta);
      playerRef.current.position.y = -0.34 + Math.sin(state.clock.elapsedTime * 9) * 0.012;
    }

    if (!playing || crashedRef.current) return;

    objectData.current.forEach((object, index) => {
      const mesh = objectRefs.current[index];
      if (!mesh) return;
      const previousZ = object.z;
      object.z += delta * WORLD_SPEED;
      mesh.position.z = object.z;

      if (object.kind === "sign") {
        mesh.rotation.y += delta * 1.3;
      } else {
        mesh.position.x = LANE_X[object.lane] + Math.sin(state.clock.elapsedTime * 0.75 + index * 1.83) * 0.075;
        mesh.position.y = -0.34 + Math.sin(state.clock.elapsedTime * 5.2 + index) * 0.008;
      }

      const crossedPlayer = previousZ <= PLAYER_Z + 1.45 && object.z >= PLAYER_Z - 1.45;
      const playerX = playerRef.current?.position.x ?? LANE_X[lane];
      const pickupWidth = object.kind === "sign" ? 1.5 : 1.12;
      const closeEnough = crossedPlayer && Math.abs(mesh.position.x - playerX) < pickupWidth;

      if (closeEnough && !object.handled) {
        object.handled = true;
        if (object.kind === "sign") {
          onCollect();
          respawnObject(object, index);
        } else {
          crashedRef.current = true;
          onCrash();
        }
      }

      if (object.z > 8) {
        respawnObject(object, index);
      }
    });
  });

  return (
    <group>
      <group ref={playerRef} position={[LANE_X[1], -0.34, PLAYER_Z]}>
        <MemoCar player moving={playing} />
      </group>
      {OBJECT_PATTERN.map((kind, index) => (
        <group
          key={`${resetKey}-${index}`}
          ref={(node) => { objectRefs.current[index] = node; }}
          position={[LANE_X[(index * 2 + 1) % 3], kind === "sign" ? -0.05 : -0.34, -18 - index * 12]}
        >
          {kind === "sign" ? <SignToken /> : <MemoCar color={CAR_COLORS[index % CAR_COLORS.length]} moving={playing} />}
        </group>
      ))}
    </group>
  );
}

function World({ lane, playing, resetKey, crashed, onCollect, onCrash }) {
  return (
    <>
      <color attach="background" args={["#bbaaa0"]} />
      <fog attach="fog" args={["#bea691", 66, 220]} />
      <mesh>
        <sphereGeometry args={[210, 32, 18]} />
        <shaderMaterial
          depthWrite={false}
          side={THREE.BackSide}
          vertexShader={`varying vec3 vDirection; void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`varying vec3 vDirection; void main(){ float h=clamp(normalize(vDirection).y*2.15,0.0,1.0); vec3 horizon=vec3(0.86,0.65,0.61); vec3 haze=vec3(0.91,0.78,0.62); vec3 zenith=vec3(0.44,0.51,0.50); vec3 color=mix(horizon,haze,smoothstep(0.0,0.25,h)); color=mix(color,zenith,smoothstep(0.22,0.92,h)); gl_FragColor=vec4(color,1.0); }`}
        />
      </mesh>
      <hemisphereLight args={["#f6dfc1", "#6d5946", 1.62]} />
      <ambientLight intensity={0.54} color="#ddb998" />
      <directionalLight
        castShadow
        position={[8, 14, 7]}
        intensity={1.76}
        color="#ffd09a"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={18}
        shadow-camera-bottom={-5}
      />
      <Landscape playing={playing} />
      <Highway playing={playing} />
      <MovingWorld lane={lane} playing={playing} resetKey={resetKey} onCollect={onCollect} onCrash={onCrash} />
      <CameraRig crashed={crashed} lane={lane} playing={playing} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.25} luminanceThreshold={1.22} luminanceSmoothing={0.5} mipmapBlur />
        <Noise opacity={0.02} premultiply />
        <Vignette eskil={false} offset={0.22} darkness={0.25} />
      </EffectComposer>
    </>
  );
}

function RoadGame({ active, ...props }) {
  return (
    <Canvas
      className="road-canvas"
      shadows="percentage"
      dpr={DPR_RANGE}
      frameloop={active ? (props.playing ? "always" : "demand") : "never"}
      camera={CAMERA_SETTINGS}
      gl={GL_SETTINGS}
      onCreated={configureRenderer}
    >
      <Suspense fallback={null}>
        <World {...props} />
      </Suspense>
    </Canvas>
  );
}

export default memo(RoadGame);
