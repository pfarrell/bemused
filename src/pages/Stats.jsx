import React, { useState, useEffect } from 'react';

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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Stats</h1>
      <ul>
        {Object.keys(data.props).map((p, index) => (
          <li key={index}>
            <a key={index} onClick={() =>handleClick(p)}>{p}</a>
          </li>
        ))}
      </ul>
      <table>
        <thead>
          <tr key={'header'}>
            <th key={'plays'}>Plays</th>
            <th key={'track'}>Track</th>
            <th key={'artist'}>Artist</th>
            <th key={'album'}>Album</th>
          </tr>
        </thead>
        <tbody>
          {display.map((row, index) => (
            <Row key={index} index={index} track={row.track} artist={row.artist} album={row.album} plays={row.plays}/>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function Row({index, track, artist, album, plays}) {
  return (
    <tr key={index}>
      <td key={`plays${track.id}`}>{plays}</td>
      <td key={`track${track.id}`}>{track.title}</td>
      <td key={`artist${track.id}`}>{artist && artist.name}</td>
      <td key={`album${track.id}`}>{album && album.title}</td>
    </tr>
  );
}

export default Stats;


