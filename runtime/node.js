// Copyright (c) 2013, Fabrice Robinet
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

var Montage = require("montage").Montage;
var Component3D = require("runtime/component-3d").Component3D;
var Transform = require("runtime/transform").Transform;
var BasicAnimation = require("runtime/animation").BasicAnimation;
require("runtime/dependencies/gl-matrix");

exports.Node = Component3D.specialize( {

    constructor: {
        value: function Node() {
            this.super();
            //FIXME: these guys are not removed
            this._hidden = false;
            this._visibility = "visible";
            this._offsetMatrix = mat4.identity();

            this.addOwnPropertyChangeListener("hidden", this);
            this.addOwnPropertyChangeListener("visibility", this);
            this.addOwnPropertyChangeListener("offsetMatrix", this);
            this.addOwnPropertyChangeListener("originVector", this);
            this.addOwnPropertyChangeListener("glTFElement", this);
        }
    },

    animationDidStart: {
        value: function(animation) {
        }
    },

    animationDidStop: {
        value: function(animation) {
        }
    },

    animationDidUpdate: {
        value: function(animation) {
        }
    },

    handleGlTFElementChange: {
        value: function() {
            this.handleHiddenChange();
            this.handleVisibilityChange();
            this.handleOffsetMatrixChange();
            this.handleOriginVectorChange();

            this._applyCSSPropertyWithValueForState(this.__STYLE_DEFAULT__, "offsetMatrix", this._offsetMatrix);

        }
    },

    handleHiddenChange: {
        value: function() {
            if (this.glTFElement != null) {
                this.glTFElement.hidden = this._hidden;
                //FIXME: user a more appropriate name for this, it will just trigger a redraw
                this.scene.dispatchEventNamed("materialUpdate", true, false, this);
            }
        }
    },

    handleVisibilityChange: {
        value: function() {
            if (this.glTFElement != null) {
                this.glTFElement.hidden = this.visibility ? this.visibility === "hidden" : false;
                //FIXME: user a more appropriate name for this, it will just trigger a redraw
                this.scene.dispatchEventNamed("materialUpdate", true, false, this);
            }
        }
    },

    offsetMatrix_animationSetter: {
        set: function(value) {
            this._offsetMatrix = value.matrix;
            this.handleOffsetMatrixChange();
        }
    },

    handleOffsetMatrixChange: {
        value: function() {
            if (this.glTFElement != null) {
                //access a private property. not sure yet which name would be the most appropriate yet
                this.glTFElement._offsetMatrix = this._offsetMatrix;
                //FIXME: user a more appropriate name for this, it will just trigger a redraw
                this.scene.dispatchEventNamed("materialUpdate", true, false, this);
            }
        }
    },

    handleOriginVectorChange: {
        value: function() {
            if (this.glTFElement != null) {
                this.glTFElement._originVector = this._originVector;
                //FIXME: user a more appropriate name for this, it will just trigger a redraw
                this.scene.dispatchEventNamed("materialUpdate", true, false, this);
            }
        }
    },

    _hidden: { value: false, writable:true },

    //deprecated - just kept for the den-demo
    hidden: {
        set: function(value) {
            if (this._hidden != value) {
                this._hidden = value;
            }
        },
        get: function() {
            return this._hidden;
        }
    },

    _visibility: { value: false, writable:true },

    visibility: {
        set: function(value) {
            this._visibility = value;
        },
        get: function() {
            return this._visibility;
        }
    },

    _transform: { value: null, writable:true },

    transform: {
        set: function(value) {
            this._transform = value;
        },
        get: function() {
            return this._transform;
        }
    },

    _offsetMatrix: { value: null, writable:true },

    offsetMatrix: {
        set: function(value) {
            if (this.glTFElement) {
                var animationManager = this.scene.glTFElement.animationManager;
                animationManager.removeAnimationWithTargetAndPath(this, "offsetMatrix_animationSetter");
                if (this._style) {
                    if (this._style.transitions) {
                        var transition = this._style.transitions["offsetMatrix"];
                        if (transition != null) {
                            if (transition.duration > 0) {
                                var fromTr = Object.create(Transform).init();
                                var toTr = Object.create(Transform).init();
                                fromTr.matrix = this._offsetMatrix;
                                toTr.matrix = value;
                                var  transformAnimation = Object.create(BasicAnimation).init();
                                transformAnimation.path = "offsetMatrix_animationSetter";
                                transformAnimation.target = this;
                                transformAnimation.delegate = this;
                                transformAnimation.from = fromTr;
                                transformAnimation.to = toTr;
                                transformAnimation.duration = transition.duration * 1000;
                                animationManager.playAnimation(transformAnimation);
                                transformAnimation.animationWasAddedToTarget();
                                animationManager.evaluateAtTime(Date.now());
                                return;
                            }
                        }
                    }
                }
            }

            this._offsetMatrix = value;
        },
        get: function() {
            return this._offsetMatrix;
        }
    },

    _originVector: { value: null, writable:true },

    originVector: {
        set: function(value) {
            this._originVector = value;
        },
        get: function() {
            return this._originVector;
        }
    },

    _observers: { value: null, writable: true},

    addObserver: {
        value: function(observer) {
            if (this._observers == null) {
                this._observers = [];
            }

            if (this._observers.indexOf(observer) === -1) {
                this._observers.push(observer);
            } else {
                console.log("WARNING attempt to add 2 times the same observer in glTFNode")
            }
        }
    },

    removeObserver: {
        value: function(observer) {
            if (this._observers) {
                var index = this._observers.indexOf(observer);
                if (index !== -1) {
                    this._observers.splice(index, 1);
                }
            }
        }
    },

    _stylableProperties: { value: ["visibility", "offsetMatrix", "originVector"]},

    styleableProperties: {
        get: function() {
            return this._stylableProperties;
        }
    },

    initialValueForStyleableProperty: {
        value: function(property) {
            if (property === "visibility") {
                return "visible";
            } else if (property === "offsetMatrix") {
                return mat4.identity();
            } else if (property === "originVector") {
                return vec3.createFrom(50, 50, 50);
            }
        }
    }

});
