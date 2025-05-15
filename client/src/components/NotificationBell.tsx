import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type NotificationItemProps = {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
};

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  const { id, title, message, date, isRead, type } = notification;
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case "transaction":
        return <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />;
      case "verification":
        return <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" />;
    }
  };
  
  return (
    <div 
      className={cn(
        "p-3 cursor-pointer transition-colors hover:bg-muted/50 relative",
        !isRead && "bg-muted/30"
      )}
      onClick={() => !isRead && onMarkAsRead(id)}
    >
      <div className="flex items-start">
        {getIcon()}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium">{title}</h4>
            <span className="text-xs text-muted-foreground">
              {format(new Date(date), "MMM d, h:mm a")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
      {!isRead && (
        <div className="absolute right-2 top-2 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
};

interface NotificationBellProps {
  userType: "buyer" | "supplier";
}

export default function NotificationBell({ userType }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications(userType);
  
  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-primary-foreground font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 flex justify-between items-center">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto text-xs px-2"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map(notification => (
              <React.Fragment key={notification.id}>
                <NotificationItem 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead}
                />
                <Separator />
              </React.Fragment>
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}