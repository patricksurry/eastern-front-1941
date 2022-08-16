function score() {
    // M.asm:4050
    let eastwest = [].concat(
            activeunits[Player.german].map(u => (maxlon + 2 - u.lon)*(u.mstrng >> 1)),
            activeunits[Player.russian].map(u => - u.lon*(u.cstrng >> 3))
        ).reduce((s, x) => s + (x >> 8), 0),
        bonus = cities.filter(c => c.owner == Player.german)
            .map(c => c.points || 0)
            .reduce((s, x) => s + x, 0),
        score = Math.max(eastwest, 0) + bonus;

    if (handicap) score >>= 1;
    return score;
}
