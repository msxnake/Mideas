import bpy
import math
from mathutils import Vector

OUT_BLEND = r"C:\Users\salam\Documents\Programacion\Mideas\farola_siglo18.blend"
OUT_RENDER = r"C:\Users\salam\Documents\Programacion\Mideas\farola_siglo18.png"

# Limpia la escena inicial.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if collection.name != "Collection":
        bpy.data.collections.remove(collection)
root = bpy.context.scene.collection
default_collection = bpy.data.collections.get("Collection")
default_collection.name = "00_Escenario"

def collection(name):
    col = bpy.data.collections.new(name)
    root.children.link(col)
    return col

COL_BASE = collection("01_Base_de_piedra_y_hierro")
COL_POST = collection("02_Poste_y_capitel")
COL_LAMP = collection("03_Linterna_acristalada")
COL_ORN = collection("04_Ornamentos_forjados")

def move_to(obj, col):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    col.objects.link(obj)

def material(name, color, metallic=0.0, roughness=0.45, transmission=0.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat

IRON = material("Hierro_forjado_negro", (0.012, 0.016, 0.021), 0.9, 0.22)
IRON_OLD = material("Hierro_envejecido", (0.055, 0.037, 0.020), 0.78, 0.38)
BRASS = material("Laton_antiguo", (0.28, 0.13, 0.028), 0.72, 0.26)
STONE = material("Piedra_caliza", (0.32, 0.27, 0.21), 0.0, 0.78)
GLASS = material("Cristal_verdoso_antiguo", (0.11, 0.18, 0.14), 0.0, 0.08, 0.78)
WARM = material("Llama_calida", (0.8, 0.12, 0.01), 0.0, 0.3, 0.0, (1.0, 0.13, 0.015), 10.0)

def finish(obj, mat, col, bevel=0.0, smooth=True):
    obj.data.materials.append(mat)
    move_to(obj, col)
    if smooth and obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True
    if bevel:
        mod = obj.modifiers.new("Bisel_artesanal", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    return obj

def cylinder(name, radius, depth, z, mat, col, vertices=32, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, col, bevel)

def cone(name, r1, r2, depth, z, mat, col, vertices=32):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2, depth=depth, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, col)

def cube(name, location, scale, mat, col, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, col, bevel, False)

def torus(name, major, minor, location, mat, col, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=48, minor_segments=10, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, col)

def pipe(name, points, radius, mat, col, cyclic=False):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 16
    curve.bevel_depth = radius
    curve.bevel_resolution = 4
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for bp, point in zip(spline.bezier_points, points):
        bp.co = point
        bp.handle_left_type = "AUTO"
        bp.handle_right_type = "AUTO"
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve)
    col.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

# 1. Basamento robusto de piedra y hierro fundido.
cylinder("Base_octogonal_de_piedra", 0.82, 0.18, 0.09, STONE, COL_BASE, 8, 0.025)
cylinder("Plinto_de_hierro", 0.65, 0.22, 0.29, IRON_OLD, COL_BASE, 12, 0.02)
cone("Campana_de_la_base", 0.54, 0.31, 0.58, 0.69, IRON, COL_BASE, 12)
torus("Aro_de_laton_inferior", 0.41, 0.055, (0, 0, 0.43), BRASS, COL_BASE)
torus("Aro_de_laton_superior", 0.30, 0.045, (0, 0, 0.98), BRASS, COL_BASE)
cylinder("Cuello_del_pedestal", 0.245, 0.30, 1.08, IRON, COL_BASE, 16)

# 2. Fuste estriado y capitel.
cylinder("Fuste_principal", 0.135, 2.55, 2.45, IRON, COL_POST, 24)
for i in range(8):
    angle = math.tau * i / 8
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.018, depth=2.34,
        location=(0.145 * math.cos(angle), 0.145 * math.sin(angle), 2.45))
    rib = bpy.context.object
    rib.name = f"Estria_vertical_{i+1:02d}"
    finish(rib, IRON_OLD, COL_POST)
for index, (z, radius, minor) in enumerate(((1.25, 0.19, 0.035), (2.20, 0.17, 0.028), (3.62, 0.20, 0.035))):
    torus(f"Collarin_de_laton_{index+1}", radius, minor, (0, 0, z), BRASS, COL_POST)
cone("Capitel_abocinado", 0.18, 0.30, 0.28, 3.84, IRON, COL_POST, 16)
cylinder("Abaco_del_capitel", 0.36, 0.10, 4.03, IRON_OLD, COL_POST, 12, 0.015)

