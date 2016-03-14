/**
 * Created by afront on 1/17/16.
 *
 * Hints:
 *
 * radians = degrees * (pi/180)
 * degrees = radians * (180/pi)
 *
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
    botInitCount    = 1,
    botDefaultSpeed = 2,
    angleVariance   = 10,  // in degrees,
    lookAhead       = 100,  // multiple
    textures        = [],
    bots            = [],
    obstacleCenters = [],
    lines           = [],
    stats           = {},
    stageBoundaries,
    creationBoundaryPadding = 1,
    boundaries      = [],
    boundaryPadding = 1,
    gravity         = 1,
    // obstacle params
    enableObstacles = true,
    maxSize     = 200,
    minSize     = 150,
    maxVectors  = 8,
    minVectors  = 3,
    maxObsCount = 6,
    minObsCount = 6;

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
        data = [],
        preBounce,
        afterBounce;

    if (bSegment.length % 2 === 0 && bSegment.length >= 4) {
        for (var i = 0; i <= bSegment.length; i += 2) {
            data = lineIntersect(
                curVector.x,
                curVector.y,
                newVector[2],
                newVector[3],
                bSegment[i],
                bSegment[i + 1],
                bSegment[(i + 2) % bSegment.length],
                bSegment[(i + 3) % bSegment.length]
            );

            if (data) {

                preBounce =
                    Math.abs(
                        Math.atan2(data[5] - data[7], data[4] - data[6]) * 180 / Math.PI -
                        Math.atan2(data[1] - data[3], data[0] - data[2]) * 180 / Math.PI
                    );
                //preBounce =
                //    Math.abs(Math.atan2(data[1] - data[3], data[0] - data[2]) * 180 / Math.PI -
                //    Math.atan2(data[5] - data[7], data[4] - data[6]) * 180 / Math.PI);

                if(preBounce > 90) {
                    afterBounce = (preBounce % 90)*2
                } else {
                    afterBounce = -(90-preBounce)*2
                }
                //afterBounce = preBounce;


                data.push(afterBounce);
                break;
            }

        }
    }

    return data;
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
    return [x1, y1, x2, y2, x3, y3, x4, y4];
}

function checkBoundaries (curVector, newVector) {
    var data;
    for (var i = 0; i < boundaries.length; i++) {
        data = checkSegmentedBoundary(curVector, newVector, boundaries[i]);
        if (data) {
            break;
        }
    }

    return data;
}

function setup () {

    setupTextures();
    enableObstacles && generateObstacles();
    drawBoundaries();
    addBots();
    if (bots.length === 1) addStats();
    //animate();
    renderer.render(stage);

}

// supports only one bot
function addStats() {
    var angleStat = new PIXI.Text('Angle: ', {font: '24px Arial', fill: 0xff1010, align: 'center'});
    angleStat.position = {x: 10, y: 5};
    stage.addChild(angleStat);

    var positionStat = new PIXI.Text('Position: ', {font: '24px Arial', fill: 0xff1010, align: 'center'});
    positionStat.position = {x: 10, y: 35};
    stage.addChild(positionStat);

    var lookAtStat      = new PIXI.Text('Position: ', {font: '24px Arial', fill: 0xff1010, align: 'center'});
    lookAtStat.position = {x: 10, y: 65};
    stage.addChild(lookAtStat);

    stats = {
        angleStat: angleStat,
        positionStat: positionStat,
        lookAtStat: lookAtStat
    };
}

function updateStats() {
    stats.angleStat.text    = 'Ang: ' + parseInt(bots[0].curAngle);
    stats.positionStat.text = 'Pos: x:' + parseInt(bots[0].x) + ', y:' + parseInt(bots[0].y);
    stats.lookAtStat.text = 'LookAt: x:' + parseInt(bots[0].lookAtX) + ', y:' + parseInt(bots[0].lookAtY);
}

function generateObstacle(pos, radius, points) {
    var obs = [];
    for (var v = 0; v < points; v++) {
        obs.push(getVector({x: pos.x, y: pos.y}, (360 / points) * (v + 1), radius));
    }
    return obs;
}

function getRandomPos() {
    return {
        x: ~~(Math.random() * renderer.width),
        y: ~~(Math.random() * renderer.height)
    }
}

/**
 * TODO: still needs work
 * @param obsRadius
 * @returns {{x, y}|*}
 */
