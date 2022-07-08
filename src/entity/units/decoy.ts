import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import type * as Unit from '../Unit';
import * as config from '../../config';

const unit: UnitSource = {
  id: 'decoy',
  info: {
    description: 'A decoy to distract enemies',
    image: 'units/decoy',
    subtype: UnitSubType.MELEE,
  },
  animations: {
    idle: 'units/decoy',
    hit: 'units/decoy',
    attack: 'units/decoy',
    die: 'units/decoy',
    walk: 'units/decoy',
  },
  unitProps: {
    staminaMax: 0,
    attackRange: 0,
    manaMax: 0,
    healthMax: 7,
    // This is critical to a decoy, it prevents it from being pushed
    immovable: true,
    radius: config.COLLISION_MESH_RADIUS
  },
  action: async (_self: Unit.IUnit, _attackTarget: Unit.IUnit | undefined, _canAttackTarget: boolean) => { }
};

export default unit;
