import { keysHandled, keysPressed } from './control.ts';
import type { Rectangle } from './field.ts';
import { scale, canvasWidth_px, kPX, fieldWidth_in } from './globals.ts';

export function to_px(inches: number) { return inches / ((canvasWidth_px / scale) / (fieldWidth_in * scale)) * kPX; }
export function to_pxx(inches: number) { return to_px(inches + 72); }
export function to_pxy(inches: number) { return to_px(72 - inches); }
export function to_inertial_rad(deg: number) { return ((deg - 90) * (Math.PI / 180)); }
export function to_rad(deg: number) { return deg * Math.PI / 180; }
export function to_deg(rad: number) { return (rad * 180 / Math.PI); }
export function to_in(px: number) { return px * ((canvasWidth_px / scale) / (fieldWidth_in * scale)) / kPX; }
export function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
export function reduce_0_360(angle: number) { return ((angle % 360) + 360) % 360; }

export function deadband(input: number, width: number){
    if (Math.abs(input) < width) { return 0; }
    return input;
}

export function loadImage(src: string) {
    var img = new Image();
    img.src = src;
    return img;
}

export function newPress(key: string) {
    return keysPressed[key] && !keysHandled[key];
}

export function RectangleRectangleCollision(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(
        rect1.x + rect1.w  <= rect2.x ||
        rect2.x + rect2.w  <= rect1.x ||
        rect1.y + rect1.h <= rect2.y ||
        rect2.y + rect2.h <= rect1.y 
    );
}