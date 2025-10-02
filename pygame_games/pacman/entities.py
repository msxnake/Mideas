"""
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
