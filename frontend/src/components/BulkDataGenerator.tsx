import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { categoriesAPI, subjectsAPI, topicsAPI, questionsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Database, Loader2, CheckCircle2 } from 'lucide-react';

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

interface GenerationProgress {
  current: string;
  total: number;
  completed: number;
  percentage: number;
}

export const BulkDataGenerator = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [questionsPerTopic, setQuestionsPerTopic] = useState<number>(75);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<{
    topicsCreated: number;
    questionsCreated: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catsData, subsData, topsData] = await Promise.all([
        categoriesAPI.getAll(true),
        subjectsAPI.getAll(),
        topicsAPI.getAll(),
      ]);

      // Flatten categories
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

      setCategories(flattenCategories(catsData || []));
      
      const subjectsArray = Array.isArray(subsData) ? subsData : (subsData?.subjects || []);
      const topicsArray = Array.isArray(topsData) ? topsData : (topsData?.topics || []);
      
      setAllSubjects(subjectsArray);
      setAllTopics(topicsArray);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load data');
    }
  };

  // Sample topic names for different subjects
  const getTopicNamesForSubject = (subjectName: string): string[] => {
    const subjectLower = subjectName.toLowerCase();
    
    if (subjectLower.includes('math') || subjectLower.includes('गणित')) {
      return [
        'Algebra', 'Trigonometry', 'Geometry', 'Mensuration', 'Number System',
        'Percentage', 'Profit & Loss', 'Ratio & Proportion', 'Time & Work',
        'Speed & Distance', 'Simple Interest', 'Compound Interest', 'Statistics',
        'Probability', 'Permutation & Combination'
      ];
    }
    
    if (subjectLower.includes('reasoning') || subjectLower.includes('तर्क')) {
      return [
        'Analogy', 'Classification', 'Series', 'Coding-Decoding', 'Blood Relations',
        'Direction Sense', 'Syllogism', 'Statement & Conclusion', 'Puzzle',
        'Seating Arrangement', 'Calendar', 'Clock', 'Venn Diagram', 'Non-Verbal Reasoning'
      ];
    }
    
    if (subjectLower.includes('english') || subjectLower.includes('अंग्रेजी')) {
      return [
        'Grammar', 'Vocabulary', 'Reading Comprehension', 'Synonyms & Antonyms',
        'Idioms & Phrases', 'One Word Substitution', 'Sentence Correction',
        'Active & Passive Voice', 'Direct & Indirect Speech', 'Cloze Test',
        'Para Jumbles', 'Error Spotting', 'Fill in the Blanks', 'Sentence Completion'
      ];
    }
    
    if (subjectLower.includes('general knowledge') || subjectLower.includes('सामान्य ज्ञान') || subjectLower.includes('gk')) {
      return [
        'History', 'Geography', 'Polity', 'Economics', 'Science & Technology',
        'Current Affairs', 'Awards & Honors', 'Books & Authors', 'Sports',
        'Indian Constitution', 'World Organizations', 'Famous Personalities',
        'Important Dates', 'National Symbols', 'Rivers & Mountains'
      ];
    }
    
    if (subjectLower.includes('science') || subjectLower.includes('विज्ञान')) {
      return [
        'Physics', 'Chemistry', 'Biology', 'General Science', 'Environmental Science',
        'Units & Measurements', 'Laws & Principles', 'Inventions & Discoveries',
        'Human Body', 'Plants & Animals', 'Natural Phenomena'
      ];
    }
    
    // Default topics for any other subject
    return [
      'Basics', 'Intermediate', 'Advanced', 'Fundamentals', 'Applications',
      'Theory', 'Practice', 'Concepts', 'Problems', 'Solutions'
    ];
  };

  const generateAllData = async () => {
    if (questionsPerTopic < 50 || questionsPerTopic > 100) {
      toast.error('Questions per topic must be between 50 and 100');
      return;
    }

    setGenerating(true);
    setProgress({ current: 'Starting...', total: 0, completed: 0, percentage: 0 });
    setResults(null);

    const errors: string[] = [];
    let topicsCreated = 0;
    let questionsCreated = 0;

    try {
      // Get subjects to process
      let subjectsToProcess = allSubjects;
      
      if (selectedCategoryId !== 'all') {
        subjectsToProcess = allSubjects.filter(sub => {
          const subCatId = sub.category_id && typeof sub.category_id === 'object' 
            ? (sub.category_id._id || sub.category_id.id)
            : sub.category_id;
          return subCatId?.toString() === selectedCategoryId;
        });
      }

      const totalSteps = subjectsToProcess.length;
      let currentStep = 0;

      for (const subject of subjectsToProcess) {
        currentStep++;
        const subjectId = subject._id || subject.id;
        const subjectName = subject.name;
        const categoryId = subject.category_id && typeof subject.category_id === 'object'
          ? (subject.category_id._id || subject.category_id.id)
          : subject.category_id;

        if (!subjectId || !categoryId) {
          errors.push(`Skipped ${subjectName}: Missing IDs`);
          continue;
        }

        // Get topic names for this subject
        const topicNames = getTopicNamesForSubject(subjectName);
        
        setProgress({
          current: `Processing ${subjectName}...`,
          total: totalSteps,
          completed: currentStep - 1,
          percentage: ((currentStep - 1) / totalSteps) * 100
        });

        // Check existing topics
        const existingTopics = allTopics.filter(t => {
          const tSubId = t.subject_id && typeof t.subject_id === 'object'
            ? (t.subject_id._id || t.subject_id.id)
            : t.subject_id;
          return tSubId?.toString() === subjectId?.toString();
        });

        const existingTopicNames = existingTopics.map(t => t.name.toLowerCase());

        // Create missing topics
        for (const topicName of topicNames) {
          if (existingTopicNames.includes(topicName.toLowerCase())) {
            continue; // Topic already exists
          }

          try {
            const newTopic = await topicsAPI.create({
              name: topicName,
              description: `Sample topic for ${subjectName}`,
              subject_id: subjectId
            });
            topicsCreated++;
            allTopics.push(newTopic);
          } catch (error: any) {
            errors.push(`Failed to create topic "${topicName}" for ${subjectName}: ${error.message}`);
          }
        }

        // Get all topics for this subject (including newly created)
        const subjectTopics = allTopics.filter(t => {
          const tSubId = t.subject_id && typeof t.subject_id === 'object'
            ? (t.subject_id._id || t.subject_id.id)
            : t.subject_id;
          return tSubId?.toString() === subjectId?.toString();
        });

        // Generate questions for each topic
        for (const topic of subjectTopics) {
          const topicId = topic._id || topic.id;
          if (!topicId) continue;

          setProgress({
            current: `Generating questions for ${subjectName} → ${topic.name}...`,
            total: totalSteps,
            completed: currentStep - 1,
            percentage: ((currentStep - 1) / totalSteps) * 100
          });

          // Generate questions for this topic
          const questions = [];
          for (let i = 1; i <= questionsPerTopic; i++) {
            const correctAnswer = Math.floor(Math.random() * 4);
            questions.push({
              question_text: `${topic.name} - Question ${i}: What is the solution to problem ${i}?`,
              option_a: `Option A for question ${i}`,
              option_b: `Option B for question ${i}`,
              option_c: `Option C for question ${i}`,
              option_d: `Option D for question ${i}`,
              correct_answer: correctAnswer,
              explanation: `This is the explanation for question ${i} in ${topic.name}. The correct answer is ${String.fromCharCode(65 + correctAnswer)}.`,
              explanation_hindi: `${topic.name} में प्रश्न ${i} के लिए यह स्पष्टीकरण है। सही उत्तर ${String.fromCharCode(65 + correctAnswer)} है।`,
              hint: `Think about the basics of ${topic.name}.`,
              hint_hindi: `${topic.name} की बुनियादी बातों के बारे में सोचें।`,
              category_id: categoryId,
              subject_id: subjectId,
              topic_id: topicId,
              category_ids: [categoryId],
              subject_ids: [subjectId],
              topic_ids: [topicId],
              difficulty_level: Math.floor(Math.random() * 10) + 1,
              time_duration: 60,
              question_reference: `SAMPLE-${subjectName.toUpperCase().replace(/\s+/g, '-')}-${topic.name.toUpperCase().replace(/\s+/g, '-')}-${i}`,
            });
          }

          try {
            const response = await questionsAPI.bulkCreate(questions);
            if (response.created) {
              questionsCreated += response.created;
            }
          } catch (error: any) {
            errors.push(`Failed to create questions for ${topic.name}: ${error.message}`);
          }
        }
      }

      setProgress({
        current: 'Completed!',
        total: totalSteps,
        completed: totalSteps,
        percentage: 100
      });

      setResults({
        topicsCreated,
        questionsCreated,
        errors
      });

      toast.success(`Successfully generated ${topicsCreated} topics and ${questionsCreated} questions!`);
      
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error('Bulk generation error:', error);
      toast.error('Error during bulk generation: ' + error.message);
    } finally {
      setGenerating(false);
      setTimeout(() => {
        setProgress(null);
      }, 3000);
    }
  };

  return (
    <Card className="border border-border/70 rounded-[1.5rem] shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle>Bulk Data Generator</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Generate topics and questions for all subjects automatically. This will create topics and 50-100 questions per topic.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category-filter">Filter by Category (Optional)</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger id="category-filter" className="rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat._id || cat.id} value={(cat._id || cat.id) as string}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-count">Questions per Topic</Label>
            <Input
              id="question-count"
              type="number"
              min="50"
              max="100"
              value={questionsPerTopic}
              onChange={(e) => setQuestionsPerTopic(parseInt(e.target.value) || 75)}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Between 50 and 100 questions</p>
          </div>
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{progress.current}</span>
              <span className="text-muted-foreground">
                {progress.completed} / {progress.total}
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Generation Complete!</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>✅ Topics Created: {results.topicsCreated}</p>
              <p>✅ Questions Created: {results.questionsCreated}</p>
              {results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Errors ({results.errors.length}):</p>
                  <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto">
                    {results.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                    {results.errors.length > 10 && (
                      <li>... and {results.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={generateAllData}
          disabled={generating || allSubjects.length === 0}
          className="w-full bg-gradient-primary rounded-xl"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Data...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Generate Topics & Questions for All Subjects
            </>
          )}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">ℹ️ What this will do:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Create topics for each subject (if not exists)</li>
            <li>Generate {questionsPerTopic} questions per topic</li>
            <li>Assign questions to proper category, subject, and topic</li>
            <li>Mathematics: Algebra, Trigonometry, Geometry, etc.</li>
            <li>Reasoning: Analogy, Series, Puzzle, etc.</li>
            <li>English: Grammar, Vocabulary, Comprehension, etc.</li>
            <li>And more topics based on subject type</li>
          </ul>
          <p className="mt-2 font-semibold">⚠️ This may take several minutes depending on the number of subjects.</p>
        </div>
      </CardContent>
    </Card>
  );
};

