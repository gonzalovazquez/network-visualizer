import { routerReducer } from 'react-router-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import insight from './reducers/insight';

const reducers = {
  insight,
};

const store = createStore(
  combineReducers({ ...reducers,
    routing: routerReducer,
  }),
  applyMiddleware(
    thunk,
    createLogger()
  )
);

export default store;
