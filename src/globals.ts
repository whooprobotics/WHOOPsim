export const canvas = document.getElementById('canvas') as HTMLCanvasElement;

export const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

export const scale = 4;
export const canvasWidth_px = 144 * scale;
export const canvasHeight_px = 144 * scale;

canvas.width = canvasWidth_px
canvas.height = canvasHeight_px

export const fieldWidth_in = 1.5
export const fieldHeight_in = 1.5

export const distance_max_range = 78;

export const kPX = 96;

export const settings = {
  useTankDrive: false,
};