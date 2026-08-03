import bpy
import math
from mathutils import Vector

OUT_BLEND = r"C:\Users\salam\Documents\Programacion\Mideas\basket_americana.blend"
OUT_RENDER = r"C:\Users\salam\Documents\Programacion\Mideas\basket_americana.png"

# ---------------------------------------------------------------- escena neta
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for coll in list(bpy.data.collections):
    bpy.data.collections.remove(coll)
root = bpy.context.scene.collection

def collection(name):
    col = bpy.data.collections.new(name)
    root.children.link(col)
    return col

COL_TAULER = collection("01_Tauler_de_vidre")
COL_ARO = collection("02_Aro_metallic")
COL_XARXA = collection("03_Xarxa_de_corda")
COL_POSTES = collection("04_Postes_de_subjeccio")
COL_ESCENA = collection("05_Escena")

def move_to(obj, col):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    col.objects.link(obj)

# ------------------------------------------------------------------ materials
def material(name, color, metallic=0.0, roughness=0.45, transmission=0.0,
             alpha=1.0, ior=1.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, alpha)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = ior
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if alpha < 1.0:
        for attr, val in (("blend_method", "BLEND"), ("shadow_method", "HASHED")):
            try:
                setattr(mat, attr, val)
            except Exception:
                pass
    try:
        mat.use_screen_refraction = True
    except Exception:
        pass
    return mat

GLASS = material("Vidre_tauler", (0.62, 0.74, 0.82), 0.04, 0.06,
                 transmission=0.82, alpha=0.58, ior=1.52)
WHITE = material("Pintura_blanca", (0.92, 0.92, 0.90), 0.0, 0.35)
RIM = material("Aro_taronja", (0.86, 0.28, 0.03), 0.55, 0.30)
ROPE = material("Corda_xarxa", (0.90, 0.88, 0.80), 0.0, 0.88)
STEEL = material("Acer_pal", (0.32, 0.34, 0.37), 0.90, 0.34)
PAD = material("Encoixinat_pal", (0.06, 0.09, 0.22), 0.0, 0.6)
BASE = material("Formigo_base", (0.30, 0.30, 0.32), 0.0, 0.85)
COURT = material("Terra_pista", (0.52, 0.34, 0.18), 0.0, 0.7)

def finish(obj, mat, col, smooth=True):
    if obj.data and hasattr(obj.data, "materials"):
        obj.data.materials.append(mat)
    move_to(obj, col)
    if smooth and obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True

def cube(size, location, mat, col, name):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.scale = (size[0], size[1], size[2])   # cub d'aresta 1.0 -> mida exacta
    bpy.ops.object.transform_apply(scale=True)
    obj.name = name
    finish(obj, mat, col, smooth=False)
    return obj

def cyl(radius, depth, location, mat, col, name, verts=24, axis=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth,
                                        location=location, vertices=verts)
    obj = bpy.context.object
    if axis is not None:
        obj.rotation_euler = Vector(axis).to_track_quat('Z', 'Y').to_euler()
    obj.name = name
    finish(obj, mat, col)
    return obj

def strand(p1, p2, radius, verts=6):
    p1, p2 = Vector(p1), Vector(p2)
    vec = p2 - p1
    length = vec.length
    if length < 1e-6:
        return None
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=length,
                                        location=(p1 + p2) / 2, vertices=verts)
    obj = bpy.context.object
    obj.rotation_euler = vec.to_track_quat('Z', 'Y').to_euler()
    return obj

# ================================================================== dimensions
# Regulació aproximada (m): tauler 1.83 x 1.07, aro a 3.05, aro Ø 0.4572.
BOARD_W, BOARD_H, BOARD_T = 1.83, 1.07, 0.03
BOARD_BOTTOM = 2.90
BOARD_ZC = BOARD_BOTTOM + BOARD_H / 2          # 3.435
RIM_R = 0.2286
RIM_TUBE = 0.010
RIM_Z = 3.05
RIM_GAP = 0.15                                 # separació tauler-aro
RIM_YC = RIM_GAP + RIM_R                        # centre de l'aro en Y

# ------------------------------------------------------------- tauler de vidre
# Cara frontal del vidre a y = 0 ; gruix cap enrere (-Y).
board = cube((BOARD_W, BOARD_T, BOARD_H), (0.0, -BOARD_T / 2, BOARD_ZC),
             GLASS, COL_TAULER, "Tauler_vidre")

