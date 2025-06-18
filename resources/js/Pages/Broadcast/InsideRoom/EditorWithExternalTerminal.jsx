import React, { useRef, useState, useLayoutEffect } from 'react';
import Editor from './Editor';
import TerminalComponent from './Terminal/TerminalComponent';

const EditorWithExternalTerminal = ({
  minEditorHeight = 80,
  minTerminalHeight = 60,
  defaultEditorRatio = 0.7,
  selectedFiles
}) => {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [editorHeight, setEditorHeight] = useState(420); // 0.7 * 600
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const h = containerRef.current.getBoundingClientRect().height;
        setContainerHeight(h);
        setEditorHeight(Math.max(minEditorHeight, Math.min(h - minTerminalHeight, h * defaultEditorRatio)));
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [minEditorHeight, minTerminalHeight, defaultEditorRatio]);

  const onMouseDown = () => {
    setDragging(true);
    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let y = e.clientY - rect.top;
    if (y < minEditorHeight) y = minEditorHeight;
    if (y > containerHeight - minTerminalHeight) y = containerHeight - minTerminalHeight;
    setEditorHeight(y);
  };
  const onMouseUp = () => {
    setDragging(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const terminalHeight = containerHeight - editorHeight - 8;

  return (
    <div
      ref={containerRef}
      className="ewet-root-container"
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: minEditorHeight + minTerminalHeight + 8,
        position: 'relative'
      }}
    >
      {/* Editor */}
      <div
        className="ewet-editor-panel editor-container"
        style={{
          height: `${editorHeight}px`,
          minHeight: minEditorHeight,
          overflow: 'hidden',
          transition: dragging ? 'none' : 'height 0.08s'
        }}
      >
        <Editor selectedFiles={selectedFiles} />
      </div>
      {/* Splitter */}
      <div
        className={`ewet-splitter${dragging ? ' dragging' : ''}${hovering ? ' hovering' : ''}`}
        style={{
          height: 8,
          cursor: 'row-resize',
          userSelect: 'none',
          zIndex: 2,
          position: 'relative',
          background: dragging || hovering ? '#19f' : '#555',
          transition: 'background 0.18s'
        }}
        onMouseDown={onMouseDown}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* 左端ガイド */}
        {hovering || dragging ? (
          <div style={{
            position: 'absolute',
            left: 6,
            top: 2,
            width: 22,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.8)',
            opacity: 0.9,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            fontSize: 15,
            letterSpacing: 2,
          }}>
            <span style={{ fontWeight: 'bold', color: '#1d1d1d' }}>···</span>
          </div>
        ) : null}
        {/* 右端ガイド */}
        {hovering || dragging ? (
          <div style={{
            position: 'absolute',
            right: 6,
            top: 2,
            width: 22,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.8)',
            opacity: 0.9,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            fontSize: 15,
            letterSpacing: 2,
          }}>
            <span style={{ fontWeight: 'bold', color: '#1d1d1d' }}>···</span>
          </div>
        ) : null}
      </div>

      {/* Terminal */}
      <div
        className="ewet-terminal-panel terminal-area"
        style={{
          height: `${terminalHeight}px`,
          minHeight: minTerminalHeight,
          overflow: 'hidden',
          borderTop: '1px solid #444',
          transition: dragging ? 'none' : 'height 0.08s'
        }}
      >
        <TerminalComponent />
      </div>
    </div>
  );
};

export default EditorWithExternalTerminal;
