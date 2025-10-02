# Pacman - Mideas to Pygame Conversion

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
