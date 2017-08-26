import React from 'react';
import { Provider } from 'react-redux';
import { Router, Route, browserHistory, IndexRoute } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

// STORE
import store from './store';

// Components
import Container from './components/Container/Container';
import MainViewer from './components/MainViewer/MainViewer';

// Vendor
import './vendor/materialized';

// Create an enhanced history that syncs navigation events with the store
const history = syncHistoryWithStore(browserHistory, store);


const App = () => (
  <Provider store={store}>
    <app>
      <Router history={history}>
        <Route path="/" component={Container}>
          <IndexRoute component={MainViewer} />
        </Route>
      </Router>
    </app>
  </Provider>
);

export default App;
