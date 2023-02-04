# TODO

Tracks current outstanding issues, ideas for improvements, etc.

## Current issues

- engine
  - [ ] initial turn supply check (tho units should be in supply anyway, or adjust initial oob?)

- Cartridge AI changes
  - [ ] code browse, diff to APX
  - [ ] mvmode choice
  - [ ] other changes?

## Triage

- [ ] ? unit defending at last tick flash not cleared?
- [ ] (possibly fixed; also now maelstrom sanity tests) 8th inf in the south accepted but stopped processing/following orders?  id=8. could it be blocked by a dead unit somehow?  sadly works on resume :(
  [game](http://localhost:3000/#EF4123J7PPcdU5ls-txzsMVOjBM_-t-rshjVx_r6q1COOWLN3TdbSNBEyYL3cpfFnnClqfdQqm5BvbzoSm9ZBBuOSlCXn7iuWZ1J6cMD7OrnbLQIMDq0OWHDXXBon4viebb97fX07neHQLNr16YBvWZZOLCfbcuYXCrGBNcUo56orxB3JSi43dyd7kCy_erpvV_xrU-1Hm)

## Future

- config
  - [ ] AI thinking interval
  - [ ] wire up more of the hard-coded options
  - [ ] option for auto-entrench if no orders?

- engine
  - [ ] don't update tree color in-place in terrain data

- UX
  - [ ] show +cadj in hover text including current air support
  - [ ] attack flash could also jitter toward target
  - [ ] display status window '*' indicator for movable reinforcements
  - [ ] optionally allow >8 orders via UI (already supported by engine; presumably was just to reduce memory to 8 x 2 bits = 2 bytes per unit?)
  - [ ] n/p vs </> could skip units that already have orders?
  - [ ] animate scroll of unit status report eg. elimination, in info window
  - [ ] option to show friendly/enemy ZoC like reach?
  - [ ] toggle key for handicap - increase muster strength of all your units by 50% but halve score,
  self-modifies VBI to change color of text window.  replaced by cartridge difficulty level
  - [ ] add battle sound, e.g. [machine gun](https://archive.org/details/MachineGunSoundEffects/Machine%2BGun%2B4.mp3)

- AI
  - [ ] have think() track a current unit and bail out once it uses a certain amount of time,
    rather than doing a whole pass at once
  - [ ] path finding gets blocked by static militia eg. Kiev, consider impassable for planning?  prob also poor near ZoC.  allow an optional costadj: loc => adj so we could penalize map locations like units +255 or +2/4 for zoc/enemy
  - [ ] evalLocation could try isOccupied = p => ghosts[p.id] || !p.valid || p.terrain == Terrain.impassable
    could also measure nbval with path-finder vs manhattan (general point)
  - [ ] try linePoints with only adj column penalties, distinguish impassable vs unit?
