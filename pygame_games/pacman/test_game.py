#!/usr/bin/env python3
"""
Test script to verify game loads correctly
"""
import os
os.environ['SDL_VIDEODRIVER'] = 'dummy'  # Headless mode

import pygame
from config import *
from assets import AssetManager
from game_states import GameStateManager

def test_game():
    """Test game initialization"""
    print("=" * 60)
    print("TESTING PACMAN PYGAME PROJECT")
    print("=" * 60)

    try:
        # Initialize Pygame
        print("\n1. Initializing Pygame...")
        pygame.init()
        print("   OK - Pygame initialized")

        # Create display (dummy)
        print("\n2. Creating display...")
        screen = pygame.Surface((MSX_WIDTH, MSX_HEIGHT))
        print(f"   OK - Screen surface created ({MSX_WIDTH}x{MSX_HEIGHT})")

        # Load assets
        print("\n3. Loading assets...")
        asset_manager = AssetManager()
        asset_manager.load_all()
        print(f"   OK - Loaded {len(asset_manager.sprites)} sprites")
        print(f"   OK - Loaded {len(asset_manager.tiles)} tiles")

        # Verify sprites
        print("\n4. Verifying sprites...")
        for sprite_name, sprite_data in asset_manager.sprites.items():
            frames = sprite_data.get('frames', [])
            print(f"   - {sprite_name}: {len(frames)} frames")
            for i, frame in enumerate(frames):
                print(f"     Frame {i}: {frame.get_width()}x{frame.get_height()}")

        # Verify tiles
        print("\n5. Verifying tiles...")
        for tile_name, tile_surface in asset_manager.tiles.items():
            print(f"   - {tile_name}: {tile_surface.get_width()}x{tile_surface.get_height()}")

        # Create game state manager
        print("\n6. Creating game state manager...")
        game_state = GameStateManager(asset_manager)
        print("   OK - GameStateManager created")

        # Initialize game
        print("\n7. Initializing game...")
        game_state.init_game()
        print(f"   OK - Game initialized with {len(game_state.entities)} entities")

        # Test a few update cycles
        print("\n8. Testing game loop...")
        for i in range(5):
            game_state.update(1.0 / 60.0)
            game_state.render(screen)
        print("   OK - Game loop working")

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED!")
        print("=" * 60)
        print("\nThe game is ready to run.")
        print("Execute: python main.py")
        return True

    except Exception as e:
        print(f"\n!!! ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        pygame.quit()

if __name__ == '__main__':
    success = test_game()
    exit(0 if success else 1)