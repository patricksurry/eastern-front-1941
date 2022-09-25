import {directions} from './data.js';
import {Location, squareSpiral} from './map.js';
import {linePoints, sortSquareFacing} from './think.js';


test("Unexpected linePoints() values", () => {
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
    expect(linepts).toEqual([104, 162, 16, 146]);
})

