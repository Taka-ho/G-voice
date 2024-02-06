import React from 'react';

const CommentList = ({ comments }) => {
  console.log(comments);
  return (
    <ul>
      {comments.map((comment, index) => (
        <li key={index}>{comment.text}</li>
      ))}
    </ul>
  );
};

export default CommentList;