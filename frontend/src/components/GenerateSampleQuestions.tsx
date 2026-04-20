import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { categoriesAPI, subjectsAPI, topicsAPI, questionsAPI, aiAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Sparkles, Loader2, Bot } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Category {
  _id?: string;
  id?: string;
  name: string;
  icon?: string;
  children?: Category[];
}

interface Subject {
  _id?: string;
  id?: string;
  name: string;
  category_id?: any;
}

interface Topic {
  _id?: string;
  id?: string;
  name: string;
  subject_id?: any;
}

export const GenerateSampleQuestions = ({ onComplete }: { onComplete?: () => void }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [generating, setGenerating] = useState(false);
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubjects(selectedCategoryId);
    } else {
      setSubjects([]);
      setTopics([]);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchTopics(selectedSubjectId);
    } else {
      setTopics([]);
    }
  }, [selectedSubjectId]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll(true);
      // Flatten categories for selection
      const flattenCategories = (cats: Category[]): Category[] => {
        let result: Category[] = [];
        cats.forEach(cat => {
          result.push(cat);
          if (cat.children) {
            result = result.concat(flattenCategories(cat.children));
          }
        });
        return result;
      };
      setCategories(flattenCategories(data || []));
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const fetchSubjects = async (categoryId: string) => {
    try {
      const data = await subjectsAPI.getAll(categoryId);
      setSubjects(Array.isArray(data) ? data : (data?.subjects || []));
    } catch (error) {
      console.error('Failed to fetch subjects', error);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    try {
      const data = await topicsAPI.getAll(subjectId);
      setTopics(Array.isArray(data) ? data : (data?.topics || []));
    } catch (error) {
      console.error('Failed to fetch topics', error);
    }
  };

  const generateSampleQuestions = async () => {
    if (!selectedCategoryId || !selectedSubjectId || !selectedTopicId) {
      toast.error('Please select Category, Subject, and Topic');
      return;
    }

    if (questionCount < 1 || questionCount > 100) {
      toast.error('Question count must be between 1 and 100');
      return;
    }

    setGenerating(true);

    const topic = topics.find(t => (t._id || t.id) === selectedTopicId);
    const subject = subjects.find(s => (s._id || s.id) === selectedSubjectId);
    const category = categories.find(c => (c._id || c.id) === selectedCategoryId);

    const topicName = topic?.name || 'Topic';
    const subjectName = subject?.name || 'Subject';

    try {
      let finalQuestions = [];

      if (useAI) {
        toast.info(`Generating ${questionCount} questions using AI... This may take a moment.`);
        const aiResponse = await aiAPI.generate({
          type: 'questions',
          context: { subject: subjectName, topic: topicName, difficulty: 5 },
          count: questionCount
        });

        if (aiResponse.questions && Array.isArray(aiResponse.questions)) {
          finalQuestions = aiResponse.questions.map((q: any, i: number) => ({
            question_text: q.question_text || `AI Question ${i}`,
            option_a: q.option_a || 'Option A',
            option_b: q.option_b || 'Option B',
            option_c: q.option_c || 'Option C',
            option_d: q.option_d || 'Option D',
            correct_answer: q.correct_answer || 0,
            explanation: q.explanation || 'No explanation provided.',
            category_id: selectedCategoryId,
            subject_id: selectedSubjectId,
            topic_id: selectedTopicId,
            category_ids: [selectedCategoryId],
            subject_ids: [selectedSubjectId],
            topic_ids: [selectedTopicId],
            exam_names: category?.name ? [category.name] : [],
            difficulty_level: 5,
            time_duration: 60,
            question_reference: `AI-${topicName.toUpperCase()}-${Date.now()}-${i}`,
          }));
        } else {
          throw new Error('AI returned an invalid format.');
        }
      } else {
        // Generate sample (dummy) questions
        for (let i = 1; i <= questionCount; i++) {
          const correctAnswer = Math.floor(Math.random() * 4); // 0-3 for A, B, C, D
          
          finalQuestions.push({
            question_text: `${topicName} - Sample Question ${i}: What is the answer to question ${i}?`,
            option_a: `Option A for question ${i}`,
            option_b: `Option B for question ${i}`,
            option_c: `Option C for question ${i}`,
            option_d: `Option D for question ${i}`,
            correct_answer: correctAnswer,
            explanation: `This is a sample explanation for question ${i}. The correct answer is ${String.fromCharCode(65 + correctAnswer)}.`,
            category_id: selectedCategoryId,
            subject_id: selectedSubjectId,
            topic_id: selectedTopicId,
            category_ids: [selectedCategoryId],
            subject_ids: [selectedSubjectId],
            topic_ids: [selectedTopicId],
            exam_names: category?.name ? [category.name] : [],
            difficulty_level: Math.floor(Math.random() * 10) + 1, // Random 1-10
            time_duration: 60, // 60 seconds per question
            question_reference: `SAMPLE-${topicName.toUpperCase()}-${i}`,
          });
        }
      }

      // Bulk create questions
      const response = await questionsAPI.bulkCreate(finalQuestions);
      if (response.created > 0) {
        toast.success(`Successfully generated ${response.created} questions for ${topicName}!`);
        if (onComplete) {
          onComplete();
        }
        // Reset form
        setSelectedCategoryId('');
        setSelectedSubjectId('');
        setSelectedTopicId('');
        setQuestionCount(useAI ? 5 : 50);
      } else {
        toast.error('Failed to save questions');
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast.error(error.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border border-border/70 rounded-[1.5rem] shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Generate Sample Questions</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Quickly generate sample questions for testing. Questions will be assigned to the selected topic.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category/Exam</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger id="category" className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat._id || cat.id} value={(cat._id || cat.id) as string}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select 
              value={selectedSubjectId} 
              onValueChange={setSelectedSubjectId}
              disabled={!selectedCategoryId}
            >
              <SelectTrigger id="subject" className="rounded-xl">
                <SelectValue placeholder={selectedCategoryId ? "Select subject" : "Select category first"} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(sub => (
                  <SelectItem key={sub._id || sub.id} value={(sub._id || sub.id) as string}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Select 
              value={selectedTopicId} 
              onValueChange={setSelectedTopicId}
              disabled={!selectedSubjectId}
            >
              <SelectTrigger id="topic" className="rounded-xl">
                <SelectValue placeholder={selectedSubjectId ? "Select topic" : "Select subject first"} />
              </SelectTrigger>
              <SelectContent>
                {topics.map(topic => (
                  <SelectItem key={topic._id || topic.id} value={(topic._id || topic.id) as string}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="count">Number of Questions</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || (useAI ? 5 : 50))}
                className="rounded-xl"
                placeholder={useAI ? "5" : "50"}
              />
              <p className="text-xs text-muted-foreground">Between 1 and 100 questions</p>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-xl bg-muted/30">
              <Switch
                id="use-ai"
                checked={useAI}
                onCheckedChange={setUseAI}
              />
              <Label htmlFor="use-ai" className="flex items-center gap-2 cursor-pointer">
                <Bot className="h-4 w-4 text-primary" />
                Use AI to generate meaningful questions
              </Label>
            </div>
          </div>
        </div>

        <Button
          onClick={generateSampleQuestions}
          disabled={!selectedCategoryId || !selectedSubjectId || !selectedTopicId || generating}
          className="w-full bg-gradient-primary rounded-xl"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating {questionCount} Questions...
            </>
          ) : (
            <>
              {useAI ? <Bot className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate {questionCount} {useAI ? 'AI Qs' : 'Sample Qs'}
            </>
          )}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">ℹ️ Note:</p>
          <p>Sample questions will be created with:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {useAI ? (
              <>
                <li>Meaningful AI-generated questions based on topic/subject</li>
                <li>Valid distractors (options)</li>
                <li>Logical explanation for the correct answer</li>
                <li>Automatically configured to difficulty level 5</li>
              </>
            ) : (
              <>
                <li>Random correct answers (A, B, C, or D)</li>
                <li>Random difficulty levels (1-10)</li>
                <li>60 seconds time duration per question</li>
                <li>Sample explanations</li>
                <li>Assigned to selected topic, subject, and category</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

