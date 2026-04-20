import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, BookOpen, Calculator, Video, File, Play, Download, Target } from 'lucide-react';
import { levelsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';

interface LevelContent {
  _id: string;
  content_type: 'pdf' | 'note' | 'formula' | 'video' | 'theory' | 'written';
  title: string;
  description: string;
  file_url?: string;
  content_text?: string;
  formula_text?: string;
  video_duration?: number;
}

interface ContentGroup {
  pdfs: LevelContent[];
  notes: LevelContent[];
  formulas: LevelContent[];
  videos: LevelContent[];
  theory: LevelContent[];
  written: LevelContent[];
}

const LevelContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { levelId, levelNumber, levelName, topicName, subjectName, categoryName, progress } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentGroup>({
    pdfs: [],
    notes: [],
    formulas: [],
    videos: [],
    theory: [],
    written: []
  });

  useEffect(() => {
    if (!levelId) {
      toast.error('Level not selected');
      navigate('/basic-to-advance');
      return;
    }
    fetchContent();
  }, [levelId]);

  const fetchContent = async () => {
    try {
      const data = await levelsAPI.getLevelContent(levelId);
      setContent(data || {
        pdfs: [],
        notes: [],
        formulas: [],
        videos: [],
        theory: [],
        written: []
      });
    } catch (error: any) {
      toast.error('Failed to load content');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    navigate('/basic-to-advance/practice', {
      state: {
        levelId,
        levelNumber,
        levelName,
        topicName,
        subjectName,
        categoryName,
        progress
      }
    });
  };

  const handleSkipTest = () => {
    navigate('/basic-to-advance/skip-test', {
      state: {
        levelId,
        levelNumber,
        levelName,
        topicName,
        subjectName,
        categoryName,
        progress
      }
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="p-8">
          <Loader text="Loading content..." />
        </div>
      </UserLayout>
    );
  }

  const hasContent = Object.values(content).some(arr => arr.length > 0);

  return (
    <UserLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header Hero */}
        <div className="mb-8 bg-gradient-to-r from-purple-700 to-green-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <Button
              variant="ghost"
              onClick={() => navigate('/basic-to-advance/levels', { state: location.state })}
              className="mb-6 text-white hover:bg-white/20 hover:text-white border-0 -ml-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Levels
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30 flex-shrink-0">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">Level {levelNumber}: {levelName || `Level ${levelNumber}`}</h1>
                <div className="flex flex-wrap gap-2 text-white/90 font-medium">
                  {categoryName && <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Exam: {categoryName}</span>}
                  {subjectName && <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Subject: {subjectName}</span>}
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Topic: {topicName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasContent ? (
          <Tabs defaultValue="theory" className="mb-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="theory">
                <BookOpen className="w-4 h-4 mr-2" />
                Theory
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="formulas">
                <Calculator className="w-4 h-4 mr-2" />
                Formulas
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Video className="w-4 h-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="pdfs">
                <File className="w-4 h-4 mr-2" />
                PDFs
              </TabsTrigger>
              <TabsTrigger value="written">
                <FileText className="w-4 h-4 mr-2" />
                Written
              </TabsTrigger>
            </TabsList>

            <TabsContent value="theory" className="space-y-4">
              {content.theory.length > 0 ? (
                content.theory.map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <CardTitle>{item.title}</CardTitle>
                      {item.description && <CardDescription>{item.description}</CardDescription>}
                    </CardHeader>
                    {item.content_text && (
                      <CardContent>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: item.content_text }} />
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No theory content available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              {content.notes.length > 0 ? (
                content.notes.map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <CardTitle>{item.title}</CardTitle>
                      {item.description && <CardDescription>{item.description}</CardDescription>}
                    </CardHeader>
                    {item.content_text && (
                      <CardContent>
                        <div className="prose max-w-none whitespace-pre-wrap">{item.content_text}</div>
                      </CardContent>
                    )}
                    {item.file_url && (
                      <CardContent>
                        <Button asChild variant="outline">
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download Note
                          </a>
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No notes available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="formulas" className="space-y-4">
              {content.formulas.length > 0 ? (
                content.formulas.map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <CardTitle>{item.title}</CardTitle>
                      {item.description && <CardDescription>{item.description}</CardDescription>}
                    </CardHeader>
                    {item.formula_text && (
                      <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg font-mono text-lg">
                          {item.formula_text}
                        </div>
                      </CardContent>
                    )}
                    {item.content_text && (
                      <CardContent>
                        <div className="prose max-w-none">{item.content_text}</div>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No formulas available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="videos" className="space-y-4">
              {content.videos.length > 0 ? (
                content.videos.map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <CardTitle>{item.title}</CardTitle>
                      {item.description && <CardDescription>{item.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      {item.file_url ? (
                        <div className="aspect-video">
                          <video
                            src={item.file_url}
                            controls
                            className="w-full h-full rounded-lg"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-muted-foreground">Video URL not available</p>
                        </div>
                      )}
                      {item.video_duration && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Duration: {formatDuration(item.video_duration)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No videos available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pdfs" className="space-y-4">
              {content.pdfs.length > 0 ? (
                content.pdfs.map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <CardTitle>{item.title}</CardTitle>
                      {item.description && <CardDescription>{item.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      {item.file_url ? (
                        <div className="space-y-4">
                          <iframe
                            src={item.file_url}
                            className="w-full h-96 rounded-lg border"
                            title={item.title}
                          />
                          <Button asChild variant="outline">
                            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">PDF URL not available</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No PDFs available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="written" className="space-y-4">
              {content.written.length > 0 ? (
                content.written.map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <CardTitle>{item.title}</CardTitle>
                      {item.description && <CardDescription>{item.description}</CardDescription>}
                    </CardHeader>
                    {item.content_text && (
                      <CardContent>
                        <div className="prose max-w-none whitespace-pre-wrap">{item.content_text}</div>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No written content available
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="mb-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              No content available for this level. You can proceed directly to practice.
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleStartPractice}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold"
              >
                <Play className="w-5 h-5 mr-2" />
                Practice Level {levelNumber}
              </Button>
              <Button
                onClick={handleSkipTest}
                size="lg"
                variant="outline"
                className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold"
              >
                <Target className="w-5 h-5 mr-2" />
                Skip Level {levelNumber}
              </Button>
            </div>
            <p className="text-sm text-center text-muted-foreground mt-4">
              Practice with 1000 questions or take a skip test (30 questions, 80% required to pass)
            </p>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default LevelContent;

