'use strict';

const GameEngine = require('lance-gg').GameEngine;

const Missile= require('./Missile');
const Ship = require('./Ship');
const Food = require('./Food');
const UFO = require('./UFO');

const TwoVector = require('lance-gg').serialize.TwoVector;
const Timer = require('./Timer');

class TapchanGameEngine extends GameEngine {

    start() {
        super.start();

        this.timer = new Timer();
        this.timer.play();
        this.on('server__postStep',() => {
            this.timer.tick();
        });

        this.worldSettings = {
            worldWrap: true,
            width: 3000,
            height: 3000
        };

        this.on('collisionStart', (e) => {
            let collisionObjects = Object.keys(e).map(k => e[k]);
            // console.log(`COLLISION:\n ${Object.keys(e)}\n${collisionObjects}`);

            let pacman = collisionObjects.find(o => o.class === Ship);
            // let missile = collisionObjects.find(o => o.class === Missile);
            let food = collisionObjects.find(o => o.class === Food);
            let ufo = collisionObjects.find(o => o.class === UFO);

            if (pacman && food) {
                this.destroyFood(food.id);
                this.emit('foodEaten', { food, pacman });

            } else if (pacman && ufo) {
                this.emit('playerHit', { pacman });
            }

            // if (!pacman || !food)
            //     return;
            // if (missile.ownerId !== pacman.id) {
            //     that.destroyMissile(missile.id);
            //     that.trace.info(`missile by ship=${missile.ownerId} hit ship=${pacman.id}`);
            //     that.emit('missileHit', { missile, pacman });
            // }
        });

        this.on('postStep', this.reduceVisibleThrust.bind(this));

        /*this.on('server__playerDisconnected', (e) => {
            let playerData = Object.keys(e).map(k => e[k]);
            let playerId = playerData.playerId;

        })*/
    };

    reduceVisibleThrust(postStepEv) {
        if (postStepEv.isReenact)
            return;

        for (let objId of Object.keys(this.world.objects)) {
            let o = this.world.objects[objId];
            if (Number.isInteger(o.showThrust) && o.showThrust >= 1)
                o.showThrust--;
        }
    }

    processInput(inputData, playerId) {

        super.processInput(inputData, playerId);

        // get the player ship tied to the player socket
        let playerShip;

        for (let objId in this.world.objects) {
            let o = this.world.objects[objId];
            if (o.playerId == playerId && o.class == Ship) {
                playerShip = o;
                break;
            }
        }

        if (playerShip) {
            if (inputData.input == 'up') {
                playerShip.isAccelerating = true;
                playerShip.showThrust = 5; // show thrust for next steps.
            } else if (inputData.input == 'right') {
                playerShip.isRotatingRight = true;
            } else if (inputData.input == 'left') {
                playerShip.isRotatingLeft = true;
            } else if (inputData.input == 'space') {
            //     this.makeMissile(playerShip, inputData.messageIndex);
            //     this.emit('fireMissile');
            }
        }
    };

    // Makes a new ship, places it randomly and adds it to the game world
    makeShip(playerId) {
        let newShipX = Math.floor(Math.random()*(this.worldSettings.width-200)) + 200;
        let newShipY = Math.floor(Math.random()*(this.worldSettings.height-200)) + 200;

        let ship = new Ship(++this.world.idCount, this, new TwoVector(newShipX, newShipY));
        ship.playerId = playerId;
        this.addObjectToWorld(ship);
        console.log(`ship added: ${ship.toString()}`);

        return ship;
    };

    makeMissile(playerShip, inputId) {
        let missile = new Missile(++this.world.idCount);
        missile.position.copy(playerShip.position);
        missile.velocity.copy(playerShip.velocity);
        missile.angle = playerShip.angle;
        missile.playerId = playerShip.playerId;
        missile.ownerId = playerShip.id;
        missile.inputId = inputId;
        missile.velocity.x += Math.cos(missile.angle * (Math.PI / 180)) * 10;
        missile.velocity.y += Math.sin(missile.angle * (Math.PI / 180)) * 10;

        this.trace.trace(`missile[${missile.id}] created vel=${missile.velocity}`);

        let obj = this.addObjectToWorld(missile);
        if (obj)
            this.timer.add(40, this.destroyMissile, this, [obj.id]);

        return missile;
    }

    makeFood() {
        let x = Math.floor(Math.random() * (this.worldSettings.width - 200)) + 200;
        let y = Math.floor(Math.random() * (this.worldSettings.height - 200)) + 200;

        // let food = new Food(++this.world.idCount, this, x, y);
        let food = new Food(++this.world.idCount, this, x, y, false);
        // food.setConstRotation();
        this.addObjectToWorld(food);
        console.log(`food added: ${food.toString()}`);

        return food;
    }

    makeUFO() {
        let x = Math.floor(Math.random() * (this.worldSettings.width - 200)) + 200;
        let y = Math.floor(Math.random() * (this.worldSettings.height - 200)) + 200;

        let ufo = new UFO(++this.world.idCount, this, x, y);
        // ufo.attachAI();
        this.addObjectToWorld(ufo);
        console.log(`ufo added: ${ufo.toString()}`);

        return ufo;
    }

    // destroy the missile if it still exists
    destroyMissile(missileId) {
        if (this.world.objects[missileId]) {
            this.trace.trace(`missile[${missileId}] destroyed`);
            this.removeObjectFromWorld(missileId);
        }
    }

    destroyFood(foodId) {
        if (this.world.objects[foodId]) {
            this.removeObjectFromWorld(foodId);
        }
    }

    destroyShip(shipId) {
        if (this.world.object[shipId]) {
            this.removeObjectFromWorld(shipId);
        }

    }
}

module.exports = TapchanGameEngine;
