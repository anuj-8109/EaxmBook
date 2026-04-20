import { useState, useEffect } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, BookmarkCheck, Trash2, ExternalLink, FileText, Video, BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { bookmarksAPI, bookmarkedMaterialsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';

const Bookmarks = () => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [expandedQs, setExpandedQs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const [questionsData, materialsData] = await Promise.all([
        bookmarksAPI.getAll(),
        bookmarkedMaterialsAPI.getAll()
      ]);
      setQuestions(questionsData || []);
      setMaterials(materialsData?.bookmarkedMaterials || []);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const removeQuestionBookmark = async (id: string) => {
    try {
      await bookmarksAPI.toggle(id);
      setQuestions(prev => prev.filter(q => (q._id || q.id) !== id));
      toast.success('Bookmark removed');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const removeMaterialBookmark = async (id: string) => {
    try {
      await bookmarkedMaterialsAPI.delete(id);
      setMaterials(prev => prev.filter(m => (m._id || m.id) !== id));
      toast.success('Bookmark removed');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedQs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="w-full h-[60vh] flex items-center justify-center">
          <Loader text="Loading your bookmarks..." />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="w-full py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Bookmarks</h1>
            <p className="text-sm text-slate-500 font-medium">Your saved questions and study materials</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
             <div className="px-3 py-1.5 bg-white rounded-lg shadow-sm">
                <p className="text-xs font-black text-slate-400 uppercase leading-none mb-1">Total Saved</p>
                <p className="text-sm font-black text-green-600 leading-none">{questions.length + materials.length}</p>
             </div>
          </div>
        </div>

        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto mb-6">
            <TabsTrigger value="questions" className="rounded-lg py-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
              Questions ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="materials" className="rounded-lg py-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
              Materials ({materials.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4 m-0 transition-all duration-300">
            {questions.length === 0 ? (
              <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <Bookmark className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">No Bookmarked Questions</h3>
                  <p className="text-sm text-slate-500 max-w-xs mb-8">Save important questions during practice or tests to review them later.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {questions.map((q, idx) => {
                  const id = q._id || q.id;
                  const isExpanded = expandedQs.has(id);
                  const subjectName = q.subject_id?.name || 'General';
                  
                  return (
                    <Card key={id} className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
                        onClick={() => toggleExpand(id)}
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 font-black border border-green-100">
                              {idx + 1}
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{subjectName}</p>
                              <p className="text-sm font-bold text-slate-700 line-clamp-1">{q.question_text}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); removeQuestionBookmark(id); }}
                              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                           >
                              <Trash2 className="h-4 w-4" />
                           </Button>
                           {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="text-sm font-medium text-slate-800 leading-relaxed mb-6 whitespace-pre-wrap">
                            {q.question_text}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {[
                              { label: 'A', text: q.option_a },
                              { label: 'B', text: q.option_b },
                              { label: 'C', text: q.option_c },
                              { label: 'D', text: q.option_d }
                            ].map((opt, i) => {
                              const isCorrect = q.correct_answer === i;
                              return (
                                <div 
                                  key={opt.label}
                                  className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                                    isCorrect ? 'border-green-500 bg-green-50' : 'border-white bg-white shadow-sm'
                                  }`}
                                >
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${
                                    isCorrect ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {opt.label}
                                  </div>
                                  <span className={`text-xs font-bold ${isCorrect ? 'text-green-800' : 'text-slate-600'}`}>
                                    {opt.text}
                                  </span>
                                  {isCorrect && <Badge className="ml-auto bg-green-500 text-[11px] h-4">CORRECT</Badge>}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                               <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1.5">Explanation</p>
                               <p className="text-xs text-blue-800 font-medium leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4 m-0 transition-all duration-300">
            {materials.length === 0 ? (
              <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <FileText className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">No Saved Materials</h3>
                  <p className="text-sm text-slate-500 max-w-xs mb-8">Save PDFs, notes, or videos from the Study Materials section to read them later.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((item) => {
                  const m = item.material_id;
                  if (!m) return null;
                  
                  return (
                    <Card key={item._id || item.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-100 overflow-hidden flex flex-col">
                      <div className="h-2 w-full bg-gradient-to-r from-green-500 to-emerald-600" />
                      <CardHeader className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                            {m.material_type === 'video' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMaterialBookmark(item._id || item.id)}
                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardTitle className="text-base font-black text-slate-800 line-clamp-2 leading-snug">
                          {m.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 pb-5 pt-0 flex-1 flex flex-col pt-2">
                        <div className="flex flex-wrap gap-2 mb-4">
                           <Badge variant="outline" className="text-xs font-bold border-slate-100 bg-slate-50/50 text-slate-500 capitalize px-2 h-5">
                              {m.material_type}
                           </Badge>
                           {m.category_id?.name && (
                             <Badge variant="outline" className="text-xs font-bold border-green-100 bg-green-50/50 text-green-600 px-2 h-5">
                                {m.category_id.name}
                             </Badge>
                           )}
                        </div>
                        
                        <div className="mt-auto flex gap-2">
                           <Button 
                             className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl h-9"
                             onClick={() => m.file_url && window.open(m.file_url, '_blank')}
                           >
                             <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open
                           </Button>
                           <Button 
                             variant="outline" 
                             className="flex-1 border-slate-200 text-slate-600 font-black rounded-xl h-9"
                             onClick={() => removeMaterialBookmark(item._id || item.id)}
                           >
                             Remove
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
};

export default Bookmarks;
