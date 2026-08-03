import bpy, bmesh, math
from mathutils import Vector

# ---------------------------------------------------------------- reset scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
    for d in list(blk):
        blk.remove(d)

# ---------------------------------------------------------------- materials
def new_mat(name, color, rough=0.5, metallic=0.0, emit=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = mat.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metallic
    if emit > 0:
        try:
            b.inputs['Emission Color'].default_value = (*color, 1)
        except Exception:
            try: b.inputs['Emission'].default_value = (*color, 1)
            except Exception: pass
        try: b.inputs['Emission Strength'].default_value = emit
        except Exception: pass
    return mat

skin   = new_mat('Skin',    (1.00, 0.79, 0.66), 0.62)
hair   = new_mat('Hair',    (0.40, 0.14, 0.48), 0.30)
white  = new_mat('EyeWhite',(1.00, 1.00, 1.00), 0.25)
iris   = new_mat('Iris',    (0.20, 0.60, 0.90), 0.20, emit=0.35)
pupil  = new_mat('Pupil',   (0.03, 0.03, 0.08), 0.20)
shine  = new_mat('Shine',   (1.00, 1.00, 1.00), 0.10, emit=1.2)
mouthm = new_mat('Mouth',   (0.80, 0.24, 0.34), 0.40)
blush  = new_mat('Blush',   (1.00, 0.55, 0.58), 0.60)
brow   = new_mat('Brow',    (0.32, 0.10, 0.40), 0.35)

def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True

# ---------------------------------------------------------------- head
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=36, radius=1.0)
head = bpy.context.active_object
head.name = 'Head'
me = head.data
bm = bmesh.new(); bm.from_mesh(me)
for v in bm.verts:
    x, y, z = v.co
    if z < 0:                      # jaw + chin
        t = -z
        taper = 1.0 - 0.50 * t
        v.co.x = x * taper
        v.co.y = y * taper
        v.co.z = z * 1.28
    if y < 0:                      # flatten the face front slightly
        v.co.y = y * 0.90
bm.to_mesh(me); bm.free()
smooth(head); assign(head, skin)

# neck
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.34, depth=0.7,
                                     location=(0, 0.05, -1.35))
neck = bpy.context.active_object; neck.name = 'Neck'
smooth(neck); assign(neck, skin)

# ---------------------------------------------------------------- eyes
def make_eye(sign):
    x = 0.40 * sign
    z = 0.00
    y = -0.80
    # sclera
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=24, radius=1.0,
                                         location=(x, y, z))
    e = bpy.context.active_object; e.name = f'EyeWhite_{sign}'
    e.scale = (0.26, 0.10, 0.34)
    e.rotation_euler = (0, 0, math.radians(-8 * sign))
    smooth(e); assign(e, white)
    # iris
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1.0,
                                         location=(x, y - 0.05, z - 0.02))
    ir = bpy.context.active_object; ir.name = f'Iris_{sign}'
    ir.scale = (0.17, 0.09, 0.24)
    smooth(ir); assign(ir, iris)
    # pupil
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=1.0,
                                         location=(x, y - 0.09, z - 0.02))
    pu = bpy.context.active_object; pu.name = f'Pupil_{sign}'
    pu.scale = (0.09, 0.07, 0.13)
    smooth(pu); assign(pu, pupil)
    # highlight
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=1.0,
                                         location=(x + 0.05*sign, y - 0.13, z + 0.08))
    hl = bpy.context.active_object; hl.name = f'Shine_{sign}'
    hl.scale = (0.05, 0.04, 0.06)
    smooth(hl); assign(hl, shine)
    # eyebrow
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, -0.86, 0.34))
    eb = bpy.context.active_object; eb.name = f'Brow_{sign}'
    eb.scale = (0.20, 0.03, 0.02)
    eb.rotation_euler = (0, 0, math.radians(-10 * sign))
    assign(eb, brow)

make_eye(+1)
make_eye(-1)

# ---------------------------------------------------------------- blush
for sign in (+1, -1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=1.0,
                                         location=(0.55*sign, -0.72, -0.28))
    bl = bpy.context.active_object; bl.name = f'Blush_{sign}'
    bl.scale = (0.16, 0.05, 0.10)
    smooth(bl); assign(bl, blush)

# ---------------------------------------------------------------- smiling mouth
crv = bpy.data.curves.new('MouthCurve', 'CURVE')
crv.dimensions = '3D'
crv.bevel_depth = 0.028
crv.bevel_resolution = 3
sp = crv.splines.new('BEZIER')
sp.bezier_points.add(2)
pts = [(-0.24, -0.86, -0.42), (0.0, -0.92, -0.52), (0.24, -0.86, -0.42)]  # corners up = smile
for bp, co in zip(sp.bezier_points, pts):
    bp.co = co
    bp.handle_left_type = bp.handle_right_type = 'AUTO'
