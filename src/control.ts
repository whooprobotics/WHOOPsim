import { deadband, loadImage, newPress } from './util.ts';
import type { Robot } from './robot.ts';
import type { Field } from './field.ts';

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

export function menuButtons(robot: Robot) {
    let accel = 0;

    if (newPress('q'))  {
        keysHandled['q'] = true;
        accel = -1;
    }
    if (newPress('e')) {
        keysHandled['e'] = true;
        accel = 1;  
    } 
    if (newPress('h')) {
        keysHandled['h'] = true;
        robot.odomData = !robot.odomData; 
    } 

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

export function controlGamePad(gamepad: Gamepad, robot: Robot, field: Field, dt: number) {
    
    const axes = gamepad.axes;

    const throttle = deadband(-axes[1], DEADZONE);
    const turn = deadband(axes[2], DEADZONE);

    robot.tankDrive(throttle + turn, throttle - turn, field, dt);
}

export function splitArcade(robot: Robot, field: Field, dt: number) {
    const gp = getGamepad();
    if (gp) { return controlGamePad(gp, robot, field, dt); }
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