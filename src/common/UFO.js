/**
 * Created by Snippy on 2017-05-23.
 */

const Serializer = require('lance-gg').serialize.Serializer;
const DynamicObject = require('lance-gg').serialize.DynamicObject;
const Utils = require('./Utils');
const TwoVector = require('lance-gg').serialize.TwoVector;

const Ship = require('./Ship');

class UFO extends DynamicObject {

    toString() { return `UFO::${super.toString()}`; }

    get bendingAngleLocalMultiple() { return 0.0; }

    constructor(id, gameEngine, x, y) {
        super(id, new TwoVector(x, y));
        this.class = UFO;
        this.gameEngine = gameEngine;
    }

    destroy() {

    }

    attachAI() {
        this.onPreStep = () => {
            this.steer();
        };

        this.gameEngine.on('preStep', this.onPreStep);

        //chase player
    }

    distanceToTargetSquared(target) {
        let dx = this.shortestVector(this.position.x, target.position.x, this.gameEngine.worldSettings.width);
        let dy = this.shortestVector(this.position.y, target.position.y, this.gameEngine.worldSettings.height);
        return dx * dx + dy * dy;
    }

    shortestVector(p1, p2, wrapDist) {
        let d = Math.abs(p2 - p1);
        if (d > Math.abs(p2 + wrapDist - p1)) p2 += wrapDist;
        else if (d > Math.abs(p1 + wrapDist - p2)) p1 += wrapDist;
        return p2 - p1;
    }

    steer() {
        let closestTarget = null;
        let closestDistance = Infinity;

        for (let objId of Object.keys(this.gameEngine.world.objects)) {
            let obj = this.gameEngine.world.objects[objId];
            if (obj.class === Ship) {
                let distance = this.distanceToTargetSquared((obj));
                if (distance < closestDistance) {
                    closestTarget = obj;
                    closestDistance = distance;
                }
            }
        }

        this.target = closestTarget;

        if (this.target) {
            let newVX = this.shortestVector(
                this.position.x, this.target.position.x, this.gameEngine.worldSettings.width);
            let newVY = this.shortestVector(
                this.position.y, this.target.position.y, this.gameEngine.worldSettings.height);
            let angleToTarget = Math.atan2(newVX, newVY) / Math.PI * 180;
            angleToTarget *= -1;
            angleToTarget += 90;
            if (angleToTarget < 0) angleToTarget += 360;

            this.angle = angleToTarget;
            this.isAccelerating = true;
        }
    }
}
module.exports = UFO;