'use strict';

const ServerEngine = require('lance-gg').ServerEngine;
const nameGenerator = require('./NameGenerator');

const MAX_PLAYERS = 24;
const START_BOTS = 5;
const START_FOOD = 40;
const NUM_MINES = 20;

class TapchanServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.serializer.registerClass(require('../common/Fish'));
        this.serializer.registerClass(require('../common/Food'));
        this.serializer.registerClass(require('../common/Mine'));

        this.scoreData = {};
    }

    start() {
        super.start();
        for (let i = 0; i < START_BOTS; i++) this.makeBot();
        for (let i = 0; i < START_FOOD; i++) this.gameEngine.makeFood();
        for (let i = 0; i < NUM_MINES; i++) this.gameEngine.makeMine();
        
        this.gameEngine.on('foodEaten', e => {
            // this.gameEngine.destroyFood(e.food.id);
            //add points
            if (this.scoreData[e.fish.id])
                e.food.isSuper
                    ? this.scoreData[e.fish.id].points += 10
                    : this.scoreData[e.fish.id].points++;
            this.updateScore();

            setTimeout(() => this.gameEngine.makeFood(), 500);
        });

        this.gameEngine.on('playerHit', e => {
            delete this.scoreData[e.fish.id];
            this.updateScore();
            this.gameEngine.destroyFish(e.fish.id);
            // this.gameEngine.destroyMine(e.mine.id);
            setTimeout(() => this.gameEngine.makeMine(), 3000);
            if (e.fish.isBot) setTimeout(() => this.makeBot(), 5000);
        });
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        let makePlayerFish = () => {
            let fish = this.gameEngine.makeFish(socket.playerId);

            this.scoreData[fish.id] = {
                points: 0,
                name: nameGenerator('general')
            };
            this.updateScore();
        };

        // handle client restart requests
        socket.on('requestRestart', makePlayerFish);
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);

        // iterate through all objects, delete those that are associated with the player
        for (let objId of Object.keys(this.gameEngine.world.objects)) {
            let obj = this.gameEngine.world.objects[objId];
            if (obj.playerId === playerId) {
                // remove score data
                if (this.scoreData[objId]) {
                    delete this.scoreData[objId];
                }
                delete this.gameEngine.world.objects[objId];
            }
        }

        this.updateScore();
    }

    makeBot() {
        let bot = this.gameEngine.makeFish(0);
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
