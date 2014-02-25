/**
 * @module ui/tree-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    NODE_TYPES = require("extras/scene-tree.reel/core/scene-tree-node").SceneTreeNodeTypes,
    MIME_TYPES = require("extras/scene-tree.reel/core/mime-types");

/**
 * @class TreeCell
 * @extends Component
 */
exports.TreeCell = Component.specialize(/** @lends TreeCell# */ {

    constructor: {
        value: function TreeCell() {
            this.super();
        }
    },

    hasChildren: {
        value: false
    },

    configuration: {
        value: null
    },

    fulfilled: {
        value: false
    },

    name: {
        value: null
    },

    type: {
        value: null
    },

    selected: {
        value: null
    },

    _node: {
        value: null
    },

    node: {
        set: function (iteration) {
            if (iteration && typeof iteration === "object" && iteration.content) {
                iteration.expanded = iteration.content.root ? true : iteration.expanded;

                if (iteration.content.rawChildren) {
                    this.hasChildren = Object.keys(iteration.content.rawChildren).length > 0;
                }

                this.name = iteration.content.name;
                this._node = iteration;
                this.type = iteration.content.type;
            }
        },
        get: function () {
            return this._node;
        }
    },

    isDraggable: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                if (this.isDraggable) {
                    this._element.addEventListener("dragstart", this, true);
                }
            }
        }
    },

    captureDragstart: {
        value: function (event) {
            if (this._node && this._node.content && this._node.content.glTFElement) {
                var dataTransfer = event.dataTransfer;

                if (dataTransfer) {
                    dataTransfer.effectAllowed = 'move';
                    dataTransfer.setData(MIME_TYPES.TEXT_PLAIN, this._node.content.glTFElement.id);
                }
            }
        }
    },

    draw: {
        value: function () {
            if (this.node) {
                var indentValue = this.configuration.get("indentValue") * (this.node.depth - 1);

                this._element.style.marginLeft = indentValue + this.configuration.get("indentUnit");

                if (this.isDraggable) {
                    this._element.setAttribute("draggable", "true");
                }

                var nodeTypeElement = this.templateObjects.nodeTypeLabel;

                if (this.type === NODE_TYPES.MESH) {
                    nodeTypeElement.value = "M";
                } else {
                    nodeTypeElement.value = "N";
                }
            }
        }
    }

});
