import sys,math
sys.path.insert(0,'/private/tmp/model-x-bpy')
import bpy
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='public/models/model-x.glb')
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.18,.23,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.06));floor=bpy.context.object
m=bpy.data.materials.new('Floor');m.diffuse_color=(.045,.052,.065,1);floor.data.materials.append(m)
for pos,power,size in [((1,-3,6),1700,5),((-4,0,4),2100,4),((0,5,5),2000,3)]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.6))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(6,-8,4));o=bpy.context.object;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler();o.data.lens=48;scene.camera=o
scene.render.filepath='/private/tmp/model-x-converted.png';bpy.ops.render.render(write_still=True)
