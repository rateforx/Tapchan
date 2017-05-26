/**
 * Created by Snippy on 2017-05-23.
 */

const Serializer = require('lance-gg').serialize.Serializer;
const DynamicObject = require('lance-gg').serialize.DynamicObject;
const TwoVector = require('lance-gg').serialize.TwoVector;

class Mine extends DynamicObject {

    toString() { return `Mine::${super.toString()}`; }

    get bendingAngleLocalMultiple() { return 0.0; }

    constructor(id, position) {
        super(id, position);
        this.class = Mine;
        this.angle = Math.random() * 360;
    }
}
module.exports = Mine;