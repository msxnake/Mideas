"""
Utility Functions
"""
import pygame

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    if not hex_color or hex_color == 'transparent' or hex_color.startswith('rgba'):
        return (0, 0, 0, 0)
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return (0, 0, 0)

def create_surface_from_pixels(pixel_data, bg_color=None):
    """Create Pygame surface from pixel data array"""
    if not pixel_data or not pixel_data[0]:
        return pygame.Surface((1, 1))

    height = len(pixel_data)
    width = len(pixel_data[0])

    surface = pygame.Surface((width, height))

    if bg_color:
        bg_rgb = hex_to_rgb(bg_color)
        surface.set_colorkey(bg_rgb)

    for y in range(height):
        for x in range(width):
            color_hex = pixel_data[y][x]
            color_rgb = hex_to_rgb(color_hex)
            if color_rgb != (0, 0, 0, 0):
                surface.set_at((x, y), color_rgb[:3])

    return surface

def scale_surface(surface, scale):
    """Scale surface using nearest-neighbor (pixel-perfect)"""
    new_size = (surface.get_width() * scale, surface.get_height() * scale)
    return pygame.transform.scale(surface, new_size)
