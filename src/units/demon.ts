import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import * as config from '../config';

const CAST_MANA_COST = 30;
const unit: UnitSource = {
  id: 'demon',
  info: {
    description: 'A demon resurrects its allies.',
    image: 'units/demon.png',
    subtype: UnitSubType.DEMON,
    probability: 30,
  },
  unitProps: {
    manaMax: 60
  },
  extraTooltipInfo: () => {
    return `Mana cost per cast: ${CAST_MANA_COST}`;
  },
  action: async (unit: Unit.IUnit) => {
    // If they have enough mana
    if (unit.mana >= CAST_MANA_COST) {
      unit.mana -= CAST_MANA_COST;

      // Resurrect a dead unit
      const deadAIs = window.underworld.units.filter(
        (u) => u.unitType === UnitType.AI && !u.alive,
      );
      if (deadAIs.length) {
        const deadUnit = deadAIs[0];
        if (deadUnit) {
          await createVisualFlyingProjectile(
            unit,
            deadUnit.x,
            deadUnit.y,
            'green-thing.png',
          );
          Unit.resurrect(deadUnit);
          // Change resurrected unit to own faction
          Unit.changeFaction(deadUnit, unit.faction);
        }
      }
    }
    // Move randomly
    const moveCoords = window.underworld.getRandomCoordsWithinBounds({ xMin: config.UNIT_SIZE, yMin: config.COLLISION_MESH_RADIUS, xMax: window.underworld.width - config.COLLISION_MESH_RADIUS, yMax: window.underworld.height - config.COLLISION_MESH_RADIUS });
    await Unit.moveTowards(unit, moveCoords);
  },
};

export default unit;
