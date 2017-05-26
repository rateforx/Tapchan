/**
 * Created by Snippy on 2017-05-23.
 */

const Serializer = require('lance-gg').serialize.Serializer;
const DynamicObject = require('lance-gg').serialize.DynamicObject;
const TwoVector = require('lance-gg').serialize.TwoVector;

class Mine extends DynamicObject {

    toString() { return `Mine::${super.toString()}`; }

    get bendingAngleLocalMultiple() { return 0.0; }

    constructor(id, gameEngine, x, y) {
        super(id, new TwoVector(x, y));
        this.class = Mine;
        this.gameEngine = gameEngine;
        this.angle = Math.random() * 360;

        // this.velocity.set(Math.random() * 10, Math.random() * 10);
    }
}
module.exports = Mine;