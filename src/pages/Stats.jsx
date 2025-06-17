import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Stats = () => {
  const [data, setData] = useState([]);
  const [display, setDisplay] = useState([]);
  const [loading, setLoading] = useState(true);
  
  function handleClick(prop) {
    setDisplay(data.props[prop].popular);
  }
  
  useEffect(() => {
    const baseURL = window.APP_CONFIG?.baseURL || '';
    const apiURL = `${baseURL}/stats/logs`.replace(/\/+/g, '/');
    fetch(apiURL)
      .then(response => response.json())
      .then(data => {
        console.log("data: ", data);
        setData(data);
        setDisplay(data.props.all_time.popular); 
        setLoading(false);
      })
      .catch(error => {
        console.error('Error: ', error);
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return (
      <Layout title="Stats - Bemused">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading stats...
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Stats - Bemused">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem', color: '#333' }}>Music Statistics</h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#555' }}>Time Periods:</h3>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            {Object.keys(data.props).map((p, index) => (
              <button 
                key={index}
                onClick={() => handleClick(p)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                {p.replace(/_/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #dee2e6',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  Plays
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #dee2e6',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  Track
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #dee2e6',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  Artist
                </th>
                <th style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #dee2e6',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  Album
                </th>
              </tr>
            </thead>
            <tbody>
              {display.map((row, index) => (
                <Row 
                  key={index} 
                  index={index} 
                  track={row.track} 
                  artist={row.artist} 
                  album={row.album} 
                  plays={row.plays}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

function Row({index, track, artist, album, plays}) {
  return (
    <tr style={{ 
      borderBottom: '1px solid #dee2e6',
      transition: 'background-color 0.2s'
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
      <td style={{ 
        padding: '0.75rem 1rem',
        fontWeight: '600',
        color: '#007bff'
      }}>
        {plays}
      </td>
      <td style={{ 
        padding: '0.75rem 1rem',
        fontWeight: '500'
      }}>
        {track.title}
      </td>
      <td style={{ 
        padding: '0.75rem 1rem',
        color: '#666'
      }}>
        {artist && artist.name}
      </td>
      <td style={{ 
        padding: '0.75rem 1rem',
        color: '#666'
      }}>
        {album && album.title}
      </td>
    </tr>
  );
}

export default Stats;
