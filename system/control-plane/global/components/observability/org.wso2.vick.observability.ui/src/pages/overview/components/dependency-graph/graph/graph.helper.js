/**
 * @module Graph/helper
 * @description
 * Offers a series of methods that isolate logic of Graph component and also from Graph rendering methods.
 */
/**
 * @typedef {Object} Link
 * @property {string} source - the node id of the source in the link.
 * @property {string} target - the node id of the target in the link.
 * @memberof Graph/helper
 */
/**
 * @typedef {Object} Node
 * @property {string} id - the id of the node.
 * @property {string} [color=] - color of the node (optional).
 * @property {string} [fontColor=] - node text label font color (optional).
 * @property {string} [size=] - size of the node (optional).
 * @property {string} [symbolType=] - symbol type of the node (optional).
 * @property {string} [svg=] - custom svg for node (optional).
 * @memberof Graph/helper
 */
import {
    forceManyBody as d3ForceManyBody,
    forceSimulation as d3ForceSimulation,
    forceX as d3ForceX,
    forceY as d3ForceY
} from "d3-force";

import CONST from "./graph.const";
import DEFAULT_CONFIG from "./graph.config";
import ERRORS from "../err";

import utils from "../utils";
import {buildLinkPathDefinition} from "../link/link.helper";
import {getMarkerId} from "../marker/marker.helper";

const NODE_PROPS_WHITELIST = ["id", "highlighted", "x", "y", "index", "vy", "vx"];

/**
 * Create d3 forceSimulation to be applied on the graph.<br/>
 * {@link https://github.com/d3/d3-force#forceSimulation|d3-force#forceSimulation}<br/>
 * {@link https://github.com/d3/d3-force#simulation_force|d3-force#simulation_force}<br/>
 * Wtf is a force? {@link https://github.com/d3/d3-force#forces| here}
 * @param  {number} width - the width of the container area of the graph.
 * @param  {number} height - the height of the container area of the graph.
 * @param  {number} gravity - the force strength applied to the graph.
 * @returns {Object} returns the simulation instance to be consumed.
 * @memberof Graph/helper
 */
function _createForceSimulation(width, height, gravity) {
    const frx = d3ForceX(width / 2).strength(CONST.FORCE_X);
    const fry = d3ForceY(height / 2).strength(CONST.FORCE_Y);
    const forceStrength = gravity;

    return d3ForceSimulation()
        .force("charge", d3ForceManyBody().strength(forceStrength))
        .force("x", frx)
        .force("y", fry);
}

/**
 * Get the correct node opacity in order to properly make decisions based on context such as currently highlighted node.
 * @param  {Object} node - the node object for whom we will generate properties.
 * @param  {string} highlightedNode - same as {@link #buildGraph|highlightedNode in buildGraph}.
 * @param  {Object} highlightedLink - same as {@link #buildGraph|highlightedLink in buildGraph}.
 * @param  {Object} config - same as {@link #buildGraph|config in buildGraph}.
 * @returns {number} the opacity value for the given node.
 * @memberof Graph/helper
 */
function _getNodeOpacity(node, highlightedNode, highlightedLink, config) {
    const highlight
        = node.highlighted
        || node.id === (highlightedLink && highlightedLink.source)
        || node.id === (highlightedLink && highlightedLink.target);
    const someNodeHighlighted = Boolean(highlightedNode
        || (highlightedLink && highlightedLink.source && highlightedLink.target));
    let opacity;

    if (someNodeHighlighted && config.highlightDegree === 0) {
        opacity = highlight ? config.node.opacity : config.highlightOpacity;
    } else if (someNodeHighlighted) {
        opacity = highlight ? config.node.opacity : config.highlightOpacity;
    } else {
        opacity = config.node.opacity;
    }

    return opacity;
}

/**
 * Receives a matrix of the graph with the links source and target as concrete node instances and it transforms it
 * in a lightweight matrix containing only links with source and target being strings representative of some node id
 * and the respective link value (if non existent will default to 1).
 * @param  {Array.<Link>} graphLinks - an array of all graph links.
 * @param  {Object} config - the graph config.
 * @returns {Object.<string, Object>} an object containing a matrix of connections of the graph, for each nodeId,
 * there is an object that maps adjacent nodes ids (string) and their values (number).
 * @memberof Graph/helper
 */