mouth = bpy.data.objects.new('Mouth', crv)
bpy.context.collection.objects.link(mouth)
assign(mouth, mouthm)

# tiny nose
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=1.0,
                                     location=(0.0, -0.90, -0.20))
nose = bpy.context.active_object; nose.name = 'Nose'
nose.scale = (0.05, 0.05, 0.05)
smooth(nose); assign(nose, skin)

# ---------------------------------------------------------------- hair (cap + long back + bangs)
def carve_face(obj, y_thr=-0.18, z_lo=-2.2, z_hi=0.78):
    m = obj.data
    b = bmesh.new(); b.from_mesh(m)
    dead = []
    for f in b.faces:
        cy = sum(v.co.y for v in f.verts) / len(f.verts)
        cz = sum(v.co.z for v in f.verts) / len(f.verts)
        if cy < y_thr and z_lo < cz < z_hi:
            dead.append(f)
    bmesh.ops.delete(b, geom=dead, context='FACES')
    b.to_mesh(m); b.free()

# long back hair mass
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=40, radius=1.0,
                                     location=(0, 0.06, 0))
hb = bpy.context.active_object; hb.name = 'Hair_back'
m = hb.data
b = bmesh.new(); b.from_mesh(m)
for v in b.verts:
    v.co.x *= 1.16
    v.co.y *= 1.12
    if v.co.z < 0.25:                       # drape long downward
        v.co.z = 0.25 + (v.co.z - 0.25) * 2.7
        v.co.x *= 1.05
    if v.co.y > 0:                          # extra volume behind
        v.co.y *= 1.08
b.to_mesh(m); b.free()
carve_face(hb, y_thr=-0.16, z_lo=-3.2, z_hi=0.72)
smooth(hb); assign(hb, hair)

# hair cap over the crown / forehead
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=36, radius=1.0,
                                     location=(0, 0.02, 0.05))
hc = bpy.context.active_object; hc.name = 'Hair_cap'
hc.scale = (1.10, 1.10, 1.08)
carve_face(hc, y_thr=-0.30, z_lo=-1.2, z_hi=0.48)   # keep forehead fringe, open the face
smooth(hc); assign(hc, hair)

# bangs / fringe: soft rounded strands across the forehead (tips above the eyes)
bang_x = (-0.66, -0.44, -0.22, 0.0, 0.22, 0.44, 0.66)
for i, x in enumerate(bang_x):
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.26, radius2=0.11,
                                    depth=0.52, location=(x, -0.84, 0.70))
    bg = bpy.context.active_object; bg.name = f'Bang_{i}'
    bg.rotation_euler = (math.radians(182), 0, math.radians(5 * (i - 3)))
    bg.scale = (1.0, 0.5, 1.0)
    smooth(bg); assign(bg, hair)

# two long front side locks framing the face
for sign in (+1, -1):
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.24, radius2=0.03,
                                    depth=2.2, location=(0.95*sign, -0.55, -0.7))
    lk = bpy.context.active_object; lk.name = f'Lock_{sign}'
    lk.rotation_euler = (math.radians(6), 0, math.radians(10*sign))
    lk.scale = (1.0, 0.6, 1.0)
    smooth(lk); assign(lk, hair)

# ---------------------------------------------------------------- lights, camera, render
scene = bpy.context.scene
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try:
        scene.render.engine = eng; break
    except Exception:
        continue

world = bpy.data.worlds[0] if bpy.data.worlds else bpy.data.worlds.new('W')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.80, 0.85, 0.93, 1)
    bg.inputs['Strength'].default_value = 0.45

def add_area(loc, energy, size=6):
    bpy.ops.object.light_add(type='AREA', location=loc)
    L = bpy.context.active_object
    L.data.energy = energy; L.data.size = size
    return L
key = add_area((-3, -4, 3), 520)
key.rotation_euler = (math.radians(55), 0, math.radians(-35))
fill = add_area((3.5, -3, 1.5), 240)
fill.rotation_euler = (math.radians(70), 0, math.radians(45))
rim = add_area((0, 4, 3), 300)
rim.rotation_euler = (math.radians(120), 0, 0)

bpy.ops.object.camera_add(location=(0, -5.1, -0.15))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(90), 0, 0)
cam.data.lens = 55
scene.camera = cam

scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.film_transparent = False
scene.render.filepath = r"C:\Users\salam\Documents\Programacion\Mideas\anime_head_render.png"
bpy.ops.render.render(write_still=True)
print("RENDER_DONE objects=", len(bpy.data.objects))
