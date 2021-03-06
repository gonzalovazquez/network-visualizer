import './3d-force-graph.css';

import './threeGlobal';
import 'three/examples/js/controls/TrackBallControls';

import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';
const ngraph = { graph, forcelayout, forcelayout3d };

import * as SWC from 'swc';

const CAMERA_DISTANCE2NODES_FACTOR = 150;
const yAxis = new THREE.Vector3(0,1,0);
let rotateAnimation = true;

export default SWC.createComponent({

  /**
   * Define properties for visualization
   */
  props: [
    new SWC.Prop('width', window.innerWidth),
    new SWC.Prop('height', window.innerHeight),
    new SWC.Prop('jsonUrl'),
    new SWC.Prop('graphData', {
      nodes: [],
      links: []
    }),
    new SWC.Prop('numDimensions', 3),
    new SWC.Prop('nodeRelSize', 4), // volume per val unit
    new SWC.Prop('nodeResolution', 8), // how many slice segments in the sphere's circumference
    new SWC.Prop('onNodeClick'),
    new SWC.Prop('lineOpacity', 0.2),
    new SWC.Prop('autoColorBy'),
    new SWC.Prop('idField', 'id'),
    new SWC.Prop('valField', 'val'),
    new SWC.Prop('nameField', 'name'),
    new SWC.Prop('colorField', 'color'),
    new SWC.Prop('linkSourceField', 'source'),
    new SWC.Prop('linkTargetField', 'target'),
    new SWC.Prop('forceEngine', 'd3'), // d3 or ngraph
    new SWC.Prop('warmupTicks', 0), // how many times to tick the force engine at init before starting to render
    new SWC.Prop('cooldownTicks', Infinity),
    new SWC.Prop('cooldownTime', 15000), // ms
    new SWC.Prop('canvasColor', 0xEEEEEE) // canvas color
  ],

  /**
   * Initializa visualization
   * @param {element} - domNode - HTML element
   * @param {object} - state- State to store values
   */
  init: (domNode, state) => {

    // Wipe DOM
    domNode.innerHTML = '';

    // Add nav info section
    let navInfo;
    domNode.appendChild(navInfo = document.createElement('div'));
    navInfo.className = 'graph-nav-info';
    navInfo.textContent = "MOVE mouse & press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan";

    // Add info space
    domNode.appendChild(state.infoElem = document.createElement('div'));
    state.infoElem.className = 'graph-info-msg';
    state.infoElem.textContent = '';
    
    // Setup tooltip
    const toolTipElem = document.createElement('div');
    toolTipElem.classList = 'graph-tooltip';
    domNode.appendChild(toolTipElem);


    // Add context space
    const contextElem = document.createElement('div');
    contextElem.className = 'graph-context-msg';
    contextElem.textContent = '';
    domNode.appendChild(contextElem);

    // Capture mouse coords on move
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();

    mousePos.x = -2; // Initialize off canvas
    mousePos.y = -2;

    /**
     * Add mousemove listener
     */
    domNode.addEventListener('mousemove', ev => {
      // update the mouse pos
      const offset = getOffset(domNode),
        relPos = {
          x: ev.pageX - offset.left,
          y: ev.pageY - offset.top
        };
      mousePos.x = (relPos.x / state.width) * 2 - 1;
      mousePos.y = -(relPos.y / state.height) * 2 + 1;

      // Move tooltip
      toolTipElem.style.top = (relPos.y - 40) + 'px';
      toolTipElem.style.left = (relPos.x - 20) + 'px';

      function getOffset(el) {
        const rect = el.getBoundingClientRect(),
          scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
          scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
      }

    }, false);

    // Handle click events on nodes
    domNode.addEventListener('click', ev => {
      rotateAnimation = false;
      if (state.onNodeClick) {
        raycaster.setFromCamera(mousePos, state.camera);
        const intersects = raycaster.intersectObjects(state.graphScene.children)
          .filter(o => o.object.__data); // Check only objects with data (nodes)
        if (intersects.length) {
          state.onNodeClick(intersects[0].object.__data);
        }
      }
    }, false);

    // Setup renderer
    state.renderer = new THREE.WebGLRenderer();
    domNode.appendChild(state.renderer.domElement);

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(state.canvasColor);
    scene.add(state.graphScene = new THREE.Group());

    // Add lights
    scene.add(new THREE.AmbientLight(0xbbbbbb));
    scene.add(new THREE.DirectionalLight(0xffffff, 0.6));

    // Setup camera
    state.camera = new THREE.PerspectiveCamera();
    state.camera.fov = 30;

    // Add camera interaction
    const tbControls = new THREE.TrackballControls(state.camera, state.renderer.domElement);

    // Add D3 force-directed layout
    state.d3ForceLayout = d3.forceSimulation()
      .force('link', d3.forceLink())
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter())
      .stop();

    let rotObjectMatrix;

    /**
     * Rotate object around axis
     * @param {object} object - Element
     * @param {objecy} axis - Axis to rotate on
     * @param {integer} radians - Radians
     */
    const rotateAroundObjectAxis = (object, axis, radians) => {
        rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotObjectMatrix);
        object.rotation.setFromRotationMatrix(object.matrix);
    }

    /**
     * Kick off animation
     */
    (function animate() { // IIFE
      if (state.onFrame) state.onFrame();

      // Update tooltip
      raycaster.setFromCamera(mousePos, state.camera);
      const intersects = raycaster.intersectObjects(state.graphScene.children)
        .filter(o => o.object.name); // Check only objects with labels
      toolTipElem.textContent = intersects.length ? intersects[0].object.name : '';

      /**
       * Highlight Node on hover
       * @todo Highlight node when on hover
       */
      const cube = raycaster.intersectObjects(state.graphScene.children);

      // if (cube.length === 1) {
      //   for (var a = 0; a < cube.length; a++) {
      //     cube[a].object.type === 'Mesh' ? cube[a].object.material.color.setHex(0xfd7a16) : null;
      //   }
      // }

      // Update context menu
      raycaster.setFromCamera(mousePos, state.camera);
      const contextData = raycaster.intersectObjects(state.graphScene.children)
        .filter(o => o.object.name); // Check only objects with labels;
      contextElem.textContent = contextData.length ? `Node type: ${contextData[0].object.__data.type}` : '';

      if (rotateAnimation) {
        //rotateAroundObjectAxis(state.graphScene, yAxis, Math.PI / 240);
      }


      // Frame cycle
      tbControls.update();
      state.renderer.render(scene, state.camera);
      requestAnimationFrame(animate);

    })();
  },

  /**
   * Update animation state
   * @param {object} state - Animation state
   */
  update: function updateFn(state) {
    resizeCanvas();

    state.onFrame = null; // Pause simulation
    state.infoElem.textContent = 'Loading...';

    if (state.graphData.nodes.length || state.graphData.links.length) {
      console.info('3d-force-graph loading', state.graphData.nodes.length + ' nodes', state.graphData.links.length + ' links');
    }

    if (!state.fetchingJson && state.jsonUrl && !state.graphData.nodes.length && !state.graphData.links.length) {
      // (Re-)load data
      state.fetchingJson = true;
      qwest.get(state.jsonUrl).then((_, json) => {
        state.fetchingJson = false;
        state.graphData = json;
        updateFn(state);  // Force re-update
      });
    }

    // Auto add color to uncolored nodes
    autoColorNodes(state.graphData.nodes, state.autoColorBy, state.colorField);

    // parse links
    state.graphData.links.forEach(link => {
      link.source = link[state.linkSourceField];
      link.target = link[state.linkTargetField];
    });

    // Add WebGL objects
    while (state.graphScene.children.length) { state.graphScene.remove(state.graphScene.children[0]) } // Clear the place

    let sphereGeometries = {}; // indexed by node value
    let sphereMaterials = {}; // indexed by color
    state.graphData.nodes.forEach(node => {
      const val = node[state.valField] || 1;
      if (!sphereGeometries.hasOwnProperty(val)) {
        sphereGeometries[val] = new THREE.SphereGeometry(Math.cbrt(val) * state.nodeRelSize, state.nodeResolution, state.nodeResolution);
      }

      const color = node[state.colorField] || 0xffffaa;
      if (!sphereMaterials.hasOwnProperty(color)) {
        sphereMaterials[color] = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.75 });
      }

      const sphere = new THREE.Mesh(sphereGeometries[val], sphereMaterials[color]);

      sphere.name = node[state.nameField]; // Add label
      sphere.__data = node; // Attach node data

      state.graphScene.add(node.__sphere = sphere);
    });

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xb4b1b1, transparent: true, opacity: state.lineOpacity });
    state.graphData.links.forEach(link => {
      const geometry = new THREE.BufferGeometry();
      geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
      const line = new THREE.Line(geometry, lineMaterial);

      line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last

      state.graphScene.add(link.__line = line);
    });

    if (state.camera.position.x === 0 && state.camera.position.y === 0) {
      // If camera still in default position (not user modified)
      state.camera.lookAt(state.graphScene.position);
      state.camera.position.z = Math.cbrt(state.graphData.nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
    }

    // Feed data to force-directed layout
    const isD3Sim = state.forceEngine !== 'ngraph';
    let layout;
    if (isD3Sim) {
      // D3-force
      (layout = state.d3ForceLayout)
        .stop()
        .alpha(1)// re-heat the simulation
        .numDimensions(state.numDimensions)
        .nodes(state.graphData.nodes)
        .force('link')
          .id(d => d[state.idField])
          .links(state.graphData.links);
    } else {
      // ngraph
      const graph = ngraph.graph();
      state.graphData.nodes.forEach(node => { graph.addNode(node[state.idField]); });
      state.graphData.links.forEach(link => { graph.addLink(link.source, link.target); });
      layout = ngraph['forcelayout' + (state.numDimensions === 2 ? '' : '3d')](graph);
      layout.graph = graph; // Attach graph reference to layout
    }

    for (let i = 0; i < state.warmupTicks; i++) { layout[isD3Sim ? 'tick' : 'step'](); } // Initial ticks before starting to render

    let cntTicks = 0;
    const startTickTime = new Date();
    state.onFrame = layoutTick;
    state.infoElem.textContent = '';

    /**
     * Resize Canvas
     */
    function resizeCanvas() {
      if (state.width && state.height) {
        state.renderer.setSize(state.width, state.height);
        state.camera.aspect = state.width/state.height;
        state.camera.updateProjectionMatrix();
      }
    }

    function layoutTick() {
      if (cntTicks++ > state.cooldownTicks || (new Date()) - startTickTime > state.cooldownTime) {
        state.onFrame = null; // Stop ticking graph
      }

      layout[isD3Sim ? 'tick' : 'step'](); // Tick it

      // Update nodes position
      state.graphData.nodes.forEach(node => {
        const sphere = node.__sphere,
          pos = isD3Sim ? node : layout.getNodePosition(node[state.idField]);

        sphere.position.x = pos.x;
        sphere.position.y = pos.y || 0;
        sphere.position.z = pos.z || 0;
      });

      // Update links position
      state.graphData.links.forEach(link => {
        const line = link.__line,
          pos = isD3Sim
            ? link
            : layout.getLinkPosition(layout.graph.getLink(link.source, link.target).id),
          start = pos[isD3Sim ? 'source' : 'from'],
          end = pos[isD3Sim ? 'target' : 'to'],
          linePos = line.geometry.attributes.position;

        linePos.array[0] = start.x;
        linePos.array[1] = start.y || 0;
        linePos.array[2] = start.z || 0;
        linePos.array[3] = end.x;
        linePos.array[4] = end.y || 0;
        linePos.array[5] = end.z || 0;

        linePos.needsUpdate = true;
        line.geometry.computeBoundingSphere();
      });
    }
    /**
     * Color nodes based on kinds
     * @param {object} nodes - Nodes to select
     * @param {object} colorBy - Color by
     * @param {object} colorField - Group
     */
    function autoColorNodes(nodes, colorBy, colorField) {
      if (!colorBy) return;

      // Color brewer paired set
      const colors = ['#d73027','#fc8d59','#fee090','#ffffbf','#e0f3f8','#91bfdb','#4575b4'];

      const uncoloredNodes = nodes.filter(node => !node[colorField]),
        nodeGroups = {};

      uncoloredNodes.forEach(node => { nodeGroups[node[colorBy]] = null });
      Object.keys(nodeGroups).forEach((group, idx) => { nodeGroups[group] = idx });

      uncoloredNodes.forEach(node => {
        node[colorField] = parseInt(colors[nodeGroups[node[colorBy]] % colors.length].slice(1), 16);
      });
    }
  }
});
