import {Direction, Weather, moveCosts, UnitKind} from './defs.js';
import {Location, Mapboard} from './map.js';


//TODO test cities <=> city terrain       console.assert(loc.terrain == Terrain.city, `Expected city terrain for ${city}`);

const
    mapboard = Mapboard({}),
    loc34 = mapboard.locationOf(Location(3, 4));

test("Invalid lon arg should throw", () => {
    expect(() => Location({lon: 3, lat: 4})).toThrow();
})

test("Locations should match", () => {
    expect(loc34).toBe(mapboard.locationOf({lon: 3, lat: 4}));
})

test("Location.fromid round-trip failed", () => {
    expect(mapboard.fromid(loc34.id)).toBe(loc34);
})

test("Neighbor location", () => {
    expect(mapboard.neighbor(loc34, Direction.east)).toBe(mapboard.locationOf({lon: 2, lat: 4}))
})

test("Wrong manhattan distance", () => {
    expect(mapboard.manhattanDistance({lon: 3, lat: 4}, {lon: 3, lat: 4})).toBe(0);
    expect(mapboard.manhattanDistance({lon: 3, lat: 4}, {lon: 4, lat: 3})).toBe(2);
    expect(mapboard.manhattanDistance({lon: 3, lat: 4}, {lon: 1, lat: 6})).toBe(4);
})

test("Self direction is null", () => {
    expect(mapboard.directionFrom({lon: 3, lat: 4}, {lon: 3, lat: 4})).toBe(null);
})

test("Wrong direction", () => {
    expect(mapboard.directionFrom({lon: 3, lat: 4}, {lon: 13, lat: 4})).toBe(Direction.west);
    expect(mapboard.directionFrom({lon: 3, lat: 4}, {lon: 0, lat: 3})).toBe(Direction.east);
    expect(mapboard.directionFrom({lon: 3, lat: 4}, {lon: 2, lat: 12})).toBe(Direction.north);
    expect(mapboard.directionFrom({lon: 3, lat: 4}, {lon: 3, lat: 0})).toBe(Direction.south);
})

test("Nil path failure", () => {
    expect(mapboard.directPath({lon: 3, lat: 4}, {lon: 3, lat: 4}).cost).toBe(0);
})


test("Direct path length != manhattan distance", () => {
    expect(mapboard.directPath({lon: 3, lat: 4}, {lon: 0, lat: 3}).cost).toBe(4);
})

test("squareSpiral sizes", () => {
    expect(mapboard.squareSpiral(loc34, 1).length).toBe(1);
    expect(mapboard.squareSpiral(loc34, 7).length).toBe(49);
})

test("squareSpiral ids", () => {
    let ids = new Set(mapboard.squareSpiral(loc34, 3).map(loc => loc.id));
    expect(ids.size).toBe(9);
})

test("even diameter squareSpiral should throw", () => {
    expect(() => mapboard.squareSpiral(loc34, 2)).toThrow();
})

test("directionFrom tie-breaking should be unbiased", () => {
    let bydir = {0: 0, 1: 0, 2: 0, 3: 0, null: 0};
    mapboard.squareSpiral(loc34, 7).forEach(loc => bydir[mapboard.directionFrom(loc34, loc)] += 1);
    expect(bydir[null]).toBe(1); //directionFrom(a, a) returns null
    delete bydir[null];

    Object.values(bydir).forEach(v => expect(v).toBe(12));
})

const finn2 = mapboard.locationOf(Location(35, 38)),
    costs = moveCosts(UnitKind.infantry, Weather.dry); // oob[42]

test("Unexpected bestPath() for 2 Finn Inf", () => {
    expect(mapboard.bestPath(finn2, Location(36, 33), costs).orders.length).toBe(10);
})

test("Unexpected reach() for 2 Finn Inf", () => {
    let data = mapboard.reach(finn2, 32, costs);
    expect(Object.keys(data).length).toBe(18);
    expect(Math.max(...Object.values(data))).toBeLessThanOrEqual(32);
})
