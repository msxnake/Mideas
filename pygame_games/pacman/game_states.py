"""
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
