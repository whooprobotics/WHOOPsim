import { to_px, to_pxx, to_pxy, to_inertial_rad, clamp, to_rad, to_deg, reduce_0_360 } from './util.ts';
import { ctx } from './globals.ts';

const TANK_COLOR = '#969696c4';
const MECANUM_COLOR = '#1d6408d7';

const LATERAL_FRICTION = 50;

type DriveType = 'tank' | 'mecanum';

export class Robot {
    public width: number;
    public height: number;
    public maxSpeed: number;    // ft/s
    public trackWidth: number;  // inches
    public wheelBase: number;   // inches
    public lateralTau: number;  // first-order lag time constant for linear motion (s)
    public angularTau: number;  // first-order lag time constant for turning (s)
    public odomData: boolean = true;

    private x: number;
    private y: number;
    private angle: number;
    private color: string = TANK_COLOR;
    private driveType: DriveType = 'tank';

    // tank wheel velocities (ft/s)
    private vL: number = 0;
    private vR: number = 0;

    // mecanum wheel velocities (ft/s)
    private vFL: number = 0;
    private vFR: number = 0;
    private vRL: number = 0;
    private vRR: number = 0;

    // world-frame velocity (in/s), retained for lateral-drift modelling
    private velX: number = 0;
    private velY: number = 0;