function _initializeLinks(graphLinks, config) {
    return graphLinks.reduce((links, l) => {
        const source = l.source.id || l.source;
        const target = l.target.id || l.target;

        if (!links[source]) {
            links[source] = {};
        }

        if (!links[target]) {
            links[target] = {};
        }

        const value = l.value || 1;

        links[source][target] = value;

        if (!config.directed) {
            links[target][source] = value;
        }

        return links;
    }, {});
}

/**
 * Method that initialize graph nodes provided by rd3g consumer and adds additional default mandatory properties
 * that are optional for the user. Also it generates an index mapping, this maps nodes ids the their index in the array
 * of nodes. This is needed because d3 callbacks such as node click and link click return the index of the node.
 * @param  {Array.<Node>} graphNodes - the array of nodes provided by the rd3g consumer.
 * @returns {Object.<string, Object>} returns the nodes ready to be used within rd3g with additional properties such as x, y
 * and highlighted values.
 * @memberof Graph/helper
 */
function _initializeNodes(graphNodes) {
    const nodes = {};
    const n = graphNodes.length;

    for (let i = 0; i < n; i++) {
        const node = graphNodes[i];

        node.highlighted = false;

        if (!node.hasOwnProperty("x")) {
            node.x = 0;
        }
        if (!node.hasOwnProperty("y")) {
            node.y = 0;
        }

        nodes[node.id.toString()] = node;
    }

    return nodes;
}

/**
 * Maps an input link (with format `{ source: 'sourceId', target: 'targetId' }`) to a d3Link
 * (with format `{ source: { id: 'sourceId' }, target: { id: 'targetId' } }`). If d3Link with
 * given index exists already that same d3Link is returned.
 * @param {Object} link - input link.
 * @param {number} index - index of the input link.
 * @param {Array.<Object>} d3Links - all d3Links.
 * @param  {Object} config - same as {@link #buildGraph|config in buildGraph}.
 * @param {Object} state - Graph component current state (same format as returned object on this function).
 * @returns {Object} a d3Link.
 * @memberof Graph/helper
 */
function _mapDataLinkToD3Link(link, index, d3Links = [], config, state = {}) {
    const d3Link = d3Links[index];

    if (d3Link) {
        const toggledDirected = state.config && state.config.directed && config.directed !== state.config.directed;

        // Every time we toggle directed config all links should be visible again
        if (toggledDirected) {
            return {...d3Link, isHidden: false};
        }

        // Every time we disable collapsible (collapsible is false) all links should be visible again
        return config.collapsible ? d3Link : {...d3Link, isHidden: false};
    }

    const highlighted = false;
    const source = {
        id: link.source,
        highlighted: highlighted
    };
    const target = {
        id: link.target,
        highlighted: highlighted
    };

    return {
        index: index,
        source: source,
        target: target
    };
}

/**
 * Some integrity validations on links and nodes structure. If some validation fails the function will
 * throw an error.
 * @param  {Object} data - Same as {@link #initializeGraphState|data in initializeGraphState}.
 * @throws can throw the following error msg:
 * INSUFFICIENT_DATA - msg if no nodes are provided
 * INVALID_LINKS - if links point to nonexistent nodes
 * @returns {undefined}
 * @memberof Graph/helper
 */
function _validateGraphData(data) {
    if (!data.nodes || !data.nodes.length) {
        utils.throwErr("Graph", ERRORS.INSUFFICIENT_DATA);
    }

    const n = data.links.length;

    for (let i = 0; i < n; i++) {
        const l = data.links[i];

        if (!data.nodes.find((n) => n.id === l.source)) {
            utils.throwErr("Graph", `${ERRORS.INVALID_LINKS} - "${l.source}" is not a valid source node id`);
        }
        if (!data.nodes.find((n) => n.id === l.target)) {
            utils.throwErr("Graph", `${ERRORS.INVALID_LINKS} - "${l.target}" is not a valid target node id`);
        }
    }
}

