'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {parts,type PartId} from './parts';
export type SceneHandle={zoom:(factor:number)=>void;reset:()=>void};
type Props={focusedMesh:string;onInspect:(id:string)=>void;selected:PartId;explode:number;labels:boolean;autoRotate:boolean;isolated:boolean;onSelect:(id:PartId)=>void};
const offsets:Record<PartId,[number,number,number]>={body:[0,.6,0],glass:[0,2,0],doors:[0,1.1,0],cabin:[0,.7,0],battery:[0,-.85,0],drive:[0,-.18,0],suspension:[0,.08,0],wheels:[0,0,0]};
const anchors:Record<PartId,[number,number,number]>={body:[-1.9,1.02,.2],glass:[.15,1.94,0],doors:[.25,1.44,1.05],cabin:[.05,1.05,-.4],battery:[.1,.24,1.02],drive:[-1.54,.57,.2],suspension:[1.57,.83,-.83],wheels:[1.53,.46,1.1]};
const VehicleScene=forwardRef<SceneHandle,Props>(function VehicleScene(props,ref){
 const host=useRef<HTMLDivElement>(null);const latest=useRef(props);latest.current=props;
 const engine=useRef<{camera:THREE.PerspectiveCamera;controls:OrbitControls}|null>(null);const [error,setError]=useState<string|null>(null);const [ready,setReady]=useState(false);
 useImperativeHandle(ref,()=>({zoom(f){const e=engine.current;if(e)e.camera.position.sub(e.controls.target).multiplyScalar(f).add(e.controls.target)},reset(){const e=engine.current;if(e){e.camera.position.set(-5.7,2.9,6.3);e.controls.target.set(0,.8,0);e.controls.update()}}}),[]);
 useEffect(()=>{
  const el=host.current!; let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{setError('Your browser could not start the 3D view.');return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(37,1,.1,70);camera.position.set(-5.7,2.9,6.3);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.8,0);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=5;controls.maxDistance=17;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.18;controls.enablePan=false;controls.autoRotateSpeed=.65;engine.current={camera,controls};
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;
  scene.add(new THREE.HemisphereLight(0xd8e9ff,0x444448,.8));
  const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(-4,8,4);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.bias=-.001;
  const rim=new THREE.DirectionalLight(0xa6c7eb,1.8);rim.position.set(3,4,-5);scene.add(rim);
  const glow=new THREE.PointLight(0xff703d,7,10);glow.position.set(1,0,4);scene.add(glow);
  const mat=(color:string,metal=.3,rough=.32)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});
  const dark=mat('#13181d',.28,.36),silver=mat('#94a2ae',.85,.25),orange=mat('#f97645',.55,.32);
  const groups={} as Record<PartId,THREE.Group>;parts.forEach(p=>{const g=new THREE.Group();g.name=p.id;g.userData.part=p.id;groups[p.id]=g;scene.add(g)});
  function mesh(g:THREE.Group,geometry:THREE.BufferGeometry,m:THREE.Material,pos:[number,number,number]=[0,0,0]){const o=new THREE.Mesh(geometry,m.clone());o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;o.userData.part=g.userData.part;g.add(o);return o}
  function box(g:THREE.Group,s:[number,number,number],p:[number,number,number],m:THREE.Material,r=.04){return mesh(g,new RoundedBoxGeometry(...s,3,r),m,p)}
  function cyl(g:THREE.Group,r:number,len:number,p:[number,number,number],m:THREE.Material){const o=mesh(g,new THREE.CylinderGeometry(r,r,len,36),m,p);o.rotation.x=Math.PI/2;return o}
  function tube(g:THREE.Group,points:THREE.Vector3[],r:number,m:THREE.Material){return mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,r,8,false),m)}
  // Battery casing with visible illustrative modules and orange high-voltage busbars.
  box(groups.battery,[2.95,.20,1.70],[0,.32,0],silver,.065);box(groups.battery,[2.8,.08,1.58],[0,.45,0],dark,.025);
  for(let x=0;x<8;x++)for(let z=0;z<4;z++)box(groups.battery,[.30,.07,.33],[-1.22+x*.35,.51,-.585+z*.39],mat('#6d827e',.65,.38),.018);
  [-1,1].forEach(s=>box(groups.battery,[2.8,.035,.035],[0,.56,s*.77],orange,.009));
  // Two motors, half-shafts and ribbed inverter housings.
  [-1.56,1.56].forEach(x=>{cyl(groups.drive,.21,.73,[x,.59,0],silver);cyl(groups.drive,.095,1.82,[x,.55,0],dark);box(groups.drive,[.46,.17,.49],[x,.82,0],silver);for(let j=0;j<7;j++)box(groups.drive,[.022,.04,.43],[x-.19+j*.065,.922,0],dark,.004);tube(groups.drive,[new THREE.Vector3(x,.75,.4),new THREE.Vector3(x*.8,.57,.58),new THREE.Vector3(x*.77,.44,.66)],.026,orange)});
  // Air springs and suspension arms remain aligned with each wheel.
  [-1.55,1.57].forEach(x=>[-1,1].forEach(side=>{const strut=cyl(groups.suspension,.09,.41,[x,.78,side*.73],silver);strut.rotation.x=0;for(let j=0;j<5;j++){const ring=mesh(groups.suspension,new THREE.TorusGeometry(.11,.028,8,24),dark,[x,.68+j*.055,side*.73]);ring.rotation.x=Math.PI/2;}[-.18,.18].forEach(dx=>tube(groups.suspension,[new THREE.Vector3(x+dx,.48,side*.37),new THREE.Vector3(x,.47,side*.96)],.026,silver))}));
  // The exterior, wheels and interior below are the creator's actual imported mesh.
  const readyRef={current:false};
  let cancelled=false;
  const pieces:{node:THREE.Object3D;home:THREE.Vector3;spread:THREE.Vector3;part:PartId;id:string}[]=[];
  const disposeObject=(root:THREE.Object3D)=>root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});
  new GLTFLoader().load('/models/model-x.glb?v=334',gltf=>{
   if(cancelled){disposeObject(gltf.scene);return}
   Object.values(groups).forEach(g=>g.position.set(0,0,0));scene.updateMatrixWorld(true);
   const model=gltf.scene;model.rotation.y=-Math.PI/2;scene.add(model);model.updateMatrixWorld(true);
   const nodes:THREE.Object3D[]=[];model.traverse(o=>{if(o.userData.component)nodes.push(o)});
   nodes.forEach(node=>{
    const id=node.userData.part as PartId;if(!groups[id])return;
    const component=node.userData.component as string;groups[id].attach(node);
    const center=new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
    const side=Math.sign(center.z)||1;
    const spread=new THREE.Vector3(id==='body'?center.x*.17:0,0,id==='wheels'?side*.95:id==='doors'?side*.9:id==='glass'?side*.12:0);
    pieces.push({node,home:node.position.clone(),spread,part:id,id:component});
    node.traverse(o=>{if(o instanceof THREE.Mesh){o.userData.part=id;o.userData.component=component;o.castShadow=true;o.receiveShadow=true;
     const materials=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?materials.map(m=>m.clone()):materials[0].clone();
     (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m instanceof THREE.MeshStandardMaterial){m.envMapIntensity=1.3;m.userData.baseEmission=m.emissive.clone();m.userData.baseIntensity=m.emissiveIntensity;}});
    }});
   });
   scene.remove(model);readyRef.current=true;setReady(true);
  },undefined,()=>{if(!cancelled)setError('The detailed car could not load. Reload to try again.')});
  // Ground catches a soft shadow without adding an opaque backdrop.
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.25}));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);
  const grid=new THREE.GridHelper(20,40,0x363b3e,0x272c30);grid.position.y=-.085;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.23;scene.add(grid);
  const labelNodes=parts.map((p,i)=>{const b=document.createElement('button');b.className='scene-label';b.setAttribute('aria-label','Inspect '+p.name);b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span><strong>'+p.name+'</strong>';b.addEventListener('click',()=>latest.current.onSelect(p.id));el.appendChild(b);return {b,id:p.id}});
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let down=new THREE.Vector2();const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  const onDown=(e:PointerEvent)=>{down.set(e.clientX,e.clientY)};const onUp=(e:PointerEvent)=>{if(down.distanceTo(new THREE.Vector2(e.clientX,e.clientY))>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(Object.values(groups),true).filter(h=>{let o:THREE.Object3D|null=h.object;while(o){if(!o.visible)return false;o=o.parent}return true});if(hits[0]){latest.current.onSelect(hits[0].object.userData.part);latest.current.onInspect(hits[0].object.userData.component||'')}};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
  const lost=(e:Event)=>{e.preventDefault();setError('The graphics connection was interrupted. Please reload the view.')};renderer.domElement.addEventListener('webglcontextlost',lost);
  let raf=0;let amount=latest.current.explode/100;const vector=new THREE.Vector3();const clock=new THREE.Clock();let last=clock.getElapsedTime();
  let focusKey='';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(){raf=requestAnimationFrame(frame);const now=clock.getElapsedTime(),dt=Math.min(now-last,.1);last=now;const p=latest.current;amount=THREE.MathUtils.damp(amount,p.explode/100,5,dt);controls.autoRotate=p.autoRotate&&!reduced;controls.update();
   parts.forEach(({id})=>{const g=groups[id],o=offsets[id];g.position.set(o[0]*amount,o[1]*amount,o[2]*amount);g.visible=!p.isolated||p.selected===id;
    if(['battery','drive','suspension'].includes(id))g.visible=g.visible&&(amount>.08||p.isolated);
   });
   pieces.forEach(({node,home,spread,part,id})=>{
    node.position.copy(home).addScaledVector(spread,amount);
    node.visible=!p.isolated||!p.focusedMesh||p.focusedMesh===id;
    node.traverse(o=>{if(o instanceof THREE.Mesh){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
     if(m instanceof THREE.MeshStandardMaterial){m.emissive.copy(m.userData.baseEmission);m.emissiveIntensity=m.userData.baseIntensity;
      if(p.focusedMesh===id){m.emissive.set('#c1532f');m.emissiveIntensity=.23}
     }
    })}});
   });
   const nextFocus=p.isolated?(p.focusedMesh||p.selected):'';
   if(readyRef.current&&nextFocus!==focusKey){
    focusKey=nextFocus;
    if(nextFocus){
     const target=p.focusedMesh?pieces.find(x=>x.id===p.focusedMesh)?.node:groups[p.selected];
     if(target){scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(target);const center=bounds.getCenter(new THREE.Vector3());const extent=bounds.getSize(new THREE.Vector3()).length();const direction=camera.position.clone().sub(controls.target).normalize();controls.minDistance=.15;controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,Math.max(.4,extent*1.8));}
    }else{controls.minDistance=5;controls.target.set(0,.8,0);camera.position.set(-5.7,2.9,6.3)}
    controls.update();
   }
   labelNodes.forEach(({b,id})=>{const a=anchors[id],o=offsets[id];vector.set(a[0]+o[0]*amount,a[1]+o[1]*amount,a[2]+o[2]*amount);if(id==='wheels')vector.z+=amount*.9;if(id==='doors')vector.z+=amount*.95;vector.project(camera);const show=readyRef.current&&p.labels&&(!['battery','drive','suspension'].includes(id)||amount>.08||p.isolated)&&(!p.isolated||p.selected===id)&&vector.z<1; b.style.display=show?'flex':'none';b.classList.toggle('chosen',id===p.selected);b.style.left=((vector.x*.5+.5)*el.clientWidth)+'px';b.style.top=((-vector.y*.5+.5)*el.clientHeight)+'px';b.style.zIndex=id===p.selected?'4':'3'});
   renderer.render(scene,camera);
  }frame();
  return()=>{cancelled=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();engine.current=null;labelNodes.forEach(x=>x.b.remove());renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});env.dispose();pmrem.dispose();room.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <><div ref={host} className="canvas-host" aria-label="Rotatable exploded 3D vehicle model"/>{!ready&&!error&&<div className="scene-loading"><span/>Loading the detailed Model X…</div>}{error&&<div className="scene-error"><h3>The 3D view needs a moment.</h3><p>{error}</p><button onClick={()=>location.reload()}>Reload the view</button></div>}</>;
});
export default VehicleScene;
