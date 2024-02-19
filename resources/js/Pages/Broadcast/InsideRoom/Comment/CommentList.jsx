import React from 'react';

const CommentList = ({ pusherComments, comments }) => {
  return (
    <ul>
      {pusherComments.length > 0 ? (
        pusherComments.map(pusherComment => (
          <li key={pusherComment.id}>
            <p>{pusherComment.comment}</p>
            {/* 他のプロパティも必要に応じて表示 */}
          </li>
        ))
      ) : (
        comments.map(comment => (
          <li key={comment.id}>
            <p>{comment.comment}</p>
            {/* 他のプロパティも必要に応じて表示 */}
          </li>
        ))
      )}
    </ul>
  );
};

export default CommentList;