/**
 * Build some Link properties based on given parameters.
 * @param  {Object} link - the link object for which we will generate properties.
 * @param  {Object.<string, Object>} nodes - same as {@link #buildGraph|nodes in buildGraph}.
 * @param  {Object.<string, Object>} links - same as {@link #buildGraph|links in buildGraph}.
 * @param  {Object} config - same as {@link #buildGraph|config in buildGraph}.
 * @param  {Function[]} linkCallbacks - same as {@link #buildGraph|linkCallbacks in buildGraph}.
 * @param  {string} highlightedNode - same as {@link #buildGraph|highlightedNode in buildGraph}.
 * @param  {Object} highlightedLink - same as {@link #buildGraph|highlightedLink in buildGraph}.
 * @param  {number} transform - value that indicates the amount of zoom transformation.
 * @returns {Object} returns an object that aggregates all props for creating respective Link component instance.
 * @memberof Graph/helper
 */
function buildLinkProps(link, nodes, links, config, linkCallbacks, highlightedNode, highlightedLink, transform) {
    const {source, target} = link;
    const x1 = (nodes[source] && nodes[source].x) || 0;
    const y1 = (nodes[source] && nodes[source].y) || 0;
    const x2 = (nodes[target] && nodes[target].x) || 0;
    const y2 = (nodes[target] && nodes[target].y) || 0;

    const d = buildLinkPathDefinition({source: {x: x1, y: y1}, target: {x: x2, y: y2}}, config.link.type);

    let mainNodeParticipates = false;

    switch (config.highlightDegree) {
        case 0:
            break;
        case 2:
            mainNodeParticipates = true;
            break;
        default:
            // 1st degree is the fallback behavior
            mainNodeParticipates = source === highlightedNode || target === highlightedNode;
            break;
    }

    const reasonNode = mainNodeParticipates && nodes[source].highlighted && nodes[target].highlighted;
    const reasonLink
        = source === (highlightedLink && highlightedLink.source)
        && target === (highlightedLink && highlightedLink.target);
    const highlight = reasonNode || reasonLink;

    let opacity = config.link.opacity;

    if (highlightedNode || (highlightedLink && highlightedLink.source)) {
        opacity = highlight ? config.link.opacity : config.highlightOpacity;
    }

    let stroke = link.color || config.link.color;

    if (highlight) {
        stroke = config.link.highlightColor === CONST.KEYWORDS.SAME ? config.link.color : config.link.highlightColor;
    }

    let strokeWidth = config.link.strokeWidth * (1 / transform);

    if (config.link.semanticStrokeWidth) {
        const linkValue = links[source][target] || links[target][source] || 1;

        strokeWidth += linkValue * strokeWidth / 10;
    }

    const markerId = config.directed ? getMarkerId(highlight, transform, config) : null;

    return {
        markerId: markerId,
        d: d,
        source: source,
        target: target,
        strokeWidth: strokeWidth,
        stroke: stroke,
        mouseCursor: config.link.mouseCursor,
        className: CONST.LINK_CLASS_NAME,
        opacity: opacity,
        onClickLink: linkCallbacks.onClickLink,
        onRightClickLink: linkCallbacks.onRightClickLink,
        onMouseOverLink: linkCallbacks.onMouseOverLink,
        onMouseOutLink: linkCallbacks.onMouseOutLink
    };
}

/**
 * Build some Node properties based on given parameters.
 * @param  {Object} node - the node object for whom we will generate properties.
 * @param  {Object} config - same as {@link #buildGraph|config in buildGraph}.
 * @param  {Function[]} nodeCallbacks - same as {@link #buildGraph|nodeCallbacks in buildGraph}.
 * @param  {string} highlightedNode - same as {@link #buildGraph|highlightedNode in buildGraph}.
 * @param  {Object} highlightedLink - same as {@link #buildGraph|highlightedLink in buildGraph}.
 * @param  {number} transform - value that indicates the amount of zoom transformation.
 * @returns {Object} returns object that contain Link props ready to be feeded to the Link component.
 * @memberof Graph/helper
 */
