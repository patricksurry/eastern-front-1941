import {lfsr24} from './rng';

test("Full period", () => {
    let rng = lfsr24(1234),
        n = 0,
        start = rng.state();
    do {
        rng.bit();
        n++;
    } while (start != rng.state());
    expect(n).toBe(1<<24);
})

test("Reproducible", () => {
    let rng = lfsr24(5678);

    rng.bits(24);
    const state = rng.state(),
        xs = [rng.byte(), rng.byte(), rng.byte(), rng.byte()],
        dup = lfsr24(state),
        ys = [dup.byte(), dup.byte(), dup.byte(), dup.byte()];
    expect(xs).toEqual(ys);
})
