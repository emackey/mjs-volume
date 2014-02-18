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
        value: function SceneTreeNode(glTFElement) {
            this.super();

            this.name = glTFElement.name;
            this.glTFElement = glTFElement;
            this.children = [];
            this.rawChildren = {};
        }
    },

    name: {
        value: null
    },

    glTFElement: {
        value: null
    },

    children: {
        value: null
    },

    rawChildren: {
        value: null
    }

});
