const ViewerDashboard = ({ comments, addComment }) => {
    const pusherComments = usePusherComments();
  
    return (
      <div>
        <CommentList pusherComments={pusherComments} comments={comments} />
        <CommentForm onAddComment={addComment} />
      </div>
    );
  };
export default ViewerDashboard;