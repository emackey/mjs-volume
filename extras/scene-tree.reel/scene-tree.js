/**
 * @module ui/scene-graph-tree.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Dict = require("collections/dict"),
    SceneTreeFactory = require("./core/scene-tree-factory").SceneTreeFactory,

    DEFAULT_VALUES = {
        indentValue: 10,
        indentUnit: "px"
    };

/**
 * @class SceneGraphTree
 * @extends Component
 */
exports.SceneTree = Component.specialize(/** @lends SceneGraphTree# */ {

    constructor: {
        value: function SceneGraphTree() {
            this.super();

            this._treeFactory = SceneTreeFactory.create();
            this.configuration = Dict();

            this._populateConfiguration();
        }
    },

    _treeFactory: {
        value: null
    },

    _previousNodeSelected: {
        value: null
    },

    configuration: {
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

    _populateConfiguration: {
        value: function () {
            var self = this;

            Object.keys(DEFAULT_VALUES).forEach(function (key) {
                self.configuration.set(key, DEFAULT_VALUES[key]);
            });
        }
    },

    handleStatusChange: {
        value: function(status) {
            if (status === "loaded" && this.scene) {
               this.sceneGraphTree = this.scene.rootNode.glTFElement;
            }
        }
    },

    _selectTreeCellNode: {
        value: function (treeCell) {
            if (this._previousNodeSelected && this._previousNodeSelected.selected) {
                this._previousNodeSelected.selected = false;
            }

            treeCell.selected = true;
            this._previousNodeSelected = treeCell;
        }
    },

    handleNodeElementAction: {
        value: function (event) {
            var detail = event.detail;

            if (detail) {
                var treeCellSelected = detail.get("treeCellSelected");

                if (treeCellSelected && treeCellSelected.node) {
                    this._selectTreeCellNode(treeCellSelected);
                    this.dispatchEventNamed("sceneNodeSelected", true, true, treeCellSelected.node.content.glTFElement);
                }
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
