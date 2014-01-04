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
var glTFNode = require("runtime/glTF-node").glTFNode;
var Transform = require("runtime/transform").Transform;
var Target = require("montage/core/target").Target;
var Set = require("collections/set");
require("runtime/dependencies/CSSOM");
require("runtime/dependencies/gl-matrix");

//FIXME: add a state to now that resolution of id pending to avoid adding useless listeners
//This currently *can't* happen with the code path in use, the API would allow it.
exports.Component3D = Target.specialize( {

    _ENTER: { value: "COMPONENT_ENTER"},

    _EXIT: { value: "COMPONENT_EXIT"},

    _TOUCH_DOWN: { value: "_TOUCH_DOWN"},

    _TOUCH_UP: { value: "_TOUCH_UP"},

    //FIXME: work-around
    self: {
        get: function() {
            return this;
        }
    },

    constructor: {
        value: function Component3D() {
            this._hasUnresolvedId = true;
            this._state = this.__STYLE_DEFAULT__;
            this.super();
        }
    },

    handleEnteredDocument: {
        value: function() {
            this.classListDidChange();
        }
    },

    _glTFElement: { value : null, writable: true },

    glTFElement: {
        get: function() {
            return this._glTFElement;
        },
        set: function(value) {
            this._glTFElement = value;
        }
    },

    _scene: { value : null, writable: true },

    scene: {
        get: function() {
            return this._scene;
        },
        set: function(value) {
            this._scene = value;
            this._sceneDidChange();
        }
    },

    baseURL: {
        get: function() {
            return this.scene ? this.scene.glTFElement.baseURL : null;
        }
    },

    _isAbsolutePath: {
        value: function(path) {
            var isAbsolutePathRegExp = new RegExp("^"+window.location.protocol, "i");

            return path.match(isAbsolutePathRegExp) ? true : false;
        }
    },

    resolvePathIfNeeded: {
        value: function(path) {
            if (this._isAbsolutePath(path)) {
                return path;
            }

            return this.baseURL + path;
        }
    },

    name: {
        get: function() {
            if (this.glTFElement) {
                return this.glTFElement.name;
            }
        },
        set: function(value) {
            if (this.glTFElement) {
                this.glTFElement.name = value;
            }
        }
    },

    _hasUnresolvedId: { value: false, writable: true },

    handleStatusChange: {
        value: function(status, key, object) {
            if (status === "loaded") {
                if (this._id) {
                    this.glTFElement = this.scene.glTFElement.ids[this._id];
                    if (this.glTFElement == null) {
                        //FIXME: this should be probably fixed at the loader level instead of having a special case for root. TBD
                        if (this.scene.glTFElement.rootNode.id == this._id) {
                            this.glTFElement = this.scene.glTFElement.rootNode;
                        }
                    }
                    if (this.glTFElement) {
                        this._hasUnresolvedId = false;

                        //FIXME: this dependency could be broken by either:
                        // - creating a notification center
                        // - make glTFElement launch events
                        this.glTFElement.component3D = this;

                        this.classListDidChange();
                    }
                }
            }
        }
    },

    resolveIdIfNeeded: {
        value: function() {
            if (this._hasUnresolvedId && this.scene != null) {
                if (this.scene.status !== "loaded") {
                    this.scene.addOwnPropertyChangeListener("status", this);
                    return;
                }

                if (this._id) {
                    this.handleStatusChange(this.scene.status, "status", this.scene);
                }
            }
        }
    },

    _idDidChange: {
        value: function() {
            this.resolveIdIfNeeded();
        }
    },

    handleStyleSheetsChange: {
        value: function(value, key, object) {
            var self = this;
            setTimeout(function() {
                self.scene.removeOwnPropertyChangeListener(key, self);
            }, 1);
        }
    },

    _sceneDidChange: {
        value: function() {
            this.resolveIdIfNeeded();
            if (this.scene) {
                this.scene.addEventListener("enteredDocument", this);
            }
        }
    },

    removeAllCSSRules: {
        value: function() {

        }
    },

    __STYLE_DEFAULT__ : { value: "__default__"},

    _state: { value: this.__STYLE_DEFAULT__, writable: true },

    _stateForSelectorName: {
        value: function(selectorName) {
            var state = null;

            if (selectorName.indexOf(":active") !== -1) {
                return "active"
            } else if (selectorName.indexOf(":hover") !== -1) {
                return "hover"
            } else if (selectorName.indexOf(":") !== -1) {
                return  null;
            }

            //that's fragile, we won't need this once we handle all states
            return this.__STYLE_DEFAULT__;
        }
    },

    _style: { value: null, writable: true },

    _defaultTransition: { value: {"duration" : 0, "timingFunction" : "ease", "delay" : 0 } },

    _createDefaultStyleIfNeeded: {
        value: function() {
            if (this._style == null) {
                this._style = {};
            }
            if (this._style.transitions == null) {
                this._style.transitions = {};
            }
            return this._style;
        }
    },

    _createStyleStateAndPropertyIfNeeded:  {
        value: function(state, property) {
            var style = this._createDefaultStyleIfNeeded();

            if (style[state] == null) {
                style[state] = {};
            }

            var stateValue = style[state];
            if (stateValue[property] == null) {
                stateValue[property] = {};
            }

            return stateValue[property];
         }
    },

    _getStylePropertyObject: {
        value: function(state, property) {
            return this._createStyleStateAndPropertyIfNeeded(state, property);
        }
    },

    _checkTransformConsistency: {
        value : function(floatValues, expectedComponentsCount) {
            if (floatValues.length != expectedComponentsCount) {
                console.log("Component3D: CSS transform ignored got:"+floatValues.length+" but expecting:"+expectedComponentsCount);
                return false;
            }
            return true;
        }
    },

    _createVectorFromCSSTransformOriginDeclaration: {
        value: function(declaration) {
            var components = declaration.split(" ");
            var transformOrigin;
            if (components.length == 3) {
                transformOrigin = vec3.create();

                transformOrigin[0] = parseFloat(components[0]);
                transformOrigin[1] = parseFloat(components[1]);
                transformOrigin[2] = parseFloat(components[2]);

                return transformOrigin;
            }

            if (components.length == 2) {
                transformOrigin = vec3.create();

                transformOrigin[0] = parseFloat(components[0]);
                transformOrigin[1] = parseFloat(components[1]);
                transformOrigin[2] = 0;

                return transformOrigin;
            }


            return vec3.createFrom(50,50,0);
        }
    },

    _createTransformFromCSS: {
        value: function(declaration) {

            var PI = 3.1415926535;
            var DEG_TO_RAD = PI/180.0;

            var transform = Object.create(Transform).init();
            var rotation, translation, scale;
            var matrix = mat4.identity();
            var index = 0;
            declaration = declaration.trim();
            var end = 0, command;

            var scalesCount = 0;
            var rotationsCount = 0;
            var translationsCount = 0;
            var matricesCount = 0;

            while (end !== -1) {
                end = declaration.indexOf("(", index);
                if (end === -1)
                    break;
                command = declaration.substring(index, end);
                index = end + 1;

                end = declaration.indexOf(")", index);
                if (end === -1)
                    break;
                var valuesDec = declaration.substring(index, end);

                var values = valuesDec.indexOf(",") !== -1 ? valuesDec.split(",") : [valuesDec];

                var floatValues = new Float32Array(values.length);
                for (var i = 0 ; i < values.length ; i++) {
                    floatValues[i] = parseFloat(values[i]);
                }
                index = end + 1;

                switch(command.trim()) {
                    case "matrix3d":
                        if (this._checkTransformConsistency(floatValues, 16)) {
                            var m = floatValues;
                            var mat = mat4.createFrom(
                                m[0], m[1], m[2], m[3],
                                m[4], m[5], m[6], m[7],
                                m[8], m[9], m[10], m[11],
                                m[12], m[13], m[14], m[15]);
                            mat4.multiply(matrix, mat);
                            matricesCount++;
                        }
                        break;
                    case "translate3d":
                        if (this._checkTransformConsistency(floatValues, 3)) {
                            if (translationsCount === 0) 
                                transform.translation = vec3.create(floatValues);
                            mat4.translate(matrix, floatValues);
                            translationsCount++;
                        }
                        break;
                    case "translateX":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            translation = [floatValues[0], 0, 0];
                            if (translationsCount === 0) 
                                transform.translation = vec3.create(translation);
                            mat4.translate(matrix, translation);
                            translationsCount++;
                        }
                        break;
                    case "translateY":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            translation = [0, floatValues[0], 0];
                            if (translationsCount === 0) 
                                transform.translation = vec3.create(translation);
                            mat4.translate(matrix, translation);
                            translationsCount++;
                        }
                        break;
                    case "translateZ":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            translation = [0, 0, floatValues[0]];
                            if (translationsCount === 0) 
                                transform.translation = vec3.create(translation);
                            mat4.translate(matrix, translation);
                            translationsCount++;
                        }
                        break;
                    case "scale3d":
                        if (this._checkTransformConsistency(floatValues, 3)) {
                            if (scalesCount === 0) 
                                transform.scale = vec3.create(floatValues);
                            mat4.scale(matrix, floatValues);
                            translationsCount++;
                        }
                        break;
                    case "scaleX":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            scale = [floatValues[0], 1, 1];
                            if (scalesCount === 0) 
                                transform.scale = vec3.create(scale);
                            mat4.scale(matrix, scale);
                            scalesCount++;
                        }
                        break;
                    case "scaleY":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            scale = [1, floatValues[0], 1];
                            if (scalesCount === 0) 
                                transform.scale = vec3.create(scale);
                            mat4.scale(matrix, scale);
                            scalesCount++;
                        }
                        break;
                    case "scaleZ":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            scale = [1, 1, floatValues[0]];
                            if (scalesCount === 0) 
                                transform.scale = vec3.create(scale);
                            mat4.scale(matrix, scale);
                            scalesCount++;
                        }
                        break;
                    case "rotate3d":
                        if (this._checkTransformConsistency(floatValues, 4)) {
                            floatValues[3] *= DEG_TO_RAD;
                            if (rotationsCount === 0)
                                transform.rotation = floatValues;
                            mat4.rotate(matrix, floatValues[3], floatValues);
                            rotationsCount++;
                        }
                        break;
                    case "rotateX":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            rotation =  [1, 0, 0, floatValues[0]];
                            rotation[3] *= DEG_TO_RAD;
                            if (rotationsCount === 0)
                                transform.rotation = rotation;
                            mat4.rotate(matrix, rotation[3], rotation);
                            rotationsCount++;
                        }

                        break;
                    case "rotateY":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            rotation =  [0, 1, 0, floatValues[0]];
                            rotation[3] *= DEG_TO_RAD;
                            if (rotationsCount === 0) 
                                transform.rotation = rotation;
                            mat4.rotate(matrix, rotation[3], rotation);
                            rotationsCount++;
                        }
                        break;
                    case "rotateZ":
                        if (this._checkTransformConsistency(floatValues, 1)) {
                            rotation =  [0, 0, 1, floatValues[0]];
                            rotation[3] *= DEG_TO_RAD;
                            if (rotationsCount === 0) {
                                transform.rotation = rotation;
                            }
                            mat4.rotate(matrix, rotation[3], rotation);
                            rotationsCount++;
                        }
                        break;
                    case "perspective":
                        end = -1;
                        break;
                    default:
                        end = -1;
                        break;
                }
            }
            /*
                if we have more than exactly one scale / one rotation / one translation, 
                then we take the matrix we just built up
                Otherwise we just return the transform that has of the advantage of holding axis angle
                can represent any rotation angle...
            */
            if ((scalesCount > 1) || (rotationsCount > 1) || (translationsCount > 1) || (matricesCount > 0)) {
                transform.matrix = matrix;
            }
            return transform;
        }
    },

    _createTransitionFromComponents: {
        value: function(transitionComponents) {
            //the property is handled up front
            var transition = {};
            var parsingState = ["duration", "timing-function", "delay"];

            //http://www.w3.org/TR/css3-transitions/#transition-timing-function-property
            // + need to handle steps () and cubic-bezier
            var timingFunctions = ["ease", "linear", "ease-in", "ease-out", "ease-in-out", "step-start"];

            var parsingStateIndex = 0;
            //each component is optional here but there is an order
            transitionComponents.forEach(function (transitionComponent) {
                var componentMatchesParsingState = false;
                var tentativeParsingIndex = parsingStateIndex;

                do {
                    if (parsingState[tentativeParsingIndex] === "duration") {
                        //make sure we really have a duration, otherwise it has to be a timing function
                        if (timingFunctions.indexOf(transitionComponent) === -1) {
                            //so we assume we have a duration here
                            componentMatchesParsingState = true;
                            transition.duration = parseFloat(transitionComponent);
                            parsingStateIndex = tentativeParsingIndex;
                        }
                    } else if (parsingState[tentativeParsingIndex] === "timing-function") {
                        if (timingFunctions.indexOf(transitionComponent) !== -1) {
                            componentMatchesParsingState = true;
                            transition.timingFunction = transitionComponent;
                            parsingStateIndex = tentativeParsingIndex;
                        }
                    } else if (parsingState[tentativeParsingIndex] === "delay") {
                        //delay has to be last parsed element
                        if (tentativeParsingIndex ==  transitionComponents.length-1) {
                            componentMatchesParsingState = true;
                            transition.delay = parseFloat(transitionComponent);
                        }
                    }
                    tentativeParsingIndex++;
                } while ((parsingStateIndex < parsingState.length) && (componentMatchesParsingState == false));

            }, this);
            if (transition.duration == null) {
                transition.duration = 0;
            }
            if (transition.timingFunction == null) {
                transition.timingFunction = "ease";
            }
            if (transition.delay == null) {
                transition.delay = 0;
            }

            return transition;
        }
    },

    _applyCSSPropertyWithValueForState: {
        value: function(state, cssProperty, cssValue) {
            //to be optimized (remove switch)
            if ((cssValue == null) || (cssProperty == null))
                return false;

            if ((cssProperty !== "transition") && this.styleableProperties.indexOf(cssProperty) === -1 ){
                return false;
            }

            var declaration = this._getStylePropertyObject(state, cssProperty);
            //consider delegating this somewhere else..
            switch(cssProperty) {
                case "transition": {
                    var transitionComponents = cssValue.split(" ");
                    if (transitionComponents.length > 0) {
                        var actualProperty = transitionComponents.shift();
                        actualProperty = this.propertyNameFromCSS(actualProperty);
                        //do we handle this property ? otherwise specifying transition for it would be pointless
                        if (this.styleableProperties.indexOf(actualProperty) !== -1 ) {
                            if (transitionComponents.length > 0) {
                                var transition = this._createTransitionFromComponents(transitionComponents);
                                if (transition != null) {
                                    var style = this._createDefaultStyleIfNeeded();
                                    style.transitions[actualProperty] = transition;
                                }
                            }
                        }
                    }
                }
                    break;
                case "offsetTransform":
                    if (typeof cssValue === "string") {
                        declaration.value = this._createTransformFromCSS(cssValue);
                    } else {
                        declaration.value = cssValue;
                    }
                    break;
                case "originVector":
                    if (typeof cssValue === "string") {
                        declaration.value = this._createVectorFromCSSTransformOriginDeclaration(cssValue);
                    } else {
                        declaration.value = cssValue;
                    }
                    break;

                case "visibility":
                    declaration.value = cssValue;
                    break;
                case "opacity":
                    declaration.value = cssValue;
                    break;
                default:
                    return false;
            }
            return true;
        }
    },

    propertyNameFromCSS: {
        value: function(cssProperty) {
            //internally we don't want to deal with prefixes.. todo make it general
            if (cssProperty === "-webkit-transform") {
                cssProperty = "transform";
            }
            if (cssProperty === "-webkit-transform-origin") {
                cssProperty = "transform-origin";
            }

            //FIXME: we keep this intermediate step as a placeholder to switch between
            //offset or transform some pending CSS verification in test-apps to validate what to do there.
            if (cssProperty === "transform") {
                cssProperty = "offsetTransform";
            }
            if (cssProperty === "transform-origin") {
                cssProperty = "originVector";
            }

            return cssProperty;
        }
    },

    _applyStyleRule: {
        value: function(selectorName, styleRule, appliedProperties) {
            if (styleRule.style) {
                var length = styleRule.style.length;
                if (length > 0) {
                    for (var i = 0 ; i < length ; i++) {
                        var cssProperty = styleRule.style[i];
                        var cssValue = styleRule.style[cssProperty];

                        cssProperty = this.propertyNameFromCSS(cssProperty);

                        //should be states ?
                        var state = this._stateForSelectorName(selectorName);
                        if (state != null) {
                            if (this._applyCSSPropertyWithValueForState(state, cssProperty, cssValue)) {
                                if (appliedProperties != null) {
                                    appliedProperties.add(cssProperty);
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    _removeStyleRule: {
        value: function(selectorName, styleRule) {
            if (styleRule.style) {
                var length = styleRule.style.length;
                if (length > 0) {
                    for (var i = 0 ; i < length ; i++) {
                        var cssProperty = styleRule.style[i];
                        var cssValue = styleRule.style[cssProperty];

                        cssProperty = this.propertyNameFromCSS(cssProperty);

                        //should be states ?
                        var state = this._stateForSelectorName(selectorName);
                        if (state != null) {
                            var declaration = this._getStylePropertyObject(state, cssProperty);
                            declaration.value = this.initialValueForStyleableProperty(cssProperty);
                        }
                    }
                }
            }
        }
    },



    _executeCurrentStyle: {
        value: function(state) {
            if (state != this.__STYLE_DEFAULT__) {
                if (state != this._state) {
                    return;
                }
            }

            if (this.styleableProperties != null) {
                this.styleableProperties.forEach(function(property) {
                    var declaration = this._getStylePropertyObject(state, property);
                    if (declaration) {
                        if (declaration.value != null) {
                            this[property] = declaration.value;
                        }
                    }
                }, this);
            }
        }
    },

    _applySelectorNamed: {
        value: function(selectorName, appliedProperties) {
            console.log("apply selector named:"+ selectorName);
            var rule = this.retrieveCSSRule(selectorName);
            var state = this._stateForSelectorName(selectorName);
            if (rule) {
                if (rule.cssText) {
                    var cssDescription = CSSOM.parse(rule.cssText);
                    if (cssDescription) {
                        var allRules = cssDescription.cssRules;
                        allRules.forEach(function(styleRule) {
                            this._applyStyleRule(selectorName, styleRule, appliedProperties);
                        }, this);
                    }
                    this._executeCurrentStyle(state);
                }
            }
        }
    },

    _removeSelectorNamed: {
        value: function(selectorName, appliedProperties) {
            var rule = this.retrieveCSSRule(selectorName);
            if (rule) {
                if (rule.cssText) {
                    var cssDescription = CSSOM.parse(rule.cssText);
                    if (cssDescription) {
                        var allRules = cssDescription.cssRules;
                        allRules.forEach(function(styleRule) {
                            this._removeStyleRule(selectorName, styleRule, appliedProperties);
                        }, this);
                    }
                    var state = this._stateForSelectorName(selectorName);
                    this._executeCurrentStyle(state);
                }
            }
        }
    },

    _removeSelectorsForState: {
        value: function(state) {
            var values = this.classList.enumerate();
            for (var i = 0 ; i < values.length ; i++) {
                var selectorName = values[i][1];
                if (this._stateForSelectorName(selectorName) === state) {
                    var rule = this.retrieveCSSRule(selectorName);
                    if (rule) {
                        if (rule.cssText) {
                            var cssDescription = CSSOM.parse(rule.cssText);
                            if (cssDescription) {
                                var allRules = cssDescription.cssRules;
                                allRules.forEach(function(styleRule) {
                                    this._removeStyleRule(selectorName, styleRule);
                                }, this);
                            }
                        }
                    }
                }
            }
        }
    },

    classListDidChange: {
        value: function() {
            var self = this;
            if (this.classList) {
                var appliedProperties = new Set();
                var values = this.classList.enumerate();
                for (var i = 0 ; i < values.length ; i++) {
                    var selectorName = values[i][1];
                    this._applySelectorNamed(selectorName, appliedProperties);
                }

                this.styleableProperties.forEach(function(property) {
                    if (appliedProperties.has(property) === false) {
                        this[property] = this.initialValueForStyleableProperty(property);
                    }
                }, this);

            } else {
                this.removeAllCSSRules();
            }
        }
    },

    _id: { value: null,  writable: true },

    id: {
        get: function() {
            return this._id;
        },

        set: function(value) {
            if (value != this._id) {
                this._id = value;
                this._idDidChange();
            }
        }
    },

    initWithScene: {
        value: function(scene) {
            this.scene = scene;
            return this;
        }
    },


    //--- class list excerpt from montage / component.js

    _classList: { value: null },

    /**
     The classList of the component's element, the purpose is to mimic the element's API but to also respect the draw.
     It can also be bound to by binding each class as a property.
     example to toggle the complete class: "classList.has('complete')" : { "<-" : "@owner.isCompete"}
     @type {Property}
     @default null
     */
    classList: {
        get: function () {
            if (this._classList == null) {
                this._classList = new Set();
                this._classList.addRangeChangeListener(this, "classList");
            }
            return this._classList;
        },
        set: function(value) {
            if (this._classList !== value) {
                if (this._classList != null) {
                    this._classList.removeRangeChangeListener(this, "classList");
                }
                if (value != null) {
                    var self = this;
                    if (value instanceof Array) {
                        this._classList = new Set();
                        value.forEach( function(className) {
                            self._classList.add(className);
                        },this);
                        value = this._classList;
                    } else {
                        this._classList = value;
                    }
                }
                this._classList.addRangeChangeListener(this, "classList");
                this.classListDidChange();
            }
        }
    },

    handleClassListRangeChange: {
        value: function (plus, minus) {
            //on plus we stack classes
            if (plus != null) {
                plus.forEach(function(selectorName) {
                    this._applySelectorNamed(selectorName);
                }, this);
            }
            //when something is removed is resync all
            if (minus != null) {
                minus.forEach(function(selectorName) {
                    this._removeSelectorNamed(selectorName);
                }, this);
            }
        }
    },

    //http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript
    retrieveCSSRule: {
        value: function(ruleName) {
            ruleName = ruleName.toLowerCase();                       // Convert test string to lower case.
            if (document.styleSheets) {                            // If browser can play with stylesheets
                for (var i = 0; i < document.styleSheets.length; i++) { // For each stylesheet
                    var styleSheet = document.styleSheets[i];          // Get the current Stylesheet
                    var ii= 0 ;                                        // Initialize subCounter.
                    var cssRule=false;                               // Initialize cssRule.
                    do {                                             // For each rule in stylesheet
                        if (styleSheet.cssRules) {                    // Browser uses cssRules?
                            cssRule = styleSheet.cssRules[ii];         // Yes --Mozilla Style
                        } else if (styleSheet.rules) {                                      // Browser usses rules?
                            cssRule = styleSheet.rules[ii];            // Yes IE style.
                        }                                             // End IE check.
                        if (cssRule)  {   
                            if (cssRule.selectorText) {
                                if (cssRule.selectorText.toLowerCase() == ruleName) { //  match ruleName?
                                    return cssRule;                      // return the style object.
                                }                                          // End found rule name
                            }                            // If we found a rule...
                        }                                             // end found cssRule
                        ii++;                                         // Increment sub-counter
                    } while (cssRule)                                // end While loop
                }                                                   // end For loop
            }                                                      // end styleSheet ability check
            return false;                                          // we found NOTHING!
        }
    },

    //--

    handleEventNamed: {
        value: function(name) {

            var state = this.__STYLE_DEFAULT__;

            switch (name) {
                case this._ENTER:
                    state = "hover";
                    var hoverEvent = document.createEvent("CustomEvent");
                    hoverEvent.initCustomEvent("hover", true, true, null);
                    this.dispatchEvent(hoverEvent);
                    break;
                case this._EXIT:
                    state = this.__STYLE_DEFAULT__; //this is probably wrong - what happens if active is on going too ?
                    break;
                case this._TOUCH_DOWN: {
                    state = "active";
                    var actionEvent = document.createEvent("CustomEvent");
                    actionEvent.initCustomEvent("action", true, true, null);
                    this.dispatchEvent(actionEvent);
                }
                    break;
                case this._TOUCH_UP:
                    state = this.__STYLE_DEFAULT__; //this is probably wrong - what happens if hover is on going too ?
                    break;
            }

            if (state !== this._state) {
                if (this._state != this.__STYLE_DEFAULT__)
                    this._removeSelectorsForState(this._state);
                this._state = state;
                var values = this.classList.enumerate();
                for (var i = 0 ; i < values.length ; i++) {
                    var selectorName = values[i][1];
                    this._applySelectorNamed(selectorName);
                }

                this._executeCurrentStyle(state);
            }
        }
    },

    //--

    deserializedFromTemplate: {
        value: function (objectOwner, label, documentPart) {
            this.nextTarget = objectOwner;
            this.identifier = label;
        }
    },

    //--

    blueprintModuleId:require("montage")._blueprintModuleIdDescriptor,

    blueprint:require("montage")._blueprintDescriptor

});
