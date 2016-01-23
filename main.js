/**
 * Created by afront on 1/17/16.
 */

//Create the renderer
var botTex         = [
    'assets/images/blu.gif',
    'assets/images/pnk.gif',
    'assets/images/red.gif',
    'assets/images/ylw.gif',
    'data:image/gif;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw=='
    ],
    renderer        = PIXI.autoDetectRenderer(512, 512, {antialias: false, transparent: false, resolution: 1}),
    stage,
    botInitCount    = 15,
    botDefaultSpeed = 5,
    angleVariance   = 10,  // in degrees,
    lookAhead       = 10,  // multiple
    textures        = [],
    bots            = [],
    lines           = [],
    stageBoundaries,
    creationBoundaryPadding = 1,
    boundaries      = [],
    boundaryPadding = 1,
    gravity         = 1;

init();

function init () {
    renderer.view.style.position = "absolute";
    renderer.view.style.display  = "block";
    renderer.autoResize          = true;
    renderer.resize(window.innerWidth, window.innerHeight);

    stageBoundaries = [
        [boundaryPadding, boundaryPadding],
        [renderer.width - boundaryPadding, boundaryPadding],
        [renderer.width - boundaryPadding, renderer.height - boundaryPadding],
        [boundaryPadding, renderer.height - boundaryPadding]
    ];
    boundaries.push(stageBoundaries);

    //Add the canvas to the HTML document
    document.body.appendChild(renderer.view);

    //Create a container object called the `stage`
    stage = new PIXI.Container();

    PIXI.loader.add(botTex).load(setup);
}

function checkSegmentedBoundary (curVector, newVector, boundary) {
    var bSegment = [].concat.apply([], boundary),
        okToMove = true;

    if (bSegment.length % 2 === 0 && bSegment.length >= 4) {
        for (var i = 0; i <= bSegment.length; i += 2) {
            okToMove = !lineIntersect(
                curVector.x,
                curVector.y,
                newVector[2],
                newVector[3],
                bSegment[i],
                bSegment[i + 1],
                bSegment[(i + 2) % bSegment.length],
                bSegment[(i + 3) % bSegment.length]
            );

            if (!okToMove) {
                //debugger;
                break;
            }
        }
    }

    return okToMove;
}

function lineIntersect (x1, y1, x2, y2, x3, y3, x4, y4) {
    var x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    var y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    if (isNaN(x) || isNaN(y)) {
        return false;
    } else {
        if (x1 >= x2) {
            if (!(x2 <= x && x <= x1)) {
                return false;
            }
        } else {
            if (!(x1 <= x && x <= x2)) {
                return false;
            }
        }
        if (y1 >= y2) {
            if (!(y2 <= y && y <= y1)) {
                return false;
            }
        } else {
            if (!(y1 <= y && y <= y2)) {
                return false;
            }
        }
        if (x3 >= x4) {
            if (!(x4 <= x && x <= x3)) {
                return false;
            }
        } else {
            if (!(x3 <= x && x <= x4)) {
                return false;
            }
        }
        if (y3 >= y4) {
            if (!(y4 <= y && y <= y3)) {
                return false;
            }
        } else {
            if (!(y3 <= y && y <= y4)) {
                return false;
            }
        }
    }
    return true;
}

function checkBoundaries (curVector, newVector) {
    var okToMove = true;
    for (var i = 0; i < boundaries.length; i++) {
        okToMove = checkSegmentedBoundary(curVector, newVector, boundaries[i]);
        if (!okToMove) {
            break;
        }
    }

    return okToMove;
}

function setup () {

    setupTextures();
    //addRandomObstacles();
    drawBoundaries();
    addBots();
    animateBots();

}

