import { players, Game, Thinker } from '../dist/ef1941';
// create a game for a specific scenario, with an optional fixed seed
const game = new Game(5 /* ScenarioKey.expert41 */, 12345678), 
// create an AI for each player
ais = Object.keys(players).map(p => new Thinker(game, +p));
while (!game.over) {
    // run several thinking passes for each side
    for (let i = 0; i < 5; i++)
        ais.forEach(ai => ai.think());
    // resolve the turn
    game.resolveTurn();
    console.log(`Turn: ${game.turn} score ${game.score(0 /* PlayerKey.German */)}\n${game.token}`);
}
