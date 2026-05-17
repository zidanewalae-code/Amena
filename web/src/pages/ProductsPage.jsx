import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function ProductsPage() {
  return <ProductsContent />;
}

function ProductsContent() {
  const { user } = useAuth();
  const canEdit = ['admin', 'organization'].includes(user?.role);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', quantity: '', expiration_date: '', category_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(productsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load products');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm({ name: '', quantity: '', expiration_date: '', category_id: '' });
    setEditingId(null);
  }

  function beginEdit(product) {
    setEditingId(product.product_id);
    setForm({
      name: product.name || '',
      quantity: String(product.quantity ?? ''),
      expiration_date: product.expiration_date || '',
      category_id: String(product.category_id || '')
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        category_id: form.category_id ? Number(form.category_id) : null
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save product');
    }
  }

  async function handleDelete(productId) {
    try {
      await api.delete(`/products/${productId}`);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete product');
    }
  }

  async function addCategory(event) {
    event.preventDefault();
    const categoryName = event.currentTarget.category_name.value.trim();

    if (!categoryName) {
      return;
    }

    try {
      await api.post('/categories', { name: categoryName });
      event.currentTarget.reset();
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create category');
    }
  }

  async function removeCategory(categoryId) {
    try {
      await api.delete(`/categories/${categoryId}`);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete category');
    }
  }

  return (
    <Layout title="Products" subtitle="Manage products and categories with a simple CRUD form.">
      <section className="grid-2">
        <article className="card">
          <div className="card-header">
            <div>
              <h2>Product Management</h2>
              <p>Admin and organization users can create, update, or delete products.</p>
            </div>
          </div>

          {canEdit ? (
            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                <span>Name</span>
                <input name="name" value={form.name} onChange={handleChange} />
              </label>
              <label>
                <span>Quantity</span>
                <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} />
              </label>
              <label>
                <span>Expiration date</span>
                <input name="expiration_date" type="date" value={form.expiration_date} onChange={handleChange} />
              </label>
              <label>
                <span>Category</span>
                <select name="category_id" value={form.category_id} onChange={handleChange}>
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingId ? 'Update product' : 'Create product'}
                </button>
                {editingId ? (
                  <button className="ghost-button" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <p className="inline-message">You can view products but only admin and organization roles can edit them.</p>
          )}

          {message ? <p className="inline-message error">{message}</p> : null}

          <div className="list-stack">
            {products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                canEdit={canEdit}
                onEdit={beginEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <h2>Categories</h2>
              <p>Small helper to keep product classification simple.</p>
            </div>
          </div>

          {canEdit ? (
            <form className="inline-form" onSubmit={addCategory}>
              <input name="category_name" placeholder="New category name" />
              <button className="primary-button" type="submit">
                Add
              </button>
            </form>
          ) : null}

          <div className="list-stack">
            {categories.map((category) => (
              <div key={category.category_id} className="list-row">
                <div>
                  <strong>{category.name}</strong>
                  <p>{category.products?.length || 0} products</p>
                </div>
                {canEdit ? (
                  <button className="link-button danger" type="button" onClick={() => removeCategory(category.category_id)}>
                    Delete
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </section>
    </Layout>
  );
}