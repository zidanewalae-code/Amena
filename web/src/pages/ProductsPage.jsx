import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function ProductsPage() {
  return <ProductsContent />;
}

function ProductsContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = ['admin', 'organization'].includes(user?.role);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
const [form, setForm] = useState({
  name: '',
  quantity: '',
  expiration_date: '',
  category_id: '',
  image: ''
});  const [editingId, setEditingId] = useState(null);
  const [cart, setCart] = useState([]);
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
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
setForm({
  name: '',
  quantity: '',
  expiration_date: '',
  category_id: '',
  image: ''
});    setEditingId(null);
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
  category_id: form.category_id ? Number(form.category_id) : null,
  image: form.image
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

  function handleAddToCart(product) {
  const savedCart =
    JSON.parse(localStorage.getItem("cart")) || [];

  const existingProduct = savedCart.find(
    (item) => item.product_id === product.product_id
  );

  let updatedCart;

  if (existingProduct) {
    updatedCart = savedCart.map((item) =>
      item.product_id === product.product_id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  } else {
    updatedCart = [
  ...savedCart,
  {
    product_id: product.product_id,
    name: product.name,
    image: product.image,
    quantity: 1
  }
];
  }

  localStorage.setItem(
    "cart",
    JSON.stringify(updatedCart)
  );

  setMessage(`${product.name} added to cart`);
}

  async function handleDonate(product) {
    const singleProductCart = [
  {
    product_id: product.product_id,
    name: product.name,
    image: product.image,
    quantity: 1
  }
];

    localStorage.setItem('cart', JSON.stringify(singleProductCart));
    setCart(singleProductCart);
    navigate('/checkout');
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
              <label>
  <span>Image URL</span>
  <input
    name="image"
    placeholder="https://..."
    value={form.image}
    onChange={handleChange}
  />
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
  onAddToCart={handleAddToCart}
  onDonate={handleDonate}
/>
            ))}
          </div>
        </article>

        
      </section>
    </Layout>
  );
}