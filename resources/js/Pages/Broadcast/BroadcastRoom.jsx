import ResultOfServer from './ResultOfServer.jsx';
import Editor from './Editor.jsx';
import './css/Editor.css';
import './css/Tab.css';
import './css/Broadcast.css'
export default function InsideRoom() {
  return (
    <div className='all-space'>
        <div className='Editor'>
            <Editor />
        </div>
        <div className='result-code'>
            <ResultOfServer />
        </div>
    </div>
  );
}