function buildNodeProps(node, config, nodeCallbacks = {}, highlightedNode, highlightedLink, transform) {
    const highlight
        = node.highlighted
        || (node.id === (highlightedLink && highlightedLink.source)
            || node.id === (highlightedLink && highlightedLink.target));
    const opacity = _getNodeOpacity(node, highlightedNode, highlightedLink, config);
    let fill = node.color || config.node.color;

    if (highlight && config.node.highlightColor !== CONST.KEYWORDS.SAME) {
        fill = config.node.highlightColor;
    }

    let stroke = node.strokeColor || config.node.strokeColor;

    if (highlight && config.node.highlightStrokeColor !== CONST.KEYWORDS.SAME) {
        stroke = config.node.highlightStrokeColor;
    }

    let label = node[config.node.labelProperty] || node.id;

    if (typeof config.node.labelProperty === "function") {
        label = config.node.labelProperty(node);
    }

    const t = 1 / transform;
    const nodeSize = node.size || config.node.size;
    const fontSize = highlight ? config.node.highlightFontSize : config.node.fontSize;
    const dx = fontSize * t + nodeSize / 100 + 1.5;
    const strokeWidth = highlight ? config.node.highlightStrokeWidth : config.node.strokeWidth;
    const svg = node.svg || config.node.svg;
    const fontColor = node.fontColor || config.node.fontColor;

    return {
        ...node,
        className: CONST.NODE_CLASS_NAME,
        cursor: config.node.mouseCursor,
        cx: (node && node.x) || "0",
        cy: (node && node.y) || "0",
        fill: fill,
        fontColor: fontColor,
        fontSize: fontSize * t,
        dx: dx,
        fontWeight: highlight ? config.node.highlightFontWeight : config.node.fontWeight,
        id: node.id,
        label: label,
        onClickNode: nodeCallbacks.onClickNode,
        onRightClickNode: nodeCallbacks.onRightClickNode,
        onMouseOverNode: nodeCallbacks.onMouseOverNode,
        onMouseOut: nodeCallbacks.onMouseOut,
        opacity: opacity,
        renderLabel: config.node.renderLabel,
        size: nodeSize * t,
        stroke: stroke,
        strokeWidth: strokeWidth * t,
        svg: svg,
        type: node.symbolType || config.node.symbolType,
        viewGenerator: node.viewGenerator || config.node.viewGenerator,
        overrideGlobalViewGenerator: !node.viewGenerator && node.svg
    };
}

// List of properties that are of no interest when it comes to nodes and links comparison
const NODE_PROPERTIES_DISCARD_TO_COMPARE = ["x", "y", "vx", "vy", "index"];

/**
 * This function checks for graph elements (nodes and links) changes, in two different
 * levels of significance, updated elements (whether some property has changed in some
 * node or link) and new elements (whether some new elements or added/removed from the graph).
 * @param {Object} nextProps - nextProps that graph will receive.
 * @param {Object} currentState - the current state of the graph.
 * @returns {Object.<string, boolean>} returns object containing update check flags:
 * - newGraphElements - flag that indicates whether new graph elements were added.
 * - graphElementsUpdated - flag that indicates whether some graph elements have
 * updated (some property that is not in NODE_PROPERTIES_DISCARD_TO_COMPARE was added to
 * some node or link or was updated).
 * @memberof Graph/helper
 */
function checkForGraphElementsChanges(nextProps, currentState) {
    const nextNodes = nextProps.data.nodes.map((n) => utils.antiPick(n, NODE_PROPERTIES_DISCARD_TO_COMPARE));
    const nextLinks = nextProps.data.links;
    const stateD3Nodes = currentState.d3Nodes.map((n) => utils.antiPick(n, NODE_PROPERTIES_DISCARD_TO_COMPARE));
    const stateD3Links = currentState.d3Links.map((l) => ({
        // FIXME: solve this source data inconsistency later
        source: l.source.id || l.source,
        target: l.target.id || l.target
    }));
    const graphElementsUpdated = !(
        utils.isDeepEqual(nextNodes, stateD3Nodes) && utils.isDeepEqual(nextLinks, stateD3Links)
    );
    const newGraphElements
        = nextNodes.length !== stateD3Nodes.length
        || nextLinks.length !== stateD3Links.length
        || !utils.isDeepEqual(nextNodes.map(({id}) => ({id: id})), stateD3Nodes.map(({id}) => ({id: id})))
        || !utils.isDeepEqual(nextLinks, stateD3Links.map(({source, target}) => ({source: source, target: target})));

    return {graphElementsUpdated: graphElementsUpdated, newGraphElements: newGraphElements};
}