# Marc blanc perimetral (llistons prims sobre la cara frontal).
FR = 0.05        # amplada marc
fy = 0.002       # sobresurt lleugerament davant del vidre
frame_defs = [
    ((BOARD_W, FR, fy * 2), (0, fy, BOARD_ZC + BOARD_H / 2 - FR / 2)),   # dalt
    ((BOARD_W, FR, fy * 2), (0, fy, BOARD_ZC - BOARD_H / 2 + FR / 2)),   # baix
    ((FR, FR, fy * 2), (-BOARD_W / 2 + FR / 2, fy, BOARD_ZC)),           # esq (alt via barra)
    ((FR, FR, fy * 2), (BOARD_W / 2 - FR / 2, fy, BOARD_ZC)),            # dre
]
# barres verticals completes:
cube((FR, fy * 2, BOARD_H), (-BOARD_W / 2 + FR / 2, fy, BOARD_ZC), WHITE, COL_TAULER, "Marc_esq")
cube((FR, fy * 2, BOARD_H), (BOARD_W / 2 - FR / 2, fy, BOARD_ZC), WHITE, COL_TAULER, "Marc_dre")
cube((BOARD_W, fy * 2, FR), (0, fy, BOARD_ZC + BOARD_H / 2 - FR / 2), WHITE, COL_TAULER, "Marc_dalt")
cube((BOARD_W, fy * 2, FR), (0, fy, BOARD_ZC - BOARD_H / 2 + FR / 2), WHITE, COL_TAULER, "Marc_baix")

# Quadrat interior (shooter's square), 0.59 x 0.45, base alineada amb l'aro.
SQ_W, SQ_H, SQ_T = 0.59, 0.45, 0.04
sq_bottom = RIM_Z + 0.02
sq_zc = sq_bottom + SQ_H / 2
cube((SQ_W, fy * 2, SQ_T), (0, fy, sq_bottom), WHITE, COL_TAULER, "Sq_baix")
cube((SQ_W, fy * 2, SQ_T), (0, fy, sq_bottom + SQ_H), WHITE, COL_TAULER, "Sq_dalt")
cube((SQ_T, fy * 2, SQ_H), (-SQ_W / 2, fy, sq_zc), WHITE, COL_TAULER, "Sq_esq")
cube((SQ_T, fy * 2, SQ_H), (SQ_W / 2, fy, sq_zc), WHITE, COL_TAULER, "Sq_dre")

# --------------------------------------------------------------- aro metal·lic
bpy.ops.mesh.primitive_torus_add(major_radius=RIM_R, minor_radius=RIM_TUBE,
                                 location=(0, RIM_YC, RIM_Z))
rim = bpy.context.object
rim.name = "Aro"
finish(rim, RIM, COL_ARO)

# Suport de l'aro (bracket) unint aro i tauler.
cube((0.10, RIM_GAP + 0.02, 0.05), (0, RIM_GAP / 2, RIM_Z), RIM, COL_ARO, "Aro_bracket")
# Petits ganxos on es lliga la xarxa (12 anelles).
NHOOK = 12
hooks = []
for i in range(NHOOK):
    ang = 2 * math.pi * i / NHOOK
    hx = RIM_R * math.cos(ang)
    hy = RIM_YC + RIM_R * math.sin(ang)
    o = cyl(0.006, 0.03, (hx, hy, RIM_Z - 0.015), RIM, COL_ARO,
            f"Ganxo_{i}", verts=8, axis=(0, 0, 1))

# ------------------------------------------------------------- xarxa de corda
# Anells decreixents; cada anell girat mitja secció -> creuament en diamant.
LEVELS = 6
NET_TOP = RIM_Z - 0.01
NET_LEN = 0.42
seg = 2 * math.pi / NHOOK

def net_node(k, i):
    frac = k / LEVELS
    r = RIM_R * (1.0 - 0.55 * frac)            # s'estreny cap avall
    z = NET_TOP - NET_LEN * (frac ** 0.85)
    ang = seg * (i + 0.5 * k)
    return (r * math.cos(ang), RIM_YC + r * math.sin(ang), z)

net_parts = []
ROPE_R = 0.0055
# lligams verticals curts de l'aro al primer anell
for i in range(NHOOK):
    top = net_node(0, i)
    rimpt = (RIM_R * math.cos(seg * i), RIM_YC + RIM_R * math.sin(seg * i), RIM_Z - 0.01)
    s = strand(rimpt, top, ROPE_R)
    if s:
        net_parts.append(s)
# malla en diamant
for k in range(LEVELS):
    for i in range(NHOOK):
        a = net_node(k, i)
        b = net_node(k + 1, i)
        c = net_node(k + 1, i - 1)
        for p, q in ((a, b), (a, c)):
            s = strand(p, q, ROPE_R)
            if s:
                net_parts.append(s)
# vora inferior (dobladillo)
for i in range(NHOOK):
    a = net_node(LEVELS, i)
    b = net_node(LEVELS, i + 1)
    s = strand(a, b, ROPE_R)
    if s:
        net_parts.append(s)

