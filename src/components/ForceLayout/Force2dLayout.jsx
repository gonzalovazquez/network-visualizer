import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

const style = {
  width: 1400,
  height: 600,
};

class Force2dLayout extends Component {

  constructor(props) {
    super(props);
    this.state = {
      resources: this.props.cluster.resources,
      links: this.props.cluster.relations,
      selection: '',
      types: [],
    };
  }

  componentDidMount() {
    const self = this;

    /* Data we've been fed */
    const items = this.state.resources;
    const links = this.state.links;
    const edges = [];
    const types = [];

    /**
     * Map through links to create edge for force graph
     */
    links.map(e => {
      const sourceNode = items.filter((n) => n.id === e.source)[0];
      const targetNode = items.filter((n) => n.id === e.target)[0];
      edges.push({ source: sourceNode, target: targetNode, value: e.Value });
    });

    /**
     * Map through items to filter types
     */
    items.map(e => {
      types.push(e.type);
      self.setState({ types });
    });

    /**
     * Creates force layout graph
     */
    const force = d3.layout.force()
      .charge(-450)
      .linkDistance(10)
      .linkStrength(0.8)
      .size([style.width, style.height])
      .nodes(items)
      .links(edges);

    /**
     * Creates container
     */
    const svg = d3.select('.mountPoint')
      .append('svg')
      .attr('viewBox', '0 0 1600 1200')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('class', 'kube-topology');

    /**
     * Creates links
     */
    const link = svg.selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .style('stroke', '#aaaaaa')
      .style('stoke-opacity', 0.6)
      .style('stroke-width', (d) => Math.sqrt(d.value / 2));


    const color = d3.scale.category20();

    /**
     * Creates nodes
     */
    const node = svg.selectAll('.node')
      .data(items)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', 5)
      .style('fill', (d) => color(d.type))
      .on('click', (d) => {
        self.setState({ selection: d.annotations.label });
      })
      .call(force.drag);

    /**
     * Force tick based animation
     */
    force.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    force.start();
  }

  render() {
    return (
      <div className="forceCluster">
        <div style={style} className="mountPoint" />
      </div>
    );
  }
}

Force2dLayout.propTypes = {
  cluster: PropTypes.object.isRequired,
};

export default Force2dLayout;
