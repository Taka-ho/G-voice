// components/NavigationModal.jsx
import React from 'react';
import '.././css/modalOfBroadcast.scss';

const NavigationModal = ({ show, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="nav-modal-backdrop">
      <div className="nav-modal">
        <h2 className="nav-modal__title">ページを離れますか？</h2>
        <p className="nav-modal__message">
          離れると配信が終了します。本当によろしいですか？
        </p>
        <div className="nav-modal__actions">
          <button onClick={onCancel} className="btn btn--gray">
            キャンセル
          </button>
          <button onClick={onConfirm} className="btn btn--blue" rel='/dashboard'>
            離れる
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationModal;
