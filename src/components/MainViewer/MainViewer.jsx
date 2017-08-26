import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  fetchData,
 } from '../../action/insight';
import Force3dLayout from '../ForceLayout/Force3dLayout';

/**
 * Main Viewer that brings component together
 * @class MainViewer
 * @extends {Component}
 */
class MainViewer extends Component {
  componentWillMount() {
    this.props.fetchData();
  }
  render() {
    return (
      <div>
        {Object.keys(this.props.cluster).length > 0 ?
          <Force3dLayout
            cluster={this.props.cluster}
          />
        : <p>Loading...</p> }
      </div>
    );
  }
}

/**
 * Maps documentation state to parameters.
 * @param {object} - Documentation.
 */
const mapStateToProps = (state) => ({
  cluster: state.insight.cluster,
});


MainViewer.propTypes = {
  cluster: PropTypes.object,
  fetchData: PropTypes.func,  
};

export default MainViewer = connect(mapStateToProps, {
  fetchData,
})(MainViewer);
