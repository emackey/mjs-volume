/**
 * @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    SceneTreeNode = require("./scene-tree-node").SceneTreeNode;

/**
 * @class SceneTreeFactory
 * @extends Component
 */
exports.SceneTreeFactory = Montage.specialize(/** @lends SceneTreeFactory# */ {

    constructor: {
        value: function SceneTreeFactory() {
            this.super();
        }
    },

    _sceneGraphTree: {
        value: null
    },

    buildWithGlTFTree: {
        value: function (tree) {
            if (tree && typeof tree === "object") {
                var self = this,
                    nodeChildren = tree.children;

                this._resetEnvironment();

                if (Array.isArray(nodeChildren)) {
                    nodeChildren.forEach(function (node) {
                        var nodeExamined = self._examineNode(node);
                        self._sceneGraphTree.children.push(nodeExamined);
                    });
                }

                return this._sceneGraphTree;
            }
        }
    },

    _resetEnvironment: {
        value: function () {
            this._sceneGraphTree = {
                children: [],
                root: true
            };
        }
    },

    _examineNode: {
        value: function (node) {
            var nodeChildren = node.children,
                sceneGraphNode = this._createSceneTreeNode(node);

            if (Array.isArray(nodeChildren)) {
                var self = this;

                nodeChildren.forEach(function (childNode) {
                    var nodeExamined = self._examineNode(childNode);
                    sceneGraphNode.rawChildren[nodeExamined.name] = nodeExamined;
                });
            }

            return sceneGraphNode;
        }
    },

    _createSceneTreeNode: {
        value: function (node) {
            var sceneGraphNode = new SceneTreeNode(node.name),
                meshes = node.meshes;

            if (Array.isArray(meshes)) {
                meshes.forEach(function (mesh) {
                    sceneGraphNode.rawChildren[mesh.name] = new SceneTreeNode(mesh.name);
                });
            }

            return sceneGraphNode;
        }
    }

});
