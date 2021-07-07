const {Engine, Render, Runner, World, Bodies, Body, Events} = Matter;

const engine = Engine.create();
engine.world.gravity.y = 0;
const {world} = engine;
const width = window.innerWidth;
const height = window.innerHeight;
const cellsHorizontal = 6;
const cellsVertical = 4;
const unitLenX = width/cellsHorizontal;
const unitLenY = height/cellsVertical;
 //length of the cells

//render creates a canvas object
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

//Walls
// Bodies.rectangle(origin of the rectangle, y axis, width of rectangle, height)
const walls = [
    Bodies.rectangle(width/2, 0, width, 2, {
        isStatic: true,
    }),
    Bodies.rectangle(width/2, height, width, 2, {
        isStatic: true,
    }),
    Bodies.rectangle(0, height/2, 2, height, {
        isStatic: true,
    }),
    Bodies.rectangle(width, height/2, 2, height, {
        isStatic: true,
    })
];
World.add(world, walls);
//Maze Generation

const shuffle = (arr) => {
    let count = arr.length;
    
    while (count > 0) {
        const index = Math.floor(Math.random() * count);
        count--;
        [arr[count], arr[index]] = [arr[index], arr[count]];
    }
    return arr;
}

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

//vertical array
const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal-1).fill(false));
const horizontals = Array(cellsVertical-1).fill(null).map(() => Array(cellsHorizontal).fill(false));

//start and goal
const startRow = Math.floor(Math.random() * cellsVertical);
const startCol = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    //if it has been visited return
    if(grid[row][column]) return;

    //mark it visited
    grid[row][column] = true;
    //assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row-1, column, 'up'],
        [row, column+1, 'right'],
        [row+1, column, 'down'],
        [row, column-1, 'left']
    ]);
    
    //for each neighbor
    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;
        //check if out of bounds of dimensions
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        }
        //if we visited the neighbor, continue to next neighbor
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        //remove wall from horizontal or vertical array
        if (direction === 'left') verticals[row][column-1] = true;
        else if (direction === 'right') verticals[row][column] = true;
        else if (direction === 'up') horizontals[row-1][column] = true;
        else if (direction === 'down') horizontals[row][column] = true;

        stepThroughCell(nextRow, nextColumn);
    }
    //visit next cell
}
stepThroughCell(startRow, startCol);

//adding walls
horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) return;
        const wall = Bodies.rectangle(
            columnIndex * unitLenX + unitLenX/2, rowIndex  * unitLenY + unitLenY, unitLenX, 5, {
                isStatic: true,
                label: 'wall',
                render: {
                    fillStyle: 'white'
                }
            }
        );
        World.add(world, wall);
    })
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) return;
        const wall = Bodies.rectangle(columnIndex * unitLenX + unitLenX, rowIndex * unitLenY + unitLenY/2, 5, unitLenY, {
            isStatic: true,
            label: 'wall',
            render: {
                fillStyle: 'white'
            }
        });
        World.add(world, wall);
    })
})
//goal
const goal = Bodies.rectangle(
    width-unitLenX/2, 
    height-unitLenY/2,
    unitLenX * .7,
    unitLenY * .7, {
        isStatic: true,
        label: 'goal',
        render: {
            fillStyle: 'gold'
        }
    }
);

World.add(world, goal);

//ball

const ball = Bodies.circle(
    unitLenX/2, 
    unitLenY/2, 
    Math.min(unitLenX/4, unitLenY/4),
    {
        isStatic: false,
        label: 'ball',
        render: {
            fillStyle: 'violet'
        }
    }
);
World.add(world, ball);

document.addEventListener('keydown', (event) => {
    //get ball velocity
    const {x, y} = ball.velocity;
    //move using velocity
    if (event.keyCode === 87) Body.setVelocity(ball, {x: x, y: y-5});
    if (event.keyCode === 68) Body.setVelocity(ball, {x: x+5, y: y});
    if (event.keyCode === 83) Body.setVelocity(ball, {x: x, y: y+5});
    if (event.keyCode === 65) Body.setVelocity(ball, {x: x-5, y: y});
})

//win collision
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((collision) => {
        let label = ['ball', 'goal'];
        if (label.includes(collision.bodyA.label) && label.includes(collision.bodyB.label)) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach((body) => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            })
        }
    })
})