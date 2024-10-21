import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ViewPage.css';

const ViewPage = () => {
  const [users, setUsers] = useState([]);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  
  const correctPassword = 'kpl_12_2025';  // Replace with the correct password

  useEffect(() => {
    if (authenticated) {
      const fetchUsers = async () => {
        let { data: users, error } = await supabase
          .from('users')
          .select('*')
          .order('player_type', { ascending: true });  // Sort users by player type
        if (error) console.error(error);
        else setUsers(users);
      };
      fetchUsers();
    }
  }, [authenticated]);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setAuthenticated(true);
    } else {
      alert('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="view-container">
      {!authenticated ? (
        <div className="password-protect">
          <h2>Password Required</h2>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
            <button type="submit">Submit</button>
          </form>
        </div>
      ) : (
        <>
          <h2>Players List</h2>
          <div className="card-list">
            {users.map((user) => (
              <div className="card" key={user.id}>
                <img src={user.photo_url} alt="User" className="user-image" />
                <div className="card-content">
                  <h3>{user.name}</h3>
                  <p><strong>FMC ID:</strong> {user.fmcid}</p>
                  <p><strong>Shirt Size:</strong> {user.shirt_size}</p>
                  <p><strong>Jersey Number:</strong> {user.jersey_number}</p>
                  <p><strong>Mobile:</strong> {user.mobile_number}</p>
                  <p><strong>Address:</strong> {user.address}</p>
                  <p><strong>Player Type:</strong> {user.player_type}</p>
                  <p><strong>Payment Status:</strong> {user.payment}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ViewPage;
