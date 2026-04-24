import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, FileSpreadsheet, AlertCircle, Download, X, Eye, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import * as docx from 'docx';
import { saveAs } from 'file-saver';

interface BulkUploadProps {
  onUpload: (file: File, format: 'csv' | 'docx') => Promise<void>;
  onPreview?: (questions: any[]) => void;
}

export const BulkUpload = ({ onUpload, onPreview }: BulkUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'csv' | 'docx'>('csv');
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadDummyTemplateCSV = () => {
    // Create dummy CSV template
    const csvContent = `difficulty_level,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,hint,question_reference,exam_names,time_duration
5,What is the capital of India?,Delhi,Mumbai,Kolkata,Chennai,0,Delhi is the capital of India,Think about the administrative center,REF001,SSC|Railway,60
6,Which planet is closest to the Sun?,Mercury,Venus,Earth,Mars,0,Mercury is the closest planet to the Sun,It's the first planet in our solar system,REF002,UPSC,45
7,What is 2 + 2?,3,4,5,6,1,2 + 2 equals 4,Basic arithmetic,REF003,Banking|SSC,30
8,Who wrote Romeo and Juliet?,Shakespeare,Dickens,Tolstoy,Hemingway,0,William Shakespeare wrote Romeo and Juliet,Think of famous English playwrights,REF004,SSC,90
5,What is the largest ocean?,Atlantic,Pacific,Indian,Arctic,1,The Pacific Ocean is the largest,Think about ocean sizes,REF005,UPSC|Railway,60`;

    // Create blob and download
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
      const { Document, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle } = docx;

      // Create header rows with field descriptions
      const headerRow = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Field', bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Required', bold: true, size: 20 })] })] }),
        ],
      });

      const fieldRows = [
        ['difficulty_level', 'Difficulty level from 1-10', 'Yes'],
        ['question_text', 'The question text', 'Yes'],
        ['option_a', 'Option A text', 'Yes'],
        ['option_b', 'Option B text', 'Yes'],
        ['option_c', 'Option C text', 'Yes'],
        ['option_d', 'Option D text', 'Yes'],
        ['correct_answer', 'Correct answer index (0-3 for A-D, 4 for X)', 'Yes'],
        ['explanation', 'Explanation for the answer', 'No'],
        ['hint', 'Hint for the question', 'No'],
        ['question_reference', 'Reference code (e.g., PYQ2023)', 'No'],
        ['exam_names', 'Exam names separated by |', 'No'],
        ['time_duration', 'Time in seconds (e.g., 60)', 'No'],
      ].map(([field, desc, required]) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: field, bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: desc, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: required, size: 18, color: required === 'Yes' ? 'FF0000' : '00AA00' })] })] }),
        ],
      }));

      // Sample question data table
      const sampleHeaderRow = new TableRow({
        children: [
          'Difficulty', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Answer', 'Explanation'
        ].map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 16 })] })] })),
      });

      const sampleRows = [
        ['5', 'What is the capital of India?', 'Delhi', 'Mumbai', 'Kolkata', 'Chennai', '0 (Delhi)', 'Delhi is the capital of India'],
        ['6', 'Which planet is closest to Sun?', 'Mercury', 'Venus', 'Earth', 'Mars', '0 (Mercury)', 'Mercury is closest to Sun'],
        ['7', 'What is 2 + 2?', '3', '4', '5', '6', '1 (4)', 'Basic arithmetic'],
      ].map(row => new TableRow({
        children: row.map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, size: 16 })] })] })),
      }));

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: 'Bulk Questions Upload Template',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: 'This document provides the format for bulk uploading questions to the system.',
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Field Definitions', bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [headerRow, ...fieldRows],
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Sample Questions', bold: true, size: 24 })],
              spacing: { before: 300, after: 100 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [sampleHeaderRow, ...sampleRows],
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Instructions:', bold: true, size: 20 })],
              spacing: { before: 300, after: 100 },
            }),
            new Paragraph({
              text: '1. Correct answer index: 0=A, 1=B, 2=C, 3=D, 4=X (none)',
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: '2. For multiple exam names, separate with pipe (|) like: SSC|Railway|Banking',
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: '3. Time duration is in seconds (e.g., 60 for 1 minute)',
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: '4. Difficulty level must be between 1 (easy) and 10 (hard)',
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: '5. When uploading, save this document as CSV format for bulk upload',
              spacing: { after: 50 },
            }),
          ],
        }],
      });

      const blob = await docx.Packer.toBlob(doc);
      saveAs(blob, 'dummy_questions_template.docx');
      toast.success('DOCX template downloaded!');
    } catch (error: any) {
      console.error('Failed to generate DOCX:', error);
      toast.error('Failed to generate DOCX template: ' + error.message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      setFormat('csv');
      setFile(selectedFile);
    } else if (ext === 'docx' || ext === 'doc') {
      setFormat('docx');
      setFile(selectedFile);
    } else {
      toast.error('Please select a CSV or DOCX file');
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
    const questions: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
      if (values.length < headers.length) continue;

      const question: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        if (header === 'difficulty_level') {
          question.difficulty_level = parseInt(value) || 5;
        } else if (header === 'correct_answer') {
          question.correct_answer = parseInt(value) || 0;
        } else if (header === 'time_duration') {
          question.time_duration = value ? parseInt(value) : null;
        } else if (header === 'exam_names') {
          question.exam_names = value ? value.split('|').map((n: string) => n.trim()).filter(Boolean) : [];
        } else if (header === 'category_ids' || header === 'subject_ids' || header === 'topic_ids') {
          question[header] = value ? value.split('|').map((id: string) => id.trim()).filter(Boolean) : [];
        } else {
          question[header] = value;
        }
      });

      if (!question.question_text || !question.option_a || !question.option_b || 
          !question.option_c || !question.option_d || question.correct_answer === undefined) {
        continue;
      }

      if (question.correct_answer < 0 || question.correct_answer > 4) {
        continue;
      }

      questions.push(question);
    }

    return questions;
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (format !== 'csv') {
      toast.info('Preview is only available for CSV files');
      return;
    }

    setPreviewLoading(true);
    try {
      const text = await file.text();
      const questions = parseCSV(text);
      
      if (questions.length === 0) {
        toast.error('No valid questions found in the file');
        return;
      }

      setPreviewQuestions(questions);
      setPreviewOpen(true);
      
      if (onPreview) {
        onPreview(questions);
      }
    } catch (error: any) {
      toast.error('Failed to parse file: ' + error.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file, format);
      // Reset file input
      setFile(null);
      setPreviewQuestions([]);
      // Reset file input element
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const getOptionLabel = (index: number) => {
    const labels = ['A', 'B', 'C', 'D', 'X'];
    return labels[index] || '?';
  };

  return (
    <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
      <CardHeader className="border-b border-border/60 px-4 py-3">
        <CardTitle className="text-sm font-semibold">Bulk Upload Questions</CardTitle>
        <p className="text-xs text-muted-foreground">Upload questions via CSV or DOCX format</p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Download Template Section */}
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold mb-1">Download Dummy Template</h3>
              <p className="text-xs text-muted-foreground">Download sample file to see the format</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadDummyTemplateCSV}
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/50 hover:bg-primary/10"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                CSV
              </Button>
              <Button
                onClick={downloadDummyTemplateDOCX}
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/50 hover:bg-primary/10"
              >
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                DOCX
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="font-semibold">Required for bulk upload:</span>
          </div>
          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
            <li>Difficulty Level (1-10) - Mandatory</li>
            <li>Question Text - Mandatory</li>
            <li>Options (a, b, c, d) - Mandatory</li>
            <li>Correct Answer (0-3 for a-d, 4 for x) - Mandatory</li>
            <li>Other fields (explanation, hint, etc.) are optional</li>
          </ul>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Select File (CSV or DOCX)</Label>
            <div className="mt-2 flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-input"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-2xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {file && (
                <div className="flex items-center gap-2">
                  {format === 'csv' ? (
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {file && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
              <p className="text-xs font-semibold mb-2">File Format: {format.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                {format === 'csv'
                  ? 'CSV should have columns: difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_answer, ...'
                  : 'DOCX should follow the template format with questions and options clearly marked.'}
              </p>
            </div>
          )}

          {file && format === 'csv' && (
            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                disabled={previewLoading}
                variant="outline"
                className="rounded-2xl flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewLoading ? 'Loading...' : 'Preview Questions'}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="rounded-2xl flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload Questions'}
              </Button>
            </div>
          )}

          {file && format !== 'csv' && (
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="rounded-2xl w-full"
            >
              {uploading ? 'Uploading...' : 'Upload Questions'}
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <p className="text-xs font-semibold mb-2">Format Guidelines:</p>
          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
            <li>CSV: Use comma-separated values with headers</li>
            <li>DOCX: Use structured format with clear question and option markers</li>
            <li>All fields except difficulty_level can be optional in individual rows</li>
            <li>Difficulty level must be between 1-10</li>
          </ul>
        </div>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-bold">Preview Questions ({previewQuestions.length})</DialogTitle>
            <DialogDescription className="text-xs">
              Review the questions before uploading. Make sure all data is correct.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-2">
              {previewQuestions.map((question, idx) => (
                <Card key={idx} className="border border-border/70 shadow-sm">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-bold text-xs text-primary">Q{idx + 1}.</span>
                          <Badge variant="outline" className="text-xs font-bold px-1.5 py-0">
                            Level {question.difficulty_level || 5}
                          </Badge>
                          {question.exam_names && question.exam_names.length > 0 && (
                            <Badge variant="secondary" className="text-xs font-semibold px-1.5 py-0">
                              {question.exam_names.join(', ')}
                            </Badge>
                          )}
                          {question.time_duration && (
                            <Badge variant="outline" className="text-xs font-semibold px-1.5 py-0">
                              {question.time_duration}s
                            </Badge>
                          )}
                          {question.question_reference && (
                            <span className="text-xs font-semibold text-muted-foreground">
                              Ref: {question.question_reference}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold mb-2 leading-tight">{question.question_text}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, optIdx) => {
                            const optionValue = question[opt];
                            const isCorrect = question.correct_answer === optIdx;
                            return optionValue ? (
                              <div
                                key={opt}
                                className={`flex items-start gap-1.5 p-1.5 rounded border text-xs ${
                                  isCorrect
                                    ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
                                    : 'border-border bg-muted/30'
                                }`}
                              >
                                <span className="font-bold text-xs w-4 flex-shrink-0">{getOptionLabel(optIdx)}.</span>
                                <span className={`flex-1 ${isCorrect ? 'font-bold text-green-700 dark:text-green-400' : 'font-semibold'}`}>
                                  {optionValue}
                                </span>
                                {isCorrect && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                            ) : null;
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {question.explanation && (
                            <div className="flex-1 min-w-[200px] p-1.5 bg-muted/50 rounded text-xs">
                              <p className="font-bold mb-0.5 text-xs">Explanation:</p>
                              <p className="font-semibold text-xs leading-tight">{question.explanation}</p>
                            </div>
                          )}
                          {question.hint && (
                            <div className="flex-1 min-w-[200px] p-1.5 bg-amber-50 dark:bg-amber-950/20 rounded text-xs">
                              <p className="font-bold mb-0.5 text-xs">Hint:</p>
                              <p className="font-semibold text-xs leading-tight">{question.hint}</p>
                            </div>
                          )}
                        </div>
                        {(question.category_ids?.length > 0 || question.subject_ids?.length > 0 || question.topic_ids?.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1 text-xs">
                            {question.category_ids?.length > 0 && (
                              <span className="font-semibold text-muted-foreground">
                                Categories: {question.category_ids.join(', ')}
                              </span>
                            )}
                            {question.subject_ids?.length > 0 && (
                              <span className="font-semibold text-muted-foreground">
                                Subjects: {question.subject_ids.join(', ')}
                              </span>
                            )}
                            {question.topic_ids?.length > 0 && (
                              <span className="font-semibold text-muted-foreground">
                                Topics: {question.topic_ids.join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(false)}
              className="rounded-xl font-semibold"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handleUpload();
              }}
              disabled={uploading}
              className="rounded-xl font-bold"
            >
              {uploading ? 'Uploading...' : 'Confirm & Upload'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

