#!/usr/bin/env python3
"""
Mideas to Pygame Converter
Converts Pacman Mideas project to playable Python/Pygame game
"""
import json
import os

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    if not hex_color or hex_color == 'transparent' or hex_color.startswith('rgba'):
        return (0, 0, 0, 0)
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return (0, 0, 0)

def load_project(project_path):
    """Load Mideas project JSON"""
    with open(project_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_assets(project):
    """Extract all assets from project"""
    assets = project.get('assets', [])
    return {
        'sprites': [a for a in assets if a.get('type') == 'sprite'],
        'tiles': [a for a in assets if a.get('type') == 'tile'],
        'tilebanks': [a for a in assets if a.get('type') == 'tileBank'],
        'screens': [a for a in assets if a.get('type') == 'screenMap'],
        'entities': [a for a in assets if a.get('type') == 'entity'],
        'components': [a for a in assets if a.get('type') == 'component'],
        'code': [a for a in assets if a.get('type') == 'code']
    }

def generate_config_py(project, assets):
    """Generate config.py with constants"""
    return '''"""
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
'''

def generate_utils_py():
    """Generate utils.py with helper functions"""
    return '''"""
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
'''

def generate_assets_py(project, assets):
    """Generate assets.py with asset loading"""
    code = '''"""
Asset Manager
Loads and manages all game assets
"""
import pygame
from utils import create_surface_from_pixels, hex_to_rgb

class AssetManager:
    def __init__(self):
        self.sprites = {}
        self.tiles = {}
        self.sounds = {}

    def load_all(self):
        """Load all game assets"""
        self.load_sprites()
        self.load_tiles()

    def load_sprites(self):
        """Load sprite assets"""
'''

    # Add sprite data
    for sprite in assets['sprites']:
        sprite_id = sprite.get('id', 'unknown')
        sprite_name = sprite.get('name', 'unnamed')
        sprite_data = sprite.get('data', {})
        frames = sprite_data.get('frames', [])
        bg_color = sprite_data.get('backgroundColor', '#000000')

        code += f'''        # Sprite: {sprite_name}
        self.sprites['{sprite_name}'] = {{
            'frames': [],
            'frame_count': {len(frames)},
            'bg_color': '{bg_color}'
        }}
'''

        for i, frame in enumerate(frames):
            pixel_data = frame.get('pixels', [])
            if pixel_data:
                code += f'''
        # Frame {i}
        frame_{i}_pixels = {repr(pixel_data)}
        frame_{i}_surface = create_surface_from_pixels(frame_{i}_pixels, '{bg_color}')
        self.sprites['{sprite_name}']['frames'].append(frame_{i}_surface)
'''

    code += '''
    def load_tiles(self):
        """Load tile assets"""
'''

    # Add tile data
    for tile in assets['tiles']:
        tile_name = tile.get('name', 'unnamed')
        tile_data = tile.get('data', {})
        pixel_data = tile_data.get('data', [])

        if pixel_data:
            code += f'''        # Tile: {tile_name}
        tile_pixels = {repr(pixel_data)}
        self.tiles['{tile_name}'] = create_surface_from_pixels(tile_pixels)
'''

    code += '''
    def get_sprite(self, name):
        """Get sprite by name"""
        return self.sprites.get(name)

    def get_tile(self, name):
        """Get tile by name"""
        return self.tiles.get(name)
'''

    return code

def generate_entities_py():
    """Generate entities.py with entity classes"""
    return '''"""
Entity System
Entity-Component-System architecture
"""
import pygame
from config import *

class Entity:
    """Base entity class"""
    def __init__(self, x, y, entity_type='generic'):
        self.x = x
        self.y = y
        self.type = entity_type
        self.active = True
        self.components = {}

    def add_component(self, name, component):
        """Add component to entity"""
        self.components[name] = component

    def get_component(self, name):
        """Get component by name"""
        return self.components.get(name)

    def has_component(self, name):
        """Check if entity has component"""
        return name in self.components

    def update(self, dt, game_state):
        """Update entity"""
        pass

    def render(self, surface):
        """Render entity"""
        pass

class Player(Entity):
    """Player entity"""
    def __init__(self, x, y, sprite_data):
        super().__init__(x, y, 'player')
        self.sprite_data = sprite_data
        self.vx = 0
        self.vy = 0
        self.speed = 60  # pixels per second
        self.current_frame = 0
        self.animation_timer = 0
        self.animation_speed = 0.1  # seconds per frame
        self.direction = 'right'

        # Hitbox
        self.hitbox = pygame.Rect(x, y, 16, 16)

    def update(self, dt, game_state):
        """Update player"""
        if not self.active:
            return

        # Handle input
        keys = pygame.key.get_pressed()
        self.vx = 0
        self.vy = 0

        if any(keys[k] for k in KEY_LEFT):
            self.vx = -self.speed
            self.direction = 'left'
        elif any(keys[k] for k in KEY_RIGHT):
            self.vx = self.speed
            self.direction = 'right'

        if any(keys[k] for k in KEY_UP):
            self.vy = -self.speed
            self.direction = 'up'
        elif any(keys[k] for k in KEY_DOWN):
            self.vy = self.speed
            self.direction = 'down'

        # Update position
        self.x += self.vx * dt
        self.y += self.vy * dt

        # Clamp to screen
        self.x = max(0, min(self.x, MSX_WIDTH - 16))
        self.y = max(0, min(self.y, MSX_HEIGHT - 16))

        # Update hitbox
        self.hitbox.x = int(self.x)
        self.hitbox.y = int(self.y)

        # Animate
        if self.vx != 0 or self.vy != 0:
            self.animation_timer += dt
            if self.animation_timer >= self.animation_speed:
                self.animation_timer = 0
                self.current_frame = (self.current_frame + 1) % self.sprite_data['frame_count']

    def render(self, surface):
        """Render player"""
        if not self.active or not self.sprite_data:
            return

        frames = self.sprite_data.get('frames', [])
        if frames and self.current_frame < len(frames):
            frame = frames[self.current_frame]
            surface.blit(frame, (int(self.x), int(self.y)))
'''

def generate_game_states_py():
    """Generate game_states.py with state management"""
    return '''"""
Game State Manager
Handles different game states (menu, game, pause, etc.)
"""
import pygame
from config import *

class GameStateManager:
    """Manages game states"""
    def __init__(self, asset_manager):
        self.current_state = STATE_MENU
        self.asset_manager = asset_manager
        self.entities = []
        self.score = 0
        self.paused = False

    def init_game(self):
        """Initialize game state"""
        self.entities = []
        self.score = 0

        # Create player
        player_sprite = self.asset_manager.get_sprite('pacman_spr')
        if player_sprite:
            from entities import Player
            player = Player(MSX_WIDTH // 2 - 8, MSX_HEIGHT // 2 - 8, player_sprite)
            self.entities.append(player)

    def handle_event(self, event):
        """Handle pygame events"""
        if event.type == pygame.KEYDOWN:
            if any(event.key == k for k in KEY_PAUSE):
                if self.current_state == STATE_GAME:
                    self.paused = not self.paused
            elif event.key == pygame.K_RETURN:
                if self.current_state == STATE_MENU:
                    self.current_state = STATE_GAME
                    self.init_game()

    def update(self, dt):
        """Update current state"""
        if self.current_state == STATE_GAME and not self.paused:
            for entity in self.entities:
                entity.update(dt, self)

    def render(self, surface):
        """Render current state"""
        if self.current_state == STATE_MENU:
            self.render_menu(surface)
        elif self.current_state == STATE_GAME:
            self.render_game(surface)
            if self.paused:
                self.render_pause(surface)

    def render_menu(self, surface):
        """Render menu"""
        surface.fill((0, 0, 0))
        font = pygame.font.Font(None, 36)

        title = font.render("PACMAN", True, (255, 255, 0))
        title_rect = title.get_rect(center=(MSX_WIDTH // 2, MSX_HEIGHT // 2 - 20))
        surface.blit(title, title_rect)

        prompt = font.render("Press ENTER", True, (255, 255, 255))
        prompt_rect = prompt.get_rect(center=(MSX_WIDTH // 2, MSX_HEIGHT // 2 + 20))
        surface.blit(prompt, prompt_rect)

    def render_game(self, surface):
        """Render game"""
        surface.fill((0, 0, 0))

        # Render maze (simple grid for now)
        self.render_maze(surface)

        # Render entities
        for entity in self.entities:
            entity.render(surface)

        # Render HUD
        font = pygame.font.Font(None, 24)
        score_text = font.render(f"Score: {self.score}", True, (255, 255, 255))
        surface.blit(score_text, (5, 5))

    def render_maze(self, surface):
        """Render simple maze"""
        # Draw border
        border_color = (33, 33, 255)
        pygame.draw.rect(surface, border_color, (0, 0, MSX_WIDTH, MSX_HEIGHT), 2)

        # Draw some walls
        wall_color = (33, 33, 255)
        walls = [
            (40, 40, 80, 8),
            (160, 40, 80, 8),
            (40, 100, 8, 60),
            (200, 100, 8, 60),
        ]
        for wall in walls:
            pygame.draw.rect(surface, wall_color, wall)

    def render_pause(self, surface):
        """Render pause overlay"""
        overlay = pygame.Surface((MSX_WIDTH, MSX_HEIGHT))
        overlay.set_alpha(128)
        overlay.fill((0, 0, 0))
        surface.blit(overlay, (0, 0))

        font = pygame.font.Font(None, 36)
        pause_text = font.render("PAUSED", True, (255, 255, 255))
        pause_rect = pause_text.get_rect(center=(MSX_WIDTH // 2, MSX_HEIGHT // 2))
        surface.blit(pause_text, pause_rect)
'''

def generate_main_py():
    """Generate main.py entry point"""
    return '''#!/usr/bin/env python3
"""
Pacman - Mideas to Pygame Conversion
Entry point and main game loop
"""
import pygame
import sys
from config import *
from assets import AssetManager
from game_states import GameStateManager

def main():
    """Main game loop"""
    # Initialize Pygame
    pygame.init()

    # Create display
    screen = pygame.Surface((MSX_WIDTH, MSX_HEIGHT))
    window = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("Pacman - Mideas Edition")

    # Clock for FPS
    clock = pygame.time.Clock()

    # Load assets
    print("Loading assets...")
    asset_manager = AssetManager()
    asset_manager.load_all()
    print(f"Loaded {len(asset_manager.sprites)} sprites")
    print(f"Loaded {len(asset_manager.tiles)} tiles")

    # Create game state manager
    game_state = GameStateManager(asset_manager)

    # Main loop
    running = True
    print("Starting game loop...")

    while running:
        # Delta time in seconds
        dt = clock.tick(FPS) / 1000.0

        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            game_state.handle_event(event)

        # Update
        game_state.update(dt)

        # Render
        screen.fill((0, 0, 0))
        game_state.render(screen)

        # Scale to window
        scaled = pygame.transform.scale(screen, (WINDOW_WIDTH, WINDOW_HEIGHT))
        window.blit(scaled, (0, 0))

        # Update display
        pygame.display.flip()

    # Cleanup
    pygame.quit()
    sys.exit(0)

if __name__ == '__main__':
    main()
'''

def generate_requirements_txt():
    """Generate requirements.txt"""
    return '''pygame>=2.5.0
'''

def generate_readme_md():
    """Generate README.md"""
    return '''# Pacman - Mideas to Pygame Conversion

A playable Pacman game converted from Mideas MSX project format to Python/Pygame.

## Features

- Pixel-perfect MSX graphics (256x192 native resolution)
- Smooth 60 FPS gameplay
- Keyboard controls (arrow keys + WASD)
- Game states: Menu, Game, Pause

## Requirements

- Python 3.7+
- Pygame 2.5.0+

## Installation

```bash
pip install -r requirements.txt
```

## How to Run

```bash
python main.py
```

## Controls

- **Arrow Keys / WASD**: Move player
- **ENTER**: Start game (from menu)
- **ESC / P**: Pause game
- **SPACE / Z**: Action button

## Project Structure

- `main.py` - Entry point and game loop
- `config.py` - Game constants and settings
- `assets.py` - Asset loading from Mideas data
- `entities.py` - Entity classes (Player, etc.)
- `game_states.py` - State management
- `utils.py` - Helper functions

## Technical Details

- **Resolution**: 256x192 (MSX Screen 2), scaled 3x to 768x576 display
- **FPS**: 60
- **Architecture**: Entity-Component-System (ECS)
- **Rendering**: Pixel-perfect, nearest-neighbor scaling

## Conversion Notes

This game was automatically converted from a Mideas MSX project using the mideas-to-pygame converter. The goal is to maintain visual and gameplay parity with the original Mideas project.

### Assets Converted:
- 1 sprite (pacman_spr with 2 frames)
- 12 tiles (maze elements)

## Future Enhancements

- Add ghost enemies
- Implement pellet collection
- Add score system
- Implement proper maze from tiles
- Add sound effects
- Add multiple levels

## License

Converted from Mideas MSX project format.
'''

def main():
    """Main converter function"""
    print("=" * 60)
    print("MIDEAS TO PYGAME CONVERTER")
    print("=" * 60)

    # Paths
    project_path = r'C:\Users\salam\Documents\Programacion\Mideas\Examples\pacman_reply(35).json'
    output_dir = r'C:\Users\salam\Documents\Programacion\Mideas\pygame_games\pacman'

    # Load project
    print(f"\nLoading project: {project_path}")
    project = load_project(project_path)

    # Extract assets
    print("Extracting assets...")
    assets = extract_assets(project)

    print(f"  Found {len(assets['sprites'])} sprites")
    print(f"  Found {len(assets['tiles'])} tiles")
    print(f"  Found {len(assets['entities'])} entities")

    # Create output directory
    print(f"\nCreating output directory: {output_dir}")
    os.makedirs(output_dir, exist_ok=True)

    # Generate files
    print("\nGenerating Python files...")

    files = {
        'config.py': generate_config_py(project, assets),
        'utils.py': generate_utils_py(),
        'assets.py': generate_assets_py(project, assets),
        'entities.py': generate_entities_py(),
        'game_states.py': generate_game_states_py(),
        'main.py': generate_main_py(),
        'requirements.txt': generate_requirements_txt(),
        'README.md': generate_readme_md(),
    }

    for filename, content in files.items():
        filepath = os.path.join(output_dir, filename)
        print(f"  Writing {filename}...")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    print("\n" + "=" * 60)
    print("CONVERSION COMPLETE!")
    print("=" * 60)
    print(f"\nProject created at: {output_dir}")
    print("\nTo run the game:")
    print(f"  cd {output_dir}")
    print("  pip install -r requirements.txt")
    print("  python main.py")
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()