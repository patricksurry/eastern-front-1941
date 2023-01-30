# Eastern Front 1941

<!-- markdownlint-disable MD033 -->

This is a [playable][game] TypeScript port of [Chris Crawford][ccwiki]'s [Eastern Front 1941][efwiki].
How quickly can you capture Moscow?  More importantly, how long can you hold it?

[game]: https://patricksurry.github.io/eastern-front-1941/
[ccwiki]: https://en.wikipedia.org/wiki/Chris_Crawford_(game_designer)
[efwiki]: https://en.wikipedia.org/wiki/Eastern_Front_(1941)

**TL;DR:** Click [here][game], choose a level of difficulty,
then issue orders to German units using the arrow keys.
An AI player will command the Russian units.
When you're ready press `End` (`Fn`+<code>&rarr;</code> on Mac) to see how each turn plays out.
For a more old-school experience, press `X` to disable extras.
Tap `?` for help and check out the original [APX manual](doc/playing.md)
and [cartridge insert](doc/Eastern_Front_1941_Atari_Cartridge.pdf)
for more detailed instructions.

[![game](doc/images/preview.png)][game]

Eastern Front 1941 is a two player turn-based simultaneous movement simulation
of the German invasion of Russia in 1941.
It introduced many novel features including an AI opponent;
multiple difficulty levels;
terrain, weather, zone of control and supply effects;
multiple unit types and movement modes including air support;
fog of war; and an innovative combat system.
The game was first released in 1981 on the [Atari Program Exchange][apx].
It became a killer app for the Atari 8-bit computer family
when it was widely released on cartridge in 1982, 41 years
after the events of 1941 that it simulates.
A further 41 years on, 2023 seems fitting for a redux.

[apx]: https://en.wikipedia.org/wiki/Atari_Program_Exchange

This port was written from scratch in TypeScript referencing disassembled binaries
of both the original Atari Program eXchange (APX) version as well as the later cartridge release,
along with Crawford's [APX notes](doc/howitworks.md).
The redux runs as a single-page, fully client-side app
with game state stored in the URL making it easy to save, resume, and share games.
For more details see the [implementation notes](doc/notes.md).

The game's subject matter offers disturbing echoes and distorted reflections of Putin's recent unprovoked invasion of Ukraine which is being fought over significant areas of the same battlefield.  So why revisit it? As Churchill (paraphrasing Santayana) said:

> "Those who fail to learn from history are condemned to repeat it."

This work is offereed as a learning resource in the same spirit as Crawford's original APX release.
If you enjoy the game (or not!) please consider donating to an organization like
[World Central Kitchen <img height=32 src="doc/images/WCK_Primary_Logo.png">][wck]
to support those most impacted by the conflict in Ukraine and by other humanitarian crises worldwide.

[wck]: https://wck.org/donate

<!-- markdownlint-disable-next-line MD026 -->
## But why?!

First and foremost Eastern Front 1941 is a great game!
This project started as a pandemic diversion
after chancing on an article about Atari's 50th anniversary.
I tumbled into a memory rabbit hole
and discovered that Chris Crawford had published much of his early [source code][ccsrc],
including the [6502 assembler][6502] code for Eastern Front.
The game had fascinated me as a kid: I remember hanging out after school
with a friend who had an [Atari 400][atari400] (or maybe 800?)
to say nothing of an original [Pong][pong] pub table :exploding_head:...
We played games like Pitfall, Missile Command, Defender and a rogue-like adventure game whose name I forget.
But Eastern Front was always my "Can we play...?" go-to.
It was a compelling game in itself with a mysterious AI opponent,
and was probably my first introduction to wargaming.
So of course I couldn't resist taking it apart!
My goals were to understand [how it worked](doc/howitworks.md),
recreate the essence of the game in a streamlined form,
and make it more accessible for others to explore and extend.

[ccsrc]: http://www.erasmatazz.com/library/source-code/index.html
[6502]: https://en.wikibooks.org/wiki/6502_Assembly
[pong]: https://en.wikipedia.org/wiki/Pong
[atari400]: https://en.wikipedia.org/wiki/Atari_8-bit_family

