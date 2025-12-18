import { Field } from './field.ts';
import { fieldControl, menuButtons, splitArcadeMecnum, splitArcadeTank } from './control.ts';
import { TankDriveRobot } from './tankDriveRobot.ts';
import { mecanumDriveRobot } from './mecnumRobot.ts';
import { settings } from './globals.ts';

let tankRobot = new TankDriveRobot(
    0, // Start x
    0, // Start y
    0, // Start angle
    14, // Width (inches)
    14, // Height (inches)
    6, // Speed (ft/s)
    14,  // Track Radius (inches)
    15, // Max Accel (ft/s^2)
    15
);

let mecanumRobot = new mecanumDriveRobot(
    0, // Start x
    0, // Start y
    0, // Start angle
    14, // Width (inches)
    14, // Height (inches)
    6, // Speed (ft/s)
    14,  // Track Radius (inches)
    14,
    15, // Max Accel (ft/s^2)
    15
);

let fields = [
    new Field("./push_back_skills.png", [
        { x: 195, y: 462, w: 190, h: 25 },
        { x: 195, y: 88, w: 190, h: 25 },
    ]),
    new Field("./empty_field.png"),
    new Field("./high_stakes_skills.png"),
]

function driveMecnumRobot(dt: number) {
    const field = fieldControl(fields);
    splitArcadeMecnum(mecanumRobot, field, dt);    
    menuButtons(mecanumRobot)
    mecanumRobot.render();
}

function driveTankRobot(dt: number) {
    const field = fieldControl(fields);
    splitArcadeTank(tankRobot, field, dt);        
    menuButtons(tankRobot)
    tankRobot.render();
}

function update(dt: number) {
    if (settings.useTankDrive) {
        driveTankRobot(dt);
    } else {
        driveMecnumRobot(dt);
    }
}

let lastFrameTime = 0;
const fps = 60;
const frameDuration = 1000 / fps;

function render(timestamp: number) {
    let elaped = timestamp - lastFrameTime 
    if (elaped >= frameDuration) {
        lastFrameTime = timestamp;
        update(elaped / 1000);
    }
    window.requestAnimationFrame(render);
}

render(0);

