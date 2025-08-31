import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const useCourseCompletion = (courseId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course_completion', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return { isCompleted: false, totalMaterials: 0, completedMaterials: 0 };

      // Get all materials in the course
      const { data: courseMaterials, error: materialsError } = await supabase
        .from('chapter_materials')
        .select(`
          id,
          chapters!inner(
            course_id
          )
        `)
        .eq('chapters.course_id', courseId);

      if (materialsError) throw materialsError;

      const totalMaterials = courseMaterials?.length || 0;
      
      if (totalMaterials === 0) {
        return { isCompleted: false, totalMaterials: 0, completedMaterials: 0 };
      }

      // Get completed materials for this user
      const materialIds = courseMaterials.map(material => material.id);
      
      const { data: completedMaterials, error: completedError } = await supabase
        .from('completed_materials')
        .select('material_id')
        .eq('student_id', user.id)
        .in('material_id', materialIds);

      if (completedError) throw completedError;

      const completedCount = completedMaterials?.length || 0;
      const isCompleted = completedCount === totalMaterials && totalMaterials > 0;

      return {
        isCompleted,
        totalMaterials,
        completedMaterials: completedCount,
        completionPercentage: totalMaterials > 0 ? Math.round((completedCount / totalMaterials) * 100) : 0
      };
    },
    enabled: !!user && !!courseId,
  });
};