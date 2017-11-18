import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// 'smoke test' to look for errors when mounting
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
});

