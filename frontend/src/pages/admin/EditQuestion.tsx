import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { QuestionForm } from '@/components/QuestionForm';
import { questionsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Question, QuestionFormData } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const EditQuestion = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Fetch the populated question details
        const data = await questionsAPI.getById(id);
        setQuestion(data);
      } catch (error: any) {
        console.error('Failed to fetch question:', error);
        toast.error('Failed to load question details');
        navigate('/admin/questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, navigate]);

  const handleSubmit = async (formData: QuestionFormData) => {
    if (!id || !user) return;
    
    try {
      setSaving(true);
      await questionsAPI.update(id, formData);
      toast.success('Question updated successfully');
      navigate('/admin/questions');
    } catch (error: any) {
      console.error('Failed to update question:', error);
      toast.error(error.message || 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading question details...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!question) {
    return null;
  }

  const extractId = (val: any) => {
    if (!val) return '';
    if (typeof val === 'object') return String(val._id || val.id || '');
    return String(val);
  };

  // Transform the API Question object into QuestionFormData expected by QuestionForm
  const initialData: QuestionFormData & { _id?: string } = {
    ...question,
    exam_names: Array.isArray(question.exam_names) ? question.exam_names : question.exam_name ? [question.exam_name] : [],
    category_ids: (question.category_ids || (question.category_id ? [question.category_id] : [])).map(extractId).filter(id => id && id !== 'undefined' && id !== 'null' && id !== '[object Object]'),
    subject_ids: (question.subject_ids || (question.subject_id ? [question.subject_id] : [])).map(extractId).filter(id => id && id !== 'undefined' && id !== 'null' && id !== '[object Object]'),
    topic_ids: (question.topic_ids || (question.topic_id ? [question.topic_id] : [])).map(extractId).filter(id => id && id !== 'undefined' && id !== 'null' && id !== '[object Object]'),
    category_id: extractId(question.category_id || (question.category_ids?.[0]) || null) || null,
    subject_id: extractId(question.subject_id || (question.subject_ids?.[0]) || null) || null,
    topic_id: extractId(question.topic_id || (question.topic_ids?.[0]) || null) || null,
    
    // Pass along the names/metadata if populated by backend
    category_names: question.category_id && typeof question.category_id === 'object' ? [(question.category_id as any).name] : undefined,
    subject_names: question.subject_id && typeof question.subject_id === 'object' ? [(question.subject_id as any).name] : undefined,
    topic_names: question.topic_id && typeof question.topic_id === 'object' ? [(question.topic_id as any).name] : undefined,
    
    time_duration: question.time_duration || null,
    question_image_url: question.question_image_url || '',
    question_video_url: question.question_video_url || '',
    option_a_image_url: question.option_a_image_url || '',
    option_b_image_url: question.option_b_image_url || '',
    option_c_image_url: question.option_c_image_url || '',
    option_d_image_url: question.option_d_image_url || '',
    hint_image_url: question.hint_image_url || '',
    explanation_image_url: question.explanation_image_url || '',
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/admin/questions')}
                className="h-8 px-2 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Question</h1>
            <p className="text-muted-foreground mt-1">
              Update question details, options, and categorization.
            </p>
          </div>
        </div>

        <QuestionForm 
          initialData={initialData} 
          onSubmit={handleSubmit} 
          onCancel={() => navigate('/admin/questions')}
          loading={saving}
        />
      </div>
    </AdminLayout>
  );
};

export default EditQuestion;
