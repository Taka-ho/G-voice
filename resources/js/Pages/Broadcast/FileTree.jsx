import FolderTree, { testData } from 'react-folder-tree';
import 'react-folder-tree/dist/style.css';
import './css/FileTree.css';

const FileTree = () => {
  const onTreeStateChange = (state, event) => console.log(state, event);

  return (
    <FolderTree
      data={ testData }
      onChange={ onTreeStateChange }
    />
  );
};

export default FileTree;
