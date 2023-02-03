import type * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as Doodad from '../entity/Doodad';
import type { Vec2 } from '../jmath/Vec';
import Events, {
  onDamage,
  onDeath,
  onMove,
  onAgro,
  onTurnStart,
  onTurnEnd,
} from '../Events';
import Subsprites, { Subsprite } from '../Subsprites';
// Register spells:
import slash, { UnitDamage } from './slash';
import rend from './rend';
import bleed from './bleed';
import suffocate from './suffocate';
import add_heal from './add_heal';
import target_circle from './target_circle';
import connect from './connect';
import contagious from './contagious';
import freeze from './freeze';
import raise_dead from './resurrect';
import shield from './shield';
import fortify from './fortify';
import swap from './swap';
import displace from './displace';
import purify from './purify';
import poison from './poison';
import debilitate from './debilitate';
import * as protection from './protection';
import clone from './clone';
import capture_soul from './capture_soul';
import mana_burn from './mana_burn';
import mana_steal from './mana_steal';
import vampire_bite from './blood_curse';
import push from './push';
import pull from './pull';
import vortex from './vortex';
import dash from './dash';
import repel from './repel';
import decoy from './summon_decoy';
import summon_generic from './summon_generic';
import explode from './bloat';
import corpse_explosion from './corpse_explosion';
import lastWill from './lastwill';
import split from './split';
import drown from './drown';
import target_similar from './target_similar';
import target_all from './target_all';
import target_cone from './target_cone';
import plus_radius from './plus_radius';
import shove from './shove';
import target_column from './target_column';
import burst from './burst';
import slow from './slow';
import death_wager from './death_wager';
import sacrifice from './sacrifice';
import devRecordDelay from './devRecordDelay';
import registerSummoningSickness from '../modifierSummoningSickness';
import arrow from './arrow';
import target_arrow from './target_arrow';
import conserve from './conserve';
import phantom_arrow from './phantom_arrow';

import * as config from '../config';

import { IUpgrade, upgradeCardsSource } from '../Upgrade';
import { _getCardsFromIds } from './cardUtils';
import { addCardToHand } from '../entity/Player';
import Underworld from '../Underworld';
import { CardCategory, CardRarity, probabilityMap, UnitType } from '../types/commonTypes';
import { HasSpace } from '../entity/Type';
import { Overworld } from '../Overworld';
import { allUnits } from '../entity/units';
import floatingText from '../graphics/FloatingText';
import { Localizable } from '../localization';
import { distance } from '../jmath/math';
export interface Modifiers {
  subsprite?: Subsprite;
  // run special init logic (usually for visuals) when a modifier is added or loaded
  // see 'poison' for example
  // init is inteded to be called within add.
  init?: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => void;
  add?: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number, extra?: object) => void;
  remove?: (unit: Unit.IUnit, underworld: Underworld) => void;
}
interface Events {
  onDamage?: onDamage;
  onDeath?: onDeath;
  onMove?: onMove;
  onAgro?: onAgro;
  onTurnStart?: onTurnStart;
  onTurnEnd?: onTurnEnd;

}
export interface Spell {
  card: ICard;
  // modifiers keep track of additional state on an individual unit basis
  modifiers?: Modifiers;
  // events trigger custom behavior when some event occurs
  events?: Events;
}
export function registerModifiers(id: string, modifiers: Modifiers) {

  allModifiers[id] = modifiers;
}
export function registerEvents(id: string, events: Events) {
  if (events.onAgro) {
    Events.onAgroSource[id] = events.onAgro;
  }
  if (events.onDamage) {
    Events.onDamageSource[id] = events.onDamage;
  }
  if (events.onDeath) {
    Events.onDeathSource[id] = events.onDeath;
  }
  if (events.onMove) {
    Events.onMoveSource[id] = events.onMove;
  }
  if (events.onTurnStart) {
    Events.onTurnStartSource[id] = events.onTurnStart;
  }
  if (events.onTurnEnd) {
    Events.onTurnEndSource[id] = events.onTurnEnd;
  }

}

