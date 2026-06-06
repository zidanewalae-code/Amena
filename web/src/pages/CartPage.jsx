import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart =
      JSON.parse(localStorage.getItem("cart")) || [];

    setCart(savedCart);
  }, []);
  function removeFromCart(productId) {
    const updatedCart = cart.filter((item) => item.product_id !== productId);

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  }

  return (
    <Layout title="Cart" subtitle="Review your selected items before checkout.">
      <section className="card cart-shell">
        <div className="card-header">
          <div>
            <h2>Your Cart</h2>
            <p>Keep only the products you want to donate, then continue to checkout.</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <p className="empty-state">Cart is empty</p>
        ) : (
          <div className="cart-list">
            {cart.map((item, index) => (
              <article key={index} className="cart-item list-card">
                <img src={item.image || '/placeholder.png'} alt={item.name} />

                <div>
                  <h3>{item.name}</h3>
                  <p>Quantity: {item.quantity}</p>

                  <div className="cart-item-actions">
                    <button className="primary-button" type="button" onClick={() => navigate('/checkout')}>
                      Donate
                    </button>

                    <button className="ghost-button" type="button" onClick={() => removeFromCart(item.product_id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}