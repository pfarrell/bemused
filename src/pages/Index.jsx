import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';


const baseURL = window.APP_CONFIG?.baseURL || '';

const Index = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiURL = `${baseURL}/artists/random?size=5`.replace(/\/+/g, '/');
    fetch(apiURL)
      .then(response => response.json())
      .then(data => {
        console.log("data: ", data);
        setArtists(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error: ', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout title="Bemused">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading albums...
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Bemused">
      <Artists artists={artists} />
    </Layout>
  );
}

function Artists({artists}) {
  return (
    <div className="flex">
      {artists.map((artist, index) => (
          <ArtistCard key={index} artist={artist} />
      ))}
    </div>
  );
}
function ArtistCard({artist}) {
  const baseURL = window.APP_CONFIG?.baseURL || '';
  return (
    <a key={artist.id} className="item" href={`/artist/${artist.id}`.replace(/\/+/g, '/')}>
      <img src={`https://patf.com/images/artists/sm/${artist.image_path}`} />
      <div className="item-title">{artist.name}</div>
    </a>
  );
}

export default Index;
