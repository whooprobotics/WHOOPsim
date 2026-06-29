# WHOOPsim

2D VEX drivetrain simulator.

## Run it locally

You need [Node.js](https://nodejs.org) (18+).

```bash
npm install      # install dependencies (do this once)
npm run dev      # start the dev server with hot reload
```

Then open the URL Vite prints:

```
http://localhost:5173/WHOOPsim/
```

## Build & deploy

```bash
npm run build
npm run deploy
```

## Controls

| Key | Action |
| --- | --- |
| `W` / `S` | Throttle (forward / back) |
| `A` / `D` | Turn (tank) / Strafe (mecanum) |
| `←` / `→` | Strafe (tank) / Turn (mecanum) |
| `1` / `2` | Decrease / increase max velocity |
| `3` / `4` | Decrease / increase lateral time constant |
| `5` / `6` | Decrease / increase angular time constant |
| `R` | Toggle tank / mecanum drive |
| `F` | Cycle field background |
| `H` | Toggle telemetry overlay |

VEX controller is also supported (left stick = throttle/strafe, right stick = turn).

## Project layout

| File | Responsibility |
| --- | --- |
| `src/main.ts` | Entry point: constructs the robot, owns the render/update loop |
| `src/robot.ts` | The `Robot` class — physics, odometry, and canvas rendering |
| `src/control.ts` | Keyboard/controller input → drive commands; menu keybinds |
| `src/field.ts` | Field background image + (optional) obstacle rectangles |
| `src/globals.ts` | Canvas, drawing context, scale constants, shared settings |
| `src/util.ts` | Math + coordinate helpers (inches ↔ pixels, deg ↔ rad, etc.) |

## Coordinate conventions

- Origin is the **center of the field**; units are **inches**, range roughly `-72..72`.
- `+X` is right, `+Y` is up (toward the top of the screen).
- Heading is in **degrees**, `0` = facing `+Y` (up), increasing **clockwise**
  (so forward = `(sin θ, cos θ)`).
- `dt` passed into drive methods is in **seconds** (~`1/60` per frame).
- `Robot.maxSpeed` is in **ft/s**; internal velocities are converted to **in/s** (`× 12`).
