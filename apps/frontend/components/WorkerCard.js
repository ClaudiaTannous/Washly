'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function WorkerCard({ worker }) {
  const [open, setOpen] = useState(false);
   const router = useRouter();


  const addr = [
    worker.profile.street,
    worker.profile.city,
    worker.profile.building_number &&
      `Building ${worker.profile.building_number}`,
  ]
    .filter(Boolean)
    .join(', ');

  const rating = Number(worker.rating?.avg || 0).toFixed(1);
  const reviewsCount = worker.rating?.count || 0;

  const cardStyle = {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '12px 16px',
    border: '1px solid rgba(204, 224, 235, 0.9)',
    boxShadow: '0 18px 40px rgba(131, 182, 203, 0.25)',
  };

  const topStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const avatarImgStyle = {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    objectFit: 'cover',
    border: '3px solid #ebf8fb',
    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.08)',
  };

  const mainStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const nameRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px',
  };

  const nameStyle = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1b2734',
  };

  const badgeBaseStyle = {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '999px',
    border: '1px solid transparent',
  };

  const badgeOnlineStyle = {
    ...badgeBaseStyle,
    background: '#e5fbe8',
    borderColor: '#34c759',
    color: '#1b7a34',
  };

  const badgeProStyle = {
    ...badgeBaseStyle,
    background: '#ebf8fb',
    borderColor: '#86becc',
    color: '#1c6d86',
  };

  const metaStyle = {
    fontSize: '13px',
    color: '#6b7a88',
  };

  const tagsRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '2px',
  };

  const tagStyle = {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '999px',
    background: '#f0fbff',
    color: '#1c6d86',
    border: '1px solid #c6e3f0',
  };

  const tagMoreStyle = {
    ...tagStyle,
    background: '#ffffff',
  };

  const ratingRowStyle = {
    marginTop: '4px',
  };

  const ratingStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#f5a623',
  };

  const ratingCountStyle = {
    fontSize: '12px',
    color: '#6b7a88',
  };

  const actionsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'flex-end',
  };

  const btnPrimaryStyle = {
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
    background: '#19b5d8',
    color: '#ffffff',
    boxShadow: '0 12px 24px rgba(25, 181, 216, 0.34)',
  };

  const btnOutlineStyle = {
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    border: '1px solid #86becc',
    cursor: 'pointer',
    background: '#ffffff',
    color: '#1c6d86',
  };

  const detailsStyle = {
    marginTop: '8px',
    borderTop: '1px solid #e5eff5',
    paddingTop: '8px',
  };

  const descStyle = {
    fontSize: '13px',
    color: '#4a5a68',
    marginBottom: '6px',
  };

  const detailsTitleStyle = {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '4px',
  };

  const servicesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr)',
    gap: '6px',
  };

  const serviceStyle = {
    borderRadius: '16px',
    padding: '6px 10px',
    background: '#f7fbff',
    border: '1px solid #d5e5f0',
    fontSize: '13px',
  };

  const serviceMainStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '6px',
  };

  const serviceNameStyle = {
    fontWeight: 600,
  };

  const serviceUnitStyle = {
    color: '#6b7a88',
  };

  const servicePriceStyle = {
    marginTop: '2px',
  };

  const serviceNotesStyle = {
    marginTop: '2px',
    fontSize: '11px',
    color: '#6b7a88',
  };

  return (
    <div style={cardStyle}>
      <div style={topStyle}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={worker.image_url || '/avatar-placeholder.png'}
            alt={worker.profile.name}
            style={avatarImgStyle}
          />
        </div>

        <div style={mainStyle}>
          <div style={nameRowStyle}>
            <span style={nameStyle}>{worker.profile.name}</span>
            {worker.is_online && (
              <span style={badgeOnlineStyle}>Online</span>
            )}
            {worker.is_professional && (
              <span style={badgeProStyle}>Professional</span>
            )}
          </div>

          <div style={metaStyle}>{addr}</div>

          <div style={tagsRowStyle}>
            {worker.services.slice(0, 3).map(s => (
              <span key={s.service_code} style={tagStyle}>
                {s.name}
              </span>
            ))}
            {worker.services.length > 3 && (
              <span style={tagMoreStyle}>
                +{worker.services.length - 3} services
              </span>
            )}
          </div>

          <div style={ratingRowStyle}>
            <span style={ratingStyle}>
              ⭐ {rating}
              {reviewsCount > 0 && (
                <span style={ratingCountStyle}>
                  {' '}
                  ({reviewsCount} reviews)
                </span>
              )}
            </span>
          </div>
        </div>

        <div style={actionsStyle}>
          <button
            type="button"
            style={btnOutlineStyle}
            onClick={() => setOpen(o => !o)}
          >
            {open ? 'Less details' : 'More details'}
          </button>
          <button
  type="button"
  style={btnPrimaryStyle}
  onClick={() => router.push(`/book/${worker.worker_id}`)}   // ⬅ navigate
>
  Book now
</button>

        </div>
      </div>

      {open && (
        <div style={detailsStyle}>
          {worker.profile.description && (
            <p style={descStyle}>{worker.profile.description}</p>
          )}

          <div style={detailsTitleStyle}>Services offered</div>
          <div style={servicesGridStyle}>
            {worker.services.map(service => (
              <div key={service.service_code} style={serviceStyle}>
                <div style={serviceMainStyle}>
                  <span style={serviceNameStyle}>{service.name}</span>
                  <span style={serviceUnitStyle}>{service.unit}</span>
                </div>
                <div style={servicePriceStyle}>
                  Starting from {service.base_price} ₪
                </div>
                {service.notes && (
                  <div style={serviceNotesStyle}>{service.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
