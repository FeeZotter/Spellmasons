import { lineSegmentIntersection } from "./collision/collisionMath";
import { distance, lerp, similarTriangles } from "./math";
import { isVec2InsidePolygon } from "./Polygon";
import { randFloat, randInt } from "./rand";
import * as Vec from "./Vec";

const minThickness = 50;
const startThickness = 300;
const startpointjitter = 700;
const iterations = 10;
const velocity = 300;
const directionRandomAmount = Math.PI / 2;
window.c = generateCave;
export function generateCave(): { groundTiles: Vec.Vec2[] } {
    const minDirection = randFloat(window.underworld.random, Math.PI, Math.PI / 2);
    const maxDirection = 0;
    const crawlers = [];
    const NUMBER_OF_CRAWLERS = randInt(window.underworld.random, 2, 4);
    for (let c = 0; c < NUMBER_OF_CRAWLERS - 1; c++) {
        const previousCrawler = crawlers[c - 1];
        const cc: CaveCrawler = {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: startThickness,
            position: Vec.round(Vec.random(-startpointjitter, startpointjitter)),
            path: [],
            left: [],
            right: [],
            rectagles: []
        }
        crawl(cc, previousCrawler ? previousCrawler.path[1] as Vec.Vec2 : Vec.round(Vec.random(-startpointjitter, startpointjitter)));
        crawlers.push(cc);
    }

    const previousCrawler = crawlers[crawlers.length - 1];
    const firstCrawler = crawlers[0];
    if (previousCrawler && firstCrawler) {

        // Connect first crawler and last crawler:
        const cc: CaveCrawler = {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: startThickness,
            position: firstCrawler.path[firstCrawler.path.length - 1] as Vec.Vec2,
            path: [],
            left: [],
            right: [],
            rectagles: []
        }
        crawl(cc, previousCrawler.path[1] as Vec.Vec2);
        crawlers.push(cc);
    }
    // Get bounds
    let bounds = {
        xMin: NaN,
        xMax: NaN,
        yMin: NaN,
        yMax: NaN
    }
    bounds = crawlers.reduce((b, crawler) => {
        for (let p of [...crawler.left, ...crawler.right]) {
            if (Number.isNaN(b.xMin) || p.x < b.xMin) {
                b.xMin = p.x;
            }
            if (Number.isNaN(b.yMin) || p.y < b.yMin) {
                b.yMin = p.y;
            }
            if (Number.isNaN(b.xMax) || p.x > b.xMax) {
                b.xMax = p.x;
            }
            if (Number.isNaN(b.yMax) || p.y > b.yMax) {
                b.yMax = p.y;
            }
        }
        return b
    }, bounds);

    // Debug Draw bounds
    // window.t.lineStyle(2, 0xff0000, 1.0);
    // window.t.moveTo(bounds.xMin, bounds.yMin);
    // window.t.lineTo(bounds.xMin, bounds.yMax);
    // window.t.lineTo(bounds.xMax, bounds.yMax);
    // window.t.lineTo(bounds.xMax, bounds.yMin);
    // window.t.lineTo(bounds.xMin, bounds.yMin);

    const groundTiles = [];
    const dotSize = 64;
    for (let x = bounds.xMin; x < bounds.xMax; x += dotSize) {
        for (let y = bounds.yMin; y < bounds.yMax; y += dotSize) {
            let isInside = false;
            for (let crawler of crawlers) {
                for (let rect of crawler.rectagles) {
                    if (isVec2InsidePolygon({ x, y }, { points: rect, inverted: false })) {
                        isInside = true;
                        break;
                    }
                }
                if (isInside) {
                    break;
                }
            }
            if (isInside) {
                groundTiles.push({ x, y });
            }
            // Debug Draw dot grid
            // window.t.lineStyle(2, isInside ? 0x00ff00 : 0xff0000, 1.0);
            // if (isInside) {
            //     window.t.beginFill(0x00ff00, 0.5);
            //     window.t.drawRect(x, y, dotSize, dotSize);
            //     window.t.endFill();
            // } else {
            //     window.t.drawCircle(x, y, 4);
            // }
        }
    }

    //   const styles = [0xff0000, 0x0000ff, 0xff00ff, 0x00ffff, 0xffff00];
    //   function drawPathWithStyle(path: Vec2[], style: number, opacity: number) {
    //     window.t.lineStyle(4, style, opacity);
    //     if (path[0]) {
    //       window.t.moveTo(path[0].x, path[0].y);
    //       // @ts-expect-error
    //       window.t.drawCircle(path[1].x, path[1].y, 25);
    //       for (let point of path) {
    //         window.t.lineTo(point.x, point.y);
    //       }
    //     }

    //   }
    // Debug Fill
    // for (let i = 0; i < crawlers.length; i++) {
    //     const crawler = crawlers[i];
    //     if (crawler) {
    //         drawPathWithStyle(crawler.path, 0x000000, 1.0);
    //         // window.t.beginFill(styles[i % styles.length], 0.2);
    //         // for (let rect of crawler.rectagles) {
    //         //   window.t.drawPolygon(rect);
    //         // }
    //         // window.t.endFill();
    //     }
    // }

    // // Lines
    // for (let i = 0; i < cave.length; i++) {
    //   const crawler = cave[i];
    //   if (crawler) {
    //     drawPathWithStyle(crawler.path, styles[i % styles.length] as number, 1.0);
    //     window.t.lineStyle(1, 0x000000, 0.0);
    //     // window.t.beginFill(styles[i % styles.length], 1.0);
    //     // window.t.drawPolygon(poly);
    //     // window.t.endFill();
    //   }
    // }
    return { groundTiles };

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
    rectagles: Vec.Vec2[][],
}
function movePointInDirection(cc: CaveCrawler, turnRadians: number, velocity: number) {
    cc.direction += turnRadians;
    const nextPointDirection = { x: cc.position.x + Math.cos(cc.direction), y: cc.position.y + Math.sin(cc.direction) };
    const dist = distance(cc.position, nextPointDirection);
    cc.path.push(cc.position);
    cc.position = Vec.round(Vec.add(cc.position, similarTriangles(nextPointDirection.x - cc.position.x, nextPointDirection.y - cc.position.y, dist, velocity)));

}
function crawl(cc: CaveCrawler, endPosition: Vec.Vec2) {
    // Start the path with a circle so that the biggest part of the cave is 
    // like an octogon or someing, not just a flat line
    const eachTurnRadians = Math.PI / 4
    for (let i = 0; i < Math.round(Math.PI * 2 / eachTurnRadians) + 1; i++) {
        movePointInDirection(cc, eachTurnRadians, 1);
    }

    // Generate path
    for (let i = 0; i < iterations; i++) {
        const turnRadians = randFloat(window.underworld.random, -directionRandomAmount, directionRandomAmount);
        movePointInDirection(cc, turnRadians, velocity);
    }
    if (endPosition) {
        // At the end make it return to origin
        while (distance(cc.position, endPosition) > velocity + velocity * .25) {
            cc.position = Vec.round(Vec.add(cc.position, similarTriangles(endPosition.x - cc.position.x, endPosition.y - cc.position.y, distance(cc.position, endPosition), velocity)));
            cc.position = Vec.round(Vec.jitter(cc.position, velocity / 2));
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
            cc.thickness = lerp(startThickness, minThickness, i / cc.path.length);
            // Don't let thickness be lessthan minThickness 
            cc.thickness = Math.max(minThickness, cc.thickness);
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

                cc.rectagles.push(points)
            }
        }
    }

}