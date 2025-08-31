import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, FileText, FileVideo, File, Download, Eye } from 'lucide-react';

interface ContentHubProps {
  courseId: string;
}

const ContentHub = ({ courseId }: ContentHubProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'article' as 'article' | 'video' | 'ppt',
    subject: '',
    article_snippet: '',
    file: null as File | null
  });

  // Fetch content for this course
  const { data: courseContent = [], isLoading } = useQuery({
    queryKey: ['course_content', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .or(`subject.eq.${courseId},file_path.ilike.%${courseId}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      
      let filePath = null;
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${courseId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(fileName, formData.file);
        
        if (uploadError) throw uploadError;
        filePath = fileName;
      }

      const { error } = await supabase
        .from('content')
        .insert({
          title: formData.title,
          type: formData.type,
          subject: courseId,
          article_snippet: formData.article_snippet,
          file_path: filePath,
          author_id: user!.id,
          author_name: profile?.full_name || user!.email || 'Unknown',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course_content', courseId] });
      toast.success('Content uploaded successfully!');
      setUploadDialogOpen(false);
      setFormData({
        title: '',
        type: 'article',
        subject: '',
        article_snippet: '',
        file: null
      });
    },
    onError: (error: any) => {
      toast.error('Failed to upload content: ' + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleDownload = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(filePath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Update download count
      const { data: currentContent } = await supabase
        .from('content')
        .select('downloads')
        .eq('file_path', filePath)
        .single();
        
      await supabase
        .from('content')
        .update({ downloads: (currentContent?.downloads || 0) + 1 })
        .eq('file_path', filePath);
    } catch (error: any) {
      toast.error('Download failed: ' + error.message);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <FileVideo className="h-5 w-5" />;
      case 'ppt': return <File className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Content Hub</h2>
          <p className="text-muted-foreground">Additional materials and resources for this course</p>
        </div>
        
        {profile?.role === 'instructor' && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Course Content</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Content title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="ppt">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.article_snippet}
                    onChange={(e) => setFormData(prev => ({ ...prev, article_snippet: e.target.value }))}
                    placeholder="Brief description of the content"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">File (optional)</label>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov"
                  />
                </div>
                
                <Button 
                  onClick={() => uploadMutation.mutate()} 
                  disabled={isUploading || !formData.title}
                  className="w-full"
                >
                  {isUploading ? 'Uploading...' : 'Upload Content'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {courseContent.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No content available</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile?.role === 'instructor' 
                ? 'Upload your first piece of content to get started.'
                : 'The instructor hasn\'t uploaded any additional content yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courseContent.map((content) => (
            <Card key={content.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getIcon(content.type)}
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{content.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      By {content.author_name} • {new Date(content.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content.article_snippet && (
                  <p className="text-muted-foreground mb-4">{content.article_snippet}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {content.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {content.downloads} downloads
                  </span>
                </div>
                {content.file_path && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => handleDownload(content.file_path!, content.title)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentHub;