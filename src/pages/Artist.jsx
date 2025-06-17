import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Artist = () => {
  const [artist, setArtist] = useState([]);
  const [wikipedia, setWikipedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const baseURL = window.APP_CONFIG?.baseURL || '';
    const apiURL = `${baseURL}/artist/logs`.replace(/\/+/g, '/');
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

  


