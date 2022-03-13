export const PLAYER_BASE_HEALTH = 10;
export const UNIT_BASE_MOVE_DISTANCE = 120;
export const UNIT_BASE_ATTACK_RANGE = 120;
export const COLLISION_MESH_RADIUS = 32;
export const LOB_PROJECTILE_SPEED = 600; // in millis
export const UNIT_SIZE = COLLISION_MESH_RADIUS * 2;
export const UNIT_BASE_HEALTH = 3;
export const UNIT_BASE_MANA = 100;
export const UNIT_BASE_DAMAGE = 1;
// Ensures that the resolveDoneMoving callback will timeout if it never gets called.
// This ensures that the game doesn't get stuck if, say, the collision system bugs
// out and a unit never comes to rest
export const RESOLVE_DONE_MOVING_TIMEOUT_MS = 1000;
// Note: UNIT_MOVE_SPEED cannot be less than
// UNIT_STOP_MOVING_MARGIN or else it will assume
// no movement has happend and invoke resolveDoneMoving
export const UNIT_MOVE_SPEED = 4;
// Stops units from moving when they are close enough
export const UNIT_STOP_MOVING_MARGIN = 1;
export const NON_HEAVY_UNIT_SCALE = 0.8;
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;
export const SECONDS_PER_TURN = 100;
export const START_CARDS_COUNT = 60;
export const NUM_PICKUPS_PER_LEVEL = 2;
export const NUM_OBSTACLES_PER_LEVEL = 10;
export const MILLIS_PER_ANIMATION = 200;
export const MILLIS_PER_SPELL_ANIMATION = 400;
export const PERCENT_CHANCE_OF_HEAVY_UNIT = 10;
export const NUMBER_OF_UPGRADES_TO_CHOOSE_FROM = 5;
export const PORTAL_COORDINATES = {
  x: MAP_WIDTH - COLLISION_MESH_RADIUS,
  y: MAP_HEIGHT / 2,
};

// Overworld
export const OVERWORLD_HEIGHT = 9;
export const OVERWORLD_MAX_WIDTH = 9;
export const OVERWORLD_SPACING = 100;

// Mana
export const MANA_GET_PER_TURN = 5;
export const DISTANCE_FAR = 300;
export const DISTANCE_VERY_FAR = 600;