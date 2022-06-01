import { lineSegmentIntersection } from "./collision/collisionMath";
import { distance, lerp, similarTriangles } from "./math";
import { isVec2InsidePolygon } from "./Polygon";
import { randFloat, randInt } from "./rand";
import * as Vec from "./Vec";
import * as config from './config';
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndex } from "./WaveFunctionCollapse";
import { conway, ConwayState } from "./Conway";

export const caveSizes: { [size: string]: CaveParams } = {
    'small': {
        minThickness: config.OBSTACLE_SIZE,
        startThickness: 150,
        startPointJitter: 500,
        iterations: 15,
        velocity: 80
    },
    'medium': {
        minThickness: config.OBSTACLE_SIZE,
        startThickness: 150,
        startPointJitter: 700,
        iterations: 20,
        velocity: 100
    }
}
interface CaveParams {
    minThickness: number;
    startThickness: number;
    // How far apart the starting points of the cave
    // crawlers could be from the center
    startPointJitter: number;
    // How many steps the cave crawlers take,
    iterations: number;
    velocity: number;
    // How far each cave crawler step is
}
const directionRandomAmount = Math.PI / 2;
export interface Limits { xMin: number, xMax: number, yMin: number, yMax: number };
export function generateCave(params: CaveParams): { map: Map, limits: Limits } {
    // Debug: Draw caves
    window.debugCave.clear();
    const minDirection = randFloat(window.underworld.random, Math.PI, Math.PI / 2);
    const maxDirection = 0;
    let crawlers = [];
    const NUMBER_OF_CRAWLERS = randInt(window.underworld.random, 2, 4);
    for (let c = 0; c < NUMBER_OF_CRAWLERS - 1; c++) {
        const previousCrawler = crawlers[c - 1];
        const cc: CaveCrawler = {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: params.startThickness,
            position: Vec.round(Vec.random(-params.startPointJitter, params.startPointJitter)),
            path: [],
            left: [],
            right: [],
            rectangles: []
        }
        crawl(cc, previousCrawler ? previousCrawler.path[1] as Vec.Vec2 : Vec.round(Vec.random(-params.startPointJitter, params.startPointJitter)), params);
        crawlers.push(cc);
    }

    const previousCrawler = crawlers[crawlers.length - 1];
    const firstCrawler = crawlers[0];
    if (previousCrawler && firstCrawler) {

        // Connect first crawler and last crawler:
        const cc: CaveCrawler = {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: params.startThickness,
            position: firstCrawler.path[firstCrawler.path.length - 1] as Vec.Vec2,
            path: [],
            left: [],
            right: [],
            rectangles: []
        }
        crawl(cc, previousCrawler.path[1] as Vec.Vec2, params);
        crawlers.push(cc);
    }
    // Get bounds
    const crawlerBounds = getLimits(crawlers.map(c => [...c.left, ...c.right]).flat());

    // Debug Draw bounds
    // window.debugCave.lineStyle(2, 0xff0000, 1.0);
    // window.debugCave.moveTo(crawlerBounds.xMin, crawlerBounds.yMin);
    // window.debugCave.lineTo(crawlerBounds.xMin, crawlerBounds.yMax);
    // window.debugCave.lineTo(crawlerBounds.xMax, crawlerBounds.yMax);
    // window.debugCave.lineTo(crawlerBounds.xMax, crawlerBounds.yMin);
    // window.debugCave.lineTo(crawlerBounds.xMin, crawlerBounds.yMin);

    // + 2 leaves room on the right side and bottom side for surrounding walls
    const width = Math.ceil((crawlerBounds.xMax - crawlerBounds.xMin) / config.OBSTACLE_SIZE) + 2;
    const height = Math.ceil((crawlerBounds.yMax - crawlerBounds.yMin) / config.OBSTACLE_SIZE) + 2;
    const materials: Material[] = Array(width * height).fill(Material.EMPTY);
    // Normalize crawlers to 0,0 in upper left corner
    function normalizeTo00(points: Vec.Vec2[]): Vec.Vec2[] {
        return points.map(p => ({ x: p.x - crawlerBounds.xMin, y: p.y - crawlerBounds.yMin }))
    }
    crawlers = crawlers.map(c =>
    ({
        ...c,
        path: normalizeTo00(c.path),
        rectangles: c.rectangles.map(normalizeTo00)
    }));

    crawlersChangeTilesToMaterial(crawlers, Material.GROUND, width, height, materials);


    // Debug draw caves
    // const styles = [0xff0000, 0x0000ff, 0xff00ff, 0x00ffff, 0xffff00];
    // function drawPathWithStyle(path: Vec.Vec2[], style: number, opacity: number) {
    //     window.debugCave.lineStyle(4, style, opacity);
    //     if (path[0]) {
    //         window.debugCave.moveTo(path[0].x, path[0].y);
    //         // @ts-expect-error
    //         window.debugCave.drawCircle(path[1].x, path[1].y, 25);
    //         for (let point of path) {
    //             window.debugCave.lineTo(point.x, point.y);
    //         }
    //     }

    // }
    // // Debug Fill
    // for (let i = 0; i < crawlers.length; i++) {
    //     const crawler = crawlers[i];
    //     if (crawler) {
    //         drawPathWithStyle(crawler.path, 0x000000, 0.1);
    //         window.debugCave.beginFill(styles[i % styles.length], 0.1);
    //         for (let rect of crawler.rectangles) {
    //             // @ts-expect-error
    //             window.debugCave.drawPolygon(rect);
    //         }
    //         window.debugCave.endFill();
    //     }
    // }

    // // Debug Lines
    // for (let i = 0; i < crawlers.length; i++) {
    //     const crawler = crawlers[i];
    //     if (crawler) {
    //         drawPathWithStyle(crawler.path, styles[i % styles.length] as number, 0.1);
    //         window.debugCave.lineStyle(1, 0x000000, 0.0);
    //     }
    // }
    // 1st pass for walls
    let conwayState: ConwayState = {
        currentNumberOfLiquidPools: 0,
        desiredNumberOfLiquidPools: 2,
    }
    conway(materials, width, conwayState);
    // 2nd pass for semi-walls
    conway(materials, width, conwayState);


    // Convert array of materials into tiles for use by WFC
    let tiles: Tile[] = materials.map((m, i) => {
        const dimentions = oneDimentionIndexToVec2(i, width);
        let image = baseTiles.empty;
        switch (m) {
            case Material.GROUND:
                image = baseTiles.ground;
                break;
            case Material.LIQUID:
                image = baseTiles.liquid;
                break;
            case Material.WALL:
                image = baseTiles.wall;
                break;
        }
        return { image, x: dimentions.x * config.OBSTACLE_SIZE, y: dimentions.y * config.OBSTACLE_SIZE }
    });
    const bounds = getLimits(tiles);
    bounds.xMin -= config.OBSTACLE_SIZE / 2;
    bounds.yMin -= config.OBSTACLE_SIZE / 2;
    bounds.xMax += config.OBSTACLE_SIZE / 2;
    bounds.yMax += config.OBSTACLE_SIZE / 2;

    console.log('jtest check', tiles[7]);

    const map = {
        tiles,
        width
    };
    resolveConflicts(map);
    return { map, limits: bounds };

}
const west: Vec.Vec2 = { x: -1, y: 0 };
const northwest: Vec.Vec2 = { x: -1, y: -1 };
const southwest: Vec.Vec2 = { x: -1, y: 1 };
const east: Vec.Vec2 = { x: 1, y: 0 };
const northeast: Vec.Vec2 = { x: 1, y: -1 };
const southeast: Vec.Vec2 = { x: 1, y: 1 };
const north: Vec.Vec2 = { x: 0, y: -1 };
const south: Vec.Vec2 = { x: 0, y: 1 };
const SIDES = {
    north,
    south,
    east,
    west
}
type SIDES_WITH_DIAG_KEYS = (keyof typeof SIDES_WITH_DIAG)
const SIDES_WITH_DIAG = {
    north,
    northeast,
    east,
    southeast,
    south,
    southwest,
    west,
    northwest
}
export function resolveConflicts(map: Map) {
    const { width } = map;
    function changeTile(index: number, image: string) {
        const tile = map.tiles[index];
        if (tile) {
            tile.image = image;
        } else {
            console.error('tile not found at ', index, width)
        }
    }
    // All tiles with >= 3 base liquid tile neighbors turn to base liquid
    for (let i = 0; i < width * width; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        const neighbors = Object.values(SIDES).flatMap(side => {
            const cell = getCell(map, Vec.add(position, side));
            // Checking for cell.image intentionally excludes the "empty" cell
            return cell && cell.image ? [{ cell, side }] : [];
        });
        if (neighbors.filter(n => n.cell.image == baseTiles.liquid).length >= 3) {
            changeTile(i, baseTiles.liquid);
        }
    }
    // Outline all base tiles with finalized tiles:
    for (let i = 0; i < width * width; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        const currentCell = getCell(map, position);
        const neighbors = (Object.keys(SIDES_WITH_DIAG) as SIDES_WITH_DIAG_KEYS[]).reduce<Record<SIDES_WITH_DIAG_KEYS, string>>((neighbors, side) => {
            const sidePosition = SIDES_WITH_DIAG[side];
            if (sidePosition) {
                const cell = getCell(map, Vec.add(position, sidePosition));
                // Checking for cell.image intentionally excludes the "empty" cell
                if (cell && cell.image) {
                    neighbors[side] = cell.image;

                }
            }
            return neighbors;
        }, {
            north: baseTiles.empty,
            northeast: baseTiles.empty,
            east: baseTiles.empty,
            southeast: baseTiles.empty,
            south: baseTiles.empty,
            southwest: baseTiles.empty,
            west: baseTiles.empty,
            northwest: baseTiles.empty,
        });
        // Change ground tiles
        if (currentCell?.image == baseTiles.ground) {
            if (neighbors.west == baseTiles.liquid && neighbors.south == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidInsideCornerNE);
            } else if (neighbors.east == baseTiles.liquid && neighbors.south == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidInsideCornerNW);
            } else if (neighbors.east == baseTiles.liquid && neighbors.north == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidInsideCornerSW);
            } else if (neighbors.west == baseTiles.liquid && neighbors.north == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidInsideCornerSE);
            } else if (neighbors.north == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidNGroundS);
            } else if (neighbors.east == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidEGroundW);
            } else if (neighbors.west == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidWGroundE);
            } else if (neighbors.south == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidSGroundN);
            } else if (neighbors.northeast == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidCornerNE);
            } else if (neighbors.northwest == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidCornerNW);
            } else if (neighbors.southeast == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidCornerSE);
            } else if (neighbors.southwest == baseTiles.liquid) {
                changeTile(i, finalTileImages.liquidCornerSW);
            }
        }
    }

    // All lava tiles turn to blood
    // for (let i = 0; i < width * width; i++) {
    //     const position = oneDimentionIndexToVec2(i, width);
    //     const cell = getCell(map, position);
    //     if (cell?.image == baseTiles.liquid) {
    //         changeTile(i, all_liquid);
    //     }
    // }
}