function addRandomObstacles() {
    var maxSize     = 300,
        minSize     = 150,
        maxVectors  = 8,
        minVectors  = 2,
        maxObsCount = 6,
        minObsCount = 1,

        obsCount = ~~(Math.random() * (maxObsCount - minObsCount) + minObsCount);
    // go through each obstacle
    for (var i = 0; i < obsCount; i++) {
        var randX = ~~(Math.random() * renderer.width),
            randY = ~~(Math.random() * renderer.height),
            obsSize = ~~(Math.random() * (maxSize - minSize) + minSize),
            obsVectors = ~~(Math.random() * (maxVectors - minVectors) + minVectors),
            obs = [];

        //// adjust location to be all inside view ////
        if (randX - (obsSize / 2) < 0)
            randX += (obsSize / 2 - randX);

        if (randX + (obsSize / 2) > renderer.width)
            randX -= randX + (obsSize / 2) - renderer.width;

        if (randY - (obsSize / 2) < 0)
            randY += (obsSize / 2 - randY);

        if (randY + (obsSize / 2) > renderer.height)
            randY -= randY + (obsSize / 2) - renderer.height;
        ////////////////////////////////////////////////

        // generate all the vectors for this obstacle
        for (var v = 0; v < obsVectors; v++){
            obs.push(getVector({x: randX, y: randY}, (360 / obsVectors) * (v + 1), obsSize/2, true));
        }

        boundaries.push(obs);
    }

}

function addObstacles() {

    boundaries.push([
        [50, 50],
        [150, 50],
        [150, 150],
        [50, 150]
    ]);

    boundaries.push([
        [350, 350],
        [450, 350],
        [450, 450],
        [350, 450]
    ]);

    boundaries.push([
        [650, 50],
        [750, 50],
        [750, 150],
        [650, 150]
    ]);
}

function animateBots () {

    //Move the cat 1 pixel per frame
    updateBotPos();
    //Loop this function 60 times per second
    //setTimeout(function() {
        requestAnimationFrame(animateBots);
    //}, 100);


    //Render the stage
    renderer.render(stage);

}

function updateBotPos () {

    // for every bot check the status and update positions
    // as long as they do not collide with something or someone.
    for (var i = 0; i < bots.length; i++) {
        var randAngle = bots[i].curAngle === bots[i].prevAngle ? getRandomDir() : getRandomDir(bots[i].curAngle),
            newVector = getVector({x: bots[i].x, y: bots[i].y}, randAngle),
            okToMove,
            collision;

        okToMove = checkBoundaries({x: bots[i].x, y: bots[i].y}, newVector);

        if (!okToMove) { // one more chance to reverse the direction
            randAngle = (randAngle + 180) % 360;
            newVector = getVector({x: bots[i].x, y: bots[i].y}, randAngle, 1);
            // check again
            okToMove = checkBoundaries({x: bots[i].x, y: bots[i].y}, newVector);
        }

        collision = checkForCollisions(bots[i], i);

        if (collision.collided) { // one more chance to reverse the direction
            //console.log('botClass:', bots[i].botClass, 'at', bots[i].x, bots[i].y, 'collided at: ', collision.with.curAngle, collision);
            //debugger;
            //randAngle = (randAngle + 180) % 360;
            randAngle = (collision.angle - randAngle) <= angleVariance ? collision.angle : randAngle;
            newVector = getVector({x: bots[i].x, y: bots[i].y}, collision.angle, botDefaultSpeed);
            // check again
            okToMove = checkBoundaries({x: bots[i].x, y: bots[i].y}, newVector);
        }

        if(okToMove){
            bots[i].prevAngle = bots[i].curAngle;
            bots[i].curAngle  = randAngle;
            bots[i].prevX     = bots[i].x;
            bots[i].prevY     = bots[i].y;
            bots[i].x         = newVector[0];
            bots[i].y         = newVector[1];
        }

        //if(Math.abs(bots[i].curAngle - bots[i].prevAngle) > angleVariance){
        //    console.log(bots[i].prevAngle, bots[i].curAngle, Math.abs(bots[i].curAngle) + Math.abs(bots[i].prevAngle));
        //    debugger;
        //}


        updateDirectionLine(i);
    }

}

