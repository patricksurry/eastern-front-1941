import {DirectionKey, WeatherKey, UnitKindKey, moveCosts} from './defs';
import {GridPoint, Mapboard} from './map';
import {Game} from './game';

const
    mapboard = new Mapboard(new Game()),
    loc34 = mapboard.locationOf(new GridPoint(3, 4));

test("Locations should match", () => {
    expect(loc34).toBe(mapboard.locationOf({lon: 3, lat: 4}));
})

test("Location.fromid round-trip failed", () => {
    expect(mapboard.locationOf(GridPoint.fromid(loc34.id))).toBe(loc34);
})

test("Consistent self locations", () => {
    mapboard.locations.forEach(row =>
        row.forEach(loc => mapboard.valid(loc) && expect(mapboard.locationOf(loc).id).toBe(loc.id)))
})

test("unique locations", () => {
    const ids = mapboard.locations.flatMap(row => row.map(loc => loc.id));
    expect(ids.length).toEqual(new Set(ids).size);
})

test("Neighbor location", () => {
    expect(mapboard.neighborOf(loc34, DirectionKey.east)).toBe(mapboard.locationOf({lon: 2, lat: 4}))
})

test("Wrong manhattan distance", () => {
    expect(GridPoint.manhattanDistance({lon: 3, lat: 4}, {lon: 3, lat: 4})).toBe(0);
    expect(GridPoint.manhattanDistance({lon: 3, lat: 4}, {lon: 4, lat: 3})).toBe(2);
    expect(GridPoint.manhattanDistance({lon: 3, lat: 4}, {lon: 1, lat: 6})).toBe(4);
})

test("Self direction is null", () => {
    expect(GridPoint.directionFrom({lon: 3, lat: 4}, {lon: 3, lat: 4})).toBe(null);
})

test("Wrong direction", () => {
    expect(GridPoint.directionFrom({lon: 3, lat: 4}, {lon: 13, lat: 4})).toBe(DirectionKey.west);
    expect(GridPoint.directionFrom({lon: 3, lat: 4}, {lon: 0, lat: 3})).toBe(DirectionKey.east);
    expect(GridPoint.directionFrom({lon: 3, lat: 4}, {lon: 2, lat: 12})).toBe(DirectionKey.north);
    expect(GridPoint.directionFrom({lon: 3, lat: 4}, {lon: 3, lat: 0})).toBe(DirectionKey.south);
})

test("Nil path failure", () => {
    expect(mapboard.directPath({lon: 3, lat: 4}, {lon: 3, lat: 4}).cost).toBe(0);
})

test("Direct path length != manhattan distance", () => {
    expect(mapboard.directPath({lon: 3, lat: 4}, {lon: 0, lat: 3}).cost).toBe(4);
})

test("squareSpiral sizes", () => {
    expect(GridPoint.squareSpiral(loc34, 1).length).toBe(1);
    expect(GridPoint.squareSpiral(loc34, 7).length).toBe(49);
})

test("squareSpiral ids", () => {
    const ids = new Set(GridPoint.squareSpiral(loc34, 3).map(loc => loc.id));
    expect(ids.size).toBe(9);
})

test("even diameter squareSpiral should throw", () => {
    expect(() => GridPoint.squareSpiral(loc34, 2)).toThrow();
})

test("directionFrom tie-breaking should be unbiased", () => {
    const bydir: Record<DirectionKey, number> = {0: 0, 1: 0, 2: 0, 3: 0};
    let nils = 0;
    GridPoint.squareSpiral(loc34, 7)
        .forEach(loc => {
            const dk = GridPoint.directionFrom(loc34, loc);
            if (dk != null) bydir[dk]++;
            else nils++;
        });

    // directionFrom(a, a) returns null, others are equally distributed
    Object.entries(bydir).forEach(([ , v]) => expect(v).toBe(12));
    expect(nils).toBe(1);
})

const finn2 = mapboard.locationOf(new GridPoint(35, 38)),
    costs = moveCosts(UnitKindKey.infantry, WeatherKey.dry); // oob.at(42)

test("Unexpected bestPath() for 2 Finn Inf", () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(mapboard.bestPath(finn2, new GridPoint(36, 33), costs)!.orders.length).toBe(10);
})

test("Unexpected reach() for 2 Finn Inf", () => {
    const data = mapboard.reach(finn2, 32, costs);
    expect(Object.keys(data).length).toBe(18);
    expect(Math.max(...Object.values(data))).toBeLessThanOrEqual(32);
})
