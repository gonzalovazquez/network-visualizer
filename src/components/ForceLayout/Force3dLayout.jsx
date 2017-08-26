import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import ForceGraph3D from '../../vendor/3d-force-graph/3d-force-graph';

// import ForceGraph3D from '3d-force-graph';

const style = {
  cluster: {
    position: 'fixed',
    height: '100%',
    width: '100%',
    marginRight: 100,
    marginTop: 2,
  },
};

const myGraph = ForceGraph3D();

class ForceLayout extends Component {

  componentDidMount() {
    /* Data we've been fed */
    const items = this.props.cluster.nodes;
    const links = this.props.cluster.links;
    const edges = [];

    /**
     * Map through links to create edge for force graph
     */
    links.map(e => {
      const sourceNode = items.filter((n) => n.id === e.source)[0];
      const targetNode = items.filter((n) => n.id === e.target)[0];
      edges.push({ source: sourceNode, target: targetNode, value: e.Value });
    });

    /**
     * Render Graph
     */
    this.renderGraph(items, edges);
  }

    /**
   * Render cluster
   * @param {array} items - Resources
   * @param {array} links - Relationship of resources
   */
  renderGraph(items, links) {
    /**
     * Instantiate myGraph
     */
    const mountPoint = d3.select('.forceCluster')[0][0];
    /**
     * Creates a 3d Force Graph
     */
    myGraph(mountPoint)
      .graphData({ nodes: items, links })
      .nameField('id')
      .lineOpacity(0.7)
      .nodeRelSize(4)
      .autoColorBy('type')
      .cooldownTicks(300)
      .onNodeClick(e => {
        this.props.selectedNode(e);
      })
      .cooldownTime(20000);
  }

  render() {
    return (
      <div>
        <div style={style.cluster} className="forceCluster" />
      </div>
    );
  }
}

ForceLayout.propTypes = {
  cluster: PropTypes.object.isRequired,
  selectedNode: PropTypes.func,
  filtered: PropTypes.array,
  filterByRelationship: PropTypes.array,
  relationship: PropTypes.string,
};

export default ForceLayout;
