'use strict';

const ServerEngine = require('lance-gg').ServerEngine;
const nameGenerator = require('./NameGenerator');
const NUM_BOTS = 10;
const NUM_FOOD = 100;
const NUM_ENEMIES = 40;

class TapchanServerEngine extends ServerEngine {
    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.serializer.registerClass(require('../common/Missile'));
        this.serializer.registerClass(require('../common/Ship'));
        this.serializer.registerClass(require('../common/Food'));
        this.serializer.registerClass(require('../common/UFO'));

        this.scoreData = {};
    }

    start() {
        super.start();
        for (let x = 0; x < NUM_BOTS; x++) this.makeBot();
        for (let i = 0; i < NUM_FOOD; i++) this.gameEngine.makeFood();
        for (let i = 0; i < NUM_ENEMIES; i++) this.summonUFO();

        this.gameEngine.on('foodEaten', (e) => {
            //add points
            if (this.scoreData[e.ship.id]) this.scoreData[e.ship.id].points++;
            this.updateScore();

            setTimeout(() => this.gameEngine.makeFood(), 3000);
        });

        this.gameEngine.on('missileHit', (e) => {
            // add points
            if (this.scoreData[e.missile.ownerId]) this.scoreData[e.missile.ownerId].points++;
            // remove score data for killed ship
            delete this.scoreData[e.ship.id];
            this.updateScore();

            console.log(`ship killed: ${e.ship.toString()}`);
            this.gameEngine.removeObjectFromWorld(e.ship.id);
            if (e.ship.isBot) {
                setTimeout(() => this.makeBot(), 5000);
            }
        });

        this.gameEngine.on('playerHit', e => {
            delete this.scoreData[e.ship.id];
            this.updateScore();
            // this.gameEngine.destroyShip(e.ship.id);
            this.gameEngine.removeObjectFromWorld(e.ship.id);
            if (e.ship.isBot) setTimeout(() => this.makeBot(), 5000);
        });
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        let makePlayerShip = () => {
            let ship = this.gameEngine.makeShip(socket.playerId);

            this.scoreData[ship.id] = {
                points: 0,
                name: nameGenerator('general')
            };
            this.updateScore();
        };

        // handle client restart requests
        socket.on('requestRestart', makePlayerShip);
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);

        // iterate through all objects, delete those that are associated with the player
        for (let objId of Object.keys(this.gameEngine.world.objects)) {
            let obj = this.gameEngine.world.objects[objId];
            if (obj.playerId == playerId) {
                // remove score data
                if (this.scoreData[objId]) {
                    delete this.scoreData[objId];
                }
                delete this.gameEngine.world.objects[objId];
            }
        }

        this.updateScore();
    }

    summonUFO() {
        let ufo = this.gameEngine.makeUFO();
        ufo.attachAI();
    }

    makeBot() {
        let bot = this.gameEngine.makeShip(0);
        bot.attachAI();

        this.scoreData[bot.id] = {
            points: 0,
            name: nameGenerator('general') + 'Bot'
        };

        this.updateScore();
    }

    updateScore() {
        // delay so player socket can catch up
        setTimeout(() => {
            this.io.sockets.emit('scoreUpdate', this.scoreData);
        }, 1000);

    }
}

module.exports = TapchanServerEngine;
