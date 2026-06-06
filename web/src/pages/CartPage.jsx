import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart =
      JSON.parse(localStorage.getItem("cart")) || [];

    setCart(savedCart);
  }, []);
  function removeFromCart(productId) {
  const updatedCart = cart.filter(
    (item) => item.product_id !== productId
  );

  setCart(updatedCart);

  localStorage.setItem(
    "cart",
    JSON.stringify(updatedCart)
  );
}

  return (
    <div>
      <h1>Your Cart</h1>

      {cart.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        cart.map((item, index) => (
          <div
            key={index}
            className="list-card"
            style={{
              marginBottom: "20px",
              padding: "15px"
            }}
          >
            <img
              src={item.image || "/placeholder.png"}
              alt={item.name}
              width="120"
            />

            <h3>{item.name}</h3>

            <p>Quantity: {item.quantity}</p>

          <button
  className="primary-button"
  onClick={() => navigate("/checkout")}
>
  Donate
</button>

<button
  className="ghost-button"
  onClick={() => removeFromCart(item.product_id)}
>
  Remove
</button>
            
          </div>
        ))
      )}
    </div>
  );
}