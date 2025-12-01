import { to_px, to_pxx, to_pxy, to_inertial_rad, clamp, to_rad, to_deg, reduce_0_360 } from './util.ts';
import { ctx } from './globals.ts';
import type { Field } from './field.ts';

export class Robot {
    public width: number;
    public height: number;
    public maxSpeed: number;
    public trackWidth: number;

    private x: number = 0; 
    private y: number = 0;
    private angle: number = 0;
    private color: string;
    public odomData: boolean = true;

    private vL: number = 0;
    private vR: number = 0;
    public maxAccel: number;

    constructor(width: number, height: number, maxSpeed: number, trackWidth: number, maxAccel: number) {
        this.width = width;
        this.height = height;
        this.maxSpeed = maxSpeed;
        this.trackWidth = trackWidth;
        this.maxAccel = maxAccel;
        this.color = '#969696ff';
    }

    private set_x(x: number) { 
        this.x = clamp(x, -72 + this.width / 2, 72 - this.width / 2); 
    }

    private set_y(y: number) { 
        this.y = clamp(y, -72 + this.height / 2, 72 - this.height / 2); 
    }

    private set_angle(angle: number) { 
        this.angle = ((angle % 360) + 360) % 360; 
    }

    get_x() { return this.x; }
    get_y() { return this.y; }
    get_angle() { return this.angle; }

    private moveTowards(current: number, target: number, maxDelta: number): number {
        const diff = target - current;
        if (Math.abs(diff) <= maxDelta) return target;
        return current + Math.sign(diff) * maxDelta;
    }

    tankDrive(leftCmd: number, rightCmd: number, field: Field, dt: number) {
        const b_in = this.trackWidth;
        const v_max_ft = this.maxSpeed;

        const left  = clamp(leftCmd,  -1, 1);
        const right = clamp(rightCmd, -1, 1);

        const targetVL_ft = left  * v_max_ft;
        const targetVR_ft = right * v_max_ft;

        const dvMax_ft = this.maxAccel * dt;

        this.vL = this.moveTowards(this.vL, targetVL_ft, dvMax_ft);
        this.vR = this.moveTowards(this.vR, targetVR_ft, dvMax_ft);

        const vL_in = this.vL * 12;
        const vR_in = this.vR * 12;

        let v_in  = (vR_in + vL_in) / 2;        

        const ω = (vL_in - vR_in) / b_in;

        const θdeg = this.get_angle();
        const θ = to_rad(θdeg);

        const forwardX = Math.sin(θ);
        const forwardY = Math.cos(θ);

        const bbox = (x: number, y: number) => ({
            x: to_pxx(x - this.width / 2), 
            y: to_pxy(y + this.height / 2), 
            w: to_px(this.width), 
            h: to_px(this.height)
        });     

        let xNew = this.get_x();
        let yNew = this.get_y();

        let xCand = this.get_x() + v_in * forwardX * dt;
        let yCand = this.get_y() + v_in * forwardY * dt;

        if (!field.collision(bbox(xCand, yCand))) {
            xNew = xCand;
            yNew = yCand;
        } else {
            if (!field.collision(bbox(xCand, this.get_y()))) {
                xNew = xCand;
            }

            if (!field.collision(bbox(this.get_x(), yCand))) {
                yNew = yCand;
            }
        }

        const θNew = θ + ω * dt;
        let θdegNew = to_deg(θNew);
        θdegNew = reduce_0_360(θdegNew);

        this.set_x(xNew);
        this.set_y(yNew);
        this.set_angle(θdegNew);
    }

    private draw_odom_data() {
        ctx.save();
        ctx.font = '20px Calibri';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.fillText(`θ: ${this.get_angle().toFixed(2)}`, 20, 20);
        ctx.fillText(`X: ${this.get_x().toFixed(2)}`, 20, 45);
        ctx.fillText(`Y: ${this.get_y().toFixed(2)}`, 20, 70);

        ctx.fillText(`vL: ${this.vL.toFixed(2)}`, 20, 95);
        ctx.fillText(`vR: ${this.vR.toFixed(2)}`, 20, 120);
        ctx.fillText(`a: ${this.maxAccel.toFixed(2)}`, 20, 145);
        ctx.restore();
    }

    private draw_chassis() {
        ctx.save();

        ctx.translate(to_pxx(this.x), to_pxy(this.y));
        ctx.rotate(to_inertial_rad(this.angle));
        ctx.fillStyle = this.color;
        ctx.fillRect(
            -to_px(this.width) / 2,
            -to_px(this.height) / 2,
            to_px(this.width),
            to_px(this.height)
        );

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(to_px(this.width) / 2, 0);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    render() {
        this.draw_chassis();
        if (this.odomData) this.draw_odom_data();
    }
}
