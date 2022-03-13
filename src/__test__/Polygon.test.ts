
import type { Vec2 } from "../Vec";
import { testables, Branch, makePolygonIndexIterator, Polygon, expandPolygon, mergeOverlappingPolygons, polygonToPolygonLineSegments } from '../Polygon';
import type { LineSegment } from "../collision/collisionMath";
const { getLoopableIndex, isVec2InsidePolygon, findFirstPointNotInsideAnotherPoly, getNormalVectorOfLineSegment,
    getClosestBranch, growOverlappingCollinearLinesInDirectionOfP2, arePolygonsEquivalent } = testables;

describe('testables', () => {
    describe('arePolygonsEquivalent', () => {
        it('should return false if polygons have different inverted flags', () => {
            const poly1 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 }
                ], inverted: false
            };
            const poly2 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 }
                ], inverted: true
            };
            const actual = arePolygonsEquivalent(poly1, poly2);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return false if polygons have different points', () => {
            const poly1 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 }
                ], inverted: false
            };
            const poly2 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 9990, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 }
                ], inverted: false
            };
            const actual = arePolygonsEquivalent(poly1, poly2);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return false if polygons have different number of points, even if it shares the same points until then', () => {
            const poly1 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 }
                ], inverted: false
            };
            const poly2 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 },
                    { "x": 1, "y": -1 }
                ], inverted: false
            };
            const actual = arePolygonsEquivalent(poly1, poly2);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return true if polygons have the same points and same inverted status', () => {
            const poly1 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 }
                ], inverted: false
            };
            const poly2 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 },
                ], inverted: false
            };
            const actual = arePolygonsEquivalent(poly1, poly2);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        it('should return true if polygons have the same points and same inverted status even if points don\'t start at the same index so long as they are in the same order', () => {
            const poly1 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 }
                ], inverted: false
            };
            const poly2 = {
                points: [
                    { "x": 0, "y": 1 },
                    { "x": 1, "y": 1 },
                    { "x": 1, "y": 0 },
                    { "x": 0, "y": 0 },
                ], inverted: false
            };
            const actual = arePolygonsEquivalent(poly1, poly2);
            const expected = true;
            expect(actual).toEqual(expected);
        });

    });
    describe('growOverlappingCollinearLinesInDirectionOfP2', () => {
        describe('should expand line\'s p2 to the farthest point of overlapping collinear lines', () => {
            [
                {
                    description: 'Simplest example',
                    line: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } },
                    walls: [
                        { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } },
                    ],
                    expected: { x: 3, y: 0 }
                },
                {
                    description: 'Works for multiple lines where the first line does not overlap with the 3rd until it is grown via the 2nd',
                    line: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } },
                    walls: [
                        { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } },
                        { p1: { x: 3, y: 0 }, p2: { x: 6, y: 0 } },
                    ],
                    expected: { x: 6, y: 0 }
                },
                {
                    description: 'Ignores lines in the opposite direction',
                    line: { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } },
                    walls: [
                        { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } },
                        { p1: { x: 5, y: 0 }, p2: { x: -7, y: 0 } },
                    ],
                    expected: { x: 3, y: 0 }
                },
                {
                    description: 'Huge overlapping',
                    line: { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } },
                    walls: [
                        { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } },
                        { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } },
                    ],
                    expected: { x: 10, y: 0 }
                },

            ].forEach(({ line, walls, description, expected }) => {
                it(description, () => {
                    const actual = growOverlappingCollinearLinesInDirectionOfP2(line, walls).p2;
                    expect(actual).toEqual(expected);

                });
            });
        });
    });
    describe('getClosestBranch', () => {
        it('should return the first branch with a branch angle of < 180 degrees', () => {
            const poly1 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 10 },
                    { "x": 1, "y": 10 },
                    { "x": 1, "y": 0 }
                ], inverted: false
            };
            const testLine = {
                p1: { x: 0, y: 0 },
                p2: { x: 0, y: 10 },
            }
            const poly2 = {
                points: [
                    { "x": 0, "y": 6 },
                    { "x": -1, "y": 5 },
                    { "x": -1, "y": 7 },
                    { "x": 0, "y": 7 }
                ], inverted: false
            };
            const poly3 = {
                points: [
                    { "x": 0, "y": 2 },
                    { "x": -1, "y": 3 },
                    { "x": 0, "y": 3 }
                ], inverted: false
            };
            const polygons = [poly1, poly2, poly3];
            const polygonLineSegments = polygons.map(polygonToPolygonLineSegments).flat();
            const actual = getClosestBranch(testLine, polygonLineSegments);
            const expected: Branch = {
                branchAngle: 3 * Math.PI / 4,
                distance: 2,
                nextLine: {
                    p1: poly3.points[0],
                    p2: poly3.points[1],
                    polygon: poly3
                }
            }
            expect(actual).toEqual(expected);

        });
        describe('given that there is no branch with a branch angle of < 180 degrees', () => {
            it('should return the branch that starts at the end of the expanded test line', () => {
                const poly1 = {
                    points: [
                        { "x": 0, "y": 0 },
                        { "x": 0, "y": 2 },
                        { "x": 1, "y": 2 },
                        { "x": 1, "y": 0 }
                    ], inverted: false
                };
                const testLine = {
                    p1: { x: 0, y: 0 },
                    p2: { x: 0, y: 2 },
                }
                const poly2 = {
                    points: [
                        { "x": 0, "y": 1 },
                        { "x": 0, "y": 3 },
                        { "x": 1, "y": 3 },
                        { "x": 1, "y": 1 }
                    ], inverted: false
                };
                const polygons = [poly1, poly2];
                const polygonLineSegments = polygons.map(polygonToPolygonLineSegments).flat();
                const actual = getClosestBranch(testLine, polygonLineSegments);
                const expected: Branch = {
                    branchAngle: 3 * Math.PI / 2,
                    distance: 3,
                    nextLine: {
                        p1: poly2.points[1],
                        p2: poly2.points[2],
                        polygon: poly2
                    }
                }
                expect(actual).toEqual(expected);
            });
            it('should return the branch that starts at the end of the expanded test line 2', () => {
                const poly1 = {
                    points: [
                        { "x": 0, "y": 0 },
                        { "x": 0, "y": 2 },
                        { "x": 1, "y": 2 },
                        { "x": 1, "y": 0 }
                    ], inverted: false
                };
                const testLine = {
                    p1: { x: 0, y: 0 },
                    p2: { x: 0, y: 2 },
                }
                const poly2 = {
                    points: [
                        { "x": 0, "y": 1 },
                        { "x": 0, "y": 3 },
                        { "x": 1, "y": 3 },
                        { "x": 1, "y": 1 }
                    ], inverted: false
                };
                const poly3 = {
                    points: [
                        { "x": 0, "y": 3 },
                        { "x": 0, "y": 4 },
                        { "x": 1, "y": 4 },
                        { "x": 1, "y": 3 }
                    ], inverted: false
                };
                const polygons = [poly1, poly2, poly3];
                const polygonLineSegments = polygons.map(polygonToPolygonLineSegments).flat();
                const actual = getClosestBranch(testLine, polygonLineSegments);
                const expected: Branch = {
                    branchAngle: 3 * Math.PI / 2,
                    distance: 4,
                    nextLine: {
                        p1: poly3.points[1],
                        p2: poly3.points[2],
                        polygon: poly3
                    }
                }
                expect(actual).toEqual(expected);
            });
        });


    });
    describe('getNormalVectorOfLineSegment', () => {
        it('should return a Vec2 representing the normal vector of the lineSegment', () => {
            const line: LineSegment = {
                p1: {
                    x: 10,
                    y: 10
                },
                p2: {
                    x: 10,
                    y: 12
                },
            }
            const actual = getNormalVectorOfLineSegment(line);
            const expected = { x: -2, y: 0 }
            expect(actual).toEqual(expected);
        });
        it('should return a Vec2 representing the normal vector of the lineSegment', () => {
            const line: LineSegment = {
                p1: {
                    x: 1,
                    y: 1
                },
                p2: {
                    x: 2,
                    y: 2
                },
            }
            const actual = getNormalVectorOfLineSegment(line);
            const expected = { x: -1, y: -1 }
            expect(actual).toEqual(expected);
        });

    });
    describe('findFirstPointNotInsideAnotherPoly', () => {
        it('should return a point that is not inside any other polygons', () => {
            const firstOutsidePoint = { x: 2, y: 2 };
            const testPoly = {
                points: [
                    { x: 0, y: 0 },
                    { x: 0, y: 2 },
                    firstOutsidePoint,
                    { x: 2, y: 0 }
                ],
                inverted: false
            }
            const polys = [testPoly,
                // Surrounds point at 0,0
                {
                    points: [
                        { x: -1, y: -1 },
                        { x: -1, y: 1 },
                        { x: 1, y: 1 },
                        { x: 1, y: -1 }
                    ],
                    inverted: false
                },
                // Surrounds point at 0,2
                {
                    points: [
                        { x: -1, y: 1 },
                        { x: -1, y: 3 },
                        { x: 1, y: 3 },
                        { x: 1, y: 1 }
                    ],
                    inverted: false
                },
                // Surrounds point at 2,0
                {
                    points: [
                        { x: 1, y: -1 },
                        { x: 1, y: 1 },
                        { x: 3, y: 1 },
                        { x: 3, y: -1 }
                    ],
                    inverted: false
                },
            ]
            const actual = findFirstPointNotInsideAnotherPoly(testPoly, polys);
            const expected = firstOutsidePoint;
            expect(actual).toEqual(expected);

        });

        describe('given one of the polygons is inverted', () => {

            it('should return a point that is not inside any other polygons', () => {
                const firstOutsidePoint = { x: 2, y: 0 };
                const testPoly = {
                    points: [
                        { x: 0, y: 0 },
                        { x: 0, y: 2 },
                        { x: 2, y: 2 },
                        firstOutsidePoint
                    ],
                    inverted: false
                }
                const polys = [testPoly,
                    // Surrounds point at 0,0
                    {
                        points: [
                            { x: -1, y: -1 },
                            { x: -1, y: 1 },
                            { x: 1, y: 1 },
                            { x: 1, y: -1 }
                        ],
                        inverted: false
                    },
                    // Surrounds point at 0,2
                    {
                        points: [
                            { x: -1, y: 1 },
                            { x: -1, y: 3 },
                            { x: 1, y: 3 },
                            { x: 1, y: 1 }
                        ],
                        inverted: false
                    },
                    // Surrounds all points EXCEPT 2,0 (because it is inverted)
                    {
                        points: [
                            { x: 1, y: -1 },
                            { x: 1, y: 1 },
                            { x: 3, y: 1 },
                            { x: 3, y: -1 }
                        ],
                        inverted: true
                    },
                ]
                const actual = findFirstPointNotInsideAnotherPoly(testPoly, polys);
                const expected = firstOutsidePoint;
                expect(actual).toEqual(expected);

            });
        });
    });
    describe('getLoopableIndex', () => {
        it('should return array[n] if n is within the limit of the array', () => {
            const array = [0, 1, 2, 3];
            const index = 1;
            const actual = getLoopableIndex(index, array);
            const expected = index;
            expect(actual).toEqual(expected);
        });
        it('should return the proper element as if the array looped infinitely when index is > the limit of the array', () => {
            const array = [0, 1, 2, 3];
            const outOfBoundsAmount = 2;
            const index = array.length + outOfBoundsAmount;
            const actual = getLoopableIndex(index, array);
            const expected = outOfBoundsAmount;
            expect(actual).toEqual(expected);
        });
        it('should return the proper element as if the array looped infinitely when index is < 0', () => {
            const array = [0, 1, 2, 3];
            const outOfBoundsAmount = -1;
            const index = outOfBoundsAmount;
            const actual = getLoopableIndex(index, array);
            const expected = 3;
            expect(actual).toEqual(expected);
        });
    });
    describe('isVec2InsidePolygon', () => {
        describe('corner cases', () => {
            describe('1. point is the same location as a vertex of the polygon', () => {
                it('should return true because it is inside (this is up to my discretion if I want points on verticies to be determined as inside)', () => {
                    const p1 = { x: 0, y: 0 }
                    const p2 = { x: 1, y: 1 }
                    const p3 = { x: 2, y: 0 }
                    const points: Vec2[] = [p1, p2, p3];
                    const polygon: Polygon = { points, inverted: false };
                    const actual = isVec2InsidePolygon(p2, polygon);
                    const expected = true;
                    expect(actual).toEqual(expected);
                });
            });
            describe('2a. point is horizontal to vertex and is outside', () => {
                it('should return false because it is outside', () => {
                    const p1 = { x: 0, y: 0 }
                    const p2 = { x: 1, y: 1 }
                    const p3 = { x: 2, y: 0 }
                    const points: Vec2[] = [p1, p2, p3];
                    const polygon: Polygon = { points, inverted: false };
                    // horizontal to p2
                    const actual = isVec2InsidePolygon({ x: -5, y: 1 }, polygon);
                    const expected = false;
                    expect(actual).toEqual(expected);
                });
            });
            describe('2b. point is horizontal to vertex and is inside', () => {
                it('should return true because it is inside', () => {
                    const p1 = { x: 0, y: 0 }
                    const p2 = { x: 0, y: 2 }
                    const p3 = { x: 3, y: 2 }
                    const p4 = { x: 2, y: 1 }
                    const p5 = { x: 3, y: 0 }
                    const points: Vec2[] = [p1, p2, p3, p4, p5];
                    const polygon: Polygon = { points, inverted: false };
                    // Horizontal to 1,1
                    const actual = isVec2InsidePolygon({ x: 1, y: 1 }, polygon);
                    const expected = true;
                    expect(actual).toEqual(expected);
                });
            });
            describe('3a. point is colinear with, but not on, a horizontal edge of the polygon and is outside', () => {
                it('should return false because it is outside', () => {
                    const p1 = { x: 0, y: 0 }
                    const p2 = { x: 0, y: 1 }
                    const p3 = { x: 1, y: 1 }
                    const p4 = { x: 1, y: 0 }
                    const points: Vec2[] = [p1, p2, p3, p4];
                    const polygon: Polygon = { points, inverted: false };
                    // Horizontal to edge: 0,1 to 1,1
                    const actual = isVec2InsidePolygon({ x: -10, y: 1 }, polygon);
                    const expected = false;
                    expect(actual).toEqual(expected);
                });
            });
            describe('3b. point is colinear with, but not on, a horizontal edge of the polygon and is inside', () => {
                it('should return true because it is inside', () => {
                    const p1 = { x: 0, y: 0 }
                    const p2 = { x: 0, y: 3 }
                    const p3 = { x: 3, y: 3 }
                    const p4 = { x: 3, y: 2 }
                    const p5 = { x: 4, y: 2 }
                    const p6 = { x: 4, y: 1 }
                    const p7 = { x: 3, y: 1 }
                    const p8 = { x: 3, y: 0 }
                    const points: Vec2[] = [p1, p2, p3, p4, p5, p6, p7, p8];
                    const polygon: Polygon = { points, inverted: false };
                    // Horizontal to edge: 3,2 to 4,2
                    const actual = isVec2InsidePolygon({ x: 2, y: 2 }, polygon);
                    const expected = true;
                    expect(actual).toEqual(expected);
                });
            });

        });
        describe('given that the point is on the same y as a vertex of another polygon but not inside', () => {
            it('should return false', () => {
                // diamond
                const p1 = { x: 0, y: 0 }
                const p2 = { x: -1, y: -1 }
                const p3 = { x: -2, y: 0 }
                const p4 = { x: -1, y: 1 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygon: Polygon = { points, inverted: false };
                // The horizontal will intersect with -1,-1 so the vertical must be tested
                // as well to prevent a false positive
                const actual = isVec2InsidePolygon({ x: -20, y: -1 }, polygon);
                const expected = false;
                expect(actual).toEqual(expected);

            });
        });
        describe('given the point lies directly on a line of the polygon', () => {
            it('should return true', () => {
                const p1 = { x: 0, y: 0 }
                const p2 = { x: 0, y: 2 }
                const p3 = { x: 2, y: 2 }
                const p4 = { x: 2, y: 0 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygon: Polygon = { points, inverted: false };
                // The point is between p2 and p3
                const actual = isVec2InsidePolygon({ x: 1, y: 2 }, polygon);
                const expected = true;
                expect(actual).toEqual(expected);
            });
        });
        describe('given the point is on the same y value as a line of the polygon but is outside of the polygon', () => {
            it('should return false', () => {
                const p1 = { x: 0, y: 0 }
                const p2 = { x: 0, y: 2 }
                const p3 = { x: 2, y: 2 }
                const p4 = { x: 2, y: 0 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygon: Polygon = { points, inverted: false };
                const actual = isVec2InsidePolygon({ x: -20, y: 2 }, polygon);
                const expected = false;
                expect(actual).toEqual(expected);
            });
        });
        it('should return true when the vec is inside the square', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygon: Polygon = { points, inverted: false };
            const actual = isVec2InsidePolygon({ x: 0.5, y: 0.5 }, polygon);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        it('should return false when the vec is OUTSIDE the square', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygon: Polygon = { points, inverted: false };
            const actual = isVec2InsidePolygon({ x: -100, y: 0.5 }, polygon);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return false when the vec is OUTSIDE the square 2', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygon: Polygon = { points, inverted: false };
            const actual = isVec2InsidePolygon({ x: -100, y: -100 }, polygon);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return true when the vec is inside a complex polygon', () => {
            const p1 = { x: 1, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 2 }
            const p4 = { x: 1, y: 3 }
            const p5 = { x: 3, y: 3 }
            const p6 = { x: 3, y: 2 }
            const p7 = { x: 2, y: 1 }
            const p8 = { x: 3, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4, p5, p6, p7, p8];
            const polygon: Polygon = { points, inverted: false };
            // Note, the y value of this point aligns with the y value
            // of a vertex of the polygon to it's right
            // (p7).  Because of the internal implementation of 
            // isVec2InsidePolygon, it tests a straight line to the right
            // which means it'll come up with 2 intersections for that vert
            // since that vert belongs to 2 of the vetexLineSegments of the
            // poly.  There is special handling inside of isVec2InsidePolygon
            // to account for this edge case
            const actual = isVec2InsidePolygon({ x: 1, y: 1 }, polygon);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        describe('given an inverted polygon', () => {
            it('should return FALSE when the vec is inside the square', () => {
                const p1 = { x: 0, y: 0 }
                const p2 = { x: 0, y: 1 }
                const p3 = { x: 1, y: 1 }
                const p4 = { x: 1, y: 0 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygon: Polygon = { points, inverted: true };
                const actual = isVec2InsidePolygon({ x: 0.5, y: 0.5 }, polygon);
                const expected = false;
                expect(actual).toEqual(expected);
            });
            it('should return TRUE when the vec is OUTSIDE the square', () => {
                const p1 = { x: 0, y: 0 }
                const p2 = { x: 0, y: 1 }
                const p3 = { x: 1, y: 1 }
                const p4 = { x: 1, y: 0 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygon: Polygon = { points, inverted: true };
                const actual = isVec2InsidePolygon({ x: -100, y: 0.5 }, polygon);
                const expected = true;
                expect(actual).toEqual(expected);
            });

        });

    });

});


describe('makePolygonIterator', () => {
    it('should iterate all the points of a polygon starting from the startPoint and looping back to the beginning until each points is iterated', () => {
        const p0 = { x: 0, y: 0 }
        const p1 = { x: 0, y: 1 }
        const p2 = { x: 1, y: 1 }
        const p3 = { x: 1, y: 0 }
        const points: Vec2[] = [p0, p1, p2, p3];
        const polygon: Polygon = { points, inverted: false }
        const iterator = makePolygonIndexIterator(polygon, 2);
        const actual = Array.from(iterator)
        const expected = [2, 3, 0, 1];
        expect(actual).toEqual(expected);
    });
    describe('given an inverted polygon', () => {
        it('should iterate all the points of a polygon IN REVERSE ORDER starting from the startPoint and looping back to the END until each points is iterated', () => {
            const p0 = { x: 0, y: 0 }
            const p1 = { x: 0, y: 1 }
            const p2 = { x: 1, y: 1 }
            const p3 = { x: 1, y: 0 }
            const points: Vec2[] = [p0, p1, p2, p3];
            const polygon: Polygon = { points, inverted: true }
            const iterator = makePolygonIndexIterator(polygon, 1);
            const actual = Array.from(iterator)
            const expected = [1, 0, 3, 2];
            expect(actual).toEqual(expected);
        });
    });
});
describe('expandPolygon', () => {
    it('should return a new polygon with all of its points grown by magnitude', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 1 }
        const p3 = { x: 1, y: 1 }
        const p4 = { x: 1, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygon: Polygon = { points, inverted: false };

        const newPolygon = expandPolygon(polygon, Math.sqrt(2));
        expect(newPolygon.points).toEqual([
            { x: -1, y: -1 },
            { x: -1, y: 2 },
            { x: 2, y: 2 },
            { x: 2, y: -1 },
        ]);
    });
    it('should expand in the opposite direction for inverted polygons where the inside and outside are flipped', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 2 }
        const p3 = { x: 2, y: 2 }
        const p4 = { x: 2, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygon: Polygon = { points, inverted: true };

        const newPolygon = expandPolygon(polygon, Math.sqrt(2));
        expect(newPolygon.points).toEqual([
            { x: 1, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 1 },
        ]);
    });

});
describe('mergeOverlappingPolygons', () => {
    describe('given a regular polygon and an inverted polygon', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 2 }
        const p3 = { x: 2, y: 2 }
        const p4 = { x: 2, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygonA: Polygon = { points, inverted: false };
        const p1b = { x: -1, y: -1 }
        const p2b = { x: -1, y: 1 }
        const p3b = { x: 1, y: 1 }
        const p4b = { x: 1, y: -1 }
        const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
        // NOTE: polygonB is inverted, so everything OUTSIDE of it
        // is solid matter
        const polygonB: Polygon = { points: pointsb, inverted: true };
        it('should successfully merge them and (out of necessity) turn the regular polygon into an inverted polygon', () => {
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];
            const actual = mergedPolygon.points;
            const expected = [
                { x: 1, y: 0 },
                p4b,
                p1b,
                p2b,
                { x: 0, y: 1 },
                p1,
            ]
            expect(actual).toEqual(expected);

        });
        it('should still work even if the order of the polygons in the array are reversed', () => {
            const mergedPolygon = mergeOverlappingPolygons([polygonB, polygonA])[0];
            const actual = mergedPolygon.points;
            const expected = [
                p2b,
                { x: 0, y: 1 },
                p1,
                { x: 1, y: 0 },
                p4b,
                p1b,
            ]
            expect(actual).toEqual(expected);

        });

    });
    describe('given multiple polygons that intersect at the same vertex on all of them', () => {
        it('should merge them in the correct order', () => {
            // This example uses 4 diamonds that intersect at 0,0

            // Diamond left
            const p1 = { x: 0, y: 0 }
            const p2 = { x: -2, y: -1 }
            const p3 = { x: -3, y: 0 }
            const p4 = { x: -2, y: 1 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            // Diamond top
            const p1b = { x: 0, y: 0 }
            const p2b = { x: -1, y: 2 }
            const p3b = { x: 0, y: 3 }
            const p4b = { x: 1, y: 2 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            // Diamond right
            const p1c = { x: 0, y: 0 }
            const p2c = { x: 2, y: 1 }
            const p3c = { x: 3, y: 0 }
            const p4c = { x: 2, y: -1 }
            const pointsc: Vec2[] = [p1c, p2c, p3c, p4c];
            const polygonC: Polygon = { points: pointsc, inverted: false };
            // Diamond bottom
            const p1d = { x: 0, y: 0 }
            const p2d = { x: 1, y: -2 }
            const p3d = { x: 0, y: -3 }
            const p4d = { x: -1, y: -2 }
            const pointsd: Vec2[] = [p1d, p2d, p3d, p4d];
            const polygonD: Polygon = { points: pointsd, inverted: false };
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB, polygonD, polygonC])[0];
            const actual = mergedPolygon.points;
            const expected: Vec2[] = [
                p2, p3, p4,
                p1b, p2b, p3b, p4b,
                p1c, p2c, p3c, p4c,
                p1d, p2d, p3d, p4d,
                p1
            ]
            expect(actual).toEqual(expected);

        });
    });
    describe('given polygons that intersect at exactly a point of one of the verticies of a polygon', () => {
        it('should merge the polygons', () => {
            //square
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 2, y: 1 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };

            // diamond
            const p1b = { x: 1, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 3 }
            const p4b = { x: 2, y: 2 }
            const pointsDiamond: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonDiamond: Polygon = { points: pointsDiamond, inverted: false };
            //  They will intersect directly on p1b, which means it will be in the merged poly twice
            const actual = mergeOverlappingPolygons([polygonA, polygonDiamond])[0].points
            const expected = [p1, p2, p1b, p2b, p3b, p4b, p1b, p3, p4];
            expect(actual).toEqual(expected);

        });
    });
    describe('given polygons that intersect at a vertex that they both share but no more', () => {
        it('should merge the polygons', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };

            const p1b = { x: 1, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 3 }
            const p4b = { x: 2, y: 2 }
            const pointsDiamond: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonDiamond: Polygon = { points: pointsDiamond, inverted: false };
            //  They will intersect directly on p3/p1b, which means it will be in the merged poly twice
            const actual = mergeOverlappingPolygons([polygonA, polygonDiamond])[0].points
            const expected = [p1, p2, p1b, p2b, p3b, p4b, p1b, p4];
            expect(actual).toEqual(expected);

        });
    });
    describe('given overlapping boxes on one axis', () => {
        it("should remove the overlapping verticies and return a polygon that is one large rectangle", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            const p1b = { x: 0, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 2 }
            const p4b = { x: 1, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygons = mergeOverlappingPolygons([polygonA, polygonB]);

            const actual = mergedPolygons[0].points;
            const expected = [
                p1,
                p2b,
                p3b,
                p4,
            ];
            expect(actual).toEqual(expected);
        });
        it('should merge them so there is only one left', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            const p1b = { x: 0, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 2 }
            const p4b = { x: 1, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygons = mergeOverlappingPolygons([polygonA, polygonB]);
            expect(mergedPolygons.length).toEqual(1);
        });
    });
    it("should ignore branching off in a direction that goes INSIDE of the current polygon", () => {
        // If a vertex lies on a line of a poly, but it branches off inside the poly, ignore it
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 3 }
        const p3 = { x: 2, y: 3 }
        const p4 = { x: 2, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygonA: Polygon = { points, inverted: false };
        // It won't take any of the branches that go inside
        const p1b = { x: 0, y: 1 }
        const p2b = { x: 1, y: 2 }
        const p3b = { x: 2, y: 1 }
        const p4b = { x: 1, y: 0 }
        const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
        const polygonB: Polygon = { points: pointsb, inverted: false };
        const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

        const actual = mergedPolygon.points;
        const expected = [
            p1,
            p2,
            p3,
            p4,
        ];
        expect(actual).toEqual(expected);
    });
    describe('given overlapping boxes on one side', () => {
        it("should merge the polygons", () => {
            // In this example one polygon has 2 points inside
            // of the other but the other has no points inside of it
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 1, y: 2 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points: points, inverted: false };
            const p1b = { x: -1, y: 1 }
            const p2b = { x: -1, y: 3 }
            const p3b = { x: 2, y: 3 }
            const p4b = { x: 2, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

            const actual = mergedPolygon.points;
            const expected = [
                p1,
                { x: 0, y: 1 },
                p1b,
                p2b,
                p3b,
                p4b,
                { x: 1, y: 1 },
                p4,
            ];
            expect(actual).toEqual(expected);
        });
        it("should still merge the polygons even if the start polygons are in reverse order", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 1, y: 2 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points: points, inverted: false };
            const p1b = { x: -1, y: 1 }
            const p2b = { x: -1, y: 3 }
            const p3b = { x: 2, y: 3 }
            const p4b = { x: 2, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygon = mergeOverlappingPolygons([polygonB, polygonA])[0];

            const actual = mergedPolygon.points;
            const expected = [
                p1b,
                p2b,
                p3b,
                p4b,
                { x: 1, y: 1 },
                p4,
                p1,
                { x: 0, y: 1 },
            ];
            expect(actual).toEqual(expected);
        });
    });
    describe('given boxes that each share 1 vertex inside of the other', () => {
        it("should remove inside verticies and make a polygon that is the spacial addition of the two boxes", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 2, y: 2 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            const p1b = { x: 1, y: 1 }
            const p2b = { x: 1, y: 3 }
            const p3b = { x: 3, y: 3 }
            const p4b = { x: 3, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

            const actual = mergedPolygon.points;
            const expected = [
                p1,
                p2,
                { x: 1, y: 2 },
                p2b,
                p3b,
                p4b,
                { x: 2, y: 1 },
                p4,
            ];
            expect(actual).toEqual(expected);

        });
    });
    describe('given boxes that are identical', () => {
        it("should remove one box entirely", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 2, y: 2 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            const polygonB: Polygon = { points, inverted: false };
            const mergedPolygons = mergeOverlappingPolygons([polygonA, polygonB]);
            const actual = mergedPolygons.length;
            const expected = 1;
            expect(actual).toEqual(expected);
        });
    });
    describe('given boxes that are mostly identical', () => {
        it("should keep the larger one", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 2, y: 2 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const p5 = { x: 1, y: -1 };
            const polygonA: Polygon = { points, inverted: false };
            const polygonB: Polygon = { points: [...points, p5], inverted: false };
            const mergedPolygons = mergeOverlappingPolygons([polygonA, polygonB]);
            expect(mergedPolygons.length).toEqual(1);
            const actual = mergedPolygons[0].points;
            const expected = [
                p5,
                p1,
                p2,
                p3,
                p4,
            ];
            expect(actual).toEqual(expected);
        });
    });
    describe('given one box fully inside the other', () => {
        const polygonOutside: Polygon = {
            points: [
                { x: 0, y: 0 },
                { x: 0, y: 4 },
                { x: 4, y: 4 },
                { x: 4, y: 0 }
            ], inverted: false
        };
        const polygonInside: Polygon = {
            points: [
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 2, y: 2 },
                { x: 2, y: 1 }
            ], inverted: false
        };
        it("should remove the inside box entirely", () => {
            const mergedPolygons = mergeOverlappingPolygons([polygonOutside, polygonInside]);
            const actual = JSON.stringify(mergedPolygons[0].points);
            const expected = JSON.stringify(polygonOutside.points);
            expect(actual).toEqual(expected);
        });
        it("should still remove the inside box even if the order of the boxes is reversed when passed into mergeOverlappingPolygons", () => {
            const mergedPolygons = mergeOverlappingPolygons([polygonInside, polygonOutside]);
            const actual = JSON.stringify(mergedPolygons[0].points);
            const expected = JSON.stringify(polygonOutside.points);
            expect(actual).toEqual(expected);
        });
    });
    describe('given 3 boxes, one that overlaps 2', () => {
        it('should return a single correctly merged polygon', () => {
            const largePoly: Polygon = {
                points: [
                    { x: 0, y: 0 },
                    { x: 0, y: 10 },
                    { x: 4, y: 10 },
                    { x: 4, y: 0 }
                ],
                inverted: false
            };
            const smallPoly1: Polygon = {
                points: [
                    { x: -1, y: 2 },
                    { x: -1, y: 3 },
                    { x: 1, y: 3 },
                    { x: 1, y: 2 }
                ],
                inverted: false
            };
            const smallPoly2: Polygon = {
                points: [
                    { x: -1, y: 7 },
                    { x: -1, y: 8 },
                    { x: 1, y: 8 },
                    { x: 1, y: 7 }
                ],
                inverted: false
            };
            const mergedPolygons = mergeOverlappingPolygons([largePoly, smallPoly1, smallPoly2]);
            const actual = mergedPolygons[0].points;
            const expected = [
                { x: 0, y: 0 },
                // intersection between largePoly and smallPoly1
                { x: 0, y: 2 },
                // Some of smallPoly1's points
                { x: -1, y: 2 },
                { x: -1, y: 3 },
                // intersection between largePoly and smallPoly1
                { x: 0, y: 3 },
                // back to iterating largePoly
                // intersection between largePoly and smallPoly2
                { x: 0, y: 7 },
                // Some of smallPoly2's points
                { x: -1, y: 7 },
                { x: -1, y: 8 },
                // intersection between largePoly and smallPoly2
                { x: 0, y: 8 },
                // back to iterating largePoly
                { x: 0, y: 10 },
                { x: 4, y: 10 },
                { x: 4, y: 0 }
            ];
            expect(actual).toEqual(expected);

        });
    });
    it('should properly merge 3 polys when one of them has all of it\'s verts within the other two but it\'s walls will still affect the final merged polygon', () => {
        const polyBridge = {
            points: [
                { "x": 0, "y": 0 },
                { "x": 0, "y": 3 },
                { "x": 3, "y": 3 },
                { "x": 3, "y": 0 }
            ], inverted: false
        };
        // Covers polyBridge's top 2 points
        const polyTop = {
            points: [
                { "x": -1, "y": 2 },
                { "x": -1, "y": 4 },
                { "x": 4, "y": 4 },
                { "x": 4, "y": 2 }
            ], inverted: false
        };
        // Covers polyBridge's bottom 2 points
        const polyBottom = {
            points: [
                { "x": -1, "y": -1 },
                { "x": -1, "y": 1 },
                { "x": 4, "y": 1 },
                { "x": 4, "y": -1 }
            ], inverted: false
        };

        const mergedPolygons = mergeOverlappingPolygons([polyBridge, polyTop, polyBottom]);
        const actual = mergedPolygons[0].points;
        const expected = [
            polyTop.points[0],
            polyTop.points[1],
            polyTop.points[2],
            polyTop.points[3],
            { x: 3, y: 2 },
            { x: 3, y: 1 },
            polyBottom.points[2],
            polyBottom.points[3],
            polyBottom.points[0],
            polyBottom.points[1],
            { x: 0, y: 1 },
            { x: 0, y: 2 },

        ];
        expect(actual).toEqual(expected);

    });
    describe("generated tests from runtime issues", () => {

        it('should reduce overlapping polys to a single poly', () => {
            const poly1 = {
                points: [
                    { "x": 0, "y": 0 },
                    { "x": 0, "y": 2 },
                    { "x": 1, "y": 2 },
                    { "x": 1, "y": 0 }
                ], inverted: false
            };
            const poly2 = {
                points: [
                    { "x": 0, "y": 1 },
                    { "x": 0, "y": 3 },
                    { "x": 1, "y": 3 },
                    { "x": 1, "y": 1 }
                ], inverted: false
            };
            const mergedPolygons = mergeOverlappingPolygons([poly1, poly2]);
            const actual = mergedPolygons.length;
            const expected = 1;
            expect(actual).toEqual(expected);

        });
        // it.only('issue with inverted?', () => {
        //     const polygons: Polygon[] = [
        //         {
        //             "points": [
        //                 {
        //                     "x": 380,
        //                     "y": 516
        //                 },
        //                 {
        //                     "x": 380,
        //                     "y": 580
        //                 },
        //                 {
        //                     "x": 444,
        //                     "y": 580
        //                 },
        //                 {
        //                     "x": 444,
        //                     "y": 516
        //                 }
        //             ],
        //             "inverted": false
        //         },
        //         {
        //             "points": [
        //                 {
        //                     "x": 446,
        //                     "y": 442
        //                 },
        //                 {
        //                     "x": 446,
        //                     "y": 506
        //                 },
        //                 {
        //                     "x": 510,
        //                     "y": 506
        //                 },
        //                 {
        //                     "x": 510,
        //                     "y": 442
        //                 }
        //             ],
        //             "inverted": false
        //         },
        //         {
        //             "points": [
        //                 {
        //                     "x": 336,
        //                     "y": 440
        //                 },
        //                 {
        //                     "x": 336,
        //                     "y": 504
        //                 },
        //                 {
        //                     "x": 400,
        //                     "y": 504
        //                 },
        //                 {
        //                     "x": 400,
        //                     "y": 440
        //                 }
        //             ],
        //             "inverted": false
        //         },
        //         {
        //             "points": [
        //                 {
        //                     "x": 0,
        //                     "y": 0
        //                 },
        //                 {
        //                     "x": 0,
        //                     "y": 600
        //                 },
        //                 {
        //                     "x": 800,
        //                     "y": 600
        //                 },
        //                 {
        //                     "x": 800,
        //                     "y": 0
        //                 }
        //             ],
        //             "inverted": true
        //         }
        //     ];
        //     const mergedPolygons = mergeOverlappingPolygons(polygons.map(p => expandPolygon(p, 32)));
        //     const actual = mergedPolygons.length;
        //     console.log('actual', mergedPolygons);
        //     const expected = 1;
        //     expect(actual).toEqual(expected);

        // });
    });

});