function register(spell: Spell, overworld: Overworld) {
  const { modifiers, card, events } = spell;
  const { id } = card;
  // Add card to cards pool
  allCards[id] = card;
  // Add modifiers to allModifiers
  if (spell.modifiers) {
    registerModifiers(id, spell.modifiers);
  }
  // Add card as upgrade:
  upgradeCardsSource.push(cardToUpgrade(card, overworld));
  // Add subsprites
  if (modifiers && modifiers.subsprite) {
    Subsprites[modifiers.subsprite.imageName] = modifiers.subsprite;
  }
  // Add events
  if (events) {
    registerEvents(id, events);
  }
}
export function registerCards(overworld: Overworld) {
  if (location && location.href.includes('localhost')) {
    register(devRecordDelay, overworld);
  }
  register(slash, overworld);
  register(rend, overworld);
  register(bleed, overworld);
  register(suffocate, overworld);
  register(add_heal, overworld);
  register(target_circle, overworld);
  register(connect, overworld);
  // register(contagious, overworld);
  register(freeze, overworld);
  register(raise_dead, overworld);
  register(shield, overworld);
  register(fortify, overworld);
  register(poison, overworld);
  register(purify, overworld);
  register(swap, overworld);
  register(displace, overworld);
  register(debilitate, overworld);
  // Nullify / "protection" is too powerful, remove for now
  // - **bug** nullify bug: it doesn't leave after it cancels a spell so if you cast it on an enemy you cant kill it
  // register(protection.default, overworld);
  register(clone, overworld);
  register(mana_burn, overworld);
  register(mana_steal, overworld);
  register(vampire_bite, overworld);
  register(push, overworld);
  register(pull, overworld);
  register(vortex, overworld);
  register(dash, overworld);
  register(repel, overworld);
  register(decoy, overworld);
  register(explode, overworld);
  // Temporarily remove corpse_explosion until optimization
  // issues are solved
  // register(corpse_explosion, overworld);
  register(lastWill, overworld);
  register(split, overworld);
  register(drown, overworld);
  register(target_similar, overworld);
  register(target_all, overworld);
  register(target_cone, overworld);
  register(plus_radius, overworld);
  register(shove, overworld);
  register(target_column, overworld);
  register(burst, overworld);
  register(slow, overworld);
  register(death_wager, overworld);
  register(capture_soul, overworld);
  register(sacrifice, overworld);
  register(arrow, overworld);
  register(phantom_arrow, overworld);
  // TODO: Target arrow isn't ready due to the fact that the convenience UX of being able to fire arrows
  // past your cast range has targeting complications with Target Arrow and I haven't been able to find
  // a solution that doesn't introduce bugs or complexity.
  // register(target_arrow, overworld);
  // TODO: Refactor bolt into soulbind, it didn't work out well as a spell
  // register(bolt, overworld);
  register(conserve, overworld);
  for (let unitId of Object.keys(allUnits)) {
    const spell = summon_generic(unitId, false);
    if (spell) {
      register(spell, overworld);
    }
    const spellMiniboss = summon_generic(unitId, true);
    if (spellMiniboss) {
      register(spellMiniboss, overworld);
    }
  }

  // Register floating modifier (non-card);
  registerSummoningSickness();

}
function cardToUpgrade(c: ICard, overworld: Overworld): IUpgrade {
  // Make forbidden cards unavailable in demo
  const probability = globalThis.isDemo && c.probability == probabilityMap[CardRarity.FORBIDDEN] ? 0 : c.probability;
  return {
    title: c.id,
    type: 'card',
    cardCategory: c.category,
    description: () => i18n(c.description).trim(),
    thumbnail: `images/spell/${c.thumbnail}`,
    // TODO: Feature creep: What if you could UPGRADE the effect of a spell!! 0.o
    maxCopies: 1,
    effect: (player) => {
      if (!overworld.underworld) {
        console.error('Cannot add card to hand, underworld is undefined');
        return;
      }
      addCardToHand(c, player, overworld.underworld);
    },
    probability: probability,
    cost: { healthCost: c.healthCost, manaCost: c.manaCost }
  };
}

// Guiding rules for designing spells:
// Follow the Priciple of Least Surpise
// Every spell effect should be designed to respond well to potentially more than one target
// Note: spells can be found in their own files in src/cards/*
// Make sure each spell's effect returns the state at the very end

