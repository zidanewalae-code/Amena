import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const emptyState = (fields) => fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {});

export default function CrudTable({
  title,
  description,
  endpoint,
  fields,
  columns,
  canEdit = true,
  extraHeader,
  transformPayload,
  transformRow
}) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyState(fields));
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fieldNames = useMemo(() => fields.map((field) => field.name), [fields]);

  async function loadItems() {
    setLoading(true);
    setMessage('');

    try {
      const response = await api.get(endpoint);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [endpoint]);

  function resetForm() {
    setForm(emptyState(fields));
    setEditingId(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function beginEdit(item) {
    setEditingId(item.id);
    const nextForm = emptyState(fields);

    fieldNames.forEach((name) => {
      if (item[name] !== undefined && item[name] !== null) {
        nextForm[name] = String(item[name]);
      }
    });

    setForm(nextForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const payload = transformPayload ? transformPayload(form) : form;

      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload);
      } else {
        await api.post(endpoint, payload);
      }

      resetForm();
      await loadItems();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save record');
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`${endpoint}/${id}`);
      await loadItems();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete record');
    }
  }

  const rows = transformRow ? items.map(transformRow) : items;

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <button className="ghost-button" type="button" onClick={loadItems}>
          Refresh
        </button>
      </div>

      {extraHeader}

      {canEdit ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <label key={field.name}>
              <span>{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea name={field.name} value={form[field.name]} onChange={handleChange} rows="3" />
              ) : field.type === 'select' ? (
                <select name={field.name} value={form[field.name]} onChange={handleChange}>
                  <option value="">Select...</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input name={field.name} type={field.type || 'text'} value={form[field.name]} onChange={handleChange} />
              )}
            </label>
          ))}

          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId ? (
              <button className="ghost-button" type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {message ? <p className="inline-message">{message}</p> : null}

      <div className="table-wrap">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="empty-state">No records found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {canEdit ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(item) : item[column.key]}</td>
                  ))}
                  {canEdit ? (
                    <td className="row-actions">
                      <button type="button" className="link-button" onClick={() => beginEdit(item)}>
                        Edit
                      </button>
                      <button type="button" className="link-button danger" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}