// Profile page displays and edits a user profile through backend API.
import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

export default function ProfilePage() {
  const [userId, setUserId] = useState('1');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  async function loadProfile() {
    const response = await fetch(apiUrl(`/api/users/${userId}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const data = await response.json();
    setProfile(data);
    if (data.full_name) setFullName(data.full_name);
    if (data.phone) setPhone(data.phone);
    if (data.profile?.city) setCity(data.profile.city);
  }

  useEffect(() => {
    if (token) {
      loadProfile().catch(() => {});
    }
  }, [token]);

  async function saveUser() {
    await fetch(apiUrl(`/api/users/${userId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ full_name: fullName, phone })
    });

    await fetch(apiUrl(`/api/users/${userId}/profile`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ city })
    });

    await loadProfile();
  }

  return (
    <main className="page">
      <h1>Profil utilisateur</h1>
      <div className="card">
        <label className="label">JWT Token</label>
        <textarea className="textarea" rows={4} value={token} onChange={(e) => setToken(e.target.value)} />
        <label className="label">User ID</label>
        <input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <button className="button" onClick={loadProfile}>Charger profil</button>
      </div>

      <div className="card">
        <label className="label">Nom complet</label>
        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <label className="label">Telephone</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className="label">Ville</label>
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        <button className="button" onClick={saveUser}>Enregistrer</button>
      </div>

      {profile && (
        <div className="card">
          <h3>Profil actuel</h3>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
