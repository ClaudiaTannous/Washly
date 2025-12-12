'use client';

import { useState } from 'react';

export default function SearchFilters({ onApply }) {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [isProfessional, setIsProfessional] = useState('');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  function handleApply() {
    onApply({
      q: q || undefined,
      city: city || undefined,
      service_code: serviceCode || undefined,
      is_professional:
        isProfessional === '' ? undefined : isProfessional === 'true',
      pickup: pickup === '' ? undefined : pickup === 'true',
      delivery: delivery === '' ? undefined : delivery === 'true',
      minRating: minRating === '' ? undefined : Number(minRating),
      maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
    });
  }

  function handleReset() {
    setQ('');
    setCity('');
    setServiceCode('');
    setIsProfessional('');
    setPickup('');
    setDelivery('');
    setMinRating('');
    setMaxPrice('');
    onApply({});
  }

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
  };

  const rowStyle = {
    display: 'flex',
    gap: '8px',
  };

  const halfFieldStyle = {
    ...fieldStyle,
    flex: 1,
  };

  const labelStyle = {
    fontSize: '12px',
    color: '#5b6b7b',
  };

  const inputStyle = {
    borderRadius: '999px',
    border: '1px solid #c3d7e5',
    padding: '7px 11px',
    fontSize: '13px',
    background: '#ffffff',
  };

  const buttonsRowStyle = {
    marginTop: '8px',
    display: 'flex',
    gap: '8px',
  };

  const btnPrimaryStyle = {
    flex: 1,
    borderRadius: '999px',
    padding: '7px 0',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    background: '#19b5d8',
    color: '#ffffff',
    boxShadow: '0 12px 26px rgba(25, 181, 216, 0.35)',
  };

  const btnOutlineStyle = {
    flex: 1,
    borderRadius: '999px',
    padding: '7px 0',
    fontSize: '13px',
    border: '1px solid #86becc',
    cursor: 'pointer',
    background: '#ffffff',
    color: '#1c6d86',
  };

  return (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Search term</label>
        <input
          style={inputStyle}
          placeholder="Name, street, or description…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>City</label>
        <input
          style={inputStyle}
          placeholder="e.g. Haifa"
          value={city}
          onChange={e => setCity(e.target.value)}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Service code</label>
        <input
          style={inputStyle}
          placeholder="e.g. WASH_STD"
          value={serviceCode}
          onChange={e => setServiceCode(e.target.value)}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Provider type</label>
        <select
          style={inputStyle}
          value={isProfessional}
          onChange={e => setIsProfessional(e.target.value)}
        >
          <option value="">Any</option>
          <option value="true">Professional / laundromat</option>
          <option value="false">Private / student</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Pickup</label>
        <select
          style={inputStyle}
          value={pickup}
          onChange={e => setPickup(e.target.value)}
        >
          <option value="">Doesn&apos;t matter</option>
          <option value="true">Pickup available</option>
          <option value="false">No pickup</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Delivery</label>
        <select
          style={inputStyle}
          value={delivery}
          onChange={e => setDelivery(e.target.value)}
        >
          <option value="">Doesn&apos;t matter</option>
          <option value="true">Delivery available</option>
          <option value="false">No delivery</option>
        </select>
      </div>

      <div style={rowStyle}>
        <div style={halfFieldStyle}>
          <label style={labelStyle}>Minimum rating</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            max="5"
            step="0.5"
            placeholder="e.g. 4"
            value={minRating}
            onChange={e => setMinRating(e.target.value)}
          />
        </div>
        <div style={halfFieldStyle}>
          <label style={labelStyle}>Maximum price</label>
          <input
            style={inputStyle}
            type="number"
            min="1"
            placeholder="₪"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div style={buttonsRowStyle}>
        <button type="button" style={btnPrimaryStyle} onClick={handleApply}>
          Search
        </button>
        <button type="button" style={btnOutlineStyle} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
