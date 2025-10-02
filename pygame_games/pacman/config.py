"""
Game Configuration
MSX constants and settings
"""
import pygame

# MSX Screen 2 constants
MSX_WIDTH = 256
MSX_HEIGHT = 192
SCALE = 3
WINDOW_WIDTH = MSX_WIDTH * SCALE
WINDOW_HEIGHT = MSX_HEIGHT * SCALE

# Game constants
FPS = 60
TILE_SIZE = 8

# MSX Color Palette
MSX_COLORS = {
    'transparent': (0, 0, 0, 0),
    'black': (0, 0, 0),
    'green': (62, 184, 73),
    'light_green': (116, 208, 125),
    'dark_blue': (89, 85, 224),
    'light_blue': (128, 118, 241),
    'dark_red': (185, 94, 81),
    'cyan': (101, 219, 239),
    'red': (219, 101, 89),
    'light_red': (255, 137, 125),
    'yellow': (204, 195, 94),
    'light_yellow': (222, 208, 135),
    'dark_green': (58, 162, 65),
    'magenta': (183, 102, 181),
    'gray': (204, 204, 204),
    'white': (255, 255, 255),
}

# Game states
STATE_MENU = 0
STATE_GAME = 1
STATE_PAUSE = 2
STATE_GAME_OVER = 3

# Controls
KEY_UP = [pygame.K_UP, pygame.K_w]
KEY_DOWN = [pygame.K_DOWN, pygame.K_s]
KEY_LEFT = [pygame.K_LEFT, pygame.K_a]
KEY_RIGHT = [pygame.K_RIGHT, pygame.K_d]
KEY_ACTION = [pygame.K_SPACE, pygame.K_z]
KEY_PAUSE = [pygame.K_ESCAPE, pygame.K_p]
