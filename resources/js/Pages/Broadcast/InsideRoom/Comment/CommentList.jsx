import React from 'react';
import '.././css/CommentList.css';
const CommentList = ({ pusherComments, comments }) => {
  console.log(comments);
  console.log(pusherComments);
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
          comments.map(comment => (
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
