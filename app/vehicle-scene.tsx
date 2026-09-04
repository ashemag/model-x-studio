'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createExplosionLayout,layoutCenter,overviewDirection} from './explosion-layout';
import {parts,type PartId} from './parts';
export type SceneHandle={zoom:(factor:number)=>void;reset:()=>void};
type Props={focusedMesh:string;onInspect:(id:string)=>void;selected:PartId;explode:number;labels:boolean;autoRotate:boolean;isolated:boolean;onSelect:(id:PartId)=>void};
const offsets:Record<PartId,[number,number,number]>={body:[0,.6,0],glass:[0,2,0],doors:[0,1.1,0],cabin:[0,.7,0],battery:[0,-.85,0],drive:[0,-.18,0],suspension:[0,.08,0],wheels:[0,0,0]};
const anchors:Record<PartId,[number,number,number]>={body:[-1.9,1.02,.2],glass:[.15,1.94,0],doors:[.25,1.44,1.05],cabin:[.05,1.05,-.4],battery:[.1,.24,1.02],drive:[-1.54,.57,.2],suspension:[1.57,.83,-.83],wheels:[1.53,.46,1.1]};
const VehicleScene=forwardRef<SceneHandle,Props>(function VehicleScene(props,ref){
 const host=useRef<HTMLDivElement>(null);const latest=useRef(props);latest.current=props;
 const engine=useRef<{camera:THREE.PerspectiveCamera;controls:OrbitControls;reset:()=>void;interrupt:()=>void}|null>(null);const [error,setError]=useState<string|null>(null);const [ready,setReady]=useState(false);
 useImperativeHandle(ref,()=>({zoom(f){const e=engine.current;if(e){e.interrupt();e.camera.position.sub(e.controls.target).multiplyScalar(f).add(e.controls.target)}},reset(){const e=engine.current;if(e){e.reset()}}}),[]);
 useEffect(()=>{
  setReady(false);setError(null);
  const el=host.current!; let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{setError('Your browser could not start the 3D view.');return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#050607');scene.fog=new THREE.Fog('#050607',16,55);const camera=new THREE.PerspectiveCamera(37,1,.05,500);camera.position.set(-5.7,2.9,6.3);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.8,0);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=5;controls.maxDistance=180;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.18;controls.enablePan=true;controls.autoRotateSpeed=.65;engine.current={camera,controls,reset:()=>{fitView(true);invalidated=true},interrupt:()=>{framingTime=0}};
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;
  scene.add(new THREE.HemisphereLight(0xd8e9ff,0x444448,.8));
  const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(-4,8,4);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.bias=-.001;
  const rim=new THREE.DirectionalLight(0xa6c7eb,1.8);rim.position.set(3,4,-5);scene.add(rim);
  const glow=new THREE.PointLight(0xe0c4a6,2,10);glow.position.set(1,0,4);scene.add(glow);
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
  const pieces:{node:THREE.Object3D;home:THREE.Vector3;spread:THREE.Vector3;part:PartId;id:string;bounds:THREE.Box3;center:THREE.Vector3;fullSpread:THREE.Vector3;materials:THREE.MeshStandardMaterial[]}[]=[];
  let layout:ReturnType<typeof createExplosionLayout>|null=null;
  const pieceLabels:{b:HTMLButtonElement;id:string;part:PartId;center:THREE.Vector3;spread:THREE.Vector3;fullSpread:THREE.Vector3}[]=[];
  const disposeObject=(root:THREE.Object3D)=>root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});
  new GLTFLoader().load('/models/model-x.glb?v=334',gltf=>{
   if(cancelled){disposeObject(gltf.scene);return}
   Object.values(groups).forEach(g=>g.position.set(0,0,0));scene.updateMatrixWorld(true);
   const model=gltf.scene;model.rotation.y=-Math.PI/2;scene.add(model);model.updateMatrixWorld(true);
   const nodes:THREE.Object3D[]=[];model.traverse(o=>{if(o.userData.component)nodes.push(o)});
   nodes.forEach(node=>{
    const id=node.userData.part as PartId;if(!groups[id])return;
    const component=node.userData.component as string;groups[id].attach(node);
    const bounds=new THREE.Box3().setFromObject(node);const center=bounds.getCenter(new THREE.Vector3());
    const side=Math.sign(center.z)||1;
    const spread=new THREE.Vector3(id==='body'?center.x*.17:0,0,id==='wheels'?side*.95:id==='doors'?side*.9:id==='glass'?side*.12:0);
    pieces.push({node,home:node.position.clone(),spread,part:id,id:component,bounds,center,fullSpread:new THREE.Vector3(),materials:[]});
    node.traverse(o=>{if(o instanceof THREE.Mesh){o.userData.part=id;o.userData.component=component;o.castShadow=true;o.receiveShadow=true;
     const materials=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?materials.map(m=>m.clone()):materials[0].clone();
     (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m instanceof THREE.MeshStandardMaterial){if(m instanceof THREE.MeshPhysicalMaterial&&m.transmission>0){m.transmission=0;m.metalness=.25;m.roughness=.18}
      pieces[pieces.length-1].materials.push(m);m.envMapIntensity=1.3;m.userData.baseEmission=m.emissive.clone();m.userData.baseIntensity=m.emissiveIntensity;}});
    }});
   });
   layout=createExplosionLayout(pieces);
   pieces.forEach((piece,i)=>{
    piece.fullSpread.copy(layout!.pieces.get(piece.id)!.translation);
    const b=document.createElement('button');b.className='mesh-marker';b.textContent=String(i+1);b.title=piece.node.userData.label||'Modeled piece';b.setAttribute('aria-label',`Inspect piece ${i+1}: ${b.title}`);
    b.addEventListener('click',()=>{latest.current.onSelect(piece.part);latest.current.onInspect(piece.id)});el.appendChild(b);
    pieceLabels.push({b,id:piece.id,part:piece.part,center:piece.center,spread:piece.spread,fullSpread:piece.fullSpread});
   });
   const positions=new Float32Array(pieces.length*3);markerGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
   scene.remove(model);readyRef.current=true;setReady(true);fitView(true);invalidated=true;renderer.shadowMap.needsUpdate=true;
  },undefined,()=>{if(!cancelled)setError('The detailed car could not load. Reload to try again.')});
  const markerGeometry=new THREE.BufferGeometry();
  const markerMaterial=new THREE.PointsMaterial({color:0xf6bc99,size:4,sizeAttenuation:false,depthWrite:false,depthTest:false,transparent:true,opacity:.75});
  const markers=new THREE.Points(markerGeometry,markerMaterial);markers.visible=false;markers.frustumCulled=false;markers.renderOrder=10;scene.add(markers);
  // A low display plinth and studio floor frame the car without extra render passes.
  const stage=new THREE.Group();scene.add(stage);
  const stageMaterial=new THREE.MeshStandardMaterial({color:0x454f5b,metalness:.35,roughness:.48,transparent:true});
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(3.55,3.6,.13,96),stageMaterial);plinth.position.y=-.12;plinth.receiveShadow=true;stage.add(plinth);
  const rimMaterial=new THREE.MeshStandardMaterial({color:0xa6b9c9,metalness:.7,roughness:.35,transparent:true});
  for(const radius of [3.36,3.51]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.007,5,128),rimMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=-.05;stage.add(ring)}
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x343d49,roughness:.85,metalness:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-.19;ground.receiveShadow=true;scene.add(ground);
  const grid=new THREE.GridHelper(100,100,0x657182,0x566272);grid.position.y=-.185;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.13;scene.add(grid);
  const labelNodes=parts.map((p,i)=>{const b=document.createElement('button');b.className='scene-label';b.setAttribute('aria-label','Inspect '+p.name);b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span><strong>'+p.name+'</strong>';b.addEventListener('click',()=>latest.current.onSelect(p.id));el.appendChild(b);return {b,id:p.id}});
  let viewWidth=1,viewHeight=1;
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;viewWidth=w;viewHeight=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(readyRef.current){invalidated=true;framingTime=.8}};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let down=new THREE.Vector2();const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  const onDown=(e:PointerEvent)=>{down.set(e.clientX,e.clientY)};const onUp=(e:PointerEvent)=>{if(down.distanceTo(new THREE.Vector2(e.clientX,e.clientY))>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);if(markers.visible){let nearest=-1,nearestDistance=64;pieces.forEach((piece,i)=>{vector.copy(piece.center).add(piece.node.position).sub(piece.home).add(groups[piece.part].position).project(camera);const dx=(vector.x-pointer.x)*viewWidth/2,dy=(vector.y-pointer.y)*viewHeight/2,d=dx*dx+dy*dy;if(vector.z<1&&d<nearestDistance){nearest=i;nearestDistance=d}});if(nearest>=0){latest.current.onSelect(pieces[nearest].part);latest.current.onInspect(pieces[nearest].id);return}}
   const hits=raycaster.intersectObjects(Object.values(groups),true).filter(h=>{let o:THREE.Object3D|null=h.object;while(o){if(!o.visible)return false;o=o.parent}return true});if(hits[0]){latest.current.onSelect(hits[0].object.userData.part);latest.current.onInspect(hits[0].object.userData.component||'')}};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
  const lost=(e:Event)=>{e.preventDefault();setError('The graphics connection was interrupted. Please reload the view.')};renderer.domElement.addEventListener('webglcontextlost',lost);
  let raf=0;let amount=latest.current.explode/100;const vector=new THREE.Vector3();let last=performance.now();
  let focusKey='';let previousExplosion=latest.current.explode;let framingTime=0;
  let invalidated=true,previousProps:Props|null=null,lastLabels=0,lastShadow=0;
  let labelsPending=false;let lastHighlighted='';const cameraPosition=new THREE.Vector3(),cameraQuaternion=new THREE.Quaternion();
  const homeTarget=new THREE.Vector3(0,.8,0),framingDirection=overviewDirection.clone();
  function fitView(immediate=false,dt=1/60){
   if(latest.current.isolated)return;
   const f=THREE.MathUtils.smoothstep(immediate?latest.current.explode/100:amount,.4,1);
   const target=homeTarget.clone().lerp(layoutCenter,f);
   const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
   const fullDistance=layout?Math.max(layout.height/(2*tangent),layout.width/(2*tangent*camera.aspect))*1.18+3:9;
   const assembledDistance=Math.max(10.5,7.5/camera.aspect);
   const distance=THREE.MathUtils.lerp(assembledDistance,fullDistance,f);
   const direction=immediate?overviewDirection:framingDirection.clone().lerp(overviewDirection,f).normalize();
   const blend=immediate?1:1-Math.exp(-8*dt);
   controls.target.lerp(target,blend);camera.position.lerp(target.addScaledVector(direction,distance),blend);
  }
  const stopFraming=()=>{framingTime=0};controls.addEventListener('start',stopFraming);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now:number){raf=requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;
   const p=latest.current,propsChanged=!previousProps||p.selected!==previousProps.selected||p.focusedMesh!==previousProps.focusedMesh||p.isolated!==previousProps.isolated||p.labels!==previousProps.labels||p.autoRotate!==previousProps.autoRotate;
   if(p.explode!==previousExplosion){previousExplosion=p.explode;framingTime=1.5;framingDirection.copy(camera.position).sub(controls.target).normalize()}
   const oldAmount=amount;amount=reduced?p.explode/100:THREE.MathUtils.damp(amount,p.explode/100,7,dt);if(Math.abs(amount-p.explode/100)<.0001)amount=p.explode/100;
   const moving=oldAmount!==amount,geometryChanged=moving||invalidated||propsChanged;
   const individual=THREE.MathUtils.smoothstep(amount,.4,1);
   if(scene.fog instanceof THREE.Fog){scene.fog.near=16+individual*384;scene.fog.far=55+individual*445;}
   framingTime=Math.max(0,framingTime-dt);if(framingTime>0)fitView(false,dt);
   controls.autoRotate=p.autoRotate&&!reduced;controls.update();
   const cameraChanged=camera.position.distanceToSquared(cameraPosition)>1e-10||1-Math.abs(camera.quaternion.dot(cameraQuaternion))>1e-10;
   if(!geometryChanged&&!cameraChanged&&!(labelsPending&&now-lastLabels>50))return;
   labelsPending=true;
   if(geometryChanged){
    ground.position.y=-.19-.85*amount-individual*(layout?.height||0)*.6;grid.position.y=ground.position.y+.005;
    stage.visible=amount<.18&&!p.isolated;stageMaterial.opacity=1-THREE.MathUtils.smoothstep(amount,.02,.18);rimMaterial.opacity=stageMaterial.opacity;
    renderer.shadowMap.enabled=individual<.05&&!p.isolated;ground.visible=individual<.2&&!p.isolated;grid.visible=individual<.2&&!p.isolated;
    parts.forEach(({id})=>{const g=groups[id],o=offsets[id];g.position.set(o[0]*amount*(1-individual),o[1]*amount*(1-individual),o[2]*amount*(1-individual));g.visible=!p.isolated||p.selected===id;
     if(['battery','drive','suspension'].includes(id))g.visible=g.visible&&(amount>.08||p.isolated)&&(individual<.98||p.isolated);
    });
    const positions=markerGeometry.getAttribute('position') as THREE.BufferAttribute|undefined;
    pieces.forEach((piece,i)=>{
     piece.node.position.copy(piece.home).addScaledVector(piece.spread,amount*(1-individual)).addScaledVector(piece.fullSpread,individual);
     piece.node.visible=!p.isolated||!p.focusedMesh||p.focusedMesh===piece.id;
     if(positions){vector.copy(piece.center).add(piece.node.position).sub(piece.home).add(groups[piece.part].position);positions.setXYZ(i,vector.x,vector.y,vector.z)}
    });
    if(positions)positions.needsUpdate=true;
    markers.visible=individual>.45&&!p.isolated&&!p.labels;
    markerMaterial.opacity=THREE.MathUtils.smoothstep(individual,.45,.9)*.75;
    if(p.focusedMesh!==lastHighlighted||invalidated){
     for(const piece of pieces)if(piece.id===lastHighlighted||piece.id===p.focusedMesh){
      for(const m of piece.materials){m.emissive.copy(m.userData.baseEmission);m.emissiveIntensity=m.userData.baseIntensity;if(piece.id===p.focusedMesh){m.emissive.set('#c1532f');m.emissiveIntensity=.23}}
     }
     lastHighlighted=p.focusedMesh;
    }
    if(renderer.shadowMap.enabled&&(!moving||now-lastShadow>80)){renderer.shadowMap.needsUpdate=true;lastShadow=now}
   }
   const nextFocus=p.isolated?(p.focusedMesh||p.selected):'';
   if(readyRef.current&&nextFocus!==focusKey){
    focusKey=nextFocus;
    if(nextFocus){
     const target=p.focusedMesh?pieces.find(x=>x.id===p.focusedMesh)?.node:groups[p.selected];
     if(target){scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(target);const center=bounds.getCenter(new THREE.Vector3());const extent=bounds.getSize(new THREE.Vector3()).length();const direction=camera.position.clone().sub(controls.target).normalize();controls.minDistance=.15;controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,Math.max(.4,extent*1.8));}
    }else{controls.minDistance=.15;fitView(true)}
    controls.update();
   }
   if(p.isolated&&readyRef.current&&geometryChanged){
    const target=p.focusedMesh?pieces.find(x=>x.id===p.focusedMesh)?.node:groups[p.selected];
    if(target){scene.updateMatrixWorld(true);const center=new THREE.Box3().setFromObject(target).getCenter(new THREE.Vector3());const movement=center.clone().sub(controls.target);camera.position.add(movement);controls.target.copy(center);controls.update()}
   }
   // Transform-only label updates avoid hundreds of layout writes on every frame.
   if(now-lastLabels>50||propsChanged||invalidated){
    lastLabels=now;labelsPending=false;
    labelNodes.forEach(({b,id})=>{const show=individual<.5&&readyRef.current&&p.labels&&(!['battery','drive','suspension'].includes(id)||amount>.08||p.isolated)&&(!p.isolated||p.selected===id);
     if(b.hidden===show)b.hidden=!show;if(!show)return;
     const a=anchors[id];vector.set(...a).add(groups[id].position).project(camera);b.style.display=vector.z<1?'flex':'none';b.classList.toggle('chosen',id===p.selected);
     b.style.transform=`translate3d(${(vector.x*.5+.5)*viewWidth}px,${(-vector.y*.5+.5)*viewHeight}px,0) translate(-12px,-50%)`;
    });
    pieceLabels.forEach(({b,id,part,center,spread,fullSpread})=>{
     const show=individual>.45&&(p.labels||id===p.focusedMesh)&&(!p.isolated||p.selected===part)&&(!p.isolated||!p.focusedMesh||p.focusedMesh===id);
     if(b.hidden===show)b.hidden=!show;if(!show)return;
     vector.copy(center).addScaledVector(spread,amount*(1-individual)).addScaledVector(fullSpread,individual).add(groups[part].position).project(camera);
     b.style.display=vector.z<1&&Math.abs(vector.x)<1&&Math.abs(vector.y)<1?'grid':'none';b.classList.toggle('chosen',p.focusedMesh===id);b.classList.add('numbered');
     b.style.transform=`translate3d(${(vector.x*.5+.5)*viewWidth}px,${(-vector.y*.5+.5)*viewHeight}px,0) translate(-50%,-50%)`;
    });
   }
   cameraPosition.copy(camera.position);cameraQuaternion.copy(camera.quaternion);previousProps=p;invalidated=false;
   renderer.render(scene,camera);
  }raf=requestAnimationFrame(frame);
  return()=>{cancelled=true;cancelAnimationFrame(raf);observer.disconnect();controls.removeEventListener('start',stopFraming);controls.dispose();markerGeometry.dispose();markerMaterial.dispose();engine.current=null;labelNodes.forEach(x=>x.b.remove());pieceLabels.forEach(x=>x.b.remove());renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});env.dispose();pmrem.dispose();room.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <><div ref={host} className="canvas-host" aria-label="Rotatable exploded 3D vehicle model"/>{!ready&&!error&&<div className="scene-loading"><span/>Loading the detailed Model X…</div>}{error&&<div className="scene-error"><h3>The 3D view needs a moment.</h3><p>{error}</p><button onClick={()=>location.reload()}>Reload the view</button></div>}</>;
});
export default VehicleScene;
