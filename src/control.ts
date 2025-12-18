import { deadband, newPress } from './util.ts';
import type { TankDriveRobot } from './tankDriveRobot.ts';
import type { Field } from './field.ts';
import type { Path } from './drive/trajectory.ts';
import type { mecanumDriveRobot } from './mecnumRobot.ts';
import { settings } from './globals.ts';

let gamepadIdx: number | null = null;

window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
    gamepadIdx = e.gamepad.index;
});

window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
    if (gamepadIdx === e.gamepad.index) {
        gamepadIdx = null;
    }
});

function getGamepad(): Gamepad | null {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gamepads) return null;

    if (gamepadIdx != null && gamepads[gamepadIdx]) {
        return gamepads[gamepadIdx]!;
    }

    return null;
}

export const keysPressed = Object.create(null);
export const keysHandled = Object.create(null);

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
    keysHandled[event.key] = false;
});

const DEADZONE = 0.15;

// let idx = 0;
// export function slider(robot: TankDriveRobot, path: Path) {
//     if (idx >= path.trajectory.length) return;

//     const pose = path.trajectory[idx];
//     // robot.setPose(pose.x, pose.y, pose.angle)
//     if (keysPressed['n']) idx-=2;
//     if (keysPressed['m']) idx+=2;
// }

export function menuButtons(robot: TankDriveRobot | mecanumDriveRobot) {
    let accel = 0;
    let decel = 0;
    let velo = 0

    if (newPress('1'))  {
        keysHandled['1'] = true;
        velo = -1;
    }
    if (newPress('2')) {
        keysHandled['2'] = true;
        velo = 1;  
    } 
    if (newPress('3'))  {
        keysHandled['3'] = true;
        accel = -1;
    }
    if (newPress('4')) {
        keysHandled['4'] = true;
        accel = 1;  
    } 
    if (newPress('5'))  {
        keysHandled['5'] = true;
        decel = -1;
    }
    if (newPress('6')) {
        keysHandled['6'] = true;
        decel = 1;  
    } 

    if (newPress('h')) {
        keysHandled['h'] = true;
        robot.odomData = !robot.odomData; 
    }
    
    if (newPress('r')) {
        keysHandled['r'] = true;
        settings.useTankDrive = !settings.useTankDrive;
    } 

    robot.maxDecel += decel;
    robot.maxSpeed += velo;
    robot.maxAccel += accel;
}

let fieldIdx = 0;

export function fieldControl(fields: Field[]) {
    if (newPress('f')) {
        keysHandled['f'] = true;
        fieldIdx++;
        if (fieldIdx >= fields.length) {
            fieldIdx = 0;
        }
    }
    fields[fieldIdx].render();
    return fields[fieldIdx];
}

export function controlGamePadTank(gamepad: Gamepad, robot: TankDriveRobot, field: Field, dt: number) {
    const axes = gamepad.axes;

    const throttle = deadband(-axes[1], DEADZONE);
    const turn = deadband(axes[2], DEADZONE);

    robot.tankDrive(throttle + turn, throttle - turn, field, dt);
}

export function controlGamePadMecnum(gamepad: Gamepad, robot: mecanumDriveRobot, field: Field, dt: number) {
    const axes = gamepad.axes;

  const throttle = deadband(-axes[1], DEADZONE);
  const strafe = deadband( -axes[0], DEADZONE);
  const turn = deadband( -axes[2], DEADZONE);

    let fl = throttle + strafe + turn;
    let fr = throttle - strafe - turn;
    let rl = throttle - strafe + turn;
    let rr = throttle + strafe - turn;

    robot.mecanumDrive(fl, fr, rl, rr, field, dt);
}

export function splitArcadeTank(robot: TankDriveRobot, field: Field, dt: number) {
    const gp = getGamepad();
    if (gp) { return controlGamePadTank(gp, robot, field, dt); }
    let throttle = 0;
    let turn = 0;

    if (keysPressed['w']) throttle += 1;
    if (keysPressed['s']) throttle -= 1;
    if (keysPressed['d']) turn += .5;
    if (keysPressed['a']) turn -= .5;

    const leftCmd = throttle + turn;
    const rightCmd = throttle - turn;

    robot.tankDrive(leftCmd, rightCmd, field, dt);
}

export function splitArcadeMecnum(robot: mecanumDriveRobot, field: Field, dt: number) {
    const gp = getGamepad();
    if (gp) { return controlGamePadMecnum(gp, robot, field, dt); }
    let throttle = 0;
    let turn = 0;
    let strafe = 0;

    if (keysPressed['w']) throttle += 1;
    if (keysPressed['s']) throttle -= 1;
    if (keysPressed['d']) turn -= .5;
    if (keysPressed['a']) turn += .5;
    if (keysPressed['ArrowLeft']) strafe += .5
    if (keysPressed['ArrowRight']) strafe -= .5

    const flCmd = throttle + turn + strafe;
    const frCmd = throttle - turn - strafe;
    const rlCmd = throttle + turn - strafe;
    const rrCmd = throttle - turn + strafe;

    robot.mecanumDrive(flCmd, frCmd, rlCmd, rrCmd, field, dt);
}