// bot collisions - circular
function checkForCollisions(bot, botsI) {
    var min = 20,
        collision = {
            collided: false,
            angle: undefined,
            with: undefined
        };
    for (var i = 0; i < bots.length; i++){
        if(botsI !== i){
            if(Math.abs(bot.x - bots[i].x) < min && Math.abs(bot.y - bots[i].y) < min) {
                collision.collided = true;
                collision.angleOfObsticle = ((Math.atan2(bot.y - bots[i].y, bot.x - bots[i].x) * 180 / Math.PI) + 180) % 360;
                collision.angle = (bot.curAngle - (collision.angleOfObsticle - bot.curAngle)) % 360;
                collision.with = bots[i];
                break;
            }
        }
    }
    return collision;
}

function updateDirectionLine (i) {
    var vector = {};
    vector.x   = (30 * Math.cos(bots[i].prevAngle * (Math.PI / 180)));
    vector.y   = (30 * Math.sin(bots[i].prevAngle * (Math.PI / 180)));

    //console.log(vector);

    lines[i].clear();
    lines[i].lineStyle(4, 0xFFFFFF, 1);
    lines[i].moveTo(0, 0);
    lines[i].lineTo(vector.x, vector.y);
    //lines[i].lineTo(bots[i].x, bots[i].x);
    lines[i].x = bots[i].x;
    lines[i].y = bots[i].y;

}

function addDirectionLine (sprite) {

    var line = new PIXI.Graphics();

    line.lineStyle(4, 0xFFFFFF, 1);
    line.moveTo(0, 0);

    line.x   = sprite.x;
    line.y   = sprite.y;
    lines.push(line);

    stage.addChild(line);

}

function drawBoundaries() {
    var line = new PIXI.Graphics();
    line.lineStyle(4, 0xEEEEEE, 1);
    for (var b = 0; b < boundaries.length; b++){

        for (var i = 0; i <= boundaries[b].length; i++) {
            if(i === 0){
                line.moveTo(boundaries[b][i][0], boundaries[b][i][1]);
            } else {
                line.lineTo(boundaries[b][i % boundaries[b].length][0], boundaries[b][i % boundaries[b].length][1]);
            }

        }
        stage.addChild(line);

    }
}

function getRandomDir (angle) {
    var adjustAngle;

    angle   = typeof angle !== 'undefined' ? angle : Math.random() * 360;               // -0.5 * 10 = -5deg + 45deg = 40deg
    adjustAngle = (Math.random() - 0.5) * angleVariance;              //  0.5 * 10 =  5deg + 45deg = 50deg
    angle += adjustAngle;
    //console.log(angle);
    return angle;
}

function setupTextures () {

    //textures.push();

}

function addBots () {

    for (var i = 0; i < botInitCount; i++) {
        makeBot(PIXI.loader.resources[botTex[i % botTex.length]].texture, (i % botTex.length));
    }

}

function makeBot (texture, botClass) {

    var sprite = new PIXI.Sprite(texture),
        newPos = getRandomPos();

    sprite.botClass = botClass;

    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(newPos.x, newPos.y);

    sprite.prevX = renderer.with/2;    //newPos.x - 10;
    sprite.prevY = renderer.height/2;  //newPos.y - 10;
    bots.push(sprite);

    stage.addChild(sprite);

    addDirectionLine(sprite);
}

function getVector (coord, angle, speed, noLookAhead) {
    var result = [];
    speed = typeof speed !== 'undefined' ? speed : botDefaultSpeed;
    //angle = angle * Math.PI / 180; // if you're using degrees instead of radians

    result.push(speed * Math.cos(angle * (Math.PI / 180)) + coord.x);
    result.push((speed * Math.sin(angle * (Math.PI / 180)) + coord.y) * gravity);

    if(!noLookAhead) {
        result.push((speed * lookAhead) * Math.cos(angle * (Math.PI / 180)) + coord.x);
        result.push((speed * lookAhead) * Math.sin(angle * (Math.PI / 180)) + coord.y);
    }

    return result;
}


function getRandomPos () {
    var padding = creationBoundaryPadding;  // range: 0 <-> 1
    return {
        x: ((Math.random() * renderer.width) * padding) + (((renderer.width / 2) * (1 - padding))),
        y: ((Math.random() * renderer.height) * padding) + (((renderer.height / 2) * (1 - padding)))
    };

}

//Tell the `renderer` to `render` the `stage`