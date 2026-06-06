import React from 'react';

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  canEdit,
  onAddToCart,
  onDonate
}) {
  return (
    <article className="list-card product-card">
      <div className="product-image">
        <img
          src={product.image || 'https://via.placeholder.com/150?text=No+Image'}
          alt={product.name}
          width="120"
          style={{ objectFit: 'cover', borderRadius: '8px' }}
        />
      </div>

      <div className="product-content">
        <div className="product-top">
          <h3>{product.name}</h3>
        </div>

        <p className="product-info">
          Available quantity: <strong>{product.quantity}</strong>
        </p>

        <p className="product-info">
          Expiration date: {product.expiration_date || 'No expiration'}
        </p>

        <div className="product-actions">
         <button
  className="primary-button"
  type="button"
  onClick={() => onDonate(product)}
>
  Donate
</button>

<button
  className="ghost-button"
  type="button"
  onClick={() => onAddToCart(product)}
>
  Add to cart
</button>
          {canEdit ? (
            <>
              <button
                className="link-button"
                type="button"
                onClick={() => onEdit(product)}
              >
                Edit
              </button>

              <button
                className="link-button danger"
                type="button"
                onClick={() => onDelete(product.product_id)}
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}