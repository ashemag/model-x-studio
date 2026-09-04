'use client';
import {flushSync} from 'react-dom';
import {useState, useRef, useEffect} from 'react';
import {ArrowUpRight, Box, Layers3, RotateCcw, Rotate3d, Plus, Minus, Maximize2, X, Crosshair, ChevronRight, CircleHelp, Expand, MoreHorizontal} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {parts,describePiece, type PartId} from './parts';
import VehicleScene, {type SceneHandle} from './vehicle-scene';
export default function Home(){
 const [selected,setSelected]=useState<PartId>('body');
 const [canFullscreen,setCanFullscreen]=useState(false);
 const [compact,setCompact]=useState(false);const [toolsOpen,setToolsOpen]=useState(false);
 const [componentsOpen,setComponentsOpen]=useState(false);const [detailOpen,setDetailOpen]=useState(false);
 const [explode,setExplode]=useState(0); const [labels,setLabels]=useState(false); const [rotate,setRotate]=useState(false); const [isolated,setIsolated]=useState(false); const [help,setHelp]=useState(false);
 useEffect(()=>{setCanFullscreen(Boolean(document.fullscreenEnabled));const query=window.matchMedia('(max-width: 700px), (max-height: 500px)');const update=()=>{setCompact(query.matches);setComponentsOpen(!query.matches);setToolsOpen(false)};update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 const [focusedMesh,setFocusedMesh]=useState('');
 const [catalog,setCatalog]=useState<{id:string;part:PartId;label:string}[]>([]);
 useEffect(()=>{fetch('/models/model-x-manifest.json').then(r=>r.json()).then(m=>setCatalog((m as {objects:{id:string;part:PartId;label:string}[]}).objects)).catch(()=>{});},[]);
 const [tab,setTab]=useState('overview'); const scene=useRef<SceneHandle|null>(null); const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>unknown}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try { Promise.resolve(context.registerTool({name:'explore_vehicle_component',description:'Select a Model X component, set its exploded view and optionally isolate it in the 3D study.',inputSchema:{type:'object',properties:{component:{type:'string',enum:parts.map(p=>p.id)},explosion:{type:'number',minimum:0,maximum:100},isolate:{type:'boolean'}},required:['component'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input:unknown){
    const v=input as {component:PartId;explosion?:number;isolate?:boolean};
    if(!v||!parts.some(p=>p.id===v.component)||(v.explosion!==undefined&&(typeof v.explosion!=='number'||!Number.isFinite(v.explosion)||v.explosion<0||v.explosion>100))||(v.isolate!==undefined&&typeof v.isolate!=='boolean'))throw new Error('Choose a valid component and an explosion value between 0 and 100.');
    flushSync(()=>{setSelected(v.component);setFocusedMesh('');setDetailOpen(true);setTab('overview');if(window.matchMedia('(max-width: 700px), (max-height: 500px)').matches){setComponentsOpen(false);setHelp(false)}if(v.explosion!==undefined)setExplode(v.explosion);if(v.isolate!==undefined)setIsolated(v.isolate)});
    return {component:v.component,description:parts.find(p=>p.id===v.component)!.description};
  }},{signal:lifecycle.signal})).catch(()=>{}); }catch{}
  return()=>lifecycle.abort();
 },[]);
 const part=parts.find(p=>p.id===selected)!; const piece=catalog.find(p=>p.id===focusedMesh);
 function select(id:PartId){setFocusedMesh('');setSelected(id);setTab('overview');setDetailOpen(true);if(compact){setComponentsOpen(false);setHelp(false);setToolsOpen(false)}}
 function toggleComponents(){setComponentsOpen(!componentsOpen);if(compact){setDetailOpen(false);setHelp(false);setToolsOpen(false)}}
 function toggleHelp(){setHelp(!help);if(compact){setComponentsOpen(false);setDetailOpen(false);setToolsOpen(false)}}

 return <main className="studio" ref={root}>
  <section className="stage-view" aria-label="Interactive Model X studio">
   <VehicleScene focusedMesh={focusedMesh} onInspect={setFocusedMesh} ref={scene} selected={selected} explode={explode} labels={labels} autoRotate={rotate} isolated={isolated} onSelect={select}/>
  </section>
  <div className="model-plaque"><span>T E S L A</span><h1>MODEL X</h1></div>
  {componentsOpen&&<aside className="components-panel floating-panel" aria-label="Components">
   <div className="panel-heading"><h2>Components</h2><button className="icon-button" onClick={()=>setComponentsOpen(false)} aria-label="Hide components"><X size={14}/></button></div>
   <div className="parts-list">{parts.map((p,i)=><button key={p.id} onClick={()=>select(p.id)} className={'part-row '+(p.id===selected&&detailOpen?'selected':'')} aria-pressed={p.id===selected&&detailOpen}><span className="part-number">{String(i+1).padStart(2,'0')}</span><span>{p.name}</span><ChevronRight size={13}/></button>)}</div>
  </aside>}
  <nav className="view-tools floating-panel" data-expanded={toolsOpen} aria-label="View controls">
   <button className={'tools-components '+(componentsOpen?'active':'')} title="Components" onClick={toggleComponents} aria-label="Toggle components" aria-pressed={componentsOpen}><Layers3 size={18}/></button>
   <span/>
   <button className="tools-extra" title="Zoom in" onClick={()=>scene.current?.zoom(.85)} aria-label="Zoom in"><Plus size={18}/></button>
   <button className="tools-extra" title="Zoom out" onClick={()=>scene.current?.zoom(1.18)} aria-label="Zoom out"><Minus size={18}/></button>
   <button className="tools-reset" title="Reset view" onClick={()=>{setRotate(false);scene.current?.reset()}} aria-label="Reset view"><RotateCcw size={17}/></button>
   <button className={'tools-extra '+(rotate?'active':'')} title="Auto rotate" onClick={()=>setRotate(!rotate)} aria-label="Toggle auto rotation" aria-pressed={rotate}><Rotate3d size={18}/></button>
   <span/>
   {canFullscreen&&<button className="tools-extra" title="Fullscreen" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else root.current?.requestFullscreen?.()}} aria-label="Toggle fullscreen"><Maximize2 size={17}/></button>}
   <button className="tools-extra" title="About this model" onClick={toggleHelp} aria-label="About this model" aria-expanded={help}><CircleHelp size={17}/></button>
   <button className="tools-more" title="More view controls" onClick={()=>setToolsOpen(!toolsOpen)} aria-label="More view controls" aria-expanded={toolsOpen}><MoreHorizontal size={20}/></button>
  </nav>
  {detailOpen&&<aside className="detail-panel floating-panel" aria-label="Component details">
   <div className="panel-heading"><span>{part.category}{['battery','drive','suspension'].includes(selected)&&<span className="illustrative-badge">Illustrative</span>}</span><button className="icon-button" onClick={()=>setDetailOpen(false)} aria-label="Close details"><X size={16}/></button></div>
   <div className="detail" aria-live="polite">
    <h2>{piece?piece.label:part.name}</h2>
    <Tabs value={tab} onValueChange={v=>setTab(String(v))}><TabsList variant="line" className="detail-tabs"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="working">How it works</TabsTrigger></TabsList></Tabs>
    <p className="detail-copy">{piece&&tab==='overview'?describePiece(piece.label):tab==='overview'?part.description:part.principle}</p>
    <dl className="specs">{part.specs.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
    {catalog.some(p=>p.part===selected)&&<div className="piece-picker"><span>Individual pieces</span><Select value={focusedMesh||'all'} onValueChange={value=>setFocusedMesh(value==='all'?'':String(value))}><SelectTrigger aria-label="Choose an individual mesh piece"><SelectValue>{piece?piece.label:`All ${catalog.filter(p=>p.part===selected).length} pieces`}</SelectValue></SelectTrigger><SelectContent alignItemWithTrigger={false}>{[{id:'all',label:'All pieces in this system'},...catalog.filter(p=>p.part===selected)].map((p,i)=><SelectItem key={p.id} value={p.id}>{i?`${String(i).padStart(2,'0')} · `:''}{p.label}</SelectItem>)}</SelectContent></Select></div>}
    <button className={'isolate-button '+(isolated?'is-active':'')} onClick={()=>setIsolated(!isolated)}>{isolated?<Layers3 size={15}/>:<Crosshair size={15}/>} {isolated?'Show everything':focusedMesh?'Isolate piece':'Isolate component'}</button>
    <a className="source-link" href={part.source} target="_blank" rel="noreferrer">Tesla documentation <ArrowUpRight size={12}/></a>
   </div>
  </aside>}
  <div className="explode-dock floating-panel" aria-label="Assembly controls">
   <button className={'assembly-button '+(explode===0?'active':'')} title="Assemble" onClick={()=>{setExplode(0);setIsolated(false)}} aria-label="Assemble vehicle"><Box size={18}/><span>Assemble</span></button>
   <div className="explode-control"><div className="slider-caption"><label id="explode-label">Explode</label><output>{explode===100?`${catalog.length} pieces`:`${explode}%`}</output></div><Slider aria-labelledby="explode-label" value={[explode]} onValueChange={v=>setExplode(Array.isArray(v)?v[0]:v)} min={0} max={100}/></div>
   <button className={'assembly-button '+(explode===100?'active':'')} title="Separate all pieces" onClick={()=>{setExplode(100);setIsolated(false)}} aria-label="Separate all pieces"><Expand size={18}/><span>All parts</span></button>
   <div className="dock-divider"/><label className="labels-toggle"><Switch checked={labels} onCheckedChange={setLabels} aria-label="Show labels"/><span>Labels</span></label>
  </div>
  {help&&<aside className="about-panel floating-panel" aria-label="About this model"><div className="panel-heading"><h2>About the model</h2><button className="icon-button" onClick={()=>setHelp(false)} aria-label="Close model information"><X size={15}/></button></div><p>Drag to orbit. Pinch or scroll to zoom. Select a component for details; use the slider to separate the car.</p><p>Pre-refresh Model X by <a href="https://www.blendkit.com/asset-gallery-detail/983e8f94-5a56-44a4-94d9-eed5e4cdcd6c/" target="_blank" rel="noreferrer">cgi Moon</a>. The {catalog.length||334} mesh pieces are modeled geometry, not a complete Tesla parts catalog. Battery, drive and suspension are illustrative. Not affiliated with Tesla.</p></aside>}
 </main>
}
