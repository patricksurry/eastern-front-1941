/// <reference types="node" />
import { EventEmitter } from 'events';

declare type AnticColor = number;

declare type Flag = 0 | 1;
interface Point {
    lon: number;
    lat: number;
}
declare function sum(xs: number[]): number;
declare function clamp(v: number, min: number, max: number): number;
declare function memoize<S, T>(fn: (x: S) => T): (x: S) => T;
interface Direction {
    label: string;
    dlon: number;
    dlat: number;
    icon: number;
}
declare const enum DirectionKey {
    north = 0,
    east = 1,
    south = 2,
    west = 3
}
declare const directions: Record<DirectionKey, Direction>;
interface Weather {
    label: string;
    earth: AnticColor;
    contrast: AnticColor;
}
declare const enum WeatherKey {
    dry = 0,
    mud = 1,
    snow = 2
}
declare const weatherdata: Record<WeatherKey, Weather>;
interface Player {
    label: string;
    unit: string;
    color: AnticColor;
    homedir: DirectionKey;
    supply: {
        sea: number;
        freeze: number;
        maxfail: readonly [number, number, number];
    };
}
declare const enum PlayerKey {
    German = 0,
    Russian = 1
}
declare const players: Record<PlayerKey, Player>;
declare const enum TerrainKey {
    clear = 0,
    mountain_forest = 1,
    city = 2,
    frozen_swamp = 3,
    frozen_river = 4,
    swamp = 5,
    river = 6,
    coastline = 7,
    estuary = 8,
    impassable = 9
}
declare type WeatherCosts = readonly [number, number, number];
declare type UnitKindCosts = readonly [WeatherCosts, WeatherCosts];
interface Terrain {
    label: string;
    color: AnticColor;
    altcolor?: AnticColor;
    offence: number;
    defence: number;
    movecost: UnitKindCosts;
}
declare const terraintypes: Record<TerrainKey, Terrain>;
interface WaterState {
    dir: DirectionKey;
    terrain: readonly [TerrainKey, TerrainKey];
}
declare const enum WaterStateKey {
    freeze = 0,
    thaw = 1
}
declare const waterstate: Record<WaterStateKey, WaterState>;
interface Month {
    label: string;
    trees: AnticColor;
    weather: WeatherKey;
    water?: WaterStateKey;
}
declare const enum MonthKey {
    Jan = 0,
    Feb = 1,
    Mar = 2,
    Apr = 3,
    May = 4,
    Jun = 5,
    Jul = 6,
    Aug = 7,
    Sep = 8,
    Oct = 9,
    Nov = 10,
    Dec = 11
}
declare const monthdata: Record<MonthKey, Month>;
interface UnitKind {
    key: string;
    icon: number;
}
declare const enum UnitKindKey {
    infantry = 0,
    armor = 1,
    air = 2
}
declare const unitkinds: Record<UnitKindKey, UnitKind>;

declare type uint6 = number;
declare type uint = number;
declare type int = number;
declare function seq2str(seq: uint6[]): string;
declare function str2seq(s: string): uint6[];
/** convert payload to string, wrapping with optional prefix string, length marker, and CRC check */
declare function wrap64(payload: uint6[], prefix: string, length_maxbits?: number): string;
/** unwrap payload to seqas wrapped by wrap64, ignoring garbage and trailing characters */
declare function unwrap64(s: string, prefix: string, length_maxbits?: number): uint6[];
/**
 * computes achecksum for sequence as a typle
 * using a six bit version of the Fletcher checksum
 */
declare function fletcher6(seq: uint6[], modulus?: number): [uint6, uint6];
/**
 * Encode a fixed-size uint of up to 1<<nbits as a seq of uint6
 */
declare function bitsencode(n: uint, nbits: uint): uint6[];
/**
 * Decode a fixed-size value of up to nbits from a seq<uint6>
 * modifying seq in place
 */
