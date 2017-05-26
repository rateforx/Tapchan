const ClientEngine = require('lance-gg').ClientEngine;
const TapchanRenderer = require('./TapchanRenderer');
const MobileControls = require('../client/MobileControls');
const KeyboardControls = require('../client/KeyboardControls');
const Fish = require('../common/Fish');
const Utils = require('./../common/Utils');

class TapchanClientEngine extends ClientEngine {
    constructor(gameEngine, options) {
        super(gameEngine, options, TapchanRenderer);

        this.serializer.registerClass(require('../common/Fish'));
        this.serializer.registerClass(require('../common/Food'));
        this.serializer.registerClass(require('../common/Mine'));

        this.gameEngine.on('client__preStep', this.preStep.bind(this));
    }

    start() {

        super.start();

        // handle gui for game condition
        this.gameEngine.on('objectDestroyed', (obj) => {
            if (obj.class === Fish && this.isOwnedByPlayer(obj)) {
                document.body.classList.add('lostGame');
                document.querySelector('#tryAgain').disabled = false;
            }
        });

        this.gameEngine.once('renderer.ready', () => {
            // click event for "try again" button
            document.querySelector('#tryAgain').addEventListener('click', () => {
                if (Utils.isTouchDevice()){
                    this.renderer.enableFullScreen();
                }
                this.socket.emit('requestRestart');
            });

            document.querySelector('#joinGame').addEventListener('click', () => {
                if (Utils.isTouchDevice()){
                    this.renderer.enableFullScreen();
                }
                this.socket.emit('requestRestart');
            });

            document.querySelector('#reconnect').addEventListener('click', () => {
                window.location.reload();
            });

            //  Game input
            if (Utils.isTouchDevice()){
                this.controls = new MobileControls(this.renderer);
            } else {
                this.controls = new KeyboardControls(this.renderer);
            }

            this.controls.on('fire', () => {
                this.sendInput('space');
            });

        });

        // allow a custom path for sounds
        let assetPathPrefix = this.options.assetPathPrefix ? this.options.assetPathPrefix : '';

        this.gameEngine.on('fireMissile', () => { this.sounds.fireMissile.play(); });
        this.gameEngine.on('missileHit', () => {
            // don't play explosion sound if the player is not in game
            if (this.renderer.playerFish) {
                this.sounds.missileHit.play();
            }
        });

        this.networkMonitor.on('RTTUpdate', (e) => {
            this.renderer.updateHUD(e);
        });
    }

    // extend ClientEngine connect to add own events
    connect() {
        return super.connect().then(() => {
            this.socket.on('scoreUpdate', (e) => {
                this.renderer.updateScore(e);
            });

            this.socket.on('disconnect', (e) => {
                console.log('disconnected');
                document.body.classList.add('disconnected');
                document.body.classList.remove('gameActive');
                document.querySelector('#reconnect').disabled = false;
            });

            if ('autostart' in Utils.getUrlVars()) {
                this.socket.emit('requestRestart');
            }
        });
    }

    // our pre-step is to process inputs that are "currently pressed" during the game step
    preStep() {
        if (this.controls) {
            if (this.controls.activeInput.up) {
                this.sendInput('up', { movement: true });
            }

            if (this.controls.activeInput.left) {
                this.sendInput('left', { movement: true });
            }

            if (this.controls.activeInput.right) {
                this.sendInput('right', { movement: true });
            }
        }
    }

}

module.exports = TapchanClientEngine;
