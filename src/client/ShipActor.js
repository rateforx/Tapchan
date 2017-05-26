const PIXI = require("pixi.js");
const PixiParticles = require("pixi-particles");
const TrailEmitterConfig = require("./TrailEmitter.json");
const ExplosionEmitterConfig = require("./ExplosionEmitter.json");

class ShipActor {

    constructor(renderer) {
        this.gameEngine = renderer.gameEngine;
        this.backLayer = renderer.layer1;
        this.sprite = new PIXI.Container();
        this.fishContainerSprite = new PIXI.Container();

        this.fishSprite = new PIXI.Sprite(PIXI.loader.resources.whale.texture);

        //keep a reference to the actor from the sprite
        this.sprite.actor = this;

        this.fishSprite.anchor.set(.5, .5);
        this.fishSprite.width = 100;
        this.fishSprite.height = 50;


        this.addThrustEmitter();
        this.sprite.addChild(this.fishContainerSprite);
        this.fishContainerSprite.addChild(this.fishSprite);
    }

    renderStep(delta) {
        if (this.thrustEmitter) {
            this.thrustEmitter.update(delta * 0.001);

            this.thrustEmitter.spawnPos.x = this.sprite.x - Math.cos(-this.fishContainerSprite.rotation) * 4;
            this.thrustEmitter.spawnPos.y = this.sprite.y + Math.sin(-this.fishContainerSprite.rotation) * 4;

            this.thrustEmitter.minStartRotation = this.fishContainerSprite.rotation * 180 / Math.PI + 180 - 1;
            this.thrustEmitter.maxStartRotation = this.fishContainerSprite.rotation * 180 / Math.PI + 180 + 1;
        }
        if (this.explosionEmitter) {
            this.explosionEmitter.update(delta * 0.001);
        }

    }

    addThrustEmitter() {
        this.thrustEmitter = new PIXI.particles.Emitter(
            this.backLayer,
            [PIXI.loader.resources.bubble.texture],
            TrailEmitterConfig
        );
        this.thrustEmitter.emit = false;

        this.explosionEmitter = new PIXI.particles.Emitter(
            this.fishContainerSprite,
            [PIXI.loader.resources.bubble.texture],
            ExplosionEmitterConfig
        );

        this.explosionEmitter.emit = false;
    }

    changeName(name) {
        if (this.nameText) {
            this.nameText.destroy();
        }
        this.nameText = new PIXI.Text(name, {fontFamily: "arial", fontSize: "14px", fill: "white"});
        this.nameText.anchor.set(0.5, 0.5);
        this.nameText.y = -40;
        this.nameText.alpha = 0.3;
        this.sprite.addChild(this.nameText);
    }

    destroy() {
        return new Promise((resolve) => {
            this.explosionEmitter.emit = true;

            if (this.nameText)
                this.nameText.destroy();
            this.thrustEmitter.destroy();
            this.thrustEmitter = null;
            this.fishSprite.destroy();

            setTimeout(() => {
                this.fishContainerSprite.destroy();
                this.explosionEmitter.destroy();
                resolve();
            }, 3000);
        });
    }

}


module.exports = ShipActor;
