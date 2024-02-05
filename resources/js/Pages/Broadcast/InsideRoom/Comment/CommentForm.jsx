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
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add Comment</button>
    </form>
  );
};

export default CommentForm;