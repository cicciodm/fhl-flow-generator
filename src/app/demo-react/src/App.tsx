import React from 'react';
import './App.css';
import GameBoard from "./components/GameBoard";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Flow</h1>
        <div>Taken from the Flow mobile game, connect dots of the same color with a continuous line, filling the whole board</div>
      </header>
      <GameBoard />
    </div>
  );
}

export default App;