function getRandomNonOverlappingPos(obsRadius) {
    var pos = getRandomPos();

    ////// adjust location to be all inside view ////
    if (pos.x - obsRadius < 0)
        pos.x += obsRadius - pos.x;

    if (pos.x + obsRadius > renderer.width)
        pos.x -= pos.x + obsRadius - renderer.width;

    if (pos.y - obsRadius < 0)
        pos.y += obsRadius - pos.y;

    if (pos.y + obsRadius > renderer.height)
        pos.y -= pos.y + obsRadius - renderer.height;
    //////////////////////////////////////////////////

    for(var i = 1; i < boundaries.length; i++) {
        for (var ii = 0; ii < boundaries[i].length; ii++){
            if(
                (boundaries[i][ii][0] > (-obsRadius + pos.x)) &&
                (boundaries[i][ii][0] < (obsRadius + pos.x)) &&
                (boundaries[i][ii][1] > (-obsRadius + pos.y)) &&
                (boundaries[i][ii][1] < (obsRadius + pos.y))
            ) {
                console.log('overlapped!');
                boundaries[i][ii].push('0xAA1111');
                //break;
            }
        }
    }



    return pos;
}

function generateObstacles(count) {
    var obsCount = count || ~~(Math.random() * (maxObsCount - minObsCount) + minObsCount);


    // go through each obstacle
    for (var i = 0; i < obsCount; i++) {
        var obsSize = ~~(Math.random() * (maxSize - minSize) + minSize);
        obstacleCenters.push(getRandomNonOverlappingPos(obsSize/2));
        var obsVectorCount = ~~(Math.random() * (maxVectors - minVectors) + minVectors);
        var obs = [];

        boundaries.push(generateObstacle(obstacleCenters[obstacleCenters.length - 1], obsSize/2, obsVectorCount));

        //// generate all the vectors for this obstacle
        //for (var v = 0; v < obsVectorCount; v++){
        //    obs.push(getVector({x: randX, y: randY}, (360 / obsVectorCount) * (v + 1), obsSize/2));
        //}
        //
        //boundaries.push(obs);
    }

}


function animate () {


    updateBotPos();

    updateStats();
    //Loop this function 60 times per second
    //setTimeout(function() {
    requestAnimationFrame(animate);
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
            newAngle,
            data,
            collision;

        data = checkBoundaries({x: bots[i].x, y: bots[i].y}, newVector);

        if (data) { // one more chance to reverse the direction

            //newAngle = ((bots[i].curAngle + 180) % 360) + data[8];
            newAngle = (bots[i].curAngle + 180) % 360;

            randAngle = newAngle;
            newVector = getVector({x: bots[i].x, y: bots[i].y}, randAngle, 1);
            // check again
            data = checkBoundaries({x: bots[i].x, y: bots[i].y}, newVector);
        }

        //collision = checkForCollisions(bots[i], i);
        //
        //if (collision.collided) { // one more chance to reverse the direction
        //
        //    randAngle = (collision.angle - randAngle) <= angleVariance ? collision.angle : randAngle;
        //
        //    newVector = getVector({x: bots[i].x, y: bots[i].y}, collision.angle, botDefaultSpeed);
        //    // check again
        //    data = checkBoundaries({x: bots[i].x, y: bots[i].y}, newVector);
        //}

        if(!data){
            bots[i].prevAngle = bots[i].curAngle;
            bots[i].curAngle  = randAngle;
            bots[i].prevX     = bots[i].x;
            bots[i].prevY     = bots[i].y;
            bots[i].x         = newVector[0];
            bots[i].y         = newVector[1];
            bots[i].lookAtX   = newVector[2];
            bots[i].lookAtY   = newVector[3];
        }

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
        b && line.beginFill(0x00FF00);
        for (var i = 0; i <= boundaries[b].length; i++) {
            var lineIndex = i === 0 ? i : i % boundaries[b].length,
                lineColor = boundaries[b][lineIndex].length === 6 ? boundaries[b][lineIndex][5] : undefined;
            if(lineColor) line.lineStyle(4, lineColor, 1);
            if(i === 0){
                line.moveTo(boundaries[b][lineIndex][0], boundaries[b][lineIndex][1]);
            } else {
                line.lineTo(boundaries[b][lineIndex][0], boundaries[b][lineIndex][1]);
            }

        }
        b && line.endFill();
        stage.addChild(line);

    }
}

function getRandomDir (angle) {
    var adjustAngle;

    angle   = typeof angle !== 'undefined' ? angle : Math.random() * 360;               // -0.5 * 10 = -5deg + 45deg = 40deg
    adjustAngle = (Math.random() - 0.5) * angleVariance;              //  0.5 * 10 =  5deg + 45deg = 50deg
    angle += adjustAngle;

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

function getVector (coord, angle, radius) {
    var result = [], tmpX, tmpY, tmpSpeed;
    radius      = typeof radius !== 'undefined' ? radius : botDefaultSpeed;
    //angle = angle * Math.PI / 180; // if you're using degrees instead of radians

    tmpX = radius * Math.cos(angle * (Math.PI / 180)) + coord.x;
    tmpY = radius * gravity * Math.sin(angle * (Math.PI / 180)) + coord.y;

    result = [
        tmpX,                       // x
        tmpY,                       // y
        lookAhead + tmpX,           // x normal
        lookAhead + tmpY,           // y normal
        angle                       // normal angle,
    ];

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