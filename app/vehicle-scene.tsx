'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {parts,type PartId} from './parts';
export type SceneHandle={zoom:(factor:number)=>void;reset:()=>void};
type Props={selected:PartId;explode:number;labels:boolean;autoRotate:boolean;isolated:boolean;onSelect:(id:PartId)=>void};
const offsets:Record<PartId,[number,number,number]>={body:[0,.6,0],glass:[0,2,0],doors:[0,1.1,0],cabin:[0,.7,0],battery:[0,-.85,0],drive:[0,-.18,0],suspension:[0,.08,0],wheels:[0,0,0]};
const anchors:Record<PartId,[number,number,number]>={body:[-1.9,1.02,.2],glass:[.15,1.94,0],doors:[.25,1.44,1.05],cabin:[.05,1.05,-.4],battery:[.1,.24,1.02],drive:[-1.54,.57,.2],suspension:[1.57,.83,-.83],wheels:[1.53,.46,1.1]};
const VehicleScene=forwardRef<SceneHandle,Props>(function VehicleScene(props,ref){
 const host=useRef<HTMLDivElement>(null);const latest=useRef(props);latest.current=props;
 const engine=useRef<{camera:THREE.PerspectiveCamera;controls:OrbitControls}|null>(null);const [error,setError]=useState(false);const [ready,setReady]=useState(false);
 useImperativeHandle(ref,()=>({zoom(f){const e=engine.current;if(e)e.camera.position.sub(e.controls.target).multiplyScalar(f).add(e.controls.target)},reset(){const e=engine.current;if(e){e.camera.position.set(-6.4,4.0,7.0);e.controls.target.set(0,.8,0);e.controls.update()}}}),[]);
 useEffect(()=>{
  const el=host.current!; let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{setError(true);return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(37,1,.1,70);camera.position.set(-6.4,4,7);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.8,0);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=5;controls.maxDistance=17;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.18;controls.enablePan=false;controls.autoRotateSpeed=.65;engine.current={camera,controls};
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;
  scene.add(new THREE.HemisphereLight(0xd8e9ff,0x444448,2));
  const key=new THREE.DirectionalLight(0xffffff,4);key.position.set(-4,8,4);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.bias=-.001;
  const rim=new THREE.DirectionalLight(0xa6c7eb,3);rim.position.set(3,4,-5);scene.add(rim);
  const glow=new THREE.PointLight(0xff703d,7,10);glow.position.set(1,0,4);scene.add(glow);
  const mat=(color:string,metal=.3,rough=.32)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});
  const pearl=mat('#dce2e7',.62,.26),dark=mat('#13181d',.28,.36),silver=mat('#94a2ae',.85,.25),rubber=mat('#111318',.05,.75),orange=mat('#f97645',.55,.32),blue=mat('#142b3b',.68,.15),seat=mat('#cec9bf',.05,.63);
  const groups={} as Record<PartId,THREE.Group>;parts.forEach(p=>{const g=new THREE.Group();g.name=p.id;g.userData.part=p.id;groups[p.id]=g;scene.add(g)});
  function mesh(g:THREE.Group,geometry:THREE.BufferGeometry,m:THREE.Material,pos:[number,number,number]=[0,0,0]){const o=new THREE.Mesh(geometry,m.clone());o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;o.userData.part=g.userData.part;g.add(o);return o}
  function box(g:THREE.Group,s:[number,number,number],p:[number,number,number],m:THREE.Material,r=.04){return mesh(g,new RoundedBoxGeometry(...s,3,r),m,p)}
  function cyl(g:THREE.Group,r:number,len:number,p:[number,number,number],m:THREE.Material){const o=mesh(g,new THREE.CylinderGeometry(r,r,len,36),m,p);o.rotation.x=Math.PI/2;return o}
  function tube(g:THREE.Group,points:THREE.Vector3[],r:number,m:THREE.Material){return mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,r,8,false),m)}
  // Body panels are separate curved surfaces so the study can open around the chassis.
  function surface(g:THREE.Group,sections:number[][],m:THREE.Material){const verts:number[]=[],indices:number[]=[];const n=20;sections.forEach(([x,y,w,camber])=>{for(let j=0;j<=n;j++){let t=j/n*2-1;verts.push(x,y+camber*(1-t*t),w*t)}});for(let i=0;i<sections.length-1;i++)for(let j=0;j<n;j++){let a=i*(n+1)+j,b=a+n+1;indices.push(a,b,a+1,b,b+1,a+1)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const material=m.clone();(material as THREE.MeshStandardMaterial).side=THREE.DoubleSide;return mesh(g,geo,material)}
  surface(groups.body,[[-2.47,.76,.64,.07],[-2.38,.9,.88,.12],[-2.15,1.03,.99,.09],[-1.8,1.1,1.02,.06],[-1.3,1.12,1,.055],[-1.08,1.14,.98,.04]],pearl);
  surface(groups.body,[[1.02,1.13,1.0,.04],[1.6,1.12,1.01,.08],[2.05,1.04,.97,.05],[2.4,.91,.87,.03]],pearl);
  box(groups.body,[.24,.39,1.81],[-2.32,.65,0],pearl,.10);box(groups.body,[.18,.38,1.83],[2.32,.64,0],pearl,.07);
  box(groups.body,[.08,.16,1.4],[-2.455,.61,0],dark,.03);box(groups.body,[.08,.14,1.54],[2.425,.54,0],dark,.025);
  [-1,1].forEach(side=>{
   box(groups.body,[4.15,.16,.13],[0,.43,side*.97],dark,.025);
   // Curved wheel arch side skin.
   const s=new THREE.Shape();s.moveTo(-2.38,.56);s.lineTo(-2.38,.83);s.quadraticCurveTo(-2.15,1.08,-1.6,1.11);s.lineTo(1.68,1.1);s.quadraticCurveTo(2.3,1.03,2.36,.81);s.lineTo(2.36,.5);s.lineTo(2.13,.5);s.absarc(1.57,.5,.56,0,Math.PI,false);s.lineTo(-.99,.5);s.absarc(-1.55,.5,.56,0,Math.PI,false);s.closePath();const skin=mesh(groups.body,new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025}),pearl,[0,0,side*.96]);skin.scale.z=side;
   const frontLight=box(groups.body,[.08,.075,.49],[-2.4,.89,side*.61],new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xc4e7ff,emissiveIntensity:2.5}),.025);frontLight.rotation.y=side*.21;
   box(groups.body,[.08,.07,.62],[2.4,.9,side*.57],new THREE.MeshStandardMaterial({color:0xf35555,emissive:0xf21b20,emissiveIntensity:1.3}),.02);
   box(groups.body,[.3,.11,.18],[-.85,1.28,side*1.06],pearl,.055);
  });
  // Sweeping windshield, roof and rear glass, with a continuous curved silhouette.
  const canopy=[[-1.13,1.14,.94,.04],[-.96,1.41,.85,.045],[-.65,1.72,.78,.05],[-.32,1.83,.77,.055],[.15,1.85,.77,.055],[.73,1.76,.79,.05],[1.13,1.54,.85,.04],[1.52,1.14,.94,.03]];
  surface(groups.glass,canopy,blue);
  [-1,1].forEach(side=>{tube(groups.glass,canopy.map(([x,y,w])=>new THREE.Vector3(x,y,side*w)),.026,silver);});
  [-1,1].forEach(side=>{
   const door=new THREE.Group();door.userData.part='doors';door.userData.side=side;groups.doors.add(door);
   const shape=new THREE.Shape();shape.moveTo(-1.08,1.12);shape.lineTo(-.73,1.57);shape.quadraticCurveTo(-.4,1.84,.12,1.84);shape.lineTo(.68,1.74);shape.lineTo(1.09,1.48);shape.lineTo(1.32,1.12);shape.lineTo(1.12,.59);shape.lineTo(-.94,.59);shape.closePath();
   const panel=mesh(door,new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:3,bevelSize:.025,bevelThickness:.015}),pearl,[0,0,side*.92]);panel.scale.z=side;
   const windowShape=new THREE.Shape();windowShape.moveTo(-.96,1.18);windowShape.lineTo(-.64,1.58);windowShape.quadraticCurveTo(-.35,1.76,.10,1.76);windowShape.lineTo(.62,1.66);windowShape.lineTo(1.08,1.2);windowShape.closePath();const win=mesh(door,new THREE.ShapeGeometry(windowShape),blue,[0,0,side*.985]);(win.material as THREE.Material)=blue.clone();(win.material as THREE.MeshStandardMaterial).side=THREE.DoubleSide;
   box(door,[.035,.66,.017],[-.15,1.44,side*.995],dark,.005);box(door,[.24,.025,.035],[.63,1.095,side*1.006],silver,.01);
   tube(door,[new THREE.Vector3(-.15,.62,side*.99),new THREE.Vector3(-.15,1.10,side*.99)],.007,dark);
  });
  // Floor and three rows of sculpted seat cushions.
  box(groups.cabin,[2.78,.1,1.76],[.08,.54,0],dark);
  [-.62,.25,1.08].forEach((x,row)=>[-1,1].forEach(side=>{box(groups.cabin,[.56,.16,.56],[x,.78,side*.47],seat,.08);const back=box(groups.cabin,[.17,.55,.55],[x+.25,1.08,side*.47],seat,.08);back.rotation.z=.13;box(groups.cabin,[.17,.19,.32],[x+.29,1.43,side*.47],seat,.06)}));
  box(groups.cabin,[.3,.21,1.61],[-1.04,1.1,0],dark,.065);const screen=box(groups.cabin,[.025,.27,.42],[-.855,1.22,0],blue,.02);screen.rotation.z=-.12;
  const steering=mesh(groups.cabin,new THREE.TorusGeometry(.16,.021,12,32),dark,[-.75,1.23,.48]);steering.rotation.y=Math.PI/2;
  // Battery casing with visible illustrative modules and orange high-voltage busbars.
  box(groups.battery,[2.95,.20,1.70],[0,.32,0],silver,.065);box(groups.battery,[2.8,.08,1.58],[0,.45,0],dark,.025);
  for(let x=0;x<8;x++)for(let z=0;z<4;z++)box(groups.battery,[.30,.07,.33],[-1.22+x*.35,.51,-.585+z*.39],mat('#6d827e',.65,.38),.018);
  [-1,1].forEach(s=>box(groups.battery,[2.8,.035,.035],[0,.56,s*.77],orange,.009));
  // Two motors, half-shafts and ribbed inverter housings.
  [-1.56,1.56].forEach(x=>{cyl(groups.drive,.21,.73,[x,.59,0],silver);cyl(groups.drive,.095,1.82,[x,.55,0],dark);box(groups.drive,[.46,.17,.49],[x,.82,0],silver);for(let j=0;j<7;j++)box(groups.drive,[.022,.04,.43],[x-.19+j*.065,.922,0],dark,.004);tube(groups.drive,[new THREE.Vector3(x,.75,.4),new THREE.Vector3(x*.8,.57,.58),new THREE.Vector3(x*.77,.44,.66)],.026,orange)});
  // Air springs and suspension arms remain aligned with each wheel.
  [-1.55,1.57].forEach(x=>[-1,1].forEach(side=>{const strut=cyl(groups.suspension,.09,.41,[x,.78,side*.73],silver);strut.rotation.x=0;for(let j=0;j<5;j++){const ring=mesh(groups.suspension,new THREE.TorusGeometry(.11,.028,8,24),dark,[x,.68+j*.055,side*.73]);ring.rotation.x=Math.PI/2;}[-.18,.18].forEach(dx=>tube(groups.suspension,[new THREE.Vector3(x+dx,.48,side*.37),new THREE.Vector3(x,.47,side*.96)],.026,silver))}));
  [-1.55,1.57].forEach(x=>[-1,1].forEach(side=>{const wheel=new THREE.Group();wheel.userData.part='wheels';wheel.userData.side=side;groups.wheels.add(wheel);const z=side*1.015;
   const tire=mesh(wheel,new THREE.TorusGeometry(.36,.135,20,64),rubber,[x,.49,z]);tire.scale.z=1.2;
   cyl(wheel,.34,.19,[x,.49,z],dark);cyl(wheel,.27,.035,[x,.49,z+side*.115],silver);cyl(wheel,.245,.04,[x,.49,z+side*.137],dark);
   for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const spoke=box(wheel,[.255,.042,.045],[x+Math.cos(a)*.15,.49+Math.sin(a)*.15,z+side*.169],silver,.012);spoke.rotation.z=a+.20;}
   cyl(wheel,.078,.06,[x,.49,z+side*.18],silver);box(wheel,[.085,.20,.07],[x+.2,.49,z+side*.115],orange,.024);
  }));
  // Ground catches a soft shadow without adding an opaque backdrop.
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.25}));ground.rotation.x=-Math.PI/2;ground.position.y=-.78;ground.receiveShadow=true;scene.add(ground);
  const grid=new THREE.GridHelper(20,40,0x363b3e,0x272c30);grid.position.y=-.80;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.23;scene.add(grid);
  const labelNodes=parts.map((p,i)=>{const b=document.createElement('button');b.className='scene-label';b.setAttribute('aria-label','Inspect '+p.name);b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span><strong>'+p.name+'</strong>';b.addEventListener('click',()=>latest.current.onSelect(p.id));el.appendChild(b);return {b,id:p.id}});
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  let down=new THREE.Vector2();const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  const onDown=(e:PointerEvent)=>{down.set(e.clientX,e.clientY)};const onUp=(e:PointerEvent)=>{if(down.distanceTo(new THREE.Vector2(e.clientX,e.clientY))>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(Object.values(groups),true).filter(h=>h.object.visible&&groups[h.object.userData.part as PartId]?.visible);if(hits[0])latest.current.onSelect(hits[0].object.userData.part)};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
  const lost=(e:Event)=>{e.preventDefault();setError(true)};renderer.domElement.addEventListener('webglcontextlost',lost);
  let raf=0;let amount=latest.current.explode/100;const vector=new THREE.Vector3();const clock=new THREE.Clock();let last=clock.getElapsedTime();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(){raf=requestAnimationFrame(frame);const now=clock.getElapsedTime(),dt=Math.min(now-last,.1);last=now;const p=latest.current;amount=THREE.MathUtils.damp(amount,p.explode/100,5,dt);controls.autoRotate=p.autoRotate&&!reduced;controls.update();
   parts.forEach(({id})=>{const g=groups[id],o=offsets[id];g.position.set(o[0]*amount,o[1]*amount,o[2]*amount);g.visible=!p.isolated||p.selected===id;
    if(id==='doors')g.children.forEach(child=>{if(child instanceof THREE.Group){child.position.z=child.userData.side*amount*.95;child.rotation.x=-child.userData.side*amount*.10}});
    if(id==='wheels')g.children.forEach(child=>{child.position.z=child.userData.side*amount*.90});
    g.traverse(obj=>{if(obj instanceof THREE.Mesh){const m=obj.material as THREE.MeshStandardMaterial;if(m.emissive&&m.emissiveIntensity<1){m.emissive.set(id===p.selected?'#c1532f':'#000000');m.emissiveIntensity=id===p.selected ? .16 : 0}}});
   });
   labelNodes.forEach(({b,id})=>{const a=anchors[id],o=offsets[id];vector.set(a[0]+o[0]*amount,a[1]+o[1]*amount,a[2]+o[2]*amount);if(id==='wheels')vector.z+=amount*.9;if(id==='doors')vector.z+=amount*.95;vector.project(camera);const show=p.labels&&(!p.isolated||p.selected===id)&&vector.z<1; b.style.display=show?'flex':'none';b.classList.toggle('chosen',id===p.selected);b.style.left=((vector.x*.5+.5)*el.clientWidth)+'px';b.style.top=((-vector.y*.5+.5)*el.clientHeight)+'px';b.style.zIndex=id===p.selected?'4':'3'});
   renderer.render(scene,camera);
  }frame();setReady(true);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();engine.current=null;labelNodes.forEach(x=>x.b.remove());renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});env.dispose();pmrem.dispose();room.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <><div ref={host} className="canvas-host" aria-label="Rotatable exploded 3D vehicle model"/>{!ready&&!error&&<div className="scene-loading"><span/>Preparing the studio…</div>}{error&&<div className="scene-error"><h3>The 3D view needs WebGL.</h3><p>Try a browser with hardware acceleration enabled. You can still explore every component in the panel.</p><button onClick={()=>location.reload()}>Reload the view</button></div>}</>;
});
export default VehicleScene;