declare function bitsdecode(seq: uint6[], nbits: uint): uint;
/** helper function estimating the size of an encoded value, used for run-length coding */
declare function fibencsize(n: uint): uint;
/** Fibonacci code a seq<uint> to a prefix free encoding chunked into seq<uint6> */
declare function fibencode(vs: uint[]): uint[];
/** Decode prefix-free Fibonacci coding chunked into seq<64> by fibencode() to recover original seq<uint> */
declare function fibdecode(seq: uint[]): uint[];
/** run length code seq<uint> => seq<uint> (hopefully shorter) by replacing runs of consecutive
 * values by <marker> <value> <repeat - min_repeat>, returning a new array of unsigned integer.
 * @param {Array[uint]} vs - The list of values to encode
 * @param {uint} marker - value to use as repeat token; existing values >= marker are incremented
 * @param {function} vsize - Function returning the expected size of encoding a value
 */
declare function rlencode(vs: uint[], marker?: number, vsize?: typeof fibencsize): uint[];
/** run length decode seq<uint> => seq<uint> to recover original array provided to rlencode
 *  the marker and vsize function must match the original encoding
 */
declare function rldecode(zs: uint[], marker?: number, vsize?: typeof fibencsize): uint[];
/** map a seq<int> (or singleton int) to seq<uint> */
declare const zigzag1: (x: number) => number;
declare function zigzag(vs: int[]): uint[];
/** recover seq<int> from a zigzag()d seq<uint> */
declare const zagzig1: (x: number) => number;
declare function zagzig(vs: uint[]): int[];
declare function ravel2(x: uint, y: uint): uint;
declare function unravel2(z: uint): [uint, uint];

interface Generator {
    state: (seed?: number) => number;
    bit: () => number;
    byte: () => number;
    bits: (n: number) => number;
}
declare function lfsr24(seed?: number): Generator;

interface GridPoint extends Point {
    lon: number;
    lat: number;
    gid: number;
}
declare function directionsFrom(p: Point, q: Point): [number, DirectionKey][];
declare function directionFrom(p: Point, q: Point): (DirectionKey | null);
declare function diamondSpiral(center: Point, radius: number, facing?: DirectionKey): GridPoint[];
declare const Grid: {
    byid: (x: number) => GridPoint;
    lonlat: (lon: number, lat: number) => GridPoint;
    point: ({ lon, lat }: Point) => GridPoint;
    adjacencies: ({ gid }: GridPoint) => GridPoint[];
    adjacent: ({ gid }: GridPoint, d: DirectionKey) => GridPoint;
    manhattanDistance: (p: Point, q: Point) => number;
    directionsFrom: typeof directionsFrom;
    directionFrom: typeof directionFrom;
    squareSpiral: (center: GridPoint, radius: number) => GridPoint[];
    diamondSpiral: typeof diamondSpiral;
};

declare type City = Point & {
    owner: PlayerKey;
    points: number;
    label: string;
};
declare type MapVariant = {
    font: string;
    encoding: readonly [string, string];
    ascii: string;
    cities: readonly City[];
};
declare const enum MapVariantKey {
    apx = 0,
    cart = 1
}
declare const mapVariants: Record<MapVariantKey, MapVariant>;
declare const blocked: readonly [readonly Point[], readonly Point[]];

declare const enum OobVariantKey {
    apx = 0,
    cart41 = 1,
    cart42 = 2
}
declare type OobData = readonly (readonly number[])[];
declare const oobVariants: Record<OobVariantKey, OobData>;

declare type Scenario = {
    label: string;
    map: MapVariantKey;
    oob: OobVariantKey;
    start: string;
    ncity: number;
    mdmg: number;
    cdmg: number;
    cadj: number;
    nunit: readonly [number, number];
    endturn: number;
    scoring: {
        win: number;
        location?: boolean;
        strength?: readonly ['current' | 'losses' | null, 'current' | 'losses' | null];
        adjust?: number;
    };
    surprised?: PlayerKey;
    skipsupply?: boolean;
    simplebreak?: boolean;
    nozoc?: boolean;
    defmod?: number;
    fog?: number;
    mvmode?: boolean;
    repl?: readonly [number, number];
    control?: readonly string[];
};
declare const enum ScenarioKey {
    apx = 0,
    learner = 1,
    beginner = 2,
    intermediate = 3,
    advanced = 4,
    expert41 = 5,
    expert42 = 6
}
declare const scenarios: Record<ScenarioKey, Scenario>;

