interface Subsprite {
  imageName: string;
  alpha: number;
  anchor: {
    x: number;
    y: number;
  };
  scale: {
    x: number;
    y: number;
  };
}
interface Subsprites {
  [key: string]: Subsprite;
}
const Subsprites: Subsprites = {
  disconnected: {
    imageName: 'images/disconnected.png',
    alpha: 1.0,
    anchor: {
      x: 0.5,
      y: 0.5,
    },
    scale: {
      x: 1,
      y: 1,
    },
  },
  headband: {
    imageName: 'images/headband.png',
    alpha: 1.0,
    anchor: {
      x: 0.5,
      y: 0.5,
    },
    scale: {
      x: 1,
      y: 1,
    },
  },
  make_vulnerable: {
    imageName: 'images/spell/make_vulnerable.png',
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
  freeze: {
    imageName: 'images/spell/freeze.png',
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
  shield: {
    imageName: 'images/spell/shield.png',
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
  ownCharacterMarker: {
    imageName: 'images/units/unit-underline.png',
    alpha: 1.0,
    anchor: {
      x: 0.5,
      y: 0.5,
    },
    scale: {
      x: 1,
      y: 1,
    },
  },
};
export default Subsprites;
