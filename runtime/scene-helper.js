// Copyright (c) 2013, Fabrice Robinet.
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
var Montage = require("montage").Montage;
var Uuid = require("montage/core/uuid").Uuid;
var glTFScene = require("runtime/glTF-scene").glTFScene;
var glTFNode = require("runtime/glTF-node").glTFNode;
var Scene = require("runtime/scene").Scene;
var Node = require("runtime/node").Node;
var SceneRenderer = require("runtime/scene-renderer").SceneRenderer;
var glTFMaterial = require("runtime/glTF-material").glTFMaterial;
var Utilities = require("runtime/utilities").Utilities;
var Projection = require("runtime/projection").Projection;
var Camera = require("runtime/camera").Camera;
var BBox = require("runtime/utilities").BBox;

var SceneHelper = exports.SceneHelper = Object.create(Object.prototype, {

    getGLTFViewPoints: {
        value: function(scene) {
            var viewPoints = [];
            var node = scene.glTFElement.rootNode;
            node.apply( function(node, parent, parentTransform) {
                if (node.cameras) {
                    if (node.cameras.length)
                        viewPoints = viewPoints.concat(node);
                }
                return null;
            }, true, null);
            return viewPoints;
        }
    },

    //we don't want to cache this to avoid synchronization here, so we don't want to call it often either :)
    getViewPoints: {
        value: function(scene) {
            var viewPoints = this.getGLTFViewPoints(scene);
            var m3dNodes = [];
            viewPoints.forEach( function(viewPoint) {
                var m3dNode = Montage.create(Node);
                m3dNode.scene = scene;
                //FIXME: should have probably used baseId here
                m3dNode.id = viewPoint.baseId;
                m3dNodes.push(m3dNode);
            }, this);

            return m3dNodes;
        }
    },

    createGLTFNodeIncludingCamera: {
        value: function(cameraName) {
            //TODO: make that a default projection method
            var projection = Object.create(Projection);
            projection.initWithDescription( {
                "type":"perspective",
                "perspective" : {
                    "yfov":45,
                    "aspectRatio":1,
                    "znear":0.1,
                    "zfar":100
                }
            });

            //create camera
            var camera = Object.create(Camera).init();
            camera.projection = projection;
            //create node to hold the camera
            var cameraNode = Object.create(glTFNode).init();
            camera.name = cameraNode.name = cameraName;
            cameraNode.id = Uuid.generate();
            cameraNode.baseId = cameraNode.id;
            cameraNode.cameras.push(camera);
            return cameraNode;
        }
    },

    createNodeIncludingCamera: {
        value: function(cameraName, m3dScene) {
            var cameraNode = SceneHelper.createGLTFNodeIncludingCamera(cameraName);
            var scene = m3dScene.glTFElement;
            scene.ids[cameraNode.baseId] = cameraNode;
            var m3dNode = Montage.create(Node);
            m3dNode.scene = m3dScene;
            m3dNode.id = cameraNode.baseId;
            return m3dNode;
        }
    }

});
