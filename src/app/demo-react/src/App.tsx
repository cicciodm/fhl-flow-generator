import React from 'react';
import './App.css';
import GameBoard from "./components/GameBoard";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1 className={"title"}>Flow</h1>
      </header>
      <GameBoard />
    </div>
  );
}

export default App;
