import {
  CircleGeometry,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  Quaternion,
  type Scene,
  Vector3,
} from "three";

const REFLECTION = 0.16;
const SHADOW = 0.4;
const MAX_SHADOWS = 16;
const FLIP = new Matrix4().makeScale(1, -1, 1);
const FLAT = new Quaternion().setFromAxisAngle(
  new Vector3(1, 0, 0),
  -Math.PI / 2,
);

const faint = (source: Material) => {
  const { color, map, vertexColors } = source as MeshStandardMaterial;
  return new MeshBasicMaterial({
    color,
    map,
    vertexColors,
    transparent: true,
    opacity: REFLECTION,
    depthWrite: false,
  });
};

const radiusOf = (mesh: Mesh) => {
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox?.max.x ?? 0;
};

// A mirrored copy of each Pin and the ball under the Lane, and a dark disc
// under each instead of a shadow map.
export const createReflections = (scene: Scene) => {
  const copies = new Map<Mesh, Mesh>();
  const materials = new Map<Material, Material>();
  const radii = new Map<Mesh, number>();
  const shadows = new InstancedMesh(
    new CircleGeometry(1, 16),
    new MeshBasicMaterial({
      color: "#000000",
      transparent: true,
      opacity: SHADOW,
      depthWrite: false,
    }),
    MAX_SHADOWS,
  );
  shadows.renderOrder = 2;
  scene.add(shadows);
  const disc = new Matrix4();
  const at = new Vector3();
  const size = new Vector3();

  const copyOf = (source: Mesh) => {
    let copy = copies.get(source);
    if (!copy) {
      const material = source.material as Material;
      let mirrored = materials.get(material);
      if (!mirrored) {
        mirrored = faint(material);
        materials.set(material, mirrored);
      }
      copy = new Mesh(source.geometry, mirrored);
      copy.matrixAutoUpdate = false;
      copy.renderOrder = 1;
      copies.set(source, copy);
      radii.set(source, radiusOf(source));
      scene.add(copy);
    }
    return copy;
  };

  return {
    update(sources: Iterable<Mesh>) {
      let count = 0;
      for (const source of sources) {
        const copy = copyOf(source);
        source.updateMatrix();
        copy.visible = source.visible;
        copy.matrix.multiplyMatrices(FLIP, source.matrix);
        copy.matrixWorldNeedsUpdate = true;
        if (!source.visible || count === MAX_SHADOWS) continue;
        const radius = radii.get(source) ?? 0;
        at.set(source.position.x, 0.002, source.position.z);
        disc.compose(at, FLAT, size.set(radius, radius, 1));
        shadows.setMatrixAt(count++, disc);
      }
      shadows.count = count;
      shadows.instanceMatrix.needsUpdate = true;
    },
  };
};
