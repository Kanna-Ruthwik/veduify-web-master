"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  //const { calculateGPA } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  //const gpa = calculateGPA();

  const clearData = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      toast('Data Cleared',{
        description: 'All your data has been cleared. The page will refresh.',
      });
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Appearance</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about assignments and classes
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your courses
                  </p>
                </div>
                <Switch
                  id="email"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </div>
          </div>

          {/*<div>
            <h3 className="text-lg font-medium">Academic Information</h3>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Current GPA: <span className="font-medium">{gpa.toFixed(2)}</span>
              </p>
            </div>
          </div>*/}

          <div>
            <h3 className="text-lg font-medium">Data Management</h3>
            <div className="mt-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={clearData}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}