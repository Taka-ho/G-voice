import React from 'react';

const CommentList = ({ comments, updateComments }) => {
  console.log(comments);
  return (
    <ul>
      {comments.map((comment, index) => (
        <li key={index}>{comment.comment}</li>
      ))}
    </ul>
  );
};

export default CommentList;