# 3. Linterna: bastidor hexagonal, cristales y cubierta.
lamp_bottom, lamp_top = 4.12, 5.16
cylinder("Suelo_de_la_linterna", 0.46, 0.10, lamp_bottom, IRON, COL_LAMP, 6, 0.02)
cylinder("Cornisa_inferior", 0.52, 0.09, lamp_bottom + 0.08, BRASS, COL_LAMP, 6, 0.015)
for i in range(6):
    angle = math.tau * i / 6
    x, y = 0.42 * math.cos(angle), 0.42 * math.sin(angle)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.035, depth=0.96, location=(x, y, 4.67))
    bar = bpy.context.object
    bar.name = f"Montante_de_hierro_{i+1}"
    finish(bar, IRON, COL_LAMP)
    # Panel fino de cristal entre los montantes.
    mid = angle + math.pi / 6
    panel = cube(f"Cristal_antiguo_{i+1}", (0.365 * math.cos(mid), 0.365 * math.sin(mid), 4.67),
                 (0.235, 0.012, 0.43), GLASS, COL_LAMP, 0.008)
    panel.rotation_euler[2] = mid + math.pi / 2
cylinder("Cornisa_superior", 0.51, 0.10, lamp_top, BRASS, COL_LAMP, 6, 0.015)
cone("Tejado_de_cobre", 0.54, 0.10, 0.56, 5.47, IRON_OLD, COL_LAMP, 6)
torus("Aro_de_remate", 0.105, 0.025, (0, 0, 5.77), BRASS, COL_LAMP)
cone("Pinaculo", 0.09, 0.0, 0.31, 5.94, BRASS, COL_LAMP, 16)

# Vela/llama interior y luz real.
cylinder("Vela", 0.085, 0.38, 4.48, BRASS, COL_LAMP, 24)
cone("Llama", 0.085, 0.0, 0.30, 4.82, WARM, COL_LAMP, 24)
bpy.ops.object.light_add(type="POINT", location=(0, 0, 4.86))
light = bpy.context.object
light.name = "Luz_de_aceite"
light.data.energy = 620
light.data.color = (1.0, 0.24, 0.055)
light.data.shadow_soft_size = 1.05
move_to(light, COL_LAMP)

# 4. Volutas de forja y anillas decorativas.
for i in range(4):
    angle = math.tau * i / 4
    local = [(0.0, 0.0, 3.93), (0.48, 0.0, 4.08), (0.48, 0.0, 4.43), (0.20, 0.0, 4.48)]
    points = [(x * math.cos(angle), x * math.sin(angle), z) for x, _, z in local]
    pipe(f"Voluta_en_S_{i+1}", points, 0.032, IRON_OLD, COL_ORN)
    x, y = 0.28 * math.cos(angle), 0.28 * math.sin(angle)
    torus(f"Anilla_forjada_{i+1}", 0.105, 0.018, (x, y, 4.08), BRASS, COL_ORN, (math.pi/2, 0, angle))

# Suelo y presentación de estudio.
bpy.ops.mesh.primitive_plane_add(size=18, location=(0, 0, -0.012))
floor = bpy.context.object
floor.name = "Suelo_de_estudio"
finish(floor, STONE, default_collection, False, False)

bpy.ops.object.camera_add(location=(7.7, -8.1, 5.6))
camera = bpy.context.object
camera.name = "Camara_presentacion"
target = Vector((0, 0, 2.85))
camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 58
bpy.context.scene.camera = camera
move_to(camera, default_collection)

for location, energy, size, color in [
    ((4.0, -4.0, 7.0), 1200, 4.0, (1.0, 0.74, 0.52)),
    ((-4.0, -1.0, 4.0), 900, 3.0, (0.25, 0.40, 1.0)),
    ((0.0, 4.0, 6.0), 1000, 3.5, (1.0, 0.34, 0.12)),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    area = bpy.context.object
    area.data.energy = energy
    area.data.shape = "DISK"
    area.data.size = size
    area.data.color = color
    area.rotation_euler = (target - area.location).to_track_quat("-Z", "Y").to_euler()
    move_to(area, default_collection)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 700
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT_RENDER
scene.render.film_transparent = False
scene.world.color = (0.008, 0.012, 0.022)

# Vista de modelado cómoda y selección del conjunto principal.
for obj in bpy.context.selected_objects:
    obj.select_set(False)
bpy.data.objects["Fuste_principal"].select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects["Fuste_principal"]

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.render.render(write_still=True)
print(f"FAROLA_CREADA: {OUT_BLEND}")
print(f"RENDER_CREADO: {OUT_RENDER}")
