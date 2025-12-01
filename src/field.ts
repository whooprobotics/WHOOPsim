import { canvas, ctx } from "./globals";
import { loadImage, RectangleRectangleCollision } from "./util";

export interface Rectangle {
    x: number,
    y: number,
    w: number,
    h: number,
}

export class Field {
    private img: HTMLImageElement;
    private obstacles: Rectangle[];
    
    constructor(src: string, obstacles: Rectangle[] = []) {
        this.img = loadImage(src);
        this.obstacles = obstacles;
    }

    collision(robotBoundingBox: Rectangle): boolean {
        for (const o of this.obstacles) {
            if (RectangleRectangleCollision(o, robotBoundingBox)) {
                return true;
            }
        }

        return false;
    }

    render() {
        ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
        // for (const o of this.obstacles) {
            // ctx.fillRect(o.x, o.y, o.w, o.h);
        // }
    }
}