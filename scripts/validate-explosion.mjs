import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {createExplosionLayout,layoutCenter,overviewDirection} from '../app/explosion-layout.ts';
const bytes=fs.readFileSync('public/models/model-x.glb');
const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
asset.scene.rotation.y=-Math.PI/2;asset.scene.updateMatrixWorld(true);
const input=[];
asset.scene.traverse(o=>{if(o.userData.component)input.push({id:o.userData.component,part:o.userData.part,bounds:new THREE.Box3().setFromObject(o)});});
const result=createExplosionLayout(input);assert.equal(result.pieces.size,334);
const slots=[...result.pieces.values()];
for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
 const a=slots[i],b=slots[j];
 assert(Math.abs(a.u-b.u)>=(a.width+b.width)/2-1e-7||Math.abs(a.v-b.v)>=(a.height+b.height)/2-1e-7,`Pieces ${i} and ${j} overlap`);
}
for(const aspect of [.7,1.3,2]){
 const camera=new THREE.PerspectiveCamera(37,aspect,.05,500);const tan=Math.tan(THREE.MathUtils.degToRad(37/2));
 const distance=Math.max(result.height/(2*tan),result.width/(2*tan*aspect))*1.18+3;
 camera.position.copy(layoutCenter).addScaledVector(overviewDirection,distance);camera.lookAt(layoutCenter);camera.updateMatrixWorld(true);
 for(const p of input){const slot=result.pieces.get(p.id);for(const x of [p.bounds.min.x,p.bounds.max.x])for(const y of [p.bounds.min.y,p.bounds.max.y])for(const z of [p.bounds.min.z,p.bounds.max.z]){
  const projected=new THREE.Vector3(x,y,z).add(slot.translation).project(camera);
  assert(Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&projected.z<1,`Piece ${p.id} outside view at ${aspect}`);
 }}
}
console.log(`Validated ${slots.length} distinct, non-overlapping projected slots; full model fits at three viewport proportions.`);
