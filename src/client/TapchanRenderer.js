'use strict';

const PIXI = require('pixi.js');
const Renderer = require('lance-gg').render.Renderer;
const Utils = require('./../common/Utils');

const Fish = require('../common/Fish');
const Food = require('../common/Food');
const ShipActor = require('./ShipActor');
const Mine = require('../common/Mine');

/**
 * Renderer for the Tapchan client - based on Pixi.js
 */
class TapchanRenderer extends Renderer {

    get ASSETPATHS() {
        return {
            smokeParticle: 'assets/smokeparticle.png',
            food: 'assets/food.png',
            mine: 'assets/mine.png',
            whale: 'assets/whale.png',
            bubble: 'assets/bubble.png',
            water: 'assets/water.png',
        };
    }

    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        this.sprites = {};
        this.isReady = false;

        // asset prefix
        this.assetPathPrefix = this.gameEngine.options.assetPathPrefix ? this.gameEngine.options.assetPathPrefix : '';

        // these define how many gameWorlds the player ship has "scrolled" through
        this.bgPhaseX = 0;
        this.bgPhaseY = 0;
    }

    init() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;

        this.stage = new PIXI.Container();
        this.layer1 = new PIXI.Container();
        this.layer2 = new PIXI.Container();

        this.stage.addChild(this.layer1, this.layer2);

        if (document.readyState === 'complete' || document.readyState === 'loaded' || document.readyState === 'interactive') {
            this.onDOMLoaded();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.onDOMLoaded();
            });
        }

        return new Promise((resolve, reject) => {
            PIXI.loader.add(Object.keys(this.ASSETPATHS).map((x) => {
                return {
                    name: x,
                    url: this.assetPathPrefix + this.ASSETPATHS[x]
                };
            }))
                .load(() => {
                    this.isReady = true;
                    this.setupStage();
                    this.gameEngine.emit('renderer.ready');
                    resolve();
                });
        });
    }

    onDOMLoaded() {
        this.renderer = PIXI.autoDetectRenderer(this.viewportWidth, this.viewportHeight);
        document.body.querySelector('.pixiContainer').appendChild(this.renderer.view);
    }

    setupStage() {
        window.addEventListener('resize', () => {
            this.setRendererSize();
        });

        this.lookingAt = {x: 0, y: 0};
        this.camera = new PIXI.Container();
        this.camera.addChild(this.layer1, this.layer2);

        // parallax background
        this.background = new PIXI.extras.TilingSprite(PIXI.loader.resources.water.texture,
            this.viewportWidth, this.viewportHeight);
        this.stage.addChild(this.background);
        this.stage.addChild(this.camera);

        this.elapsedTime = Date.now();
        // debug
        if ('showworldbounds' in Utils.getUrlVars()) {
            let graphics = new PIXI.Graphics();
            graphics.beginFill(0xFFFFFF);
            graphics.alpha = 0.1;
            graphics.drawRect(0, 0, this.gameEngine.worldSettings.width, this.gameEngine.worldSettings.height);
            this.camera.addChild(graphics);
        }

    }

    setRendererSize() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;

        this.background.width = this.viewportWidth;
        this.background.height = this.viewportHeight;

        this.renderer.resize(this.viewportWidth, this.viewportHeight);
    }

    draw() {
        super.draw();

        let now = Date.now();

        if (!this.isReady) return; // assets might not have been loaded yet
        let worldWidth = this.gameEngine.worldSettings.width;
        let worldHeight = this.gameEngine.worldSettings.height;

        let viewportSeesRightBound = this.camera.x < this.viewportWidth - worldWidth;
        let viewportSeesLeftBound = this.camera.x > 0;
        let viewportSeesTopBound = this.camera.y > 0;
        let viewportSeesBottomBound = this.camera.y < this.viewportHeight - worldHeight;

        for (let objId of Object.keys(this.sprites)) {
            let objData = this.gameEngine.world.objects[objId];
            let sprite = this.sprites[objId];

            if (objData) {

                // if the object requests a "showThrust" then invoke it in the actor
                if ((sprite !== this.playerFish) && sprite.actor) {
                    // sprite.actor.thrustEmitter.emit = !!objData.showThrust;
                }

                sprite.x = objData.position.x;
                sprite.y = objData.position.y;

                if (objData.class === Fish) {
                    sprite.actor.fishContainerSprite.rotation = this.gameEngine.world.objects[objId].angle * Math.PI / 180;
                } else {
                    sprite.rotation = this.gameEngine.world.objects[objId].angle * Math.PI / 180;
                }

                // make the wraparound seamless for objects other than the player ship
                if (sprite !== this.playerFish && viewportSeesLeftBound && objData.position.x > this.viewportWidth - this.camera.x) {
                    sprite.x = objData.position.x - worldWidth;
                }
                if (sprite !== this.playerFish && viewportSeesRightBound && objData.position.x < -this.camera.x) {
                    sprite.x = objData.position.x + worldWidth;
                }
                if (sprite !== this.playerFish && viewportSeesTopBound && objData.position.y > this.viewportHeight - this.camera.y) {
                    sprite.y = objData.position.y - worldHeight;
                }
                if (sprite !== this.playerFish && viewportSeesBottomBound && objData.position.y < -this.camera.y) {
                    sprite.y = objData.position.y + worldHeight;
                }
            }

            if (sprite) {
                // object is either a Pixi sprite or an Actor. Actors have renderSteps
                if (sprite.actor && sprite.actor.renderStep) {
                    sprite.actor.renderStep(now - this.elapsedTime);
                }
            }

            // this.emit("postDraw");
        }

        let cameraTarget;
        if (this.playerFish) {
            cameraTarget = this.playerFish;
            // this.cameraRoam = false;
        } else if (!this.gameStarted && !cameraTarget) {

            // calculate centroid
            cameraTarget = getCentroid(this.gameEngine.world.objects);
            this.cameraRoam = true;
        }

        if (cameraTarget) {
            // let bgOffsetX = -this.bgPhaseX * worldWidth - cameraTarget.x;
            // let bgOffsetY = -this.bgPhaseY * worldHeight - cameraTarget.y;

            // 'cameraroam' in Utils.getUrlVars()
            if (this.cameraRoam) {
                let lookingAtDeltaX = cameraTarget.x - this.lookingAt.x;
                let lookingAtDeltaY = cameraTarget.y - this.lookingAt.y;
                let cameraTempTargetX;
                let cameraTempTargetY;

                if (lookingAtDeltaX > worldWidth / 2) {
                    this.bgPhaseX++;
                    cameraTempTargetX = this.lookingAt.x + worldWidth;
                } else if (lookingAtDeltaX < -worldWidth / 2) {
                    this.bgPhaseX--;
                    cameraTempTargetX = this.lookingAt.x - worldWidth;
                } else {
                    cameraTempTargetX = this.lookingAt.x + lookingAtDeltaX * 0.02;
                }

                if (lookingAtDeltaY > worldHeight / 2) {
                    cameraTempTargetY = this.lookingAt.y + worldHeight;
                    this.bgPhaseY++;
                } else if (lookingAtDeltaY < -worldHeight / 2) {
                    this.bgPhaseY--;
                    cameraTempTargetY = this.lookingAt.y - worldHeight;
                } else {
                    cameraTempTargetY = this.lookingAt.y + lookingAtDeltaY * 0.02
                }

                this.centerCamera(cameraTempTargetX, cameraTempTargetY);

            } else {
                this.centerCamera(cameraTarget.x, cameraTarget.y);
            }
        }

        let bgOffsetX = this.bgPhaseX * worldWidth + this.camera.x;
        let bgOffsetY = this.bgPhaseY * worldHeight + this.camera.y;

        this.background.tilePosition.x = bgOffsetX * 0.01;
        this.background.tilePosition.y = bgOffsetY * 0.01;

        this.elapsedTime = now;

        // Render the stage
        this.renderer.render(this.stage);
    }

    addObject(objData, options) {
        let sprite;

        if (objData.class === Fish) {
            let shipActor = new ShipActor(this);
            sprite = shipActor.sprite;
            this.sprites[objData.id] = sprite;
            sprite.id = objData.id;

            if (this.clientEngine.isOwnedByPlayer(objData)) {
                this.playerFish = sprite; // save reference to the player ship
                document.body.classList.remove('lostGame');
                if (!document.body.classList.contains('tutorialDone')) {
                    document.body.classList.add('tutorial');
                }
                document.body.classList.remove('lostGame');
                document.body.classList.add('gameActive');
                document.querySelector('#tryAgain').disabled = true;
                document.querySelector('#joinGame').disabled = true;
                document.querySelector('#joinGame').style.opacity = 0;

                this.gameStarted = true; // todo state shouldn't be saved in the renderer

                // remove the tutorial if required after a timeout
                setTimeout(() => {
                    document.body.classList.remove('tutorial');
                }, 10000);
            } else {
                let tint = '0x' + (Math.floor(((Math.random() * 16777215 ) / 4) + 16777215 / 2)).toString(16);
                sprite.actor.fishSprite.tint = tint; // color  player ship
            }
        } else if (objData.class === Food) {

            let isSuper = objData.isSuper;
            sprite = new PIXI.Sprite(PIXI.loader.resources.food.texture);
            //food into rainbow pukes
            sprite.tint = '0x' + (Math.floor(((Math.random() * 16777215 ) / 2) + 16777215 / 2)).toString(16);
            this.sprites[objData.id] = sprite;

            if (isSuper) {
                sprite.width = 20;
                sprite.height = 20;
            } else {
                sprite.width = 10;
                sprite.height = 10;
            }

            sprite.anchor.set(.5, .5);

        } else if (objData.class === Mine) {

            sprite = new PIXI.Sprite(PIXI.loader.resources.mine.texture);

            sprite.width = 60;
            sprite.height = 60;

            sprite.anchor.set(.5, .5);
        }

        sprite.position.set(objData.position.x, objData.position.y);
        this.layer2.addChild(sprite);

        Object.assign(sprite, options);

        return sprite;
    }

    removeObject(obj) {
        if (this.playerFish && obj.id === this.playerFish.id) {
            this.playerFish = null;
        }

        let sprite = this.sprites[obj.id];
        if (sprite.actor) {
            // removal "takes time"
            sprite.actor.destroy().then(() => {
                console.log('deleted sprite');
                delete this.sprites[obj.id];
            });
        } else {
            this.sprites[obj.id].destroy();
            delete this.sprites[obj.id];
        }
    }

    /**
     * Centers the viewport on a coordinate in the gameworld
     * @param {Number} targetX
     * @param {Number} targetY
     */
    centerCamera(targetX, targetY) {
        if (isNaN(targetX) || isNaN(targetY)) return;
        if (!this.lastCameraPosition) {
            this.lastCameraPosition = {};
        }

        this.lastCameraPosition.x = this.camera.x;
        this.lastCameraPosition.y = this.camera.y;

        this.camera.x = this.viewportWidth / 2 - targetX;
        this.camera.y = this.viewportHeight / 2 - targetY;
        this.lookingAt.x = targetX;
        this.lookingAt.y = targetY;
    }

    updateHUD(data) {
        if (data.RTT) {
            qs('.latencyData').innerHTML = data.RTT;
        }
        if (data.RTTAverage) {
            qs('.averageLatencyData').innerHTML = truncateDecimals(data.RTTAverage, 2);
        }
    }

    updateScore(data) {
        let scoreContainer = qs('.score');
        let scoreArray = [];

        // remove score lines with objects that don't exist anymore
        let scoreEls = scoreContainer.querySelectorAll('.line');
        for (let x = 0; x < scoreEls.length; x++) {
            if (data[scoreEls[x].dataset.objId] === null) {
                scoreEls[x].parentNode.removeChild(scoreEls[x]);
            }
        }

        for (let id of Object.keys(data)) {
            let scoreEl = scoreContainer.querySelector(`[data-obj-id='${id}']`);
            // create score line if it doesn't exist
            if (scoreEl === null) {
                scoreEl = document.createElement('div');
                scoreEl.classList.add('line');
                if (this.playerFish && this.playerFish.id === parseInt(id)) scoreEl.classList.add('you');
                scoreEl.dataset.objId = id;
                scoreContainer.appendChild(scoreEl);
            }

            // stupid string/number conversion
            if (this.sprites[parseInt(id)])
                this.sprites[parseInt(id)].actor.changeName(data[id].name);

            scoreEl.innerHTML = `${data[id].name}: ${data[id].points}`;

            scoreArray.push({
                el: scoreEl,
                data: data[id]
            });
        }

        scoreArray.sort((a, b) => {
            return a.data.points < b.data.points;
        });

        for (let x = 0; x < scoreArray.length; x++) {
            scoreArray[x].el.style.transform = `translateY(${x}rem)`;
        }

    }

    onKeyChange(e) {
        if (this.playerFish) {
            if (e.keyName === 'up') {
                this.playerFish.actor.thrustEmitter.emit = e.isDown;
            }
        }
    }

    enableFullScreen() {
        let isInFullScreen = (document.fullScreenElement && document.fullScreenElement !== null) ||    // alternative standard method
            (document.mozFullScreen || document.webkitIsFullScreen);

        let docElm = document.documentElement;
        if (!isInFullScreen) {

            if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
            } else if (docElm.mozRequestFullScreen) {
                docElm.mozRequestFullScreen();
            } else if (docElm.webkitRequestFullScreen) {
                docElm.webkitRequestFullScreen();
            }
        }
    }

    /*
     * Takes in game coordinates and translates them into screen coordinates
     * @param obj an object with x and y properties
     */
    gameCoordsToScreen(obj) {
        // console.log(obj.x , this.viewportWidth / 2 , this.camera.x)
        return {
            x: obj.position.x + this.camera.x,
            y: obj.position.y + this.camera.y
        };
    }

}

function getCentroid(objects) {
    let maxDistance = 500; // max distance to add to the centroid
    let shipCount = 0;
    let centroid = {x: 0, y: 0};
    let selectedShip = null;

    for (let id of Object.keys(objects)) {
        let obj = objects[id];
        if (obj.class === Fish) {
            if (selectedShip === null)
                selectedShip = obj;

            let objDistance = Math.sqrt(Math.pow((selectedShip.position.x - obj.position.y), 2) + Math.pow((selectedShip.position.y - obj.position.y), 2));
            if (selectedShip === obj || objDistance < maxDistance) {
                centroid.x += obj.position.x;
                centroid.y += obj.position.y;
                shipCount++;
            }
        }
    }

    centroid.x /= shipCount;
    centroid.y /= shipCount;

    return centroid;
}

// convenience function
function qs(selector) {
    return document.querySelector(selector);
}

function truncateDecimals(number, digits) {
    let multiplier = Math.pow(10, digits);
    let adjustedNum = number * multiplier;
    let truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

    return truncatedNum / multiplier;
};

function isMacintosh() {
    return navigator.platform.indexOf('Mac') > -1;
}

function isWindows() {
    return navigator.platform.indexOf('Win') > -1;
}

module.exports = TapchanRenderer;
