import * as THREE from 'three';

export type ExplodablePiece = {id:string;part:string;bounds:THREE.Box3};
export const overviewDirection=new THREE.Vector3(-5.7,2.1,6.3).normalize();
const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),overviewDirection).normalize();
const up=new THREE.Vector3().crossVectors(overviewDirection,right).normalize();
export const layoutCenter=new THREE.Vector3(0,3,0);

// Pack the actual projected bounds, so even neighboring trim fragments separate.
// The meshes retain their original orientation and scale throughout the transition.
export function createExplosionLayout(pieces:ExplodablePiece[]) {
 const cards=pieces.map(piece=>{
  const {min,max}=piece.bounds;let left=Infinity,bottom=Infinity,rightEdge=-Infinity,top=-Infinity;
  for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z]){
   const corner=new THREE.Vector3(x,y,z),u=corner.dot(right),v=corner.dot(up);
   left=Math.min(left,u);rightEdge=Math.max(rightEdge,u);bottom=Math.min(bottom,v);top=Math.max(top,v);
  }
  return {...piece,width:Math.max(.36,rightEdge-left)+.22,height:Math.max(.3,top-bottom)+.22,center:piece.bounds.getCenter(new THREE.Vector3())};
 }).sort((a,b)=>a.part.localeCompare(b.part)||b.height-a.height||a.id.localeCompare(b.id));
 const area=cards.reduce((sum,c)=>sum+c.width*c.height,0);
 const width=Math.max(12,Math.sqrt(area*1.6));
 let x=0,y=0,rowHeight=0;
 const slots=cards.map(card=>{
  if(x&&x+card.width>width){x=0;y+=rowHeight;rowHeight=0}
  const slot={...card,x:x+card.width/2,y:y+card.height/2};x+=card.width;rowHeight=Math.max(rowHeight,card.height);return slot;
 });
 const height=y+rowHeight;
 const result=new Map(slots.map(slot=>{
  const center=layoutCenter.clone().addScaledVector(right,slot.x-width/2).addScaledVector(up,height/2-slot.y);
  return [slot.id,{translation:center.clone().sub(slot.center),center,width:slot.width,height:slot.height,u:slot.x,v:slot.y}];
 }));
 return {pieces:result,width,height};
}
