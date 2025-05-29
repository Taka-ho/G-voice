// ConfirmationAlert.jsx
import React from 'react';

const ConfirmationAlert = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirmation-alert">
      <p>{message}</p>
      <button onClick={onConfirm}>続行</button>
      <button onClick={onCancel}>キャンセル</button>
    </div>
  );
};

export default ConfirmationAlert;
