
import { clockwiseAngle } from "./Angle";
export interface Vec2 {
    x: number;
    y: number;
}

// Get the angle away from the x-axis from origin to point in radians
// Note: This function returns the counter clockwise angle from the x-axis
// of "origin" to "point".  This is tricky because I built Polygons to
// have their "inside" (non-walkable zone) to be filled by iterating
// the polygon verticies in a clockwise direction.  Many of the 
// functions dealing with polygons have to consider clockwise angles between
// points (in order to determine the inside of the polygon).
// So for example, the polygonLineSegment 0,0 to 1,0 has an inside
// angle of 0 to -Math.PI but the angle between those vec2s (in that order)
// would be Math.PI.  This deserves a refactor but I probably wont get to it.
// Keep that in mind when working with polygons
export function getAngleBetweenVec2s(origin: Vec2, point: Vec2): number {
    const dy = point.y - origin.y;
    const dx = point.x - origin.x;
    return Math.atan2(dy, dx);
}

export function multiply(scalar: number, p2: Vec2): Vec2 {
    return {
        x: scalar * p2.x,
        y: scalar * p2.y
    }
}
export function add(p1: Vec2, p2: Vec2): Vec2 {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    }
}
export function subtract(p1: Vec2, p2: Vec2): Vec2 {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    }
}
// Returns a scalar
export function crossproduct(p1: Vec2, p2: Vec2): number {
    return p1.x * p2.y - p1.y * p2.x;
}
// Returns a scalar
// Source: https://www.cuemath.com/algebra/product-of-vectors/
export function dotProduct(p1: Vec2, p2: Vec2): number {
    const origin = { x: 0, y: 0 };
    const angle = clockwiseAngle(getAngleBetweenVec2s(origin, p1), getAngleBetweenVec2s(origin, p2));
    return magnitude(p1) * magnitude(p2) * Math.cos(angle);
}
export function magnitude(p: Vec2): number {
    return Math.sqrt(p.y * p.y + p.x * p.x);
}

export function equal(p1: Vec2, p2: Vec2): boolean {
    return p1.x == p2.x && p1.y == p2.y;
}

export function clone(p: Vec2): Vec2 {
    return { x: p.x, y: p.y };
}

export function round(v: Vec2): Vec2 {
    return { x: Math.round(v.x), y: Math.round(v.y) };
}

// Returns true if testPoint is within a bounding box drawn between the two bounding points
export function isBetween(testPoint: Vec2, boundingPoint: Vec2, boundingPoint2: Vec2): boolean {
    const minY = Math.min(boundingPoint.y, boundingPoint2.y);
    const minX = Math.min(boundingPoint.x, boundingPoint2.x);
    const maxY = Math.max(boundingPoint.y, boundingPoint2.y);
    const maxX = Math.max(boundingPoint.x, boundingPoint2.x);
    return minX <= testPoint.x && testPoint.x <= maxX &&
        minY <= testPoint.y && testPoint.y <= maxY;
}