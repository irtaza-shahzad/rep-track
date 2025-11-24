import { Dumbbell, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StartWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartEmpty: () => void;
  onStartFromTemplate: () => void;
}

export const StartWorkoutDialog = ({
  open,
  onOpenChange,
  onStartEmpty,
  onStartFromTemplate,
}: StartWorkoutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Workout</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto py-6 w-64 max-w-full flex-col gap-2"
            onClick={onStartEmpty}
          >
            <Dumbbell className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Start Empty Workout</div>
              <div className="text-xs text-muted-foreground">Add exercises as you go</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 w-64 max-w-full flex-col gap-2"
            onClick={onStartFromTemplate}
          >
            <FileText className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Start from Template</div>
              <div className="text-xs text-muted-foreground">Use a saved workout plan</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
