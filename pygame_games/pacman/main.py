#!/usr/bin/env python3
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
