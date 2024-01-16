import Editor from './Editor.jsx';
import FileTree from './FileTree.jsx';
import './css/Editor.css';
import './css/Tab.css';
export default function InsideRoom() {
  return (
    <div className='all-space'>
        <div className='file-tree'>
          <FileTree />
        </div>
        <div className='Editor'>
            <Editor />
        </div>
    </div>
  );
}
