import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export interface ForumMessage {
  id: string;
  course_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useForumMessages = (courseId: string) => {
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Fetch initial messages
  useEffect(() => {
    if (!courseId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('forum_messages')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: true });

        // Fetch profiles separately
        if (data) {
          const userIds = [...new Set(data.map(msg => msg.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
          
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          const messagesWithProfiles = data.map(msg => ({
            ...msg,
            profiles: profileMap.get(msg.user_id) || null
          }));
          setMessages(messagesWithProfiles);
        }

        if (error) throw error;
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load forum messages",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [courseId, toast]);

  // Set up real-time subscription
  useEffect(() => {
    if (!courseId) return;

    const channel = supabase
      .channel('forum-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_messages',
          filter: `course_id=eq.${courseId}`
        },
        async (payload) => {
          // Fetch profile info separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const messageWithProfile: ForumMessage = {
            id: payload.new.id,
            course_id: payload.new.course_id,
            user_id: payload.new.user_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            profiles: profile || null
          };

          setMessages((prev) => [...prev, messageWithProfile]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'forum_messages',
          filter: `course_id=eq.${courseId}`
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  // Send a new message
  const sendMessage = async (content: string) => {
    if (!profile?.id || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('forum_messages')
        .insert({
          course_id: courseId,
          user_id: profile.id,
          content: content.trim(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('forum_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
  };
};