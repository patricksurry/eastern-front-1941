import {players, UnitKindKey, directions, DirectionKey} from '../engine/defs';
import {ScenarioKey, scenarios} from '../engine/scenarios';
import {UnitMode} from '../engine/unit';
import {Game} from '../engine/game';
import {Thinker} from '../engine/think';

import {AppModel, UIModeKey} from './appmodel';
import {globalHandler, keyModifiers, modeHandlers} from './appkeys';
import {AppView} from './appview';
import {HelpModel} from './help';

const errctr = '\fx\x06\fe\f@\x16^';  // fmt code to clear window from x=6, then center @ $16 = 22, see antic model

class AppCtrl {
    app: AppModel;
    help: HelpModel;
    view: AppView;

    #game!: Game;
    // placeholder to allow AI v AI, human Russian or both human play
    #ai!: Thinker[];

    constructor() {
        this.app = new AppModel();
        this.help = new HelpModel(() => this.app.help = !this.app.help);
        this.view = new AppView(this.app, this.help);

        const token = window.location.hash.slice(1) || undefined;

        if (token) {
            this.game = new Game(token);
            this.setMode(UIModeKey.orders);
            this.app.help = false;
        } else {
            this.setMode(UIModeKey.setup);
        }

        this.help.paint();

        document.addEventListener('keydown', (e) => this.keyHandler(e));
    }
    get game() { return this.#game; }
    set game(g: Game) {
        this.#game = g;
        this.app.game = g;

        //TODO need to kill/stop old ones?
        this.#ai = Object.keys(players)
            .filter(player => +player != this.#game.human)
            .map(player => new Thinker(this.#game, +player));

        // scroll the map to the center of mass of the human player's
        const p = this.game.oob.centerOfGravity(this.game.human),
        {x, y} = this.game.mapboard.xy(p);
        this.view.pinMapCenter(x + 0.5, y + 0.5);

        this.view.redraw();

        g.on('game', (action) => {
            switch (action) {
                case 'turn':
                case 'over':
                    this.app.paintMap();
                    this.app.paintUnits();
                    if (this.app.uimode == UIModeKey.resolve) this.setMode(UIModeKey.orders);
                    break;
                case 'tick':
                    this.app.paintUnits();
                    break;
                default: {
                    const fail: never = action;
                    throw new Error(`Unhandled game action: ${fail}`)
                }
            }
            this.view.redraw();
        }).on('map', (action, loc) => {
            switch (action) {
                case 'citycontrol':
                    if (this.app.extras) {
                        const city = this.game.mapboard.cities[loc.cityid as number],
                            playerName = players[city.owner].label.toUpperCase() + 'S',
                            cityName = city.label.toUpperCase();
                        this.app.infoWindow.puts(`\fh\f^${playerName} CAPTURE ${cityName}!`)
                        this.app.paintMap();
                    }
                    break;
                default: {
                    const fail: never = action;
                    throw new Error(`Unhandled map action: ${fail}`)
                }
            }
        }).on('unit', (action, u) => {
            if (action == 'orders') {
                this.app.paintUnit(u);
                // update game state if human modified orders
                if (u.human) window.location.hash = g.token;
            } else if (action == 'exit' && this.app.extras) {
                this.app.infoWindow.puts(`\fh\f^${u.label}\nELIMINATED!`)
            }
            // the rest of the actions happen during turn processing, which we pick up via game.tick
        }).on('message', (_, message) => {
            this.app.errorWindow.puts(`${errctr}${message}`)
        })
    }
    keyHandler(event: KeyboardEvent) {
        const modifiers = keyModifiers(event);
        let handled = globalHandler(event.key, modifiers, this);
        if (!handled) {
            handled = modeHandlers[this.app.uimode](event.key, modifiers, this);
        }
        if (handled) {
            if (this.app.uimode == UIModeKey.orders && !this.app.errorWindow.dirty) {
                // in orders mode, clear error past score if nothing else wrote to the err window
                this.app.errorWindow.puts(errctr);
            }
            this.view.redraw();
            event.preventDefault();     // eat event if handled
        }
    }
    setMode(m: UIModeKey) {
        this.app.uimode = m;
        switch (m) {
            case UIModeKey.setup:
                this.app.dateWindow.puts('\fh\n\f^EASTERN FRONT 1941');
                this.app.infoWindow.puts('\fh\f^COPYRIGHT 1982 ATARI\nALL RIGHTS RESERVED')
                this.setScenario(ScenarioKey.learner);
                break;
            case UIModeKey.orders: {
                // save the new game state
                window.location.hash = this.#game.token;
                // start thinking...
                this.#ai.forEach(t => t.thinkRecurring(250));

                const date = this.#game.date.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
                this.app.dateWindow.puts(`\fh\n\f^${date}`);
                this.app.infoWindow.cls();
                this.app.errorWindow.puts(`\fh\f@\x05>${this.#game.score(this.#game.human)}`);
                if (this.game.over) {
                    const g = this.#game,
                        advice = g.score(g.human) >= scenarios[g.scenario].scoring.win
                            ? 'ADVANCE TO NEXT LEVEL'
                            : 'TRY AGAIN';
                    this.app.infoWindow.puts(`\fh\f^GAME OVER\n${advice}`)
                    this.app.errorWindow.puts(`${errctr}PRESS \f#ENTER\f- TO CONTINUE`)
                } else {
                    this.app.errorWindow.puts(`${errctr}PLEASE ENTER YOUR ORDERS NOW`);
                }
                break;
            }
            case UIModeKey.resolve: {
                // finalize AI orders
                this.#ai.forEach(t => t.finalize());

                this.app.focusOff();
                this.app.infoWindow.cls()
                this.app.errorWindow.puts(`${errctr}EXECUTING MOVE`);
                console.log(`Executing turn ${this.#game.turn} from state ${this.#game.token}`);
                this.#game.resolveTurn(100);
                break;
            }
        }
    }
    setScenario(scenario?: ScenarioKey, inc?: number) {
        inc ??= 0;
        const n = Object.keys(scenarios).length;

        if (scenario == null) {
            scenario = (this.#game.scenario + inc + n) % n;
        }
        this.game = new Game(scenario);
        const label = scenarios[this.#game.scenario].label.padEnd(8, ' ');
        this.app.errorWindow.puts(`\fh\f^\f#<\f- ${label} \f#>\f-    \f#ENTER\f- TO START`);
    }
    editUnitMode(mode: UnitMode | null) {
        const u = this.app.focussed();
        if (!u) return;
        if (mode == null) u.nextmode();
        else u.mode = mode;
        this.app.focusOn(u);    // redraw reach
    }
    editOrders(dir: DirectionKey | null | -1) {
        // dir => add step, -1 => remove step, null => clear or unfocus
        const u = this.app.focussed();
        if (!u) return;
        if (!u.human) {
            this.app.errorWindow.puts(`${errctr}THAT IS A ${players[u.player].label.toUpperCase()} UNIT!`)
            return;
        }

        if (dir == null) {
            if (u.orders.length == 0) {
                this.app.focusOff();
                return;
            }
            u.resetOrders();
        } else if (u.kind == UnitKindKey.air && u.mode == UnitMode.assault) {
            if (!(dir in directions)) {
                u.resetOrders();
            }
            else {
                // air support towards next unit in given direction
                u.setOrdersSupportingFriendlyFurther(dir);
            }
        } else if (dir == -1) {
             u.delOrder();
        } else {
            u.addOrder(dir);
        }
    }
}

export {AppCtrl};