declare const enum UnitTypeKey {
    infantry = 0,
    militia = 1,
    unused = 2,
    flieger = 3,
    panzer = 4,
    tank = 5,
    cavalry = 6,
    pzgrndr = 7
}
declare const unitFlag: {
    readonly orders: number;
    readonly attack: number;
    readonly defend: number;
    readonly damage: number;
    readonly move: number;
    readonly enter: number;
    readonly exit: number;
    readonly oos: number;
};
declare type UnitEvent = keyof typeof unitFlag;
declare const enum UnitMode {
    standard = 0,
    assault = 1,
    march = 2,
    entrench = 3
}
declare const unitModes: {
    readonly 0: {
        readonly label: "STANDARD";
    };
    readonly 1: {
        readonly label: "ASSAULT";
    };
    readonly 2: {
        readonly label: "MARCH";
    };
    readonly 3: {
        readonly label: "ENTRENCH";
    };
};
declare class Unit {
    #private;
    id: number;
    player: PlayerKey;
    unitno: number;
    kind: UnitKindKey;
    type: UnitTypeKey;
    modifier: number;
    immobile: number;
    canAttack: number;
    resolute: number;
    label: string;
    arrive: number;
    scheduled: number;
    lon: number;
    lat: number;
    mstrng: number;
    cstrng: number;
    cadj: number;
    fog: number;
    orders: DirectionKey[];
    tick: number;
    ifr: number;
    ifrdir: [number, number, number, number];
    objective?: Point;
    flags: number;
    constructor(game: Game, id: number, ...args: number[]);
    get active(): boolean;
    get movable(): 1 | 0;
    get human(): boolean;
    get location(): MapPoint;
    get path(): MapPoint[];
    emit(event: UnitEvent): void;
    get mode(): UnitMode;
    set mode(mode: UnitMode);
    nextmode(): void;
    foggyStrength(observer: PlayerKey): {
        mstrng: number;
        cstrng: number;
    };
    addOrder(dir: number): MapPoint | undefined;
    delOrder(): void;
    setOrders(dirs: DirectionKey[]): void;
    resetOrders(): void;
    setOrdersSupportingFriendlyFurther(dir: DirectionKey): void;
    moveCost(terrain: TerrainKey, weather: WeatherKey): number;
    moveCosts(weather: WeatherKey): number[];
    orderCost(dir: DirectionKey): number;
    scheduleOrder(startTurn?: boolean): void;
    pathTo(goal: Point): Path;
    reach(range?: number): GridPoint[];
    moveTo(dst: MapPoint | null, notify?: boolean): void;
    tryOrder(): void;
    recover(): void;
    eliminate(disperse?: boolean): void;
    nextTurn(startOrResume: boolean): void;
    traceSupply(): Flag;
    locScore(): number;
    describe(debug?: boolean): string;
}

declare type UnitPredicate = (u: Unit, index: number) => boolean;
declare type UnitMap<T> = (u: Unit, index: number) => T;
declare type UnitForeach = (u: Unit, index: number) => void;
declare class Oob {
    #private;
    startmstrng: [number, number];
    constructor(game: Game, memento?: number[]);
    at(index: number): Unit;
    every(f: UnitPredicate): boolean;
    some(f: UnitPredicate): boolean;
    filter(f: UnitPredicate): Unit[];
    find(f: UnitPredicate): Unit | undefined;
    findIndex(f: UnitPredicate): number;
    forEach(f: UnitForeach): void;
    map<T>(f: UnitMap<T>): T[];
    slice(start?: number, end?: number): Unit[];
    get memento(): number[];
    scoreStrengths(player: PlayerKey): number;
    nextTurn(startOrResume: boolean): void;
    activeUnits(player?: PlayerKey): Unit[];
    centerOfGravity(player?: PlayerKey): Point;
    scheduleOrders(): void;
    executeOrders(tick: number): void;
    zocAffects(player: PlayerKey, loc: MapPoint, omitSelf?: boolean): boolean;
    zocAffecting(player: PlayerKey, loc: MapPoint, omitSelf?: boolean, threshold?: number): number;
    zocBlocked(player: PlayerKey, src: MapPoint, dst: MapPoint): boolean;
}

declare type GameEvent = 'turn' | 'tick' | 'over';
declare type MessageLevel = 'error';
declare class Game extends EventEmitter {
    scenario: ScenarioKey;
    human: PlayerKey;
    turn: number;
    date: Date;
    month: MonthKey;
    weather: WeatherKey;
    handicap: number;
    mapboard: Mapboard;
    oob: Oob;
    rand: Generator;
    constructor(token: string);
    constructor(scenario: ScenarioKey, seed?: number);
    get memento(): number[];
    get token(): string;
    get over(): boolean;
    resolveTurn(delay?: number): void;
    nextTurn(startOrResume?: boolean): void;
    score(player: PlayerKey): number;
    emit(event: 'game', action: GameEvent): boolean;
    emit(event: 'map', action: MapEvent, loc: MapPoint): boolean;
    emit(event: 'unit', action: UnitEvent, u: Unit): boolean;
    emit(event: 'message', level: MessageLevel, message: string): boolean;
    on(event: 'game', listener: (action: GameEvent) => void): this;
    on(event: 'map', listener: (action: MapEvent, loc: MapPoint) => void): this;
    on(event: 'unit', listener: (action: UnitEvent, u: Unit) => void): this;
    on(event: 'message', listener: (level: MessageLevel, message: string) => void): this;
}

declare type Path = {
    cost: number;
    orders: DirectionKey[];
};
declare type MapEvent = 'citycontrol';
interface LocationData {
    icon: number;
    terrain: TerrainKey;
    alt: Flag;
}
interface MapPoint extends GridPoint, LocationData {
    cityid?: number;
    unitid?: number;
}
declare class Mapboard {
    #private;
    locations: MapPoint[][];
    cities: {
        lon: number;
        lat: number;
        owner: PlayerKey;
        points: number;
        label: string;
    }[];
    font: string;
    constructor(game: Game, memento?: number[]);
    get memento(): number[];
    nextTurn(startOrResume?: boolean): void;
    get extent(): {
        width: number;
        height: number;
    };
    get bbox(): {
        0: number;
        2: number;
        3: number;
        1: number;
    };
    xy({ lon, lat }: Point): {
        x: number;
        y: number;
    };
    describe(loc: MapPoint, debug?: boolean): string;
    valid(pt: GridPoint): boolean;
    locationOf(pt: GridPoint): MapPoint;
    boundaryDistance(pt: Point, dir: DirectionKey): number;
    neighborsOf({ gid }: GridPoint): [MapPoint?, MapPoint?, MapPoint?, MapPoint?];
    neighborOf({ gid }: GridPoint, dir: DirectionKey): MapPoint | undefined;
    occupy(loc: MapPoint, player: PlayerKey): void;
    directPath(p: GridPoint, q: GridPoint, costs?: number[]): Path;
    bestPath(p: GridPoint, q: GridPoint, costs: number[]): Path;
    reach(src: GridPoint, range: number, costs: number[]): {
        [key: number]: number;
    };
}

declare class Thinker {
    #private;
    finalized: boolean;
    constructor(game: Game, player: PlayerKey);
    thinkRecurring(delay?: number): void;
    finalize(): void;
    think(): Unit[];
}

export { DirectionKey, Flag, Game, Generator, Grid, GridPoint, MapEvent, MapPoint, MapVariantKey, Mapboard, MonthKey, Oob, OobVariantKey, Path, PlayerKey, Point, ScenarioKey, TerrainKey, Thinker, Unit, UnitEvent, UnitKindKey, UnitMode, WaterStateKey, WeatherKey, bitsdecode, bitsencode, blocked, clamp, directions, fibdecode, fibencode, fletcher6, lfsr24, mapVariants, memoize, monthdata, oobVariants, players, ravel2, rldecode, rlencode, scenarios, seq2str, str2seq, sum, terraintypes, unitFlag, unitModes, unitkinds, unravel2, unwrap64, waterstate, weatherdata, wrap64, zagzig, zagzig1, zigzag, zigzag1 };
