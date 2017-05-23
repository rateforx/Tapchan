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

    constructor(id, x, y) {
        super(id, new TwoVector(x, y));
        Math.floor(Math.random() * 100) > 50
            ? this.isRotatingRight = true
            : this.isRotatingLeft = true;
        this.rotationSpeed = Math.floor(Math.random() * 10);
        this.class = Food;
    }
}
module.exports = Food;