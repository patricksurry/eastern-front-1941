Source code
===

This folder contains the new Typescript implementation of Eastern Front 1941.
Source files are in `*.ts` and [Jest][jest] unit tests are in `*.test.ts`.
`README.md` is this file.
[`CHANGES.md`](CHANGES.md) captures a history of many of the cartridge-specific features
that were implemented after I had the base APX code mostly working.
It might have useful context as to how and why I made particular design choices.
[`TODO.md`](TODO.md) tracks a running list of future tasks which might or might not get implemented.
Various static configuration choices are parameterized in `config.ts`.
Also see the [implementation notes](../doc/notes.md) with more background on the design.

[jest]: https://jestjs.io/

The app is split into three components, described in more detail below:

- `engine/` - the headless game engine
- `antic/` - a generic Atari-like character-based display window
- `app/` - the UX for the game itself

Game engine
---

The core game engine is a headless `EventEmitter` rooted in `game.ts`.
The "public" API across all engine modules is exposed in `index.ts` for bundling purposes.

Much of the cartridge storage budget is taken up by the various maps and tables
needed to play the game, just like a physical wargame.
These tables are directly extracted from the original binaries via `scripts/` and
expressed in a more accessible form here.

- `defs.ts` - Core data type definitions, enums and so forth
- `scenarios.ts` - Definitions for each of the difficult levels and scenarios
- `map-data.ts` - ascii representations of the game map derived from the binary data
- `oob-data.ts` - Orders of battle (lists of unit data) used in the various scenarios, extracted from binary data

The game and AI logic are defined in:

- `game.ts` - the core game engine, managing the map (`map.ts`) and order of battle (`oob.ts`)
- `map.ts` - manages the game board which contains units and cities
- `grid.ts` - a generic system to manage the cartesian grid upon which the map sits
- `oob.ts` - manages the order of battle, little more than a specialized array of units
- `unit.ts` - manage an individual unit and its interactions with other units like combat
- `think.ts` - implements the original APX AI system
- `codec.ts` - a suite of integer coding and decoding utilities used primarily to encode and decode compact game state
- `rng.ts` - replaces Atari's truly random byte generator with a simple reproducible random number generator.  This makes the game a pure function of an initial seed value, making it easier to test and reason about.

User interface
---

The display is based on a simple model/view/controller implementation in `app/`,
which leverages a generic Atari-like 'video terminal' window provided by `antic/`.

`antic/`:

- `palettes.ts` - Various options for converting from Antic to RGB color
- `anticmodel.ts` - models a variable size character display, with vt52-like formatting codes
- `anticview.ts` - maps a display region to HTML

`app/`:

- `app.ts` - the main external entry point, simply instantiates an app controller
- `appctrl.ts` - the app controller which manages game state between setup, order and turn resolution
- `appkeys.ts` - key handlers for the app controller, mapping key presses to controller actions by game state
- `appmodel.ts` - the app display model, which maps the game state into a set of antic windows
- `appview.ts` - the app view, a declarative mapping of the model to HTML with [MithrilJS](https://mithril.js.org/)
- `help.ts` - implements the help popover with some display scrambling for fun
