import {lfsr24} from './rng';

test("Full period", () => {
    const rng = lfsr24(1234),
        start = rng.state();
    let n = 0;

    do {
        rng.bit();
        n++;
    } while (start != rng.state());
    expect(n).toBe(1<<24);
})

test("Reproducible", () => {
    const rng = lfsr24(5678);

    rng.bits(24);
    const state = rng.state(),
        xs = [rng.byte(), rng.byte(), rng.byte(), rng.byte()],
        dup = lfsr24(state),
        ys = [dup.byte(), dup.byte(), dup.byte(), dup.byte()];
    expect(xs).toEqual(ys);
})
