import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import * as Vec from '../../jmath/Vec';
import { createVisualFlyingProjectile } from '../Projectile';
import * as resurrect from '../../cards/resurrect';
import Underworld from '../../Underworld';
import { summoningSicknessId } from '../../modifierSummoningSickness';

const manaCostToCast = resurrect.default.card.manaCost;
async function animatePriestProjectileAndHit(self: Unit.IUnit, target: Unit.IUnit) {
  // TODO does this cause an issue on headless?
  await createVisualFlyingProjectile(
    self,
    target,
    'projectile/priestProjectileCenter',
  );
}
async function resurrectUnits(self: Unit.IUnit, units: Unit.IUnit[], underworld: Underworld): Promise<boolean> {
  if (units.length == 0) {
    return false;
  }
  playSFXKey('priestAttack');
  let didResurrect = false;
  await Unit.playAnimation(self, unit.animations.attack);
  let promises = [];
  for (let ally of units) {
    promises.push(animatePriestProjectileAndHit(self, ally).then(async () => {
      const { targetedUnits } = await underworld.castCards({}, self, Vec.clone(self), [resurrect.id], ally, false);
      for (let unit of targetedUnits) {
        // Add summoning sickeness so they can't act after they are summoned
        Unit.addModifier(unit, summoningSicknessId, underworld, false);
      }
    }));
    didResurrect = true;
  }
  await Promise.all(promises);
  return didResurrect;

}
const unit: UnitSource = {
  id: 'priest',
  info: {
    description: 'priest_copy',
    image: 'units/priestIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    attackRange: 500,
    healthMax: 20,
    damage: 20,
    manaCostToCast,
    manaMax: manaCostToCast,
    manaPerTurn: manaCostToCast / 2
  },
  spawnParams: {
    probability: 20,
    budgetCost: 9,
    unavailableUntilLevelIndex: 4,
  },
  animations: {
    idle: 'units/priestIdle',
    hit: 'units/priestHit',
    attack: 'units/priestAttack',
    die: 'units/priestDeath',
    walk: 'units/priestWalk',
  },
  sfx: {
    damage: 'priestHurt',
    death: 'priestDeath',
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    let didAction = false;
    if (attackTargets.length) {
      // Priests attack or move, not both; so clear their existing path
      unit.path = undefined;
      // Resurrect dead ally
      const numberOfAlliesToRez = unit.isMiniboss ? 3 : 1;
      didAction = await resurrectUnits(unit, attackTargets.slice(0, numberOfAlliesToRez), underworld);
    }
    if (!didAction) {
      const closestDeadAlly = Unit.closestInListOfUnits(unit,
        underworld.units.filter((u) => u !== unit && u.faction == unit.faction && !u.alive)
      );
      // Move to closest dead ally
      if (closestDeadAlly) {
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestDeadAlly, unit.stamina);
        await Unit.moveTowards(unit, moveTo, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.mana < manaCostToCast) {
      return [];
    }
    const resurrectableAllies = underworld.units.filter(u =>
      u.faction == unit.faction
      && !u.alive
      && Unit.inRange(unit, u)
      // Do not allow priest to rez each other.
      // That would be super annoying for players
      && u.unitSourceId !== unit.unitSourceId);
    return resurrectableAllies;
  }
};

export default unit;
