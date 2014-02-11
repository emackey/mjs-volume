/**
 * @requires montage/ui/component
 */
var Montage = require("montage").Montage;

/**
 * @class SceneTreeNode
 * @extends Component
 */
exports.SceneTreeNode = Montage.specialize(/** @lends SceneTreeNode# */ {

    constructor: {
        value: function SceneTreeNode(name) {
            this.super();

            this.name = name;
            this.children = [];
            this.rawChildren = {};
        }
    },

    name: {
        value: null
    },

    children: {
        value: null
    },

    rawChildren: {
        value: null
    }

});
