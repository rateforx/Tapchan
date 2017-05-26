'use strict';

const GameEngine = require('lance-gg').GameEngine;

const Fish = require('./Fish');
const Food = require('./Food');
const Mine = require('./Mine');

const TwoVector = require('lance-gg').serialize.TwoVector;
const Timer = require('./Timer');

class TapchanGameEngine extends GameEngine {

    start() {
        super.start();

        this.timer = new Timer();
        this.timer.play();
        this.on('server__postStep', () => {
            this.timer.tick();
        });

        this.worldSettings = {
            worldWrap: true,
            width: 3000,
            height: 3000
        };

        this.on('collisionStart', (e) => {
            let collisionObjects = Object.keys(e).map(k => e[k]);
            console.log(`COLLISION:\n ${Object.keys(e)}\n${collisionObjects}`);

            let fish = collisionObjects.find(o => o.class === Fish);
            let food = collisionObjects.find(o => o.class === Food);
            let mine = collisionObjects.find(o => o.class === Mine);

            if (fish && food) {
                this.destroyFood(food.id);
                this.emit('foodEaten', { food, fish });

            } else if (fish && mine) {
                // this.destroyMine(mine.id);
                this.emit('playerHit', { fish, mine });
            }
        });
        this.on('postStep', this.reduceVisibleThrust.bind(this));
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
            if (o.playerId === playerId && o.class === Fish) {
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
                //     this.makeMissile(playerFish, inputData.messageIndex);
                //     this.emit('fireMissile');
            }
        }
    };

    makeFish(playerId) {
        let newShipX = Math.floor(Math.random() * (this.worldSettings.width - 200)) + 200;
        let newShipY = Math.floor(Math.random() * (this.worldSettings.height - 200)) + 200;

        let fish = new Fish(++this.world.idCount, this, new TwoVector(newShipX, newShipY));
        fish.playerId = playerId;
        this.addObjectToWorld(fish);
        console.log(`ship added: ${fish.toString()}`);

        return fish;
    };
    makeFood() {
        let x = Math.floor(Math.random() * (this.worldSettings.width - 200)) + 200;
        let y = Math.floor(Math.random() * (this.worldSettings.height - 200)) + 200;

        // let food = new Food(++this.world.idCount, this, x, y);
        let isSuper = Math.random() > .9;
        let food = new Food(++this.world.idCount, this, x, y, isSuper);
        // food.setConstRotation();
        this.addObjectToWorld(food);
        console.log(`food added: ${food.toString()}`);

        return food;
    }
    makeMine() {
        let x = Math.floor(Math.random() * (this.worldSettings.width - 200)) + 200;
        let y = Math.floor(Math.random() * (this.worldSettings.height - 200)) + 200;

        let mine = new Mine(++this.world.idCount, this, x, y);
        mine = this.addObjectToWorld(mine);
        console.log(`ufo added: ${mine.toString()}`);

        return mine;
    }
    /*makeMissile(playerFish, inputId) {
     let missile = new Missile(++this.world.idCount);
     missile.position.copy(playerFish.position);
     missile.velocity.copy(playerFish.velocity);
     missile.angle = playerFish.angle;
     missile.playerId = playerFish.playerId;
     missile.ownerId = playerFish.id;
     missile.inputId = inputId;
     missile.velocity.x += Math.cos(missile.angle * (Math.PI / 180)) * 10;
     missile.velocity.y += Math.sin(missile.angle * (Math.PI / 180)) * 10;

     this.trace.trace(`missile[${missile.id}] created vel=${missile.velocity}`);

     let obj = this.addObjectToWorld(missile);
     if (obj)
     this.timer.add(40, this.destroyMissile, this, [obj.id]);

     return missile;
     }*/

    destroyFood(foodId) {
        if (this.world.objects[foodId] && this.world.objects[foodId].class === Food) {
            this.removeObjectFromWorld(foodId);
        }
    }
    destroyFish(fishId) {
        if (this.world.objects[fishId] && this.world.objects[fishId].class === Fish) {
            this.removeObjectFromWorld(fishId);
        }
    }
    destroyMine(mineId) {
        if (this.world.objects[mineId] && this.world.objects[mineId].class === Mine)
            this.removeObjectFromWorld(mineId);
    }
    /*destroyMissile(missileId) {
     if (this.world.objects[missileId] && this.world.objects[missileId].class === Missile) {
     this.trace.trace(`missile[${missileId}] destroyed`);
     this.removeObjectFromWorld(missileId);
     }
     }*/

}

module.exports = TapchanGameEngine;