function crawlersChangeTilesToMaterial(crawlers: CaveCrawler[], material: Material, caveWidth: number, caveHeight: number, caveMaterialsArray: Material[]) {
    for (let x = 0; x < caveWidth; x++) {
        for (let y = 0; y < caveHeight; y++) {
            let isInside = false;
            for (let crawler of crawlers) {
                for (let rect of crawler.rectangles) {
                    if (isVec2InsidePolygon({ x: x * config.OBSTACLE_SIZE, y: y * config.OBSTACLE_SIZE }, { points: rect, inverted: false })) {
                        isInside = true;
                        break;
                    }
                }
                if (isInside) {
                    break;
                }
            }
            if (isInside) {
                const index = vec2ToOneDimentionIndex({ x, y }, caveWidth)
                caveMaterialsArray[index] = material;
            }
            // Debug Draw dot grid
            // window.debugCave.lineStyle(2, isInside ? 0x00ff00 : 0xff0000, 1.0);
            // if (isInside) {
            //     window.debugCave.beginFill(0x00ff00, 0.5);
            //     window.debugCave.drawRect(x, y, dotSize, dotSize);
            //     window.debugCave.endFill();
            // } else {
            //     window.debugCave.drawCircle(x, y, 4);
            // }
        }
    }
}
interface CaveCrawler {
    // In radians
    direction: number,
    thickness: number,
    position: Vec.Vec2,
    path: Vec.Vec2[],
    left: Vec.Vec2[],
    right: Vec.Vec2[],
    // Final form used to check if a cell is inside the cave
    rectangles: Vec.Vec2[][],
}
function movePointInDirection(cc: CaveCrawler, turnRadians: number, velocity: number) {
    cc.direction += turnRadians;
    cc.path.push(cc.position);
    cc.position = Vec.round(Vec.getEndpointOfMagnitudeAlongVector(cc.position, cc.direction, velocity));
}
function crawl(cc: CaveCrawler, endPosition: Vec.Vec2, params: CaveParams) {
    // Start the path with a circle so that the biggest part of the cave is 
    // like an octogon or someing, not just a flat line
    const eachTurnRadians = Math.PI / 4
    for (let i = 0; i < Math.round(Math.PI * 2 / eachTurnRadians) + 1; i++) {
        movePointInDirection(cc, eachTurnRadians, 1);
    }

    // Generate path
    for (let i = 0; i < params.iterations; i++) {
        const turnRadians = randFloat(window.underworld.random, -directionRandomAmount, directionRandomAmount);
        movePointInDirection(cc, turnRadians, params.velocity);
    }
    if (endPosition) {
        // At the end make it return to origin
        while (distance(cc.position, endPosition) > params.velocity + params.velocity * .25) {
            cc.position = Vec.round(Vec.add(cc.position, similarTriangles(endPosition.x - cc.position.x, endPosition.y - cc.position.y, distance(cc.position, endPosition), params.velocity)));
            cc.position = Vec.round(Vec.jitter(cc.position, params.velocity / 2));
            cc.path.push(cc.position);
        }
        cc.path.push(endPosition);
        // And add a second one so that the left and right path's have a next point after getting all the way back
        cc.path.push(endPosition);

        // Generate left and right for thickness
        for (let i = 0; i < cc.path.length; i++) {
            const prevPoint = cc.path[i - 1];
            const p = cc.path[i];
            const nextPoint = cc.path[i + 1];
            if (!prevPoint || !p || !nextPoint) {
                continue;
            }
            const lastLeft = cc.left[cc.left.length - 1]
            const lastRight = cc.right[cc.right.length - 1]
            const direction = Vec.getAngleBetweenVec2s(prevPoint, nextPoint)
            const left = { x: p.x + Math.cos(direction + Math.PI / 2), y: p.y + Math.sin(direction + Math.PI / 2) };
            const right = { x: p.x + Math.cos(direction - Math.PI / 2), y: p.y + Math.sin(direction - Math.PI / 2) };
            const tangentDist = distance(p, left);
            // cc.thickness += randInt(window.underworld.random, -40, 5);
            cc.thickness = lerp(params.startThickness, params.minThickness, i / cc.path.length);
            // Don't let thickness be lessthan minThickness 
            cc.thickness = Math.max(params.minThickness, cc.thickness);
            let newLeft = Vec.add(p, similarTriangles(left.x - p.x, left.y - p.y, tangentDist, cc.thickness));
            // Jitter the left and right sides so they are not perfectly parallel
            newLeft = Vec.round(Vec.jitter(newLeft, cc.thickness / 4));
            cc.left.push(newLeft);
            let newRight = Vec.add(p, similarTriangles(right.x - p.x, right.y - p.y, tangentDist, cc.thickness));
            // Jitter the left and right sides so they are not perfectly parallel
            newRight = Vec.round(Vec.jitter(newRight, cc.thickness / 4));
            cc.right.push(newRight);
            if (lastLeft && lastRight) {
                let points = [lastLeft, newLeft, newRight, lastRight];
                // Ensure rectangle isn't twisted like a bowtie which will result in weird isVec2Inside results:

                if (lineSegmentIntersection({ p1: lastLeft, p2: newLeft }, { p1: newRight, p2: lastRight })) {
                    // if 1 to 2 crosses 3 to 4, flip 2 and 3
                    points = [lastLeft, newRight, newLeft, lastRight];
                } else if (lineSegmentIntersection({ p1: newLeft, p2: newRight }, { p1: lastLeft, p2: lastRight })) {
                    // If 2 and 3 crosses 1 and 4, flip 3 and 4
                    points = [lastLeft, newLeft, lastRight, newRight];
                }
                // Protect against chevron shaped rectangles:
                for (let p of points) {
                    const withoutP = { points: points.filter(x => x !== p), inverted: false };
                    if (isVec2InsidePolygon(p, withoutP)) {
                        points = withoutP.points;
                        break;
                    }
                }

                cc.rectangles.push(points)
            }
        }
    }

}

