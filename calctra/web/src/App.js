import React from 'react';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Calctra</h1>
        <p>A Decentralized Platform for Scientific Computing Resources</p>
      </header>
      <main className="app-main">
        <section className="hero">
          <h2>Welcome to Calctra</h2>
          <p>
            Reshaping the scientific computing ecosystem through blockchain technology, 
            artificial intelligence, and privacy-preserving computing.
          </p>
          <button className="cta-button">Get Started</button>
        </section>
        
        <section className="features">
          <h2>Key Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>Decentralized Computing Resources</h3>
              <p>Pool computing resources from around the world</p>
            </div>
            <div className="feature-card">
              <h3>Intelligent Resource Matching</h3>
              <p>AI-driven allocation of computing tasks</p>
            </div>
            <div className="feature-card">
              <h3>Privacy-Preserving Computing</h3>
              <p>Homomorphic encryption for secure data processing</p>
            </div>
            <div className="feature-card">
              <h3>CAL Token Economy</h3>
              <p>Incentivize resource sharing and fair value distribution</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Calctra. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App; 