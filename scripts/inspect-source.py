import sys
sys.path.insert(0,"/private/tmp/model-x-bpy")
import bpy,json
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/private/tmp/tesla-model-x-cgimoon.blend',use_scripts=False)
a=[]
for o in bpy.data.objects:
 if o.type=='MESH':
  pts=[o.matrix_world@Vector(v) for v in o.bound_box]
  a.append(dict(name=o.name,verts=len(o.data.vertices),faces=len(o.data.polygons),materials=[m.name if m else '' for m in o.data.materials],bbox=[[round(min(p[i] for p in pts),3) for i in range(3)],[round(max(p[i] for p in pts),3) for i in range(3)]],modifiers=[(m.type,getattr(m,'levels',None)) for m in o.modifiers]))
open('/private/tmp/model-x-meshes.json','w').write(json.dumps(a,indent=2))
print(json.dumps(a))
print('MATERIALS')
for m in bpy.data.materials:
 print(m.name,[(n.type,n.name) for n in m.node_tree.nodes] if m.use_nodes else '')
