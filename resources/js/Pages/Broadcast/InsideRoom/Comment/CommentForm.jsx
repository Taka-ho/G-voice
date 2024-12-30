import React, { useState } from 'react';

const CommentForm = ({ onAddComment }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() !== '') {
      onAddComment({ text });
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
      value={text}
      onChange={(e) => setText(e.target.value)} 
      style={{ resize: 'none' }}
      rows={1}
      />
      <button type="submit">コメント</button>
    </form>
  );
};

export default CommentForm;
