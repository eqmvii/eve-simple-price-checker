import React from 'react';
import ReactDOM from 'react-dom';

// main app import
import App from './App';

//components import
import ItemQuickbar from './components/ItemQuickbar.js';
import ItemSearchbar from './components/ItemSearchbar.js';

// 'smoke tests' to look for errors when mounting the app and components
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<ItemQuickbar />, div);
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<ItemSearchbar />, div);
});


