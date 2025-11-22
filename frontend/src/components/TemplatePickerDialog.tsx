import { Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: string[];
  duration: string;
}

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WorkoutTemplate[];
  onSelectTemplate: (template: WorkoutTemplate) => void;
}

export const TemplatePickerDialog = ({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
}: TemplatePickerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4 overflow-y-auto flex-1">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No templates available.</p>
              <p className="text-sm mt-2">Create templates in the Exercises tab.</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary">{template.duration}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {template.exercises.slice(0, 3).map((exercise, idx) => (
                        <span key={idx} className="text-xs text-muted-foreground">
                          {exercise}
                          {idx < Math.min(2, template.exercises.length - 1) && ', '}
                        </span>
                      ))}
                      {template.exercises.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{template.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onSelectTemplate(template)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
