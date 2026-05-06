import React, { useEffect, useRef, useState } from 'react';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let quill: any;
    
    const initQuill = async () => {
      const Quill = (await import('quill')).default;
      
      if (editorRef.current && !quillRef.current) {
        quill = new Quill(editorRef.current, {
          theme: 'snow',
          placeholder: placeholder || 'Type your content here...',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'indent': '-1'}, { 'indent': '+1' }],
              ['link', 'image'],
              ['blockquote', 'code-block'],
              [{ 'color': [] }, { 'background': [] }],
              ['clean']
            ]
          }
        });
        
        quillRef.current = quill;
        
        // Set initial value
        if (value) {
          quill.root.innerHTML = value;
        }
        
        // Listen for changes
        quill.on('text-change', () => {
          const html = quill.root.innerHTML;
          onChange(html === '<p><br></p>' ? '' : html);
        });
        
        setIsReady(true);
      }
    };
    
    initQuill();
    
    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);
  
  // Update value from props (controlled)
  useEffect(() => {
    if (quillRef.current && isReady) {
      const currentContent = quillRef.current.root.innerHTML;
      if (value !== currentContent && value !== (currentContent === '<p><br></p>' ? '' : currentContent)) {
        quillRef.current.root.innerHTML = value || '';
      }
    }
  }, [value, isReady]);

  return (
    <div className="rich-text-editor">
      <div ref={editorRef} className="min-h-[200px] bg-white" />
    </div>
  );
};

export default RichTextEditor;
