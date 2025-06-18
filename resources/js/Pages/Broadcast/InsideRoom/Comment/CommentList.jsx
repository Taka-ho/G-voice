import React from 'react';
import '../css/CommentList.css';

const CommentList = ({ comments }) => {
  // commentsがundefined/nullのときは空配列に
  const safeComments = comments ?? [];

  return (
    <div className="comment-list">
      {safeComments.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>
          コメントはまだありません
        </div>
      ) : (
        safeComments.map((comment, i) => (
          <div key={comment.id || i} className="comment-item">
            <div className="comment-author">{comment.author ?? '名無し'}</div>
            <div className="comment-body">{comment.body ?? comment.text ?? ''}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default CommentList;
