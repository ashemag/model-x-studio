import sys, json, os
sys.path.insert(0,'/private/tmp/model-x-bpy')
import bpy
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/private/tmp/tesla-model-x-cgimoon.blend',use_scripts=False)
bpy.context.view_layer.update()
worlds={o.name:o.matrix_world.copy() for o in bpy.data.objects}
for o in bpy.data.objects:
 o.parent=None;o.matrix_world=worlds[o.name]
bpy.context.view_layer.update()
for o in list(bpy.data.objects):
 if o.type!='MESH' or not len(o.data.polygons): continue
 for mod in list(o.modifiers):
  if mod.type=='SUBSURF': mod.levels=2 if o.name in ['Plane.028','Cube.004'] else 1;mod.render_levels=mod.levels
  if mod.type=='NODES': o.modifiers.remove(mod)
# Exportable physical materials; the source uses Cycles-only custom node groups.
for m in bpy.data.materials:
 name=m.name.lower(); m.use_nodes=True; m.node_tree.nodes.clear()
 out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');p=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');m.node_tree.links.new(p.outputs['BSDF'],out.inputs['Surface'])
 color=(.025,.03,.037,1);metal=.0;rough=.4
 if 'carpaint' in name: color=(.22,.29,.38,1);metal=.55;rough=.29;p.inputs['Coat Weight'].default_value=.7;p.inputs['Coat Roughness'].default_value=.16
 elif any(s in name for s in ['chrome','rims','disk','nuts','logo','mirror','border plate']): color=(.55,.59,.64,1);metal=.92;rough=.2
 elif name.startswith('windows'): color=(.012,.022,.035,1);metal=.35;rough=.105
 elif 'headlights' in name or 'frontbumperlightsshield' in name: color=(.3,.4,.5,1);rough=.15;p.inputs['Transmission Weight'].default_value=.8
 elif 'interior' in name: color=(.15,.13,.115,1);rough=.7
 elif 'tyre' in name: color=(.016,.018,.021,1);rough=.72
 elif 'redback' in name or 'backlightsshield' in name: color=(.36,.009,.013,1);rough=.22
 elif 'yellow' in name:color=(.8,.22,.01,1)
 elif 'white' in name: color=(.8,.88,1,1);p.inputs['Emission Color'].default_value=(.65,.8,1,1);p.inputs['Emission Strength'].default_value=1.1
 p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
# Evaluate modifiers first, then split genuine disconnected source geometry.
bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
snapshots={o.name:bpy.data.meshes.new_from_object(o.evaluated_get(deps),depsgraph=deps) for o in bpy.context.scene.objects if o.type=='MESH'}
for o in list(bpy.context.scene.objects):
 if o.type!='MESH' or not len(o.data.polygons):continue
 name=o.name; data=snapshots[name]
 o.modifiers.clear();o.data=data
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 for other in bpy.context.selected_objects:
  if other!=o:other.select_set(False)
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
 for piece in bpy.context.selected_objects:piece['source_object']=name
 bpy.ops.object.select_all(action='DESELECT')
for o in list(bpy.data.objects):
 if o.type!='MESH' or not len(o.data.polygons):bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.update()
entries=[]
for i,o in enumerate(list(bpy.context.scene.objects)):
 if o.type!='MESH' or not len(o.data.polygons):continue
 pts=[o.matrix_world@Vector(v) for v in o.bound_box];lo=Vector([min(p[a] for p in pts) for a in range(3)]);hi=Vector([max(p[a] for p in pts) for a in range(3)]);c=(lo+hi)/2;size=hi-lo
 used={p.material_index for p in o.data.polygons};mats=' '.join(m.name.lower() for n,m in enumerate(o.data.materials) if m and n in used);source=o.get('source_object',o.name)
 group='body';label='Exterior detail'
 if any(s in mats for s in ['tyre','rims','tiresnuts','disk']):group='wheels';label='Wheel and brake detail'
 elif source=='interiors':group='cabin';label='Interior trim and seating'
 elif 'windows' in mats and 'carpaint' not in mats and 'border' not in mats:group='glass';label='Glazing'
 elif source=='Plane.028':
  if 'windows.' in mats or mats=='windows':group='glass';label='Windshield' if c.y<0 and abs(c.x)<.2 else 'Rear glass' if c.y>1.5 else 'Side or roof glass'
  elif abs(c.x)>.5 and -.95<c.y<1.4 and size.y>.35 and size.z>.3:group='doors';label='Front door panel' if c.y<.3 else 'Falcon wing door panel'
  elif c.y<-1.3 and size.x>1 and c.z>.75:label='Hood'
  elif c.y<-1.8 and size.x>1:label='Front bumper'
  elif c.y>1.8 and size.x>1:label='Liftgate panel' if c.z>.75 else 'Rear bumper'
  elif abs(c.x)>.7 and size.z>.4:label='Fender / quarter panel'
  else:label='Body trim and seals'
 elif any(s in mats for s in ['lights','headlight']):label='Rear lighting element' if c.y>0 else 'Front lighting element'
 elif 'logo' in mats:label='Tesla emblem'
 elif 'mirror' in mats:label='Side mirror'
 elif 'chrome' in mats:label='Chrome trim'
 elif 'blackplastic' in mats:label='Lower trim and liner'
 if group=='wheels':
  label='Tire and tread' if 'tyre' in mats else 'Brake disc' if 'disk' in mats else 'Wheel fastener' if 'nuts' in mats else 'Alloy wheel detail'
 if abs(c.x)>.3:label+=(' · left' if c.x>0 else ' · right')
 if group=='wheels':label+=(' · front' if c.y<0 else ' · rear')
 o.name=f'{group}_{i:04d}';o['part']=group;o['label']=label;o['component']=o.name
 entries.append({'id':o.name,'part':group,'label':label,'source':source,'center':list(c),'size':list(size),'faces':len(o.data.polygons)})
os.makedirs('public/models',exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/models/model-x.glb'),export_format='GLB',export_extras=True,export_cameras=False,export_lights=False,export_yup=True)
open('public/models/model-x-manifest.json','w').write(json.dumps({'creator':'cgi Moon','modelYear':'Pre-refresh; exact year unverified','source':'https://www.blendkit.com/asset-gallery-detail/983e8f94-5a56-44a4-94d9-eed5e4cdcd6c/','objects':entries},indent=2))
print('EXPORTED',len(entries),'pieces',sum(e['faces'] for e in entries),'faces')
print('BOUNDS',[(o.name,[round(v,2) for v in o.dimensions]) for o in bpy.context.scene.objects if max(o.dimensions)>5.5])