# uneix tota la xarxa en un sol objecte
if net_parts:
    bpy.ops.object.select_all(action="DESELECT")
    for o in net_parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = net_parts[0]
    bpy.ops.object.join()
    net = bpy.context.object
    net.name = "Xarxa_de_corda"
    finish(net, ROPE, COL_XARXA)

# ---------------------------------------------------- postes de subjecció
POLE_Y = -1.05
POLE_R = 0.075
POLE_TOP = 3.72
# pal vertical principal
cyl(POLE_R, POLE_TOP, (0, POLE_Y, POLE_TOP / 2), STEEL, COL_POSTES, "Pal_principal")
# encoixinat inferior de protecció
cyl(POLE_R + 0.03, 1.8, (0, POLE_Y, 0.9), PAD, COL_POSTES, "Encoixinat")
# base de formigó
cube((0.7, 0.7, 0.12), (0, POLE_Y, 0.06), BASE, COL_POSTES, "Base_formigo")

# braç en coll de cigne (bezier amb bevel) del pal al darrere del tauler
arm = bpy.data.curves.new("Coll_cigne", 'CURVE')
arm.dimensions = '3D'
sp = arm.splines.new('BEZIER')
pts = [
    (0, POLE_Y, POLE_TOP),
    (0, POLE_Y + 0.45, POLE_TOP + 0.14),
    (0, -0.30, BOARD_ZC + 0.30),
    (0, -BOARD_T - 0.01, BOARD_ZC + 0.22),
]
sp.bezier_points.add(len(pts) - 1)
for bp, co in zip(sp.bezier_points, pts):
    bp.co = co
    bp.handle_left_type = 'AUTO'
    bp.handle_right_type = 'AUTO'
arm.bevel_depth = 0.055
arm.bevel_resolution = 4
arm_obj = bpy.data.objects.new("Bracc_coll_cigne", arm)
root.objects.link(arm_obj)
arm_obj.data.materials.append(STEEL)
move_to(arm_obj, COL_POSTES)

# tirants diagonals que uneixen el tauler als postes
for sx in (-1, 1):
    p_board = (sx * (BOARD_W / 2 - 0.25), -BOARD_T - 0.01, BOARD_BOTTOM + 0.12)
    p_arm = (0, -0.45, BOARD_ZC + 0.28)
    s = strand(p_board, p_arm, 0.028, verts=12)
    s.name = f"Tirant_{'esq' if sx < 0 else 'dre'}"
    finish(s, STEEL, COL_POSTES)
# placa de fixació posterior al tauler
cube((0.9, 0.05, 0.35), (0, -BOARD_T - 0.03, BOARD_ZC + 0.10), STEEL, COL_POSTES, "Placa_fixacio")

# ---------------------------------------------------------------------- escena
bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 1.5, 0))
finish(bpy.context.object, COURT, COL_ESCENA, smooth=False)
bpy.context.object.name = "Terra"

# --------------------------------------------------------------------- càmera
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 42
cam = bpy.data.objects.new("Camera", cam_data)
root.objects.link(cam)
cam.location = Vector((2.9, 3.4, 2.35))
target = Vector((0.0, 0.25, 3.0))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam
move_to(cam, COL_ESCENA)

# ----------------------------------------------------------------------- llums
def area_light(name, location, target, energy, size, color):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy = energy
    d.size = size
    d.color = color
    o = bpy.data.objects.new(name, d)
    o.location = Vector(location)
    o.rotation_euler = (Vector(target) - Vector(location)).to_track_quat('-Z', 'Y').to_euler()
    root.objects.link(o)
    move_to(o, COL_ESCENA)

area_light("Key", (4.0, 4.5, 5.5), (0, 0.3, 3.1), 1400, 3.0, (1.0, 0.98, 0.95))
area_light("Fill", (-4.0, 3.0, 3.5), (0, 0.3, 3.0), 500, 4.0, (0.85, 0.9, 1.0))
area_light("Rim", (-1.5, -3.0, 4.5), (0, 0.3, 3.2), 700, 2.5, (0.9, 0.95, 1.0))

# -------------------------------------------------------------------- render
scene = bpy.context.scene
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
    try:
        scene.render.engine = eng
        break
    except Exception:
        continue
try:
    scene.eevee.use_raytracing = True
except Exception:
    pass
try:
    scene.eevee.use_ssr = True
    scene.eevee.use_ssr_refraction = True
except Exception:
    pass

scene.render.resolution_x = 1000
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT_RENDER
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.20, 0.28, 0.42, 1.0)
    bg.inputs[1].default_value = 0.6

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.render.render(write_still=True)
print(f"BASKET_CREADA: {OUT_BLEND}")
print(f"RENDER_CREAT: {OUT_RENDER}")
