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
        rows={1}  // 行数を指定します。必要に応じて適切な数を設定してください。
        wrap="off"  // 改行を無効にします。
        style={{ resize: 'none' }}
      />
      <button type="submit">Add Comment</button>
    </form>
  );
};

export default CommentForm;
