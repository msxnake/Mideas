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
        for key in ('Emission Color', 'Emission'):
            try: b.inputs[key].default_value = (*color, 1); break
            except Exception: pass
        try: b.inputs['Emission Strength'].default_value = emit
        except Exception: pass
    return mat

skin   = new_mat('Skin',    (1.00, 0.82, 0.71), 0.60)
hair   = new_mat('Hair',    (0.19, 0.10, 0.07), 0.34)   # dark warm brown
white  = new_mat('EyeWhite',(1.00, 1.00, 1.00), 0.25)
iris   = new_mat('Iris',    (0.55, 0.36, 0.74), 0.30, emit=0.30)  # violet eyes
pupil  = new_mat('Pupil',   (0.05, 0.03, 0.09), 0.20)
shine  = new_mat('Shine',   (1.00, 1.00, 1.00), 0.10, emit=1.4)
lips   = new_mat('Lips',    (0.84, 0.40, 0.44), 0.40)
teeth  = new_mat('Teeth',   (0.98, 0.96, 0.95), 0.30)
cavity = new_mat('Cavity',  (0.45, 0.16, 0.22), 0.50)
blush  = new_mat('Blush',   (1.00, 0.56, 0.57), 0.60)
brow   = new_mat('Brow',    (0.17, 0.09, 0.06), 0.35)
lash   = new_mat('Lash',    (0.10, 0.06, 0.05), 0.30)
sweat  = new_mat('Sweater', (0.94, 0.91, 0.84), 0.75)   # cream knit
cardi  = new_mat('Cardigan',(0.82, 0.74, 0.86), 0.80)   # lavender

def assign(o, m):
    o.data.materials.clear(); o.data.materials.append(m)

def smooth(o):
    for p in o.data.polygons: p.use_smooth = True

# ---------------------------------------------------------------- head (soft oval)
bpy.ops.mesh.primitive_uv_sphere_add(segments=56, ring_count=40, radius=1.0)
head = bpy.context.active_object; head.name = 'Head'
me = head.data
bm = bmesh.new(); bm.from_mesh(me)
for v in bm.verts:
    x, y, z = v.co
    if z < 0:                       # soft jaw + gentle chin
        t = -z
        taper = 1.0 - 0.34 * t
        v.co.x = x * taper
        v.co.y = y * taper
        v.co.z = z * 1.12
    if y < 0:                       # flatten face front a touch
        v.co.y = y * 0.92
bm.to_mesh(me); bm.free()
head.scale = (0.93, 1.0, 1.06)      # slightly oval / longer
smooth(head); assign(head, skin)

# neck
bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.33, depth=0.9,
                                     location=(0, 0.05, -1.5))
neck = bpy.context.active_object; neck.name = 'Neck'
smooth(neck); assign(neck, skin)

# ---------------------------------------------------------------- eyes (violet, with lashes)
def make_eye(sign):
    x, y, z = 0.40 * sign, -0.78, -0.02
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(x, y, z))
    e = bpy.context.active_object; e.name = f'White_{sign}'
    e.scale = (0.25, 0.10, 0.31); e.rotation_euler = (0, 0, math.radians(-8*sign))
    smooth(e); assign(e, white)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(x, y-0.05, z-0.02))
    ir = bpy.context.active_object; ir.name = f'Iris_{sign}'
    ir.scale = (0.16, 0.09, 0.22); smooth(ir); assign(ir, iris)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(x, y-0.09, z-0.02))
    pu = bpy.context.active_object; pu.name = f'Pupil_{sign}'
    pu.scale = (0.08, 0.07, 0.12); smooth(pu); assign(pu, pupil)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(x+0.05*sign, y-0.12, z+0.07))
    hl = bpy.context.active_object; hl.name = f'Shine_{sign}'
    hl.scale = (0.045, 0.035, 0.055); smooth(hl); assign(hl, shine)
    # upper lash line
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, -0.85, z+0.20))
    la = bpy.context.active_object; la.name = f'Lash_{sign}'
    la.scale = (0.27, 0.05, 0.035); la.rotation_euler = (0, 0, math.radians(-10*sign))
    assign(la, lash)
    # eyebrow
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, -0.84, 0.36))
    eb = bpy.context.active_object; eb.name = f'Brow_{sign}'
    eb.scale = (0.20, 0.03, 0.018); eb.rotation_euler = (0, 0, math.radians(-9*sign))
    assign(eb, brow)

make_eye(+1); make_eye(-1)

# blush
for s in (+1, -1):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0.54*s, -0.70, -0.26))
    bl = bpy.context.active_object; bl.name = f'Blush_{s}'
    bl.scale = (0.15, 0.05, 0.09); smooth(bl); assign(bl, blush)

# tiny nose
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, -0.90, -0.16))
nose = bpy.context.active_object; nose.name = 'Nose'
nose.scale = (0.045, 0.05, 0.05); smooth(nose); assign(nose, skin)

# ---------------------------------------------------------------- open smile with teeth
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, -0.84, -0.40))
cav = bpy.context.active_object; cav.name = 'Cavity'
cav.scale = (0.21, 0.05, 0.085); smooth(cav); assign(cav, cavity)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.88, -0.36))
th = bpy.context.active_object; th.name = 'Teeth'
th.scale = (0.14, 0.025, 0.022); assign(th, teeth)
# lip outline (smile curve)
crv = bpy.data.curves.new('Lips', 'CURVE'); crv.dimensions = '3D'
crv.bevel_depth = 0.022; crv.bevel_resolution = 3
sp = crv.splines.new('BEZIER'); sp.bezier_points.add(2)
for bp, co in zip(sp.bezier_points,
                  [(-0.24,-0.85,-0.36),(0.0,-0.90,-0.47),(0.24,-0.85,-0.36)]):
    bp.co = co; bp.handle_left_type = bp.handle_right_type = 'AUTO'
lipobj = bpy.data.objects.new('LipLine', crv)
bpy.context.collection.objects.link(lipobj); assign(lipobj, lips)

# ---------------------------------------------------------------- hair (center-part, long, framing)
def carve(obj, y_thr, z_lo, z_hi, x_abs=None):
    m = obj.data; b = bmesh.new(); b.from_mesh(m)
    dead = []
    for f in b.faces:
        cy = sum(v.co.y for v in f.verts)/len(f.verts)
        cz = sum(v.co.z for v in f.verts)/len(f.verts)
        cx = sum(v.co.x for v in f.verts)/len(f.verts)
        if cy < y_thr and z_lo < cz < z_hi and (x_abs is None or abs(cx) < x_abs):
            dead.append(f)
    bmesh.ops.delete(b, geom=dead, context='FACES')
    b.to_mesh(m); b.free()

# long back mass
bpy.ops.mesh.primitive_uv_sphere_add(segments=56, ring_count=44, radius=1.0,
                                     location=(0, 0.20, 0))
hb = bpy.context.active_object; hb.name = 'Hair_back'
m = hb.data; b = bmesh.new(); b.from_mesh(m)
for v in b.verts:
    v.co.x *= 1.20; v.co.y *= 1.14
    if v.co.z < 0.30:
        v.co.z = 0.30 + (v.co.z - 0.30) * 3.1     # long drape
        v.co.x *= 1.08
    if v.co.y < 0:
        v.co.y += 0.16                            # push front edge behind the cheeks
    else:
        v.co.y *= 1.10
b.to_mesh(m); b.free()
carve(hb, y_thr=-0.02, z_lo=-4.0, z_hi=0.80)      # expose the whole face (no cheek seams)
smooth(hb); assign(hb, hair)

# crown cap with a centre part (open a thin wedge at top-front-centre)
bpy.ops.mesh.primitive_uv_sphere_add(segments=56, ring_count=40, radius=1.0,
                                     location=(0, 0.04, 0.06))
hc = bpy.context.active_object; hc.name = 'Hair_cap'
hc.scale = (1.12, 1.12, 1.10)
carve(hc, y_thr=-0.32, z_lo=-1.2, z_hi=0.55)                  # open the face
carve(hc, y_thr=-0.05, z_lo=0.70, z_hi=1.3, x_abs=0.05)      # subtle centre parting slit
smooth(hc); assign(hc, hair)

# side-swept fringe: soft locks hanging DOWN beside the brows (tips near the eyes)
for s in (+1, -1):
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.22, radius2=0.05,
                                    depth=0.62, location=(0.46*s, -0.82, 0.60))
    fr = bpy.context.active_object; fr.name = f'Fringe_{s}'
    fr.rotation_euler = (math.radians(184), 0, math.radians(-7*s))   # apex down, slight inward
    fr.scale = (1.0, 0.45, 1.0); smooth(fr); assign(fr, hair)

# long front side locks framing the face
for s in (+1, -1):
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.30, radius2=0.05,
                                    depth=2.6, location=(0.98*s, -0.5, -0.9))
    lk = bpy.context.active_object; lk.name = f'Lock_{s}'
    lk.rotation_euler = (math.radians(8), math.radians(-6*s), math.radians(12*s))
    lk.scale = (1.0, 0.55, 1.0); smooth(lk); assign(lk, hair)

# ---------------------------------------------------------------- shoulders / sweater / cardigan
bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=28, radius=1.0,
                                     location=(0, 0.15, -3.05))
torso = bpy.context.active_object; torso.name = 'Sweater'
torso.scale = (1.55, 0.95, 1.15); smooth(torso); assign(torso, sweat)
# cardigan panels over the shoulders/arms
for s in (+1, -1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=24, radius=1.0,
                                         location=(1.35*s, 0.20, -2.85))
    cp = bpy.context.active_object; cp.name = f'Cardi_{s}'
    cp.scale = (0.55, 1.0, 1.25); smooth(cp); assign(cp, cardi)

# ---------------------------------------------------------------- world, lights, camera, render
scene = bpy.context.scene
for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try: scene.render.engine = eng; break
    except Exception: continue

world = bpy.data.worlds[0] if bpy.data.worlds else bpy.data.worlds.new('W')
scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value = (0.95, 0.85, 0.92, 1)   # pastel pink
    bg.inputs['Strength'].default_value = 0.45

scene.view_settings.exposure = -0.7        # tame the overexposure

def add_area(loc, energy, size=7):
    bpy.ops.object.light_add(type='AREA', location=loc)
    L = bpy.context.active_object; L.data.energy = energy; L.data.size = size
    return L
k = add_area((-3, -4, 3), 320); k.rotation_euler = (math.radians(55), 0, math.radians(-35))
f = add_area((3.5, -3, 1.5), 150); f.rotation_euler = (math.radians(70), 0, math.radians(45))
r = add_area((-1, 4, 4), 240); r.rotation_euler = (math.radians(125), 0, math.radians(-10))

def point_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

bpy.ops.object.camera_add(location=(1.1, -8.8, -1.0))
cam = bpy.context.active_object; cam.data.lens = 55
point_at(cam, (0.0, 0.0, -1.15))                                # slight 3/4, full head + shoulders
scene.camera = cam

scene.render.resolution_x = 760
scene.render.resolution_y = 1000
scene.render.filepath = r"C:\Users\salam\Documents\Programacion\Mideas\anime_girl_render.png"
bpy.ops.render.render(write_still=True)
print("RENDER_DONE objects=", len(bpy.data.objects))