/**
 * Logic to check for changes in graph config.
 * @param {Object} nextProps - nextProps that graph will receive.
 * @param {Object} currentState - the current state of the graph.
 * @returns {Object.<string, boolean>} returns object containing update check flags:
 * - configUpdated - global flag that indicates if any property was updated.
 * - d3ConfigUpdated - specific flag that indicates changes in d3 configurations.
 * @memberof Graph/helper
 */
function checkForGraphConfigChanges(nextProps, currentState) {
    const newConfig = nextProps.config || {};
    const configUpdated
        = newConfig && !utils.isEmptyObject(newConfig) && !utils.isDeepEqual(newConfig, currentState.config);
    const d3ConfigUpdated = newConfig && newConfig.d3 && !utils.isDeepEqual(newConfig.d3, currentState.config.d3);

    return {configUpdated: configUpdated, d3ConfigUpdated: d3ConfigUpdated};
}

/**
 * Encapsulates common procedures to initialize graph.
 * @param {Object} props - Graph component props, object that holds data, id and config.
 * @param {Object} props.data - Data object holds links (array of **Link**) and nodes (array of **Node**).
 * @param {string} props.id - the graph id.
 * @param {Object} props.config - same as {@link #buildGraph|config in buildGraph}.
 * @param {Object} state - Graph component current state (same format as returned object on this function).
 * @returns {Object} a fully (re)initialized graph state object.
 * @memberof Graph/helper
 */
function initializeGraphState({data, id, config}, state) {
    _validateGraphData(data);

    let graph;

    if (state && state.nodes) {
        graph = {
            nodes: data.nodes.map(
                (n) => (state.nodes[n.id]
                    ? Object.assign({}, n, utils.pick(state.nodes[n.id], NODE_PROPS_WHITELIST))
                    : Object.assign({}, n))
            ),
            links: data.links.map((l, index) => _mapDataLinkToD3Link(l, index, state && state.d3Links, config, state))
        };
    } else {
        graph = {
            nodes: data.nodes.map((n) => Object.assign({}, n)),
            links: data.links.map((l) => Object.assign({}, l))
        };
    }

    const newConfig = Object.assign({}, utils.merge(DEFAULT_CONFIG, config || {}));
    const nodes = _initializeNodes(graph.nodes);
    const links = _initializeLinks(graph.links, newConfig); // Matrix of graph connections
    const {nodes: d3Nodes, links: d3Links} = graph;
    const formatedId = id.replace(/ /g, "_");
    const simulation = _createForceSimulation(newConfig.width, newConfig.height, newConfig.d3 && newConfig.d3.gravity);

    return {
        id: formatedId,
        config: newConfig,
        links: links,
        d3Links: d3Links,
        nodes: nodes,
        d3Nodes: d3Nodes,
        highlightedNode: "",
        simulation: simulation,
        newGraphElements: false,
        configUpdated: false,
        transform: 1
    };
}

/**
 * This function updates the highlighted value for a given node and also updates highlight props.
 * @param {Object.<string, Object>} nodes - an object containing all nodes mapped by their id.
 * @param {Object.<string, Object>} links - an object containing a matrix of connections of the graph.
 * @param {Object} config - an object containing rd3g consumer defined configurations {@link #config config} for the graph.
 * @param {string} id - identifier of node to update.
 * @param {string} value - new highlight value for given node.
 * @returns {Object} returns an object containing the updated nodes
 * and the id of the highlighted node.
 * @memberof Graph/helper
 */
function updateNodeHighlightedValue(nodes, links, config, id, value = false) {
    const highlightedNode = value ? id : "";
    const node = Object.assign({}, nodes[id], {highlighted: value});
    let updatedNodes = Object.assign({}, nodes, {[id]: node});

    // When highlightDegree is 0 we want only to highlight selected node
    if (links[id] && config.highlightDegree !== 0) {
        updatedNodes = Object.keys(links[id]).reduce((acc, linkId) => {
            const updatedNode = Object.assign({}, updatedNodes[linkId], {highlighted: value});

            return Object.assign(acc, {[linkId]: updatedNode});
        }, updatedNodes);
    }

    return {
        nodes: updatedNodes,
        highlightedNode: highlightedNode
    };
}

export {
    buildLinkProps,
    buildNodeProps,
    checkForGraphConfigChanges,
    checkForGraphElementsChanges,
    initializeGraphState,
    updateNodeHighlightedValue
};