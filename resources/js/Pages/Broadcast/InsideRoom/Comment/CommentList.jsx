import React from 'react';
import '../css/CommentList.css';

const CommentList = ({ pusherComments, comments }) => {
  // commentsがnullまたはundefinedの場合は空の配列として扱う
  const safeComments = comments || [];

  return (
    <div className='comment-list'>
      <ul>
        {pusherComments.length > 0 ? (
          pusherComments.map(pusherComment => (
            <li key={pusherComment.id}>
              <p>{pusherComment.comment}</p>
              {/* 他のプロパティも必要に応じて表示 */}
            </li>
          ))
        ) : (
          safeComments.map(comment => (
            <li key={comment.id}>
              <p>{comment.comment}</p>
              {/* 他のプロパティも必要に応じて表示 */}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default CommentList;
