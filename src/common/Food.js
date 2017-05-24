/**
 * Created by Snippy on 2017-05-23.
 */

const Serializer = require('lance-gg').serialize.Serializer;
const DynamicObject = require('lance-gg').serialize.DynamicObject;
const TwoVector = require('lance-gg').serialize.TwoVector;

class Food extends DynamicObject {

    static get netScheme() {
        return Object.assign({

        }, super.netScheme)
    }

    toString() {
        return `Food::${super.toString()}`;
    }

    syncTo(other) {
        super.syncTo(other);
    }

    constructor(id, gameEngine, x, y, isSuperfood) {
        super(id, new TwoVector(x, y));
        this.gameEngine = gameEngine;
        this.superFood = isSuperfood === true;
        /*Math.floor(Math.random()) > .5
            ? this.isRotatingRight = true
            : this.isRotatingLeft = true;
        this.constRotation = this.isRotatingRight ? 'right' : 'left';*/
        this.constRotation = Math.floor(Math.random()) > .5 ? 'right' : 'left';
        this.rotationSpeed = Math.random() * 10 + 5;
        this.class = Food;
    }

    setConstRotation() {
        this.onPreStep = () => {
            this.constRotation === 'right'
                ? this.isRotatingRight = true
                : this.isRotatingLeft = true;
        };
        this.gameEngine.on('preStep', this.onPreStep);
    }

    get isSuperFood() { return this.isSuperFood; }
}
module.exports = Food;