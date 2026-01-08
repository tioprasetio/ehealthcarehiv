/* eslint-disable @typescript-eslint/no-explicit-any */
import { Clock, Pill, Calendar, Trash2, User } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ScheduleMenuCardProps {
  type: "med" | "control";
  schedule: any;
  onDelete: () => void;
}

export function ScheduleMenuCard({
  type,
  schedule,
  onDelete,
}: ScheduleMenuCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition h-full flex flex-col">
      {/* Visual block */}
      <div className="h-40 bg-primary/10 flex items-center justify-center relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          {type === "med" ? (
            <Pill className="h-7 w-7" />
          ) : (
            <Calendar className="h-7 w-7" />
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <CardContent className="p-4 flex flex-col flex-1">
        {/* TITLE */}
        <h3 className="font-semibold text-lg">
          {type === "med"
            ? schedule.medication_name
            : format(new Date(schedule.scheduled_date), "d MMMM yyyy", {
                locale: id,
              })}
        </h3>

        {/* PATIENT */}
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
          <User className="h-3 w-3" />
          {schedule.profiles?.full_name}
        </p>

        {/* TIME + EXTRA */}
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />

          {type === "med"
            ? schedule.schedule_time?.slice(0, 5)
            : schedule.scheduled_time?.slice(0, 5)}

          {type === "med" && <> • {schedule.dosage}</>}
          {type === "control" && schedule.location && (
            <> • {schedule.location}</>
          )}
        </p>

        <div className="flex-1" />
      </CardContent>
    </Card>
  );
}
