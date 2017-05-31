/**
 * Created by Snippy on 2017-05-23.
 */

const Serializer = require('lance-gg').serialize.Serializer;
const DynamicObject = require('lance-gg').serialize.DynamicObject;

class Mine extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            armed: { type: Serializer.TYPES.INT8 }
        }, super.netScheme);
    }

    toString() { return `Mine::${super.toString()}`; }

    constructor(id, position) {
        super(id, position);
        this.class = Mine;
        this.angle = Math.random() * 360;
        this.velocity.set(Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.armed = false;
        setTimeout(() => this.armed = true, 3000);
    }
}
module.exports = Mine;