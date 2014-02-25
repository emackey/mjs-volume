/**
 * @requires montage/ui/component
 */
var Montage = require("montage").Montage,

    SceneTreeNodeTypes = {
        NODE: 'NODE',
        MESH: 'MESH',
        LIGHT: 'LIGHT',
        CAMERA: 'CAMERA'
    };

exports.SceneTreeNodeTypes = SceneTreeNodeTypes;

/**
 * @class SceneTreeNode
 * @extends Component
 */
exports.SceneTreeNode = Montage.specialize(/** @lends SceneTreeNode# */ {

    constructor: {
        value: function SceneTreeNode(glTFElement, type) {
            this.super();

            this.name = glTFElement.name;
            this.glTFElement = glTFElement;
            this.children = [];
            this.rawChildren = {};
            this.type = type || SceneTreeNodeTypes.NODE;
        }
    },

    name: {
        value: null
    },

    _type: {
        value: null
    },

    type: {
        set: function (type) {
            if (typeof type === "string") {
                this._type = SceneTreeNodeTypes[type.toUpperCase()] || null;
            }
        },
        get: function () {
            return this._type;
        }
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
