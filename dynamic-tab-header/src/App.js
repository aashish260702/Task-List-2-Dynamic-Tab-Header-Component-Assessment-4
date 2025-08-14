import React from 'react';
import DynamicTabHeader from './components/DynamicTabHeader';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>Dynamic Tab Header Demo</h1>
        <p>Interactive tab management with overflow handling</p>
      </header>
      <main className="app-main">
        <DynamicTabHeader />
      </main>
    </div>
  );
}

export default App;
