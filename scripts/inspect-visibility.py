import sys
sys.path.insert(0,"/private/tmp/model-x-bpy")
import bpy,json
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/private/tmp/tesla-model-x-cgimoon.blend',use_scripts=False)

for o in bpy.data.objects:
 print(o.name,'hidden',o.hide_render,o.hide_get(),'location',list(o.location),'delta',list(o.delta_location),'collections',[(c.name,c.hide_render,c.hide_viewport) for c in o.users_collection])
