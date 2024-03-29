//TODO these represent deviations from the original implementation
// in general false reflects the original APX/cartridge condition
// the values here show my current choices, but aren't actually configurable in code yet
const options = {
    colorPalette: 'WikiNTSC', // 'Atari800MacXnewStellaNTSC', 'Atari800MacXz26NTSC' are also playable
    astarPathFinding: true,
    reduceInitialFogInContact: true,    // initial fog reduced for units in contact at scenario start
    mapIncludesSevastopol: true,        // in APX it looks like it initially scored 10pts but later removed
    disperseEliminatedUnits: true,      // whether eliminated units disperse nearby (as in cartridge)
    defenderFirstStrike: true,          // whether defender can break attacker and prevent attack

    // hard-wired settings (these config options aren't referenced)
    mapIncludeSevastopol: true,
    germanReinforcementsMoveOnArrival: true,
    russianReinforcementsMoveOnArrival: false,
    moreRandomSupplyAndRetreat: true,  // randomize N/S check in retreat and supply vs fixed order
    shuffleUnitInitiative: false,  // vs reverse unit index order-processing preferring Russians, note [modulo bias](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) sort full list of 256?
    shuffleThinkingOrder: false,
} as const;

export {options}