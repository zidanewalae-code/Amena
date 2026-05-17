import React from 'react';

export default function ProductCard({ product, onEdit, onDelete, canEdit }) {
  return (
    <article className="list-card">
      <div>
        <strong>{product.name}</strong>
        <p>
          Qty: {product.quantity} | Expiration: {product.expiration_date || '-'} | Category: {product.category?.name || '-'}
        </p>
      </div>
      {canEdit ? (
        <div className="row-actions">
          <button className="link-button" type="button" onClick={() => onEdit(product)}>
            Edit
          </button>
          <button className="link-button danger" type="button" onClick={() => onDelete(product.product_id)}>
            Delete
          </button>
        </div>
      ) : null}
    </article>
  );
}