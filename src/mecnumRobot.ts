import { to_px, to_pxx, to_pxy, to_inertial_rad, clamp, to_rad, to_deg, reduce_0_360 } from './util.ts';
import { ctx } from './globals.ts';
import type { Field } from './field.ts';
import type { Path } from './drive/trajectory.ts';

export class mecanumDriveRobot {
    public width: number;
    public height: number;
    public maxSpeed: number;
    public trackWidth: number;
    public wheelBase: number;

    private x: number = 0; 
    private y: number = 0;
    private angle: number = 0;
    private color: string;
    private pathTime: number = 0;
    public odomData: boolean = true;

    private vFL = 0;
    private vFR = 0;
    private vRL = 0;
    private vRR = 0;
    public maxAccel: number;
    public maxDecel: number;

    constructor(startX: number, startY: number, startAngle: number, width: number, height: number, maxSpeed: number, trackWidth: number, wheelBase: number, maxAccel: number, maxDeccel: number) {
        this.x = startX;
        this.y = startY;
        this.angle = startAngle;
        this.width = width;
        this.height = height;
        this.maxSpeed = maxSpeed;
        this.trackWidth = trackWidth;
        this.wheelBase = wheelBase
        this.maxAccel = maxAccel;
        this.maxDecel = maxDeccel;
        this.color = '#1d6408d7';
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

    private moveTowards(current: number, target: number, dt: number): number {
        const diff = target - current;

        let isAccel = Math.abs(target) > Math.abs(current);
        let maxDelta = (isAccel ? this.maxAccel : this.maxDecel) * dt;

        if (Math.abs(diff) <= maxDelta) return target;
        return current + Math.sign(diff) * maxDelta;
    }

    mecanumDrive(flCmd: number, frCmd: number, rlCmd: number, rrCmd: number, field: Field, dt: number) {
        const fl = clamp(flCmd, -1, 1);
        const fr = clamp(frCmd, -1, 1);
        const rl = clamp(rlCmd, -1, 1);
        const rr = clamp(rrCmd, -1, 1);

        const tFL = fl * this.maxSpeed;
        const tFR = fr * this.maxSpeed;
        const tRL = rl * this.maxSpeed;
        const tRR = rr * this.maxSpeed;

        this.vFL = this.moveTowards(this.vFL, tFL, dt);
        this.vFR = this.moveTowards(this.vFR, tFR, dt);
        this.vRL = this.moveTowards(this.vRL, tRL, dt);
        this.vRR = this.moveTowards(this.vRR, tRR, dt);

        const FL = this.vFL * 12;
        const FR = this.vFR * 12;
        const RL = this.vRL * 12;
        const RR = this.vRR * 12;


        const vFwd   = (FL + FR + RL + RR) / 4;
        const vRight = (-FL + FR + RL - RR) / 4;

        const rx = this.wheelBase / 2;
        const ry = this.trackWidth / 2;
        const r = rx + ry;

        const omega = (-FL + FR - RL + RR) / (4 * r);

        const θ = to_rad(this.get_angle());

        const forwardX = Math.sin(θ);
        const forwardY = Math.cos(θ);
        const rightX   = Math.cos(θ);
        const rightY   = -Math.sin(θ);

        const vx = vFwd * forwardX + vRight * rightX; // in/s
        const vy = vFwd * forwardY + vRight * rightY; // in/s

        const bbox = (x: number, y: number) => ({
            x: to_pxx(x - this.width / 2),
            y: to_pxy(y + this.height / 2),
            w: to_px(this.width),
            h: to_px(this.height)
        });

        let xNew = this.get_x();
        let yNew = this.get_y();

        const xCand = this.get_x() + vx * dt;
        const yCand = this.get_y() + vy * dt;

        if (!field.collision(bbox(xCand, yCand))) {
            xNew = xCand;
            yNew = yCand;
        } else {
            if (!field.collision(bbox(xCand, this.get_y()))) xNew = xCand;
            if (!field.collision(bbox(this.get_x(), yCand))) yNew = yCand;
        }

        const θNew = θ + omega * dt;
        this.set_x(xNew);
        this.set_y(yNew);
        this.set_angle(reduce_0_360(to_deg(θNew)));
    }

    public setPose(x: number, y: number, angle: number) {
        this.x = x;
        this.y = y;
        this.angle = angle;
    }

    public pathFollow(path: Path, dt: number) {
        if (!path.trajectory.length) return;

        this.pathTime += dt;
        if (this.pathTime > path.totalTime) {
            this.pathTime = path.totalTime;
        }

        const normalized = this.pathTime / path.totalTime;
        const idx = Math.floor(normalized * (path.trajectory.length - 1));
        const snap = path.trajectory[idx];

        this.set_x(snap.x);
        this.set_y(snap.y);
        this.set_angle(snap.angle);
    }

    private draw_odom_data() {
        if (!this.odomData) return;
        ctx.save();
        ctx.font = '20px Calibri';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.fillText(`θ: ${this.get_angle().toFixed(2)}`, 20, 20);
        ctx.fillText(`X: ${this.get_x().toFixed(2)}`, 20, 45);
        ctx.fillText(`Y: ${this.get_y().toFixed(2)}`, 20, 70);

        ctx.fillText(`FL: ${(this.vFL).toFixed(2)}`, 20, 95);
        ctx.fillText(`FR: ${(this.vFR).toFixed(2)}`, 20, 120);
        ctx.fillText(`RL: ${(this.vRL).toFixed(2)}`, 20, 145);
        ctx.fillText(`RR: ${(this.vRR).toFixed(2)}`, 20, 170);
        ctx.fillText(`Velo: ${this.maxSpeed.toFixed(2)}`, 20, 170+25);
        ctx.fillText(`Accel: ${this.maxAccel.toFixed(2)}`, 20, 170+50);
        ctx.fillText(`Decel: ${this.maxDecel.toFixed(2)}`, 20, 170+75);
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
