import * as particles from '@pixi/particle-emitter'
import { IUnit, takeDamage } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import { Spell } from './index';
import { drawUICircle } from '../graphics/PlanningView';
import { forcePush, velocityStartMagnitude } from './push';
import type Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { createParticleTexture, simpleEmitter } from '../graphics/Particles';
import { Vec2 } from '../jmath/Vec';
import * as colors from '../graphics/ui/colors';

const id = 'Bloat';
const imageName = 'explode-on-death.png';
const damage = 1;
const baseRadius = 140;
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number, extra?: { additionalRadius?: number }) {
  const additionalRadius = extra && extra.additionalRadius || 0;
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: true,
      quantity,
      radius: baseRadius + additionalRadius
    };
    // Add event
    if (!unit.onDeathEvents.includes(id)) {
      unit.onDeathEvents.push(id);
    }
    // Add subsprite image
    if (unit.image) {
      // Visually "bloat" the image
      unit.image.sprite.scale.x = 1.5;
    }
  }
}
function remove(unit: IUnit, underworld: Underworld) {
  if (unit.image) {
    // reset the scale
    unit.image.sprite.scale.x = 1.0;
  }
}

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'spellIconBloat.png',
    description: `Cursed targets explode when they die dealing ${damage} damage to all units within the
    explosion radius.
    Multiple stacks of bloat will increase the amount of damage done when the unit explodes.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        Unit.addModifier(unit, id, underworld, prediction, quantity, { additionalRadius: state.aggregator.additionalRadius });
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
    subsprite: {
      imageName,
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
  events: {
    onDeath: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[id]
      const quantity = modifier?.quantity || 1;
      const adjustedRange = modifier?.radius || baseRadius;
      if (prediction) {
        drawUICircle(unit, adjustedRange, colors.healthRed, 'Explosion Radius');
      } else {
        playSFXKey('bloatExplosion');
      }
      makeBloatExplosionWithParticles(unit, prediction, adjustedRange / baseRadius);
      underworld.getUnitsWithinDistanceOfTarget(
        unit,
        adjustedRange,
        prediction
      ).forEach(u => {
        // Deal damage to units
        takeDamage(u, damage * quantity, u, underworld, prediction);
        // Push units away from exploding unit
        forcePush(u, unit, velocityStartMagnitude, underworld, prediction);
      });
      underworld.getPickupsWithinDistanceOfTarget(
        unit,
        adjustedRange,
        prediction
      ).forEach(p => {
        // Push pickups away
        forcePush(p, unit, velocityStartMagnitude, underworld, prediction);
      })
    }
  }
};
function makeBloatExplosionWithParticles(position: Vec2, prediction: boolean, sizeProportionModifier: number = 1) {
  if (prediction) {
    // Don't show if just a prediction
    return
  }
  const texture = createParticleTexture();
  if (!texture) {
    console.error('No texture for makeBloatExplosion')
    return
  }
  const config =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 0
      },
      "scale": {
        "start": 3,
        "end": 2,
      },
      "color": {
        "start": "#d66437",
        "end": "#f5e8b6"
      },
      "speed": {
        "start": 900,
        "end": 50,
        "minimumSpeedMultiplier": 1
      },
      "acceleration": {
        "x": 0,
        "y": 0
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": 0,
        "max": 360
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 300
      },
      "lifetime": {
        "min": 0.3 * sizeProportionModifier,
        "max": 0.3 * sizeProportionModifier
      },
      "blendMode": "normal",
      "frequency": 0.0001,
      "emitterLifetime": 0.1,
      "maxParticles": 2000,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": true,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": 0,
        "r": 0
      }
    }, [texture]);
  simpleEmitter(position, config);
}
export default spell;
