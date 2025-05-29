// hooks/UseNavigationConfirmation.js
import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

const UseNavigationConfirmation = (shouldBlock, showModal, setShowModal, onConfirm) => {
  const blockerRef = useRef(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      shouldBlock && currentLocation.pathname !== nextLocation.pathname,
    [shouldBlock]
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      blockerRef.current = blocker;
      setShowModal(true); // カスタムモーダルを表示
    }
  }, [blocker, setShowModal]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!shouldBlock) return;
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);

  const confirmNavigation = () => {
    blockerRef.current?.proceed();
    setShowModal(false);
    onConfirm?.();
  };

  const cancelNavigation = () => {
    // モーダルを閉じる
    setShowModal(false);
    // ブロッカーが存在する場合、遷移キャンセル
    blockerRef.current?.reset();
  };
  

  return { confirmNavigation, cancelNavigation };
};

export default UseNavigationConfirmation;
