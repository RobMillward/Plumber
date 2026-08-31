# Plumber

A browser-based, Donkey Kong-style platformer built with React + TypeScript + Redux Toolkit
## About the game

Mario climbs a zigzag of sloped girders toward the top of the level. The current build implements:

- **Movement** — walking left/right with step-up tolerance onto adjacent girders, and jumping (with a fixed jump arc) that can land back on a girder mid-flight.
- **Ladders** — climbing up/down between girder rows, including dead-end ladders that stop Mario at their edge and ladders that connect through to a girder just beyond their nominal bounds.
- **Hammer power-up** — walking (or jumping) into a hammer picks it up, swings it for a limited time, then auto-drops it; carrying a hammer disables jumping and climbing, matching the original game's rules.

All movement/collision/state logic lives in [`useMarioPhysics`](src/components/Mario/useMarioPhysics.ts), a fixed-timestep physics hook, with collision detection split out per obstacle type (`girderCollision.ts`, `ladderCollision.ts`, `hammerCollisions.ts`). Level layout (girder rows, ladders, hammer placements) is defined in [`src/consts/levels.ts`](src/consts/levels.ts).

ClaudeCode used to implement ladder climbing logic, pre-loading of assets, as well as being used for refactoring and clean-up tasks

### Controls

| Key | Action |
| --- | --- |
| `←` / `→` | Walk |
| `↑` / `↓` | Climb a ladder (while overlapping one) |
| `Space` | Jump |
| `H` | Pick up / drop a hammer manually |

## Tech stack

- [React 19](https://react.dev/) with the React Compiler
- TypeScript
- [Redux Toolkit](https://redux-toolkit.js.org/) + React Redux for app state
- [Vite](https://vite.dev/) for dev/build tooling
- [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/react) for testing

## Getting started

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # type-check and build for production
npm run preview   # preview a production build locally
npm test          # run the Jest test suite
npm run lint      # lint the project
```
