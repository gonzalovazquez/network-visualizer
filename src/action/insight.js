// import axios from 'axios';
import cluster from '../data/dummy.json';

export const insightHasErrored = (bool) => ({
  type: 'INSIGHT_HAS_ERROR',
  hasErrored: bool,
});

export const insightIsLoading = (bool) => ({
  type: 'INSIGHT_IS_LOADING',
  isLoading: bool,
});

export const insightSuccessful = (items) => ({
  type: 'INSIGHT_IS_SUCCESSFUL',
  items,
});

/**
 * Fetch data of cluster
 * @param {string} url - URL to Cluster Insight
 */
export const fetchData = () => (dispatch) => {
  dispatch(insightSuccessful(cluster));
    // dispatch(insightIsLoading(true));
    // axios
    // .get(url)
    // .then(response => {
    //   dispatch(insightIsLoading(false));
    //   dispatch(insightHasErrored(false));
    //   dispatch(insightSuccessful(response.data));
    // });
};
