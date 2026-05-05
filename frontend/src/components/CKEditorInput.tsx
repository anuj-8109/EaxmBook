import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface CKEditorInputProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

const CKEditorInput = ({ value, onChange, placeholder }: CKEditorInputProps) => {
  return (
    <div className="ck-editor-wrapper prose prose-sm max-w-none">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          placeholder: placeholder || 'Type your content here...',
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'link',
            'bulletedList',
            'numberedList',
            'blockQuote',
            'insertTable',
            'undo',
            'redo'
          ]
        }}
        onChange={(_event: any, editor: any) => {
          const data = editor.getData();
          onChange(data);
        }}
      />
    </div>
  );
};

export default CKEditorInput;