export function getLimits(points: Vec.Vec2[]): Limits {
    let limits: Limits = {
        xMin: Number.MAX_SAFE_INTEGER,
        xMax: Number.MIN_SAFE_INTEGER,
        yMin: Number.MAX_SAFE_INTEGER,
        yMax: Number.MIN_SAFE_INTEGER
    }
    for (let p of points) {
        if (Number.isNaN(limits.xMin) || p.x < limits.xMin) {
            limits.xMin = Math.floor(p.x);
        }
        if (Number.isNaN(limits.yMin) || p.y < limits.yMin) {
            limits.yMin = Math.floor(p.y);
        }
        if (Number.isNaN(limits.xMax) || p.x > limits.xMax) {
            limits.xMax = Math.ceil(p.x);
        }
        if (Number.isNaN(limits.yMax) || p.y > limits.yMax) {
            limits.yMax = Math.ceil(p.y);
        }
    }
    return limits;

}
type Tile = { image: string } & Vec.Vec2;
interface Map {
    tiles: (Tile | undefined)[];
    width: number;
}
function getCell(map: Map, position: Vec.Vec2): Tile | undefined {
    return map.tiles[vec2ToOneDimentionIndex(position, map.width)];
}
enum Material {
    EMPTY,
    LIQUID,
    GROUND,
    WALL,
}
const baseTiles = {
    empty: '',
    wall: 'tiles/wall.png',
    semiWall: 'tiles/wall.png',
    liquid: 'tiles/lava.png',
    ground: 'tiles/ground.png',
}
const all_liquid = 'tiles/blood.png';
const all_ground = 'tiles/bloodFloor.png';
const finalTileImages = {
    all_liquid,
    all_ground,
    liquidInsideCornerNE: 'tiles/bloodInsideCornerNE.png',
    liquidInsideCornerNW: 'tiles/bloodInsideCornerNW.png',
    liquidInsideCornerSE: 'tiles/bloodInsideCornerSE.png',
    liquidInsideCornerSW: 'tiles/bloodInsideCornerSW.png',
    liquidNGroundS: 'tiles/bloodSideBottom.png',
    liquidCornerNE: 'tiles/bloodSideBottomLeft.png',
    liquidCornerNW: 'tiles/bloodSideBottomRight.png',
    liquidEGroundW: 'tiles/bloodSideLeft.png',
    liquidWGroundE: 'tiles/bloodSideRight.png',
    liquidSGroundN: 'tiles/bloodSideTop.png',
    liquidCornerSE: 'tiles/bloodSideTopLeft.png',
    liquidCornerSW: 'tiles/bloodSideTopRight.png',
    wallS: 'tiles/bloodWallBtm.png',
    wallCornerSW: 'tiles/bloodWallBtmLeft.png',
    wallCornerSE: 'tiles/bloodWallBtmRight.png',
    wallE: 'tiles/bloodWallRight.png',
    wallW: 'tiles/bloodWallLeft.png',
    wallN: 'tiles/bloodWallTop.png',
    wallCornerNW: 'tiles/bloodWallTopLeft.png',
    wallCornerNE: 'tiles/bloodWallTopRight.png',
};