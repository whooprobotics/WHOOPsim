import { deadband, newPress, to_rad } from './util.ts';
import type { Robot } from './robot.ts';
import type { Field } from './field.ts';
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

const TAU_STEP = 0.01;
const TAU_MIN = 0.01;

export function menuButtons(robot: Robot) {
    let velo = 0;
    let latTau = 0;
    let angTau = 0;

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
        latTau = -TAU_STEP;
    }
    if (newPress('4')) {
        keysHandled['4'] = true;
        latTau = TAU_STEP;
    }
    if (newPress('5'))  {
        keysHandled['5'] = true;
        angTau = -TAU_STEP;
    }
    if (newPress('6')) {
        keysHandled['6'] = true;
        angTau = TAU_STEP;
    }

    if (newPress('h')) {
        keysHandled['h'] = true;
        robot.odomData = !robot.odomData;
    }

    if (newPress('r')) {
        keysHandled['r'] = true;
        settings.useTankDrive = !settings.useTankDrive;
    }

    robot.maxSpeed += velo;
    robot.lateralTau = Math.max(TAU_MIN, robot.lateralTau + latTau);
    robot.angularTau = Math.max(TAU_MIN, robot.angularTau + angTau);
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

export function controlGamePadTank(gamepad: Gamepad, robot: Robot, dt: number) {
    const axes = gamepad.axes;

    const throttle = deadband(-axes[1], DEADZONE);
    const turn = deadband(axes[2], DEADZONE);

    robot.tankDrive(throttle + turn, throttle - turn, dt);
}

export function controlGamePadMecnum(gamepad: Gamepad, robot: Robot, dt: number) {
    const axes = gamepad.axes;

  const throttle = deadband(-axes[1], DEADZONE);
  const strafe = deadband( -axes[0], DEADZONE);
  const turn = deadband( -axes[2], DEADZONE);

    let fl = throttle + strafe + turn;
    let fr = throttle - strafe - turn;
    let rl = throttle - strafe + turn;
    let rr = throttle + strafe - turn;

    robot.mecanumDrive(fl, fr, rl, rr, dt);
}

export function splitArcadeTank(robot: Robot, dt: number) {
    const gp = getGamepad();
    if (gp) { return controlGamePadTank(gp, robot, dt); }
    let throttle = 0;
    let turn = 0;

    if (keysPressed['w']) throttle += 1;
    if (keysPressed['s']) throttle -= 1;
    if (keysPressed['d']) turn += .5;
    if (keysPressed['a']) turn -= .5;

    const leftCmd = throttle + turn;
    const rightCmd = throttle - turn;

    robot.tankDrive(leftCmd, rightCmd, dt);
}

export function splitArcadeMecnum(robot: Robot, dt: number) {
    const gp = getGamepad();
    if (gp) { return controlGamePadMecnum(gp, robot, dt); }
    let throttle = 0;
    let turn = 0;
    let strafe = 0;

    if (keysPressed['w']) throttle += 1;
    if (keysPressed['s']) throttle -= 1;
    if (keysPressed['ArrowRight']) turn -= .5;
    if (keysPressed['ArrowLeft']) turn += .5;
    if (keysPressed['a']) strafe += .5
    if (keysPressed['d']) strafe -= .5

    const flCmd = throttle + turn + strafe;
    const frCmd = throttle - turn - strafe;
    const rlCmd = throttle + turn - strafe;
    const rrCmd = throttle - turn + strafe;

    robot.mecanumDrive(flCmd, frCmd, rlCmd, rrCmd, dt);
}

export function controlGamePadMecnumFieldCentric(gamepad: Gamepad, robot: Robot, dt: number) {
    const axes = gamepad.axes;

    const throttle = deadband(-axes[1], DEADZONE);
    const strafe = deadband(-axes[0], DEADZONE);
    const turn = deadband(-axes[2], DEADZONE);

    const angle = robot.get_angle();
    const robotFwd =  throttle * Math.cos(to_rad(angle)) + strafe * Math.sin(to_rad(angle));
    const robotStrafe = -throttle * Math.sin(to_rad(angle)) + strafe * Math.cos(to_rad(angle));

    const fl = robotFwd + turn + robotStrafe;
    const fr = robotFwd - turn - robotStrafe;
    const rl = robotFwd + turn - robotStrafe;
    const rr = robotFwd - turn + robotStrafe;

    robot.mecanumDrive(fl, fr, rl, rr, dt);
}

export function splitArcadeMecnumFieldCentric(robot: Robot, dt: number) {
    const gp = getGamepad();
    if (gp) { return controlGamePadMecnumFieldCentric(gp, robot, dt); }

    let throttle = 0;
    let strafe   = 0;
    let turn     = 0;

    if (keysPressed['w']) throttle += 1;
    if (keysPressed['s']) throttle -= 1;
    if (keysPressed['a']) strafe   -= 1;
    if (keysPressed['d']) strafe   += 1;
    if (keysPressed['ArrowLeft'])  turn -= 1;
    if (keysPressed['ArrowRight']) turn += 1;

    const angle = robot.get_angle();
    const robotFwd =  throttle * Math.cos(to_rad(angle)) + strafe * Math.sin(to_rad(angle));
    const robotStrafe = -throttle * Math.sin(to_rad(angle)) + strafe * Math.cos(to_rad(angle));

    const flCmd = robotFwd + turn + robotStrafe;
    const frCmd = robotFwd - turn - robotStrafe;
    const rlCmd = robotFwd + turn - robotStrafe;
    const rrCmd = robotFwd - turn + robotStrafe;

    robot.mecanumDrive(flCmd, frCmd, rlCmd, rrCmd, dt);
}

export function driveMecnumRobot(robot: Robot, dt: number) {
    splitArcadeMecnumFieldCentric(robot, dt);
}

export function driveTankRobot(robot: Robot, dt: number) {
    splitArcadeTank(robot, dt);
}