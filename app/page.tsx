'use client';
import {flushSync} from 'react-dom';
import {useState, useRef, useEffect} from 'react';
import {ArrowUpRight, ArrowRight, ArrowLeft, Box, Layers3, RotateCcw, Rotate3d, Plus, Minus, Maximize2, X, Crosshair, Play, Pause, ChevronRight, CircleHelp, Expand} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {parts, type PartId} from './parts';
import VehicleScene, {type SceneHandle} from './vehicle-scene';
export default function Home(){
 const [selected,setSelected]=useState<PartId>('battery');
 const [explode,setExplode]=useState(48); const [labels,setLabels]=useState(true); const [rotate,setRotate]=useState(false); const [isolated,setIsolated]=useState(false); const [tour,setTour]=useState(false); const [help,setHelp]=useState(false);
 const [tab,setTab]=useState('overview'); const scene=useRef<SceneHandle|null>(null); const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>unknown}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try { Promise.resolve(context.registerTool({name:'explore_vehicle_component',description:'Select a Model X component, set its exploded view and optionally isolate it in the 3D study.',inputSchema:{type:'object',properties:{component:{type:'string',enum:parts.map(p=>p.id)},explosion:{type:'number',minimum:0,maximum:100},isolate:{type:'boolean'}},required:['component'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input:unknown){
    const v=input as {component:PartId;explosion?:number;isolate?:boolean};
    if(!v||!parts.some(p=>p.id===v.component)||(v.explosion!==undefined&&(typeof v.explosion!=='number'||!Number.isFinite(v.explosion)||v.explosion<0||v.explosion>100))||(v.isolate!==undefined&&typeof v.isolate!=='boolean'))throw new Error('Choose a valid component and an explosion value between 0 and 100.');
    flushSync(()=>{setSelected(v.component);setTour(false);setTab('overview');if(v.explosion!==undefined)setExplode(v.explosion);if(v.isolate!==undefined)setIsolated(v.isolate)});
    return {component:v.component,description:parts.find(p=>p.id===v.component)!.description};
  }},{signal:lifecycle.signal})).catch(()=>{}); }catch{}
  return()=>lifecycle.abort();
 },[]);
 const part=parts.find(p=>p.id===selected)!; const index=parts.indexOf(part);
 function select(id:PartId){setSelected(id);setTab('overview')}
 useEffect(()=>{if(!tour)return; const t=setInterval(()=>setSelected(s=>parts[(parts.findIndex(p=>p.id===s)+1)%parts.length].id),6500);return()=>clearInterval(t)},[tour]);
 return <div className="explorer" ref={root}>
  <header className="topbar"><a className="brand" href="/" aria-label="Model X Anatomy home"><span className="brand-mark">A</span> ANATOMY<span className="brand-divider"/><span className="brand-sub">An electric perspective.</span></a><div className="top-right"><span className="edition">INTERACTIVE STUDY <span>001</span></span><button className="round-button" aria-label="How to explore" onClick={()=>setHelp(!help)}><CircleHelp size={19}/></button></div></header>
  <main className="workspace">
   <section className="viewport" aria-label="Interactive 3D Model X">
    <div className="heading"><div className="eyebrow"><span className="live-dot"/> ENGINEERED TO BE EXPLORED</div><h1>Model <span>X</span><span className="title-period">.</span></h1><p>Extraordinary. Inside out.</p></div>
    <div className="view-id"><span>TESLA</span><small>DUAL MOTOR · CONCEPT STUDY</small></div>
    <VehicleScene ref={scene} selected={selected} explode={explode} labels={labels} autoRotate={rotate} isolated={isolated} onSelect={select}/>
    <div className="scene-caption"><span className="caption-cross">+</span><span>REAL-TIME 3D<span className="caption-line"/>DRAG TO ORBIT</span></div>
    <div className="view-tools"><button onClick={()=>scene.current?.zoom(0.85)} aria-label="Zoom in"><Plus size={18}/></button><button onClick={()=>scene.current?.zoom(1.18)} aria-label="Zoom out"><Minus size={18}/></button><span/><button onClick={()=>{scene.current?.reset();setRotate(false)}} aria-label="Reset camera"><RotateCcw size={17}/></button><button onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else root.current?.requestFullscreen?.()}} aria-label="Toggle fullscreen"><Maximize2 size={17}/></button></div>
    <div className="assembly-panel"><div className="assembly-top"><div><span className="eyebrow">SEE WHAT LIES BENEATH</span><h2>One car. Many remarkable parts.</h2></div><button className="tour-button" onClick={()=>{setTour(!tour);if(!tour){setExplode(85);setSelected('body')}}}>{tour?<Pause size={14}/>:<Play size={14}/>} {tour?'Pause tour':'Take the tour'}</button></div><div className="assembly-bottom"><button className={'mode-button '+(explode===0?'active':'')} onClick={()=>setExplode(0)}><Box size={16}/> Assembled</button><div className="explode-slider"><Slider aria-label="Explode vehicle" value={[explode]} onValueChange={v=>setExplode(Array.isArray(v)?v[0]:v)} min={0} max={100}/><div><span>ASSEMBLED</span><span>{explode}% EXPLODED</span></div></div><button className={'mode-button '+(explode>0?'active':'')} onClick={()=>setExplode(100)}><Expand size={16}/> Exploded</button><div className="control-divider"/><label className="toggle-label"><Switch checked={labels} onCheckedChange={setLabels} aria-label="Show part labels"/>Labels</label><button className={'icon-toggle '+(rotate?'on':'')} onClick={()=>setRotate(!rotate)} aria-label="Toggle auto rotation" aria-pressed={rotate}><Rotate3d size={20}/></button></div></div>
   </section>
   <aside className="inspector" aria-label="Component inspector"><div className="inspector-heading"><span className="eyebrow">EXPLORE THE COMPONENTS</span><span className="count">08</span></div><div className="parts-list">{parts.map((p,i)=><button key={p.id} onClick={()=>select(p.id)} className={'part-row '+(p.id===selected?'selected':'')} aria-pressed={p.id===selected}><span className="part-number">0{i+1}</span><span>{p.name}</span><span className="part-dot"/><ChevronRight size={15}/></button>)}</div>
    <div className="detail" aria-live="polite"><div className="detail-category"><span>{part.category}</span><span>0{index+1} / 08</span></div><h2>{part.name}</h2><div className="detail-tag">{part.tag}</div><Tabs value={tab} onValueChange={v=>setTab(String(v))}><TabsList variant="line" className="detail-tabs"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="working">How it works</TabsTrigger></TabsList></Tabs><p className="detail-copy">{tab==='overview'?part.description:part.principle}</p><dl className="specs">{part.specs.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl><button className={'isolate-button '+(isolated?'is-active':'')} onClick={()=>setIsolated(!isolated)}>{isolated?<Layers3 size={16}/>:<Crosshair size={16}/>} {isolated?'Show all components':'Isolate component'}<ArrowUpRight size={16}/></button><a className="source-link" href={part.source} target="_blank" rel="noreferrer">Explore Tesla’s documentation <ArrowUpRight size={12}/></a></div>
    <div className="part-navigation"><button onClick={()=>select(parts[(index+7)%8].id)} aria-label="Previous component"><ArrowLeft size={17}/></button><span>KEEP EXPLORING</span><button onClick={()=>select(parts[(index+1)%8].id)} aria-label="Next component"><ArrowRight size={17}/></button></div>
   </aside>
  </main><footer className="footer"><span>A CLOSER LOOK CHANGES EVERYTHING.</span><span>Independent educational study · Simplified geometry, not service CAD.<span className="footer-dot">·</span>Not affiliated with Tesla.</span></footer>
  {help&&<div className="help-card" role="dialog" aria-modal="false" aria-label="Explore controls"><button className="help-close" onClick={()=>setHelp(false)} aria-label="Close help"><X size={18}/></button><h2>Make yourself curious.</h2><p>Drag the car to look around. Scroll or pinch to zoom. Pull the slider to separate the systems, then select a component to see what it does.</p><p>The model is an original, simplified spatial study of Model X. Internals and panel geometry are illustrative, not an exact engineering model.</p><button className="isolate-button" onClick={()=>setHelp(false)}>Let’s explore <ArrowRight size={16}/></button></div>}
 </div>
}