export interface EffectState {
  cardIds: string[];
  shouldRefundLastSpell: boolean;
  casterCardUsage?: Player.CardUsage;
  casterUnit: Unit.IUnit;
  casterPositionAtTimeOfCast: Vec2;
  casterPlayer?: Player.IPlayer;
  targetedUnits: Unit.IUnit[];
  targetedPickups: Pickup.IPickup[];
  targetedDoodads: Doodad.IDoodad[];
  castLocation: Vec2;
  // aggregator carries extra information that can be passed
  // between card effects.
  aggregator: {
    unitDamage: UnitDamage[],
    radius: number;
  };
  // If preCachedTargetedUnitIds exists,
  // it prevents non precached units from being targeted
  // This functions as a way to guaruntee that only the units
  // shown in the prediction will be affected by the spell, so
  // if you cast a spell and your networked ally walks into it's
  // radius after you clicked but while the message is still going
  // to their client, it won't hit them.
  preCachedTargetedUnitIds?: number[];
}
export function refundLastSpell(state: EffectState, prediction: boolean, floatingMessage?: string) {
  // Only refund the spell when it's not a prediction so that
  // it will show the mana cost in the UI of "remaining mana" even if
  // they are not currently hovering a valid target.
  // ---
  // Only allow refunding player units' mana. For example, if a priest casts resurrect
  // on a dead enemy that has "protection" on it (so the resurrect fails), it should not refund
  // priests mana.
  // Refund is exclusively for the benefit of players so they don't get frusterated by fizzle spells.
  if (!prediction && state.casterUnit.unitType == UnitType.PLAYER_CONTROLLED) {
    state.shouldRefundLastSpell = true;
    if (floatingMessage) {
      floatingText({ coords: state.casterUnit, text: floatingMessage });
    }
  }

}
export function hasTargetAtPosition(position: Vec2, underworld: Underworld): boolean {
  const unitAtCastLocation = underworld.getUnitAt(position);
  const pickupAtCastLocation = underworld.getPickupAt(position);
  const doodadAtCastLocation = underworld.getDoodadAt(position);
  return !!unitAtCastLocation || !!pickupAtCastLocation || !!doodadAtCastLocation;
}
export function defaultTargetsForAllowNonUnitTargetTargetingSpell(targets: Vec2[], castLocation: Vec2, card: ICard): Vec2[] {
  if (card.allowNonUnitTarget && card.category === CardCategory.Targeting) {
    // Defaulting targets for a allowNonUnitTarget Targeting spell is handled specially:
    // For most (other) spells, you want the spell to snap to the target for convenience,
    // but for targeting spells you're often trying to pick a specific spot to target as many
    // as possible, therefore we do not want any snaping.
    // Returning just the castLocation when only one target (or less) is targeted
    // means that the spell will cast on the castLocation rather than the center of 
    // targets[0], which is some entity's (unit, pickup, doodad) center.
    const firstTarget = targets[0];
    return (
      // If there are no targets, return the cast location so players can cast a targeting spell anywhere on the ground
      targets.length == 0
      ||
      // If there is only 1 target, return the cast location (e.g. disable snapping) so long as the target isn't moving due to the spell.  If the distance from the target to the cast location
      // is less than what would be a selectable distance then disable snapping to the target; however, if not, DO SNAP (this allows Push + Targeting Spell to make the targeting spell appear at the final position
      // that the unit was pushed to) 
      firstTarget && targets.length == 1 && distance(firstTarget, castLocation) <= ((Unit.isUnit(firstTarget) && firstTarget.isMiniboss) ? config.SELECTABLE_RADIUS * config.UNIT_MINIBOSS_SCALE_MULTIPLIER : config.SELECTABLE_RADIUS)
    ) ? [castLocation] : targets;
  } else {
    console.error('defaultTargetsForAllowNonUnitTargetTargetingSpell was invoked on a card that it wasn\'t designed for:', card.id);
    return targets;
  }

}
// Returns all current targets of an effect / spell
// See underworld.getPotentialTargets for the function that returns all targetable
// entities
export function getCurrentTargets(state: EffectState): HasSpace[] {
  return [...state.targetedUnits, ...state.targetedPickups, ...state.targetedDoodads];
}
type CalculateReturn = {
  // For target spells
  newUnitIds?: number[];
  // For target spells
  newPickupIds?: number[];
  // // attribute change
  // health?: number;
  // healthMax?: number;
  // mana?: number;
  // manaMax?: number;
  // staminaMax?: number;
  // // position change
  // pos?: Vec2;
}
type SpellsCalculation = {
  cardId: string;
  quantity: number;
} & CalculateReturn;
type CalculateOutcomeReturn = {
  spells: SpellsCalculation[];
  // What the spell was cast on:
  targetedUnitId: number;
  // What the spell was cast on:
  targetedPickupId: number;
  // What the spell was cast on:
  castLocation: Vec2;
}
// Invoked on all cards in a spell
export type calculateOutcomeFn = {
  // prediction is for displaying to the user what will happen if they cast
  (cards: ICard[], underworld: Underworld): Promise<CalculateOutcomeReturn>;
};

// Belongs to each card
// Right now it seems like calculate is only useful for targeting cards
export type CalculateFn = {
  // calculate needs prediction so it can search for prediction units in the underworld
  (args: RealizedCalculateArgs, underworld: Underworld, prediction: boolean): CalculateReturn;
};
export type Effect2Fn = {
  (args: RealizedCalculateArgs, underworld: Underworld, prediction: boolean, castLocation?: Vec2): void;
};
// Calculate args have ids and go over the network,
// realized calculate args are populated with the actual units
type RealizedCalculateArgs = {
  card: ICard,
  casterUnit: Unit.IUnit,
  targetedUnits: Unit.IUnit[],
  targetedPickups: Pickup.IPickup[],
  quantity: number,
  castLocation: Vec2,
  // aggregator carries extra information that can be passed
  // between card effects.
  aggregator: {
    unitDamage: UnitDamage[],
    radius: number;
  }
}
export type AnimateSpellFn = {
  (args: RealizedCalculateArgs, triggerEffectStage: () => void, underworld: Underworld, castLocation?: Vec2): Promise<void>;
};
export type ShowPredictionFn = {
  (args: RealizedCalculateArgs, outOfRange?: boolean): void;
}
export type EffectFn = {
  // prediction is for displaying to the user what will happen if they cast
  (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean): Promise<EffectState>;
};
export interface ICard {
  id: string;
  category: CardCategory;
  manaCost: number;
  healthCost: number;
  probability: number;
  thumbnail: string;
  // The path for the animation effect when the spell is cast
  animationPath?: string;
  effect?: EffectFn;

