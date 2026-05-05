import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import * as docx from 'docx';
import * as mammoth from 'mammoth';
import { saveAs } from 'file-saver';

interface BulkUploadProps {
  onUpload: (file: File, format: 'csv' | 'docx', parsedQuestions?: any[]) => Promise<void>;
  onPreview?: (questions: any[]) => void;
  onCancel?: () => void;
}

export const BulkUpload = ({ onUpload, onCancel }: BulkUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'csv' | 'docx'>('csv');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadDummyTemplateCSV = () => {
    let headers = 'question_text,question_text_hindi,option_a,option_a_hindi,option_b,option_b_hindi,option_c,option_c_hindi,option_d,option_d_hindi,correct_answer,answer_type,difficulty_level,time_duration,question_reference,exam_names,hint,hint_hindi,explanation,explanation_hindi';
    let row = '"What is the capital of France?","फ्रांस की राजधानी क्या है?","Paris","पेरिस","London","लंदन","Berlin","बर्लिन","Madrid","मैड्रिड","0","single","5","60","REF001","SSC|Railway","It starts with P","यह P से शुरू होता है","Paris is the capital of France","पेरिस फ्रांस की राजधानी है"';
    let csvContent = `${headers}\n${row}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'dummy_questions_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV template downloaded!');
  };

  const downloadDummyTemplateDOCX = async () => {
    try {
      const { Document, Paragraph, HeadingLevel, AlignmentType } = docx;
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: 'Bulk Questions Upload Template', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: 'Use the CSV template for best results.' }),
          ],
        }],
      });
      const blob = await docx.Packer.toBlob(doc);
      saveAs(blob, 'dummy_questions_template.docx');
      toast.success('DOCX template downloaded!');
    } catch (error: any) {
      toast.error('Failed to generate DOCX template');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    setFile(selectedFile);
    setFormat(ext === 'csv' ? 'csv' : 'docx');
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    setUploading(true);
    try {
      await onUpload(file, format);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Help Banner */}
      <div className="bg-[#e6f7ff] border border-[#bae7ff] rounded-lg p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#0050b3]">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium text-sm">Need help with format?</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadDummyTemplateCSV}
            className="bg-white border-[#d9d9d9] hover:border-[#40a9ff] hover:text-[#40a9ff] text-xs h-8 rounded-md"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-[#52c41a]" />
            . CSV Sample
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadDummyTemplateDOCX}
            className="bg-white border-[#d9d9d9] hover:border-[#40a9ff] hover:text-[#40a9ff] text-xs h-8 rounded-md"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5 text-[#1890ff]" />
            Word Sample
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Upload File</Label>
        <div className="flex items-center gap-0 overflow-hidden rounded-md border border-[#d9d9d9]">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#f5f5f5] hover:bg-[#e8e8e8] text-gray-700 border-r border-[#d9d9d9] rounded-none h-10 px-4 text-sm font-normal shadow-none"
          >
            Choose file
          </Button>
          <div className="flex-1 px-4 text-sm text-gray-500 bg-white flex items-center h-10 truncate">
            {file ? file.name : 'No file chosen'}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.docx,.doc,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <p className="text-[11px] text-gray-400 italic">Supported: .docx, .doc, .txt, .csv</p>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="bg-[#595959] hover:bg-[#434343] text-white border-none rounded-md h-9 px-6 text-sm font-medium"
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="bg-[#2eb872] hover:bg-[#239e5f] text-white border-none rounded-md h-9 px-6 text-sm font-medium shadow-none"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  );
};
