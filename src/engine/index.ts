// public exports from the headless game bundle

export {
    type Flag, type Point,
    sum, memoize, clamp,
    directions, DirectionKey,
    players, PlayerKey,
    terraintypes, TerrainKey,
    weatherdata, WeatherKey,
    waterstate, WaterStateKey,
    monthdata, MonthKey,
    unitkinds, UnitKindKey,
} from './defs';
export {
    wrap64, unwrap64,
    str2seq, seq2str,
    fletcher6,
    bitsencode, bitsdecode,
    fibencode, fibdecode,
    rlencode, rldecode,
    zigzag, zagzig,
    zigzag1, zagzig1,
    ravel2, unravel2,
} from './codec';
export {lfsr24, type Generator} from './rng';
export {type GridPoint, Grid} from './grid';
export {mapVariants, MapVariantKey, blocked} from './map-data';
export {MapPoint, Mapboard, Path, type MapEvent} from './map';
export {oobVariants, OobVariantKey} from './oob-data';
export {Oob} from './oob';
export {Unit, type UnitEvent, unitFlag, UnitMode, unitModes} from './unit';
export {scenarios, ScenarioKey} from './scenarios';
export {Thinker} from './think';
export {Game} from './game';


