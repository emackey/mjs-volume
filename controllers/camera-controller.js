// Copyright (c) Fabrice ROBINET
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

require("runtime/dependencies/gl-matrix");
var Utilities = require("runtime/utilities").Utilities;
var Transform = require("runtime/transform").Transform;
var Montage = require("montage").Montage;

exports.CameraController = Montage.specialize( {

    // Montage
    constructor: {
        value: function View() {
            this.super();

            this._lastPosition = [0 ,0];
        }
    },

    _viewPoint: { value: null, writable: true},

    viewPoint: {
        get: function() {
            return this._viewPoint;
        },
        set: function(value) {
            if (this._viewPoint != value) {
                this._viewPoint = value;
                this.zoomStep = 0;
            }
        }
    },

    _node: { value: null, writable: true},

    zoomStep: { value: 0, writable: true },

    node: {
        get: function() {
            return this._node;
        },
        set: function(value) {
            if (this._node != value) {
                this._node = value;
                this.zoomStep = 0;
            }
        }
    },

    _lastPosition: { value: null, writable: true },

    _transform: { value: null, writable: true },

    _axisUp: { value: null, writable: true },

    zoom: {
        value: function(event) {
            if (this.moving)
                return;

            var self = this;
            var direction = vec3.create();
            var eye = vec3.create(this.viewPoint.glTFElement.transform.translation);

            var targetPosition;
            var rootNode = this.node.glTFElement;
            var sceneBBox =  rootNode.getBoundingBox(true);
            targetPosition = [
                (sceneBBox[0][0] + sceneBBox[1][0]) / 2,
                (sceneBBox[0][1] + sceneBBox[1][1]) / 2,
                (sceneBBox[0][2] + sceneBBox[1][2]) / 2];

            if (this.zoomStep == 0) {
                var lg = vec3.createFrom(sceneBBox[1][0] - sceneBBox[0][0], sceneBBox[1][1] - sceneBBox[0][1], sceneBBox[1][2] - sceneBBox[0][2])
                this.zoomStep = 0.0001 * vec3.length(lg);

            }

            direction[0] = targetPosition[0] - eye[0];
            direction[1] = targetPosition[1] - eye[1];
            direction[2] = targetPosition[2] - eye[2];
            vec3.normalize(direction);

            eye[0] += this.zoomStep * direction[0] * event.wheelDeltaY;
            eye[1] += this.zoomStep * direction[1] * event.wheelDeltaY;
            eye[2] += this.zoomStep * direction[2] * event.wheelDeltaY;

            this.viewPoint.glTFElement.transform.translation = eye;
        }
    },

    translate: {
        value: function(event) {
            this._transform.matrix = this.viewPoint.glTFElement.worldMatrix;
            if (this.moving == false)
                 return;

            var xDelta = event.translateX - this._lastPosition[0];
            var yDelta = event.translateY - this._lastPosition[1];

            this._lastPosition[0] = event.translateX;
            this._lastPosition[1] = event.translateY;

            xDelta  *=  0.05;
            yDelta  *=  -0.05;

            //if (this._axisUp == null) {
                this._axisUp = vec3.createFrom(0, 1, 0);
                mat4.rotateVec3(this._transform.matrix, this._axisUp);
            //}
            var hasTarget = false;
            var targetPosition;
            if (hasTarget == false) {
                var rootNode = this.node.glTFElement;
                var sceneBBox =  rootNode.getBoundingBox(true);
                targetPosition = [
                    (sceneBBox[0][0] + sceneBBox[1][0]) / 2,
                    (sceneBBox[0][1] + sceneBBox[1][1]) / 2,
                    (sceneBBox[0][2] + sceneBBox[1][2]) / 2];
            }
            var direction = vec3.create();
            var eye = vec3.create(this._transform.translation);

            direction[0] = targetPosition[0] - eye[0];
            direction[1] = targetPosition[1] - eye[1];
            direction[2] = targetPosition[2] - eye[2];

            var axisUpAdjusted = vec3.create(this._axisUp);
            var right = vec3.create();
            vec3.normalize(direction);
            vec3.cross(direction, this._axisUp, right);
            vec3.normalize(right);
            vec3.cross(direction, right, axisUpAdjusted);
            vec3.normalize(axisUpAdjusted);

            var cameraMat = mat4.identity();

            var ratio = 0;
            if (Math.abs(yDelta) > Math.abs(xDelta)) {
                ratio = Math.abs(yDelta) / Math.abs(xDelta);
            } else {
                ratio = Math.abs(xDelta) / Math.abs(yDelta);
            }

            if (ratio > 0.5) {
                mat4.rotate(cameraMat, xDelta, axisUpAdjusted);
                mat4.rotate(cameraMat, yDelta, right);
            } else
            if (Math.abs(yDelta) > Math.abs(xDelta))
                mat4.rotate(cameraMat, yDelta, right);
            else
                mat4.rotate(cameraMat, xDelta, axisUpAdjusted);

            eye[0] -= targetPosition[0];
            eye[1] -= targetPosition[1];
            eye[2] -= targetPosition[2];

            mat4.rotateVec3(cameraMat, eye);

            eye[0] += targetPosition[0];
            eye[1] += targetPosition[1];
            eye[2] += targetPosition[2];

            var  rotationMatrix = mat4.identity();
            mat4.multiply3(cameraMat, this._transform.matrix,  rotationMatrix);

            var translationMatrix = mat4.identity();
            mat4.translate(translationMatrix, eye);

            var finalMat = mat4.identity();
            mat4.multiply(translationMatrix, rotationMatrix, finalMat);
            this.viewPoint.glTFElement.transform.matrix = finalMat;
        }
    },

    beginTranslate: {
        value: function(event) {
            this.moving = true;
            if (this._transform == null) {
                this._transform = Object.create(Transform).init();
            }
            this._transform.matrix = this.viewPoint.glTFElement.worldMatrix;
        }
    },

    endTranslate: {
        value: function(event) {
            this.moving = false;

            this._axisUp = null;
        }
    }

});
