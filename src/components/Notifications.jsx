import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionUserId, setSessionUserId] = useState(null);
  const prevIdsRef = useRef(new Set());
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    loadNotifications();

    // Set up realtime subscription - inspect payload to show immediate popup
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // If payload contains a new notification for this user, show popup quickly
          try {
            const rec = payload?.record || payload?.new || payload?.data || null;
            if (rec && sessionUserId && rec.user_id === sessionUserId && rec.type === 'mentor_meeting') {
              if (!rec.is_read) setPopup({ title: rec.title, message: rec.message, link: rec.link });
            }
          } catch (e) {
            // ignore
          }
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSessionUserId(session.user.id);

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      // detect newly arrived notifications since last load
      const newItems = (data || []).filter(n => !prevIdsRef.current.has(n.id));
      if (newItems.length > 0) {
        newItems.forEach(n => {
          if (n.type === 'mentor_meeting' && !n.is_read) {
            setPopup({ title: n.title, message: n.message, link: n.link });
          }
        });
      }
      // update prev ids
      prevIdsRef.current = new Set((data || []).map(d => d.id));
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (notificationId, link) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    await loadNotifications();

    if (link) {
      navigate(link);
    }
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    await loadNotifications();
  };

  const handlePopupView = async () => {
    setPopup(null);
    // mark notifications as read and navigate
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
    // reload and go to notifications page
    await loadNotifications();
    navigate('/notifications');
  };

  const handlePopupDismiss = () => {
    setPopup(null);
  };

  return (
    <>
      {popup && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="max-w-xl w-full bg-primary/95 text-white p-4 rounded-lg shadow-lg border border-primary/70">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold">{popup.title}</h4>
                <p className="text-sm mt-1">{popup.message}</p>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button onClick={handlePopupView} className="bg-white text-black px-3 py-1 rounded">View</button>
                <button onClick={handlePopupDismiss} className="text-white px-3 py-1 rounded border border-white/30">Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    notification.is_read 
                      ? "bg-muted/50" 
                      : "bg-primary/10 hover:bg-primary/20"
                  }`}
                  onClick={() => markAsRead(notification.id, notification.link)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
    </>
  );
};

export default Notifications;
