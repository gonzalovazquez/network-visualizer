const initialState = {
  cluster: {},
  hasErrored: false,
  isLoading: false,
};

export default function insight(state = initialState, action) {
  const newState = { ...state };
  switch (action.type) {
    case 'INSIGHT_IS_LOADING':
      newState.isLoading = action.isLoading;
      return newState;
    case 'INSIGHT_HAS_ERROR':
      newState.hasErrored = action.hasErrored;
      return newState;
    case 'INSIGHT_IS_SUCCESSFUL':
      newState.cluster = Object.assign({}, state.cluster, action.items);
      return newState;
    default:
      return newState;
  }
}
