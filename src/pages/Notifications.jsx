import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getProfilePhotoUrl } from '@/lib/profile-photo';

const Notifications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
    loadNotifications(session.user.id);
  };

  const loadNotifications = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select('*, sender:sender_id(name, profile_photo)')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId, senderId) => {
    try {
      // Accept the connection request
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create connection
      const { error: createError } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          connected_user_id: senderId,
        });

      if (createError && createError.code !== '23505') throw createError;

      toast.success('Connection accepted!');
      setNotifications(notifications.filter(n => n.id !== requestId));
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Connection request declined');
      setNotifications(notifications.filter(n => n.id !== requestId));
    } catch (error) {
      console.error('Error declining connection:', error);
      toast.error('Failed to decline connection');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] lg:ml-60 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold">Notifications</h1>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">You're all caught up! 🎉</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="outline" size="sm">
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-30" />
              <p style={{ color: 'var(--text-muted)' }} className="text-lg">No notifications yet</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-2">When someone interacts with you, it will show up here</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                }}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={notif.sender?.profile_photo ? getProfilePhotoUrl(notif.sender.profile_photo) : undefined} />
                    <AvatarFallback>{notif.sender?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm">
                      <span className="font-semibold">{notif.sender?.name}</span> sent you a connection request
                    </p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                      {new Date(notif.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                {notif.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(notif.id, notif.sender_id)}
                      style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                      className="hover:opacity-90"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(notif.id)}
                    >
                      Decline
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[var(--success)]" />
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm">Connected</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
