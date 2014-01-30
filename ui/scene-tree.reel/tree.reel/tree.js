/**
 * @module ui/tree.reel
 * @requires montage/ui/component
 * @requires montage/core/TreeController
 */
var Component = require("montage/ui/component").Component,
    TreeController = require("montage/core/tree-controller").TreeController;

/**
 * @class Tree
 * @extends Component
 */
exports.Tree = Component.specialize(/** @lends Tree# */ {

    constructor: {
        value: function Tree() {
            this.super();
        }
    },

    _childrenPath: {
        value: "children"
    },

    _tree: {
        value: null
    },

    tree: {
        set: function (tree) {
            if (tree) {
                this._tree = tree;
                this.treeController = new TreeController(tree, this._childrenPath);
            }
        },
        get: function () {
            return this._tree;
        }
    },

    treeController: {
        value: null
    },

    handleExpandedAction: {
        value: function (event) {
            var treeCell = event.target.ownerComponent;

            if (treeCell && !treeCell.fulfilled) {
                treeCell.node.expanded = false;

                var children = [],
                    rawChildren = treeCell.node.content.rawChildren,
                    rawChildrenKeys = Object.keys(rawChildren);

                for (var i = 0, length = rawChildrenKeys.length; i < length; i++) {
                    children.push(rawChildren[rawChildrenKeys[i]]);
                }

                treeCell.fulfilled = true;
                treeCell.node.content.children = children;
                treeCell.node.expanded = true;
            }
        }
    }

});
