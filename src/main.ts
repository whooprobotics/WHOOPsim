import { Field } from './field.ts';
import { driveMecnumRobot, driveTankRobot, fieldControl, menuButtons } from './control.ts';
import { Robot } from './robot.ts';
import { settings } from './globals.ts';

let robot = new Robot(
    0, // Start x
    0, // Start y
    0, // Start angle
    14, // Width (inches)
    14, // Height (inches)
    6, // Speed (ft/s)
    14, // Track width (inches)
    14, // Wheel base (inches)
    0.2, // Lateral tau (s)
    0.1, // Angular tau (s)
);

let pushBackField = new Field("./push_back_skills.png");
let emptyField = new Field("./empty_field.png"); 
let highStakesField = new Field("./high_stakes_skills.png");

let fields = [
    pushBackField,
    emptyField,
    highStakesField
]

function update(dt: number) {
    fieldControl(fields); // Allows the user to swap background image
    menuButtons(robot); // Enables keybinds to modify robot constants

    // How to move the tank drive robot forward at half speed for 1 second.
    // dt is in seconds, with the sim being run at 60 fps, so every frame is 1/60 seconds
    /*
        let timeout = 0; // declare this once, outside update()
        timeout += dt;
        if (timeout < 1) {
            robot.tankDrive(.5, .5, dt); // drives forward
        } else {
            robot.tankDrive(0, 0, dt); // stops the robot
        }
    */


    // This is the user control loop. Comment this out
    // if using manual controls
    if (settings.useTankDrive) {
        driveTankRobot(robot, dt);
    } else {
        driveMecnumRobot(robot, dt);
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

