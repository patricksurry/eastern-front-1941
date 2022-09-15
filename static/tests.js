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

const loc34 = Location(3, 4);
assertEqual(Location.fromid(loc34.id).id, loc34.id, "Location.fromid round-trip failed");
assertEqual(Location.of({lon: 3, lat: 4}).id, loc34.id, "Location.of failed");

assertArrayLength(squareSpiral(loc34, 1), 1, "squareSpiral(1) should have one square");
assertArrayLength(squareSpiral(loc34, 7), 49, "squareSpiral(7) should have 49 squares");

assertThrows(() => squareSpiral(loc34, 2), "squareSpiral(2) should throw an error")

let bydir = {0: 0, 1: 0, 2: 0, 3: 0, null: 0};
squareSpiral(loc34, 7).forEach(loc => bydir[directionFrom(loc34, loc)] += 1);
assertEqual(bydir[null], 1, "directionFrom(a, a) should return null");
delete bydir[null];
assertArrayEqual(Object.values(bydir), [12, 12, 12, 12], "directionFrom() should be equally distributed")

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
let linepts = directions.map((dir, i) => linePoints(sortSquareFacing(p, 5, i, sq), 5));
assertArrayEqual(linepts, [104, 162, 16, 146], "Unexpected linePoints()");

const finn2 = oob[42];
assertArrayLength(finn2.bestPath(Location(36, 33)).orders, 10, "Unexpected bestPath() for 2 Finn Inf");

//TODO
gameState.weather = Weather.dry;
assertArrayLength(Object.keys(finn2.reach()), 18, "Unexpected reach() for 2 Finn Inf")

console.info(`unit tests complete: ${pass} pass, ${fail} fail`)
console.groupEnd();
