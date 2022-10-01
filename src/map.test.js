import {Direction, Weather} from './game.js';
import {Location, reach, moveCosts, manhattanDistance, directionFrom, directPath, squareSpiral} from './map.js';
import {oob} from './unit.js';

const loc34 = Location(3, 4);

test("Location ids should match", () => {
    expect(loc34.id).toBe(Location.of({lon: 3, lat: 4}).id);
})

test("Invalid lon arg should throw", () => {
    expect(() => Location({lon: 3, lat: 4})).toThrow();
})

test("Location.fromid round-trip failed", () => {
    expect(Location.fromid(loc34.id).id).toBe(loc34.id);
})

test("Location.of failed", () => {
    expect(Location.of({lon: 3, lat: 4}).id).toBe(loc34.id);
})


test("Wrong manhattan distance", () => {
    expect(manhattanDistance({lon: 3, lat: 4}, {lon: 3, lat: 4})).toBe(0);
    expect(manhattanDistance({lon: 3, lat: 4}, {lon: 4, lat: 3})).toBe(2);
    expect(manhattanDistance({lon: 3, lat: 4}, {lon: 1, lat: 6})).toBe(4);
})

test("Self direction is null", () => {
    expect(directionFrom({lon: 3, lat: 4}, {lon: 3, lat: 4})).toBe(null);
})

test("Wrong direction", () => {
    expect(directionFrom({lon: 3, lat: 4}, {lon: 13, lat: 4})).toBe(Direction.west);
    expect(directionFrom({lon: 3, lat: 4}, {lon: 0, lat: 3})).toBe(Direction.east);
    expect(directionFrom({lon: 3, lat: 4}, {lon: 2, lat: 12})).toBe(Direction.north);
    expect(directionFrom({lon: 3, lat: 4}, {lon: 3, lat: 0})).toBe(Direction.south);
})

test("Nil path failure", () => {
    expect(directPath({lon: 3, lat: 4}, {lon: 3, lat: 4}).cost).toBe(0);
})

test("Direct path length != manhattan distance", () => {
    expect(directPath({lon: 3, lat: 4}, {lon: 0, lat: 3}).cost).toBe(4);
})

test("squareSpiral sizes", () => {
    expect(squareSpiral(loc34, 1).length).toBe(1);
    expect(squareSpiral(loc34, 7).length).toBe(49);
})

test("even diameter squareSpiral should throw", () => {
    expect(() => squareSpiral(loc34, 2)).toThrow();
})

test("directionFrom tie-breaking should be unbiased", () => {
    let bydir = {0: 0, 1: 0, 2: 0, 3: 0, null: 0};
    squareSpiral(loc34, 7).forEach(loc => bydir[directionFrom(loc34, loc)] += 1);
    expect(bydir[null]).toBe(1); //directionFrom(a, a) returns null
    delete bydir[null];

    Object.values(bydir).forEach(v => expect(v).toBe(12));
})

const finn2 = oob[42];

test("Unexpected bestPath() for 2 Finn Inf", () => {
    expect(finn2.bestPath(Location(36, 33)).orders.length).toBe(10);
})

test("Unexpected reach() for 2 Finn Inf", () => {
    let costs = reach(finn2, 32, moveCosts(finn2.kind, Weather.dry));
    expect(Object.keys(costs).length).toBe(18);
    expect(Math.max(...Object.values(costs))).toBeLessThanOrEqual(32);
})
