import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Eye } from 'lucide-react';
import { questionsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Question {
  _id?: string;
  id?: string;
  question_text: string;
  exam_names?: string[];
  difficulty_level?: number;
}

interface DuplicateGroup {
  questions: Question[];
  similarity: number;
}

export const DuplicateDetector = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const calculateSimilarity = (text1: string, text2: string): number => {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 100;
    
    // Normalize texts
    const normalized1 = text1.trim().toLowerCase();
    const normalized2 = text2.trim().toLowerCase();
    
    if (normalized1 === normalized2) return 100;
    
    // Check for substring match (one contains the other)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2;
      const longer = normalized1.length >= normalized2.length ? normalized1 : normalized2;
      return Math.round((shorter.length / longer.length) * 100);
    }
    
    // Use Levenshtein distance for similarity
    const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
    const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
    
    if (longer.length === 0) return 100;
    
    const distance = levenshteinDistance(normalized1, normalized2);
    const similarity = ((longer.length - distance) / longer.length) * 100;
    return Math.round(similarity);
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim();
  };

  const findDuplicates = async () => {
    setLoading(true);
    try {
      // Fetch all questions - get multiple pages if needed
      let allQuestions: any[] = [];
      let page = 1;
      const limit = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const response = await questionsAPI.getAll({ limit, page });
        const questions = Array.isArray(response) ? response : (response?.questions || []);
        
        if (questions.length === 0) {
          hasMore = false;
        } else {
          allQuestions = [...allQuestions, ...questions];
          // If we got less than limit, we've reached the end
          if (questions.length < limit || (response && !Array.isArray(response) && response.total && allQuestions.length >= response.total)) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }
      
      if (allQuestions.length === 0) {
        toast.info('No questions found');
        setLoading(false);
        return;
      }

      const duplicateGroups: DuplicateGroup[] = [];
      const processed = new Set<string>();
      const questionMap = new Map<string, Question>();

      // Normalize and index all questions
      allQuestions.forEach((q: any) => {
        const id = (q._id || q.id) as string;
        questionMap.set(id, q);
      });

      for (let i = 0; i < allQuestions.length; i++) {
        const q1 = allQuestions[i];
        const id1 = (q1._id || q1.id) as string;
        
        if (processed.has(id1)) continue;
        
        const normalized1 = normalizeText(q1.question_text || '');
        if (!normalized1) continue;
        
        const group: Question[] = [q1];
        let maxSimilarity = 100;

        for (let j = i + 1; j < allQuestions.length; j++) {
          const q2 = allQuestions[j];
          const id2 = (q2._id || q2.id) as string;
          
          if (processed.has(id2) || id1 === id2) continue;
          
          const normalized2 = normalizeText(q2.question_text || '');
          if (!normalized2) continue;

          // Check for exact match first (normalized)
          if (normalized1 === normalized2) {
            group.push(q2);
            processed.add(id2);
            continue;
          }

          // Check for high similarity (90% or more)
          const similarity = calculateSimilarity(normalized1, normalized2);
          
          if (similarity >= 90) {
            group.push(q2);
            processed.add(id2);
            if (similarity > maxSimilarity) {
              maxSimilarity = similarity;
            }
          }
        }

        if (group.length > 1) {
          duplicateGroups.push({
            questions: group,
            similarity: maxSimilarity,
          });
          processed.add(id1);
        }
      }

      setDuplicates(duplicateGroups);
      if (duplicateGroups.length === 0) {
        toast.success('No duplicates found!');
      } else {
        toast.warning(`Found ${duplicateGroups.length} duplicate group(s) with ${duplicateGroups.reduce((sum, g) => sum + g.questions.length, 0)} total questions`);
      }
    } catch (error: any) {
      toast.error('Failed to find duplicates: ' + error.message);
      console.error('Duplicate detection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await questionsAPI.delete(questionId);
      toast.success('Question deleted');
      findDuplicates(); // Refresh
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  return (
    <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
      <CardHeader className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Duplicate Question Detection</CardTitle>
            <p className="text-xs text-muted-foreground">Find questions with 90% or higher similarity</p>
          </div>
          <Button
            onClick={findDuplicates}
            disabled={loading}
            variant="outline"
            className="rounded-2xl text-xs"
          >
            {loading ? 'Scanning...' : 'Scan for Duplicates'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {duplicates.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Click "Scan for Duplicates" to find similar questions
          </p>
        ) : (
          <div className="space-y-4">
            {duplicates.map((group, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-sm">
                    Duplicate Group {idx + 1} ({group.questions.length} questions)
                  </span>
                  <Badge variant="destructive" className="rounded-full">
                    {group.similarity}% similar
                  </Badge>
                </div>
                <div className="space-y-2">
                  {group.questions.map((q) => (
                    <div
                      key={q._id || q.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.question_text}</p>
                        <div className="flex gap-2 mt-2">
                          {q.exam_names && q.exam_names.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {q.exam_names.join(', ')}
                            </Badge>
                          )}
                          {q.difficulty_level && (
                            <Badge variant="outline" className="text-xs">
                              Level {q.difficulty_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            // TODO: Open view modal
                            toast.info('View question feature coming soon');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-destructive"
                          onClick={() => handleDelete((q._id || q.id) as string)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

