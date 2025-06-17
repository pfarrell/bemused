// src/App.jsx
import React from 'react';
import Layout from './components/Layout';
import Stats from './pages/Stats';
import Index from './pages/Index';

const App = () => {
  // Get the page to render from the global variable set by Sinatra
  const currentPage = window.REACT_PAGE || 'stats';
  
  // Render the appropriate page based on the Sinatra route
  const renderPage = () => {
    switch (currentPage) {
      case 'index':
        return <Index />;
      case 'stats':
        return <Stats />;
      case 'artist':
        return <Artist />;

      
      // Add more React pages here as you port them
      // case 'logs':
      //   return <Logs />;
      // case 'playlists':
      //   return <Playlists />;
      
      default:
        return (
          <Layout title="Unknown Page">
            <div>
              <h1>Unknown React Page</h1>
              <p>Page type: {currentPage}</p>
            </div>
          </Layout>
        );
    }
  };
  
  return renderPage();
};

export default App;
