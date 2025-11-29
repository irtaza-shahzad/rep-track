import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportData, downloadFile } from '@/lib/api';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('pdf');
  const [includeWorkouts, setIncludeWorkouts] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeStreaks, setIncludeStreaks] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Build include array
      const include: string[] = [];
      if (includeWorkouts) include.push('workouts');
      if (includeStats) include.push('stats');
      if (includeStreaks) include.push('streaks');
      
      // If nothing selected, include all
      if (include.length === 0) {
        include.push('all');
      }

      // Format dates
      const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

      // Call API
      const blob = await exportData(exportFormat, include, startDateStr, endDateStr);

      // Download file
      const filename = `fittrack_export_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      downloadFile(blob, filename);

      toast({
        title: 'Export Successful',
        description: `Your data has been exported as ${exportFormat.toUpperCase()}.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Workout Data
          </DialogTitle>
          <DialogDescription>
            Choose what data to export and in which format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as 'csv' | 'pdf')}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                  <div className="font-medium">PDF Report</div>
                  <div className="text-xs text-muted-foreground">Formatted document with charts and tables</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer">
                  <div className="font-medium">CSV Spreadsheet</div>
                  <div className="text-xs text-muted-foreground">Raw data for Excel or Google Sheets</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data to Include */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Include Data</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                <Checkbox 
                  id="workouts" 
                  checked={includeWorkouts}
                  onCheckedChange={(checked) => setIncludeWorkouts(checked as boolean)}
                />
                <Label htmlFor="workouts" className="flex-1 cursor-pointer">
                  <div className="font-medium">Workout History</div>
                  <div className="text-xs text-muted-foreground">All exercises, sets, reps, and weights</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                <Checkbox 
                  id="stats" 
                  checked={includeStats}
                  onCheckedChange={(checked) => setIncludeStats(checked as boolean)}
                />
                <Label htmlFor="stats" className="flex-1 cursor-pointer">
                  <div className="font-medium">Statistics</div>
                  <div className="text-xs text-muted-foreground">Total volume, workouts, and averages</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                <Checkbox 
                  id="streaks" 
                  checked={includeStreaks}
                  onCheckedChange={(checked) => setIncludeStreaks(checked as boolean)}
                />
                <Label htmlFor="streaks" className="flex-1 cursor-pointer">
                  <div className="font-medium">Streak Data</div>
                  <div className="text-xs text-muted-foreground">Current and longest streaks</div>
                </Label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal rounded-xl',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal rounded-xl',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
