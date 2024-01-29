import Editor from './Editor.jsx';
import FileTree from './FileTree.jsx';
import './css/Editor.css';
import './css/Tab.css';

export default function InsideRoom() {
  return (
    <div className='wrapper'>
      <div className='Editor'>
          <FileTree />
      </div>
    </div>
  );
}
