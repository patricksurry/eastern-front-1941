//TODO these represent deviations from the original implementation
// in general false reflects the original APX/cartridge condition
// the values here show my current choices, but aren't actually configurable in code yet
const options = {
    mapIncludeSevastopol: false,
    germanReinforcementsMoveOnArrival: true,
    russianReinforcementsMoveOnArrival: false,
    astarPathFinding: true,
    moreRandomSupplyAndRetreat: true,  // randomize N/S check in retreat and supply vs fixed order
    shuffleUnitInitiative: false,  // vs reverse unit index order-processing preferring Russians, note [modulo bias](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) sort full list of 256?
    shuffleThinkingOrder: false,
} as const;

export {options}