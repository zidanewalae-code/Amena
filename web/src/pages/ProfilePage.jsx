import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function ProfilePage() {
  return <ProfileContent />;
}

function ProfileContent() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: ''
    });
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const response = await api.patch(`/users/${user.user_id}`, {
        ...form,
        password: form.password || undefined
      });

      const nextUser = { ...user, ...response.data.user };
      login({ token: window.localStorage.getItem('amena_token'), user: nextUser });
      setForm((current) => ({ ...current, password: '' }));
      setMessage('Profile updated');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update profile');
    }
  }

  return (
    <Layout title="Profile" subtitle="A simple local profile page for the current authenticated user.">
      <section className="card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          <label>
            <span>Email</span>
            <input name="email" value={form.email} onChange={handleChange} />
          </label>
          <label>
            <span>Phone</span>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            <span>New password</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current password" />
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              Save profile
            </button>
          </div>
        </form>

        {message ? <p className="inline-message">{message}</p> : null}
      </section>
    </Layout>
  );
}