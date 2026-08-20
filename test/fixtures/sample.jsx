// Sample JSX file for integration tests
import React from 'react';

function Button({ label, onClick, disabled }) {
  return (
    <button className="btn btn-primary" onClick={onClick} disabled={disabled} aria-label={label}>
      {label}
    </button>
  );
}

function App() {
  const handleClick = () => {
    console.log('Button clicked');
  };

  return (
    <div className="app-container">
      <h1>Minification Test App</h1>
      <Button label="Click me" onClick={handleClick} disabled={false} />
    </div>
  );
}

export default App;
