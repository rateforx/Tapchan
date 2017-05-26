/**
 * Created by Snippy on 2017-05-23.
 */

const Serializer = require('lance-gg').serialize.Serializer;
const DynamicObject = require('lance-gg').serialize.DynamicObject;
const TwoVector = require('lance-gg').serialize.TwoVector;

class Food extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            isSuper: { type: Serializer.TYPES.INT8 }
        }, super.netScheme);
    }

    toString() {
        let s = ``;
        if (this.isSuper) s = `Super`;
        return s + `Food::${super.toString()}`;
    }

    constructor(id, gameEngine, x, y, isSuper) {
        super(id, new TwoVector(x, y));
        this.gameEngine = gameEngine;
        this.isSuper = isSuper;
        this.class = Food;
        this.angle = Math.random() * 360 % 360;
    }
}
module.exports = Food;