import React from 'react';

function getStockTone(quantity) {
  if (quantity <= 5) return 'danger';
  if (quantity <= 20) return 'warning';
  return 'success';
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  canEdit,
  onAddToCart,
  onDonate
}) {
  const stockTone = getStockTone(Number(product.quantity ?? 0));

  return (
    <article className="list-card product-card">
      <div className="product-image">
        <img
          className="product-image-element"
          src={product.image || 'https://via.placeholder.com/150?text=No+Image'}
          alt={product.name}
        />
      </div>

      <div className="product-content">
        <div className="product-top">
          <div>
            <span className="section-badge">Product</span>
            <h3>{product.name}</h3>
          </div>
          <span className={`status-chip tone-${stockTone}`}>
            {stockTone === 'danger' ? 'Low stock' : stockTone === 'warning' ? 'Medium stock' : 'In stock'}
          </span>
        </div>

        <p className="product-info">
          Available quantity: <strong>{product.quantity}</strong>
        </p>

        <p className="product-info">
          Expiration date: {product.expiration_date || 'No expiration'}
        </p>

        {product.category?.name ? <p className="product-info">Category: {product.category.name}</p> : null}

        <div className="product-actions">
          <button className="primary-button" type="button" onClick={() => onDonate(product)}>
            Donate
          </button>

          <button className="ghost-button" type="button" onClick={() => onAddToCart(product)}>
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