Along the way I had fun unravelling Crawford's code,
with happy memories of hacking 6502 assembly on an [Apple //e][apple2e]
back in the day.
(Apparently I'm no better at keeping carry flag semantics straight.)
I also learned a bunch of other things including
[TypeScript][typescript], [Mithril][mithril] and [Jest][jest].
But more than anything I gained a whole new appreciation
for Crawford's technical tour-de-force:
implementing an interactive wargame with a credible AI in only 12K bytes
*including* all data and graphics.
It shipped on a 16K cartridge with 4K to spare!

[apple2e]: https://en.wikipedia.org/wiki/Apple_IIe
[typescript]: https://www.typescriptlang.org/
[mithril]: https://mithril.js.org/
[jest]: https://jestjs.io/

Eastern Front still has a lot to teach us about early video game development, game design,
and AI play, and of course lessons from the history itself.
Crawford's own [narrative history](doc/howitworks.md#narrative-history)
of the game's development is well worth a read.
As he says in his preface to the [APX source notes](doc/howitworks.md):

> "My hope is that people will study these materials to become better programmers [...]"

And later in the [cartrige insert](doc/Eastern_Front_1941_Atari_Cartridge.pdf):

> "There was really no way to win this war.  The \[Expert\] point system ... reflects these brutal truths. ... In other words, you'll almost always lose.  Does that seem unfair to you?  Unjust?  Stupid?  Do you feel that nobody would ever want to play a game \[they\] cannot possibly win?  If so, then you have learned the ultimate lesson of war on the Eastern Front."

So in that spirit, this re-implementation tries to capture the essence of the
game&mdash;reusing the same raw data, fonts, display style and color scheme&mdash;without
slavishly recreating every pixel of the original.
You can play the [original ROM](reference/cartridge.rom) on an emulator like [AtariMac][atarimac]
but honestly the gameplay now feels painful.
Crawford explicitly designed for play with only a joystick
whereas I wanted a more efficient keyboard-driven experience.
At the same time I wanted to make the game's data and logic
more approachable and easier to modify.
For example data structures like the order-of-battle are still lists
accessed by index, but are now wrapped as simple objects
to attach meaningful names and methods to the content.
Similarly most magic constants have become named enumerations.
Heck, my laptop has sixteen million times the memory of an Atari 400
and perhaps ten thousand times the CPU power
so we can afford to be a little more verbose...

[atarimac]: https://www.atarimac.com/atari800macx.php

I aimed to keep the game engine completely separate from the display layer
so that it can run "headless".
This is great for unit testing but also makes it
easy to experiment with AI development and meta-learning of new strategies.
The human player is also parameterized
so AI vs AI play or playing as the Russians is possible,
although the current AI does not play the Germans well
(see [`examples/`](examples)).
Check out the [implementation notes](doc/notes.md)
for more details of how the new code is structured,
changes I introduced from the original,
and a collection of (IMHO) interesting discoveries.

I've inevitably introduced errors and misinterpretations during the re-platforming.
Please share any feedback, suggestions and bug reports.
The most useful bug reports will include the current game state
(just copy and paste the game's current URL), and if possible prior states which
you'll find logged in your browser's javascript console.

Enjoy!

## What's what?

Here's a quick lay of of the land for navigating the repo:

- `README.md` - you are here
- `index.html` - the minimal HTML container for the game
- [`doc/`](doc) - how to play, how it works, implementation notes, and other useful resources
- [`dist/`](dist) - a bundled node module for headless game play
- [`examples/`](examples) - examples of headless game play like AI v AI
- [`reference/`](reference) - binaries and annotated disassembly for the original game
- [`src/`](src) - the TypeScript source and unit tests that implement the game
- [`scripts/`](scripts) - various scripts to extract data from the original binary images
- [`static/`](static) - the bundled javascript implementing the game, along with the font map images
- `package*json`, `tsconfig.json`, `rollup.config.js`, `jest.config.ts` - various build configuration files
