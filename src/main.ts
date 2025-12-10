import { Robot } from './robot.ts'
import { Field } from './field.ts';
import { fieldControl, menuButtons, splitArcade } from './control.ts';

let robot = new Robot(
    14, // Width (inches)
    14, // Height (inches)
    6, // Speed (ft/s)
    16,  // Track Radius (inches)
    18, // Max Accel (ft/s^2)
    25 // Max Decel
);

let fields = [
    new Field("./push_back_skills.png", [
        { x: 195, y: 462, w: 190, h: 25 },
        { x: 195, y: 88, w: 190, h: 25 },
    ]),
    new Field("./empty_field.png"),
    new Field("./high_stakes_skills.png"),
]

function update(dt: number) {
    const field = fieldControl(fields);
    menuButtons(robot); 
    robot.render();
    splitArcade(robot, field, dt);
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