    constructor(
        x: number,
        y: number,
        angle: number,
        width: number,
        height: number,
        maxSpeed: number,
        trackWidth: number,
        wheelBase: number,
        lateralTau: number,
        angularTau: number,
    ) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.width = width;
        this.height = height;
        this.maxSpeed = maxSpeed;
        this.trackWidth = trackWidth;
        this.wheelBase = wheelBase;
        this.lateralTau = lateralTau;
        this.angularTau = angularTau;
    }

    private set_x(x: number) { this.x = clamp(x, -72 + this.width / 2, 72 - this.width / 2); }
    private set_y(y: number) { this.y = clamp(y, -72 + this.height / 2, 72 - this.height / 2); }
    private set_angle(angle: number) { this.angle = reduce_0_360(angle); }

    get_x() { return this.x; }
    get_y() { return this.y; }
    get_angle() { return this.angle; }
    getPose() { return { x: this.x, y: this.y, angle: this.angle }; }

    setPose(x: number, y: number, angle: number) {
        this.x = x;
        this.y = y;
        this.angle = reduce_0_360(angle);
        this.stop();
    }

    stop() {
        this.vL = this.vR = 0;
        this.vFL = this.vFR = this.vRL = this.vRR = 0;
        this.velX = this.velY = 0;
    }

    private odometryUpdate(
        forward_delta: number,
        sideways_delta: number,
        orientation_delta_rad: number,
        fwd_speed: number,
        lat_speed: number,
    ) {
        const prev_orientation_rad = to_rad(this.angle);
        const orientation_rad = prev_orientation_rad + orientation_delta_rad;
        this.set_angle(to_deg(orientation_rad));

        let local_X_position: number;
        let local_Y_position: number;

        if (Math.abs(orientation_delta_rad) < 1e-7) {
            local_X_position = sideways_delta;
            local_Y_position = forward_delta;
        } else {
            const c = 2 * Math.sin(orientation_delta_rad / 2);
            local_X_position = c * (sideways_delta / orientation_delta_rad);
            local_Y_position = c * (forward_delta / orientation_delta_rad);
        }

        const local_polar_length = Math.sqrt(local_X_position ** 2 + local_Y_position ** 2);
        if (local_polar_length > 0) {
            const global_polar_angle = Math.atan2(local_Y_position, local_X_position) - prev_orientation_rad - (orientation_delta_rad / 2);
            this.set_x(this.x + local_polar_length * Math.cos(global_polar_angle));
            this.set_y(this.y + local_polar_length * Math.sin(global_polar_angle));
        }

        this.velX = fwd_speed * Math.sin(orientation_rad) + lat_speed * Math.cos(orientation_rad);
        this.velY = fwd_speed * Math.cos(orientation_rad) - lat_speed * Math.sin(orientation_rad);
    }

    tankDrive(leftCmd: number, rightCmd: number, dt: number) {
        this.driveType = 'tank';
        this.color = TANK_COLOR;

        const left = clamp(leftCmd, -1, 1);
        const right = clamp(rightCmd, -1, 1);

        const targetVL = left * this.maxSpeed;
        const targetVR = right * this.maxSpeed;

        const targetLinear = (targetVL + targetVR) / 2;
        const targetAngular = (targetVR - targetVL) / 2;
        const currentLinear = (this.vL + this.vR) / 2;
        const currentAngular = (this.vR - this.vL) / 2;

        const kLat = 1 - Math.exp(-dt / this.lateralTau);
        const kAng = 1 - Math.exp(-dt / this.angularTau);

        const newLinear = currentLinear + (targetLinear - currentLinear) * kLat;
        const newAngular = currentAngular + (targetAngular - currentAngular) * kAng;

        this.vL = newLinear - newAngular;
        this.vR = newLinear + newAngular;

        const vL_in = this.vL * 12;
        const vR_in = this.vR * 12;

        const fwd_speed = (vL_in + vR_in) / 2;
        const orientation_delta_rad = (vL_in - vR_in) / this.trackWidth * dt;

        const new_orientation_rad = to_rad(this.angle) + orientation_delta_rad;
        const rightX = Math.cos(new_orientation_rad);
        const rightY = -Math.sin(new_orientation_rad);
        const lat_speed = (this.velX * rightX + this.velY * rightY) * Math.max(0, 1 - LATERAL_FRICTION * dt);

        this.odometryUpdate(fwd_speed * dt, 0, orientation_delta_rad, fwd_speed, lat_speed);
        this.render();
    }

    mecanumDrive(flCmd: number, frCmd: number, rlCmd: number, rrCmd: number, dt: number) {
        this.driveType = 'mecanum';
        this.color = MECANUM_COLOR;

        const fl = clamp(flCmd, -1, 1);
        const fr = clamp(frCmd, -1, 1);
        const rl = clamp(rlCmd, -1, 1);
        const rr = clamp(rrCmd, -1, 1);

        const tFL = fl * this.maxSpeed;
        const tFR = fr * this.maxSpeed;
        const tRL = rl * this.maxSpeed;
        const tRR = rr * this.maxSpeed;

        const r = (this.wheelBase + this.trackWidth) / 2;

        const targetFwd = (tFL + tFR + tRL + tRR) / 4;
        const targetLat = (tFL - tFR - tRL + tRR) / 4;
        const targetOmega = (tFL - tFR + tRL - tRR) / (4 * r);

        const curFwd = (this.vFL + this.vFR + this.vRL + this.vRR) / 4;
        const curLat = (this.vFL - this.vFR - this.vRL + this.vRR) / 4;
        const curOmega = (this.vFL - this.vFR + this.vRL - this.vRR) / (4 * r);

        const kLat = 1 - Math.exp(-dt / this.lateralTau);
        const kAng = 1 - Math.exp(-dt / this.angularTau);

        const newFwd = curFwd + (targetFwd - curFwd) * kLat;
        const newLat = curLat + (targetLat - curLat) * kLat;
        const newOmega = curOmega + (targetOmega - curOmega) * kAng;

        this.vFL = newFwd + newLat + newOmega * r;
        this.vFR = newFwd - newLat - newOmega * r;
        this.vRL = newFwd - newLat + newOmega * r;
        this.vRR = newFwd + newLat - newOmega * r;

        const fwd_in = newFwd * 12;
        const lat_in = newLat * 12;
        const omega_in = newOmega * 12; // rad/s

        this.odometryUpdate(fwd_in * dt, lat_in * dt, omega_in * dt, fwd_in, lat_in);
        this.render();
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

        let row = 95;
        if (this.driveType === 'tank') {
            ctx.fillText(`vL: ${this.vL.toFixed(2)}`, 20, row); row += 25;
            ctx.fillText(`vR: ${this.vR.toFixed(2)}`, 20, row); row += 25;
        } else {
            ctx.fillText(`FL: ${this.vFL.toFixed(2)}`, 20, row); row += 25;
            ctx.fillText(`FR: ${this.vFR.toFixed(2)}`, 20, row); row += 25;
            ctx.fillText(`RL: ${this.vRL.toFixed(2)}`, 20, row); row += 25;
            ctx.fillText(`RR: ${this.vRR.toFixed(2)}`, 20, row); row += 25;
        }

        ctx.fillText(`Velo: ${this.maxSpeed.toFixed(2)}`, 20, row); row += 25;
        ctx.fillText(`LatTau: ${this.lateralTau.toFixed(3)}`, 20, row); row += 25;
        ctx.fillText(`AngTau: ${this.angularTau.toFixed(3)}`, 20, row);
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
            to_px(this.height),
        );

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(to_px(this.width) / 2, 0);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
    
    private render() {
        if (this.odomData) this.draw_odom_data();
        this.draw_chassis();
    }
}
