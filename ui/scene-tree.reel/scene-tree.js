/**
 * @module ui/scene-graph-tree.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    SceneTreeFactory = require("./core/scene-tree-factory").SceneTreeFactory;

/**
 * @class SceneGraphTree
 * @extends Component
 */
exports.SceneTree = Component.specialize(/** @lends SceneGraphTree# */ {

    constructor: {
        value: function SceneGraphTree() {
            this.super();

            this._treeFactory = SceneTreeFactory.create();
        }
    },

    _treeFactory: {
        value: null
    },

    scene: {
        value: null
    },

    enterDocument: {
        value: function (firstime) {
            if (firstime) {
                if (this.scene.status === "loaded") {
                    this.handleStatusChange(this.scene.status);
                }

                this.scene.addOwnPropertyChangeListener("status", this);
            }
        }
    },

    handleStatusChange: {
        value: function(status) {
            if (status === "loaded" && this.scene) {
               this.sceneGraphTree = this.scene.rootNode.glTFElement;
            }
        }
    },

    _sceneGraphTree: {
        value: null
    },

    sceneGraphTree: {
        set: function (tree) {
            if (tree) {
                this._sceneGraphTree = this._treeFactory.buildWithGlTFTree(tree);
            }
        },
        get: function () {
            return this._sceneGraphTree;
        }
    }

});
