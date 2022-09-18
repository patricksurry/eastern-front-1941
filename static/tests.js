let pass = 0, fail = 0;

function assert(v, ...assertArgs) {
    console.assert(v, ...assertArgs);
    if (v) { pass++ }
    else { fail++ }
}

function assertEqual(a, b, ...assertArgs) {
    assert(a == b, ...[].concat(assertArgs, [a, b]));
}

function assertArrayLength(arr, n, ...assertArgs) {
    assert(arr.length == n, ...[].concat(assertArgs, [n, arr]))
}

function assertArrayEqual(a, b, ...assertArgs) {
    assert(a.every((v, i) => v == b[i]), ...[].concat(assertArgs, [a, b]));
}

function assertThrows(callable, ...assertArgs) {
    let threw = false;
    try {callable()} catch { threw = true; }
    assert(threw, ...assertArgs);
}

console.group("unit tests begin");

// Location constructor
assertEqual(Location(3, 4).id, Location.of({lon: 3, lat: 4}).id, "Location ids should match");
assertThrows(() => Location({lon: 3, lat: 4}), "Invalid location should throw");

// Location to/from id
const loc34 = Location(3, 4);
assertEqual(Location.fromid(loc34.id).id, loc34.id, "Location.fromid round-trip failed");
assertEqual(Location.of({lon: 3, lat: 4}).id, loc34.id, "Location.of failed");

// Manhattan distance
assertEqual(manhattanDistance({lon: 3, lat: 4}, {lon: 3, lat: 4}), 0, "Wrong manhattan distance");
assertEqual(manhattanDistance({lon: 3, lat: 4}, {lon: 4, lat: 3}), 2, "Wrong manhattan distance");
assertEqual(manhattanDistance({lon: 3, lat: 4}, {lon: 1, lat: 6}), 4, "Wrong manhattan distance");

// direction tests
assertEqual(directionFrom({lon: 3, lat: 4}, {lon: 3, lat: 4}), null, "Self direction is null");
assertEqual(directionFrom({lon: 3, lat: 4}, {lon: 13, lat: 4}), Direction.west, "Wrong direction");
assertEqual(directionFrom({lon: 3, lat: 4}, {lon: 0, lat: 3}), Direction.east, "Wrong direction");
assertEqual(directionFrom({lon: 3, lat: 4}, {lon: 2, lat: 12}), Direction.north, "Wrong direction");
assertEqual(directionFrom({lon: 3, lat: 4}, {lon: 3, lat: 0}), Direction.south, "Wrong direction");

// path tests
assertEqual(directPath({lon: 3, lat: 4}, {lon: 3, lat: 4}).cost, 0, "Nil path failure");
assertEqual(directPath({lon: 3, lat: 4}, {lon: 0, lat: 3}).cost, 4, "Direct path length != manhattan distance");

// Square spiral alg
assertArrayLength(squareSpiral(loc34, 1), 1, "squareSpiral(1) should have one square");
assertArrayLength(squareSpiral(loc34, 7), 49, "squareSpiral(7) should have 49 squares");
assertThrows(() => squareSpiral(loc34, 2), "squareSpiral(2) should throw an error")

// directionFrom tie-breaking
let bydir = {0: 0, 1: 0, 2: 0, 3: 0, null: 0};
squareSpiral(loc34, 7).forEach(loc => bydir[directionFrom(loc34, loc)] += 1);
assertEqual(bydir[null], 1, "directionFrom(a, a) should return null");
delete bydir[null];
assertArrayEqual(Object.values(bydir), [12, 12, 12, 12], "directionFrom() should be equally distributed")

// linePoints tests
// set up the linepts position from the PDF diagram, and test from all directions
let p = Location(102, 102),
    sq = squareSpiral(p, 5),
    occ = [[103, 103], [103, 101], [103, 100], [102, 102], [101, 101]];
sq.forEach(loc => {
    loc.v = 0;
    occ.forEach(([lon, lat]) => {
        if (loc.lon == lon && loc.lat == lat) loc.v = 1;
    })
});
let linepts = directions.map((_, i) => linePoints(sortSquareFacing(p, 5, i, sq), 5, loc => loc.v));
assertArrayEqual(linepts, [104, 162, 16, 146], "Unexpected linePoints()");

// bestPath test
const finn2 = oob[42];
assertArrayLength(finn2.bestPath(Location(36, 33)).orders, 10, "Unexpected bestPath() for 2 Finn Inf");

// reach test
assertArrayLength(
    Object.keys(reach(finn2, 32, moveCosts(finn2.armor, Weather.dry))), 18,
    "Unexpected reach() for 2 Finn Inf"
)

// unit score tests
assert
    (oob.map(u => u.score() * (u.player == Player.german ? 1: -1)).every(s => s >= 0),
    "Germans should be non-negative, and Russin non-positive"
)

console.info(`unit tests complete: ${pass} pass, ${fail} fail`)
console.groupEnd();
