import {players, UnitKindKey, directions, DirectionKey} from './defs';
import {UnitMode} from './unit';
import {AppModel, UIModeKey} from './appmodel';
import {globalHandler, modeHandlers} from './appkeys';
import {ScenarioKey, scenarios} from './scenarios';
import {Game} from './game';
import {Thinker} from './think';
import {HelpModel} from './help';
import {AppView} from './appview';

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
        this.view = new AppView({app: this.app, help: this.help});

        this.app.dateWindow.puts('\fh\n\f^EASTERN FRONT 1941');
        this.app.infoWindow.puts('\fh\f^COPYRIGHT 1982 ATARI\nALL RIGHTS RESERVED')

        const token = window.location.hash.slice(1) || undefined;

        if (token) {
            this.setGame(new Game(token));
            this.setMode(UIModeKey.orders);
            this.app.help = false;
        } else {
            this.setScenario(ScenarioKey.learner);
            this.setMode(UIModeKey.setup);
        }

        this.help.paint();

        document.addEventListener('keydown', (e) => this.keyHandler(e));
    }
    setGame(game: Game) {
        this.#game = game;
        this.app.setGame(game);

        this.view.redraw();

        //TODO kill old ones?
        this.#ai = Object.keys(players)
            .filter(player => +player != this.#game.human)
            .map(player => new Thinker(this.#game, +player));

        game.on('game', (action) => {
            switch (action) {
                case 'end': {
                    const advice =
                        game.score(game.human) >= scenarios[game.scenario].win
                        ? 'ADVANCE TO NEXT LEVEL'
                        : 'TRY AGAIN';
                    this.app.infoWindow.puts(`\fz\x06\x00\fe\f^GAME OVER\n${advice}`)
                    //TODO clear executing move but leave score, &  doesn't show < > ENTER stuff
                    this.setMode(UIModeKey.setup);
                    break;
                }
                case 'turn':
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
        }).on('map', (action) => {
            switch (action) {
                case 'citycontrol':
                    this.app.paintMap();
                    break;
                default: {
                    const fail: never = action;
                    throw new Error(`Unhandled map action: ${fail}`)
                }
            }
        }).on('unit', (action, u) => {
            if (action == 'orders') {
                this.app.paintUnit(u);
                // save game state
                if (u.human) window.location.hash = game.token;
            } else if (action == 'exit' && this.app.extras) {
                this.app.infoWindow.puts(`\fz\x06\x00\fe\f^${u.label}\nELIMINATED!`)
            }
            // the rest of the actions happen during turn processing, which we pick up via game.tick
        }).on('message', (_, message) => {
            this.app.errorWindow.puts(`\fh\f^${message}`)
        })
    }
    keyHandler(event: KeyboardEvent) {
        let handled = globalHandler(event.key, this);
        if (!handled) {
            handled = modeHandlers[this.app.uimode](event.key, this);
        }
        if (handled) {
            if (this.app.uimode == UIModeKey.orders && !this.app.errorWindow.dirty) {
                // in orders mode, clear error if nothing else wrote to the err window
                this.app.errorWindow.cls();
            }
            this.view.redraw();
            event.preventDefault();     // eat event if handled
        }
    }
    setMode(m: UIModeKey) {
        this.app.uimode = m;
        switch (m) {
            case UIModeKey.setup:
                break;
            case UIModeKey.orders: {
                // save game state
                window.location.hash = this.#game.token;
                // start thinking...
                this.#ai.forEach(t => t.thinkRecurring(250));

                const date = this.#game.date.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
                this.app.dateWindow.puts(`\fh\n\f^${date}`);
                this.app.infoWindow.puts(`\fh\f@\x04>${this.#game.score(this.#game.human)}`);
                this.app.errorWindow.puts('\fh\f^PLEASE ENTER YOUR ORDERS NOW');
                break;
            }
            case UIModeKey.resolve: {
                // finalize AI orders
                this.#ai.forEach(t => t.finalize());

                this.app.focusOff();
                this.app.infoWindow.cls()
                this.app.errorWindow.puts('\fh\f^EXECUTING MOVE');
                this.#game.nextTurn(250);
                break;
            }
        }
    }
    setScenario(scenario: ScenarioKey | null, inc?: number) {
        inc ??= 0;
        const n = Object.keys(scenarios).length;

        if (scenario == null) {
            scenario = (this.#game.scenario + inc + n) % n;
        }
        this.setGame(new Game(scenario));

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
            this.app.errorWindow.puts(`\fh\f^THAT IS A ${players[u.player].label.toUpperCase()} UNIT!`)
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