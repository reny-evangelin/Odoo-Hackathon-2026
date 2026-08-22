import React, { useState, useEffect } from "react";
import { Clock, LogOut, RefreshCw, CheckCircle2 } from "lucide-react";
import { AttendanceRecord } from "../../types/hrms";
import { Button, Card, Badge, cn } from "../ui/Primitives";

interface PunchClockWidgetProps {
  currentRecord: AttendanceRecord | null;
  onClockIn: () => Promise<void>;
  onClockOut: () => Promise<void>;
  isLoading?: boolean;
}

export const PunchClockWidget: React.FC<PunchClockWidgetProps> = ({
  currentRecord,
  onClockIn,
  onClockOut,
  isLoading = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const isClockedIn = Boolean(currentRecord?.check_in && !currentRecord?.check_out);
  const isShiftCompleted = Boolean(currentRecord?.check_in && currentRecord?.check_out);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live elapsed timer if clocked in
  useEffect(() => {
    if (!isClockedIn || !currentRecord?.check_in) {
      setElapsedSeconds(0);
      return;
    }

    try {
      const parts = currentRecord.check_in.split(":");
      const inH = parseInt(parts[0], 10);
      const inM = parseInt(parts[1], 10);
      const inS = parseInt(parts[2] || "0", 10);

      const inDate = new Date();
      inDate.setHours(inH, inM, inS, 0);

      const updateTimer = () => {
        const now = new Date();
        const diff = Math.max(0, Math.floor((now.getTime() - inDate.getTime()) / 1000));
        setElapsedSeconds(diff);
      };
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    } catch {
      setElapsedSeconds(0);
    }
  }, [isClockedIn, currentRecord?.check_in]);

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-5 sm:p-6 border-l-4 border-l-[#7C3AED] bg-gradient-to-br from-white to-purple-50/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
              isClockedIn
                ? "bg-emerald-100 text-emerald-600"
                : isShiftCompleted
                ? "bg-purple-100 text-[#7C3AED]"
                : "bg-slate-100 text-slate-500"
            )}
          >
            <Clock className={cn("w-6 h-6", isClockedIn && "animate-pulse text-emerald-600")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Attendance Punch Station
              </span>
              <Badge
                variant={isClockedIn ? "success" : isShiftCompleted ? "brand" : "neutral"}
                size="sm"
                dot
              >
                {isClockedIn
                  ? "Active Shift"
                  : isShiftCompleted
                  ? "Shift Completed Today"
                  : "Not Clocked In"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {currentTime || "--:--:--"}
              </h2>
              <span className="text-xs font-semibold text-slate-500">{currentDate}</span>
            </div>

            {isClockedIn && (
              <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Shift Active: <strong className="font-mono">{formatElapsed(elapsedSeconds)}</strong>{" "}
                (Checked in at {currentRecord?.check_in})
              </p>
            )}

            {isShiftCompleted && (
              <p className="text-xs text-purple-700 font-semibold mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 inline-block" />
                Completed: {currentRecord?.check_in} → {currentRecord?.check_out} ({currentRecord?.work_hours || 0} hrs logged)
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {!isClockedIn ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onClockIn}
              isLoading={isLoading}
              disabled={isShiftCompleted}
              leftIcon={<Clock className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 font-bold px-6 shadow-sm"
            >
              {isShiftCompleted ? "Day Completed" : "Clock In Now"}
            </Button>
          ) : (
            <Button
              variant="danger"
              size="lg"
              onClick={onClockOut}
              isLoading={isLoading}
              leftIcon={<LogOut className="w-4 h-4" />}
              className="font-bold px-6 shadow-sm"
            >
              Clock Out ({formatElapsed(elapsedSeconds)})
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