  // These 4 card functions (showPrediction, effect2, calculate, animate) that ensure reliable outcome across multiple clients with potentially desynced state
  showPrediction?: ShowPredictionFn;
  // effect2 triggers the effect of the card on a unit or pickup passed in by id (passed by id so there's no chance of desync
  // due to location)
  effect2?: Effect2Fn;
  // Calculate, for now, is used only to return new unit/pickup targets from each targeting spell
  calculate?: CalculateFn;
  // Animate handles the sfx and visuals of a spell, only used in non-prediction clients (not headless)
  animate?: AnimateSpellFn;


  description: Localizable;
  // requiresFollowingCard is for cards like chain or AOE that need another
  // card to follow them in order to have an effect
  requiresFollowingCard?: boolean;
  // The number of turns it takes after use to return to it's original cost
  // Default is 1
  expenseScaling: number;
  // This flag allows casting on the ground and is necessary
  // for spells like AOE, Trap, etc
  allowNonUnitTarget?: boolean;
  // supportQuantity, if true, makes multiple sequential invokations of a card combine
  // into only 1 invokation with a quantity arg passed to the effect function.
  // If false, it will just invoke card.effect for the number of times that the card
  // is in the spell
  supportQuantity?: boolean;
  // used to assist with targeting for spells that only affect dead units
  onlySelectDeadUnits?: boolean;
  sfx?: string;
}

export const allCards: { [cardId: string]: ICard } = {};
export const allModifiers: { [id: string]: Modifiers } = {};

export function getCardsFromIds(cardIds: string[]): ICard[] {
  return _getCardsFromIds(cardIds, allCards);
}

export function addTargetForCalculatedReturn(target: any, returnValue: CalculateReturn) {
  if (Unit.isUnit(target)) {
    // Adds a unit IF it is not already added 
    if (returnValue.newUnitIds && returnValue.newUnitIds.indexOf(target.id) === -1) {
      returnValue.newUnitIds.push(target.id);
    } else {
      returnValue.newUnitIds = [target.id];
    }
  } else if (Pickup.isPickup(target)) {
    // Adds a pickup IF it is not already added 
    if (returnValue.newPickupIds && returnValue.newPickupIds.indexOf(target.id) === -1) {
      returnValue.newPickupIds.push(target.id);
    } else {
      returnValue.newPickupIds = [target.id];
    }
  } else {
    console.error('addTarget unsupported for ', target);
  }
}
export function addTarget(target: any, effectState: EffectState) {
  if (Unit.isUnit(target)) {
    addUnitTarget(target, effectState);
  } else if (Pickup.isPickup(target)) {
    addPickupTarget(target, effectState);
  } else if (Doodad.isDoodad(target)) {
    addDoodadTarget(target, effectState);
  } else {
    console.error('addTarget unsupported for ', target);
  }
}

// forceAdd overrides the preCachedTargetedUnitIds check.  This is used for when a unit is created
// by the spell such as Summon Decoy (so it's unit id wouldn't have been available to cache)
export function addUnitTarget(unit: Unit.IUnit, effectState: EffectState, forceAdd?: boolean) {
  if (!forceAdd && effectState.preCachedTargetedUnitIds && !effectState.preCachedTargetedUnitIds.includes(unit.id)) {
    console.log('Omit unit', unit.id, ' from targeting because it wasnt precached');
    return;
  }
  // Adds a unit to effectState.targetedUnits IF it is not already in unitTargets
  if (effectState.targetedUnits.indexOf(unit) === -1) {
    effectState.targetedUnits.push(unit);
  }
}
export function addPickupTarget(pickup: Pickup.IPickup, effectState: EffectState) {
  // Adds a pickup to effectState.targetedPickups IF it is not already in targetedPickups
  if (effectState.targetedPickups.indexOf(pickup) === -1) {
    effectState.targetedPickups.push(pickup);
  }
}
export function addDoodadTarget(doodad: Doodad.IDoodad, effectState: EffectState) {
  // Adds a doodad to effectState.targetedDoodads IF it is not already in targetedDoodads
  if (effectState.targetedDoodads.indexOf(doodad) === -1) {
    effectState.targetedDoodads.push(doodad);
  }
}