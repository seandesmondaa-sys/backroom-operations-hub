import { useState, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay,
  isToday, addMonths, subMonths, startOfWeek, endOfWeek, setHours, setMinutes,
} from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import {
  useOSEvents, useCreateOSEvent, useDeleteOSEvent,
  type OSEvent, type EventType,
  EVENT_TYPE_LABELS, EVENT_TYPE_COLORS,
} from "@/hooks/use-os-events";
import { useAllUserRoles, useDepartments } from "@/hooks/use-roles";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Plus, ChevronLeft, ChevronRight, CalendarIcon, Clock, MapPin, Trash2, Users,
} from "lucide-react";

// ─── Time picker helper ────────────────────────────────────
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs w-28" />
  );
}

// ─── Event Form Dialog ─────────────────────────────────────
function EventFormDialog({
  open, onOpenChange, initialDate, onSubmit, isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialDate?: Date;
  onSubmit: (e: Parameters<ReturnType<typeof useCreateOSEvent>["mutate"]>[0]) => void;
  isPending: boolean;
}) {
  const { data: teamMembers = [] } = useAllUserRoles();
  const { data: departments = [] } = useDepartments();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("meeting");
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [departmentId, setDepartmentId] = useState<string>("none");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setEventType("meeting");
    setDate(initialDate || new Date()); setStartTime("09:00"); setEndTime("10:00");
    setAllDay(false); setLocation(""); setIsGlobal(true);
    setDepartmentId("none"); setSelectedAttendees([]);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startDt = allDay ? new Date(date.setHours(0, 0, 0)) : setMinutes(setHours(new Date(date), sh), sm);
    const endDt = allDay ? new Date(date.setHours(23, 59, 59)) : setMinutes(setHours(new Date(date), eh), em);

    onSubmit({
      title: title.trim(),
      description: description || null,
      event_type: eventType,
      start_time: startDt.toISOString(),
      end_time: endDt.toISOString(),
      all_day: allDay,
      location: location || null,
      is_global: isGlobal,
      department_id: departmentId === "none" ? null : departmentId,
      attendee_ids: selectedAttendees,
    });
    resetForm();
  };

  const toggleAttendee = (uid: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Schedule Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Event title…" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm" />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[50px]" />

          <div className="grid grid-cols-2 gap-2">
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{EVENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          {/* Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-8 text-xs justify-start">
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {format(date, "EEEE, MMMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {/* Time */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="all-day" checked={allDay} onCheckedChange={setAllDay} />
              <Label htmlFor="all-day" className="text-xs">All day</Label>
            </div>
            {!allDay && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <TimePicker value={startTime} onChange={setStartTime} />
                <span className="text-xs text-muted-foreground">to</span>
                <TimePicker value={endTime} onChange={setEndTime} />
              </div>
            )}
          </div>

          {/* Scope */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-2">
              <Switch id="global" checked={isGlobal} onCheckedChange={setIsGlobal} />
              <Label htmlFor="global" className="text-xs">Global event</Label>
            </div>
            {!isGlobal && (
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No department</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Attendees */}
          <div>
            <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Attendees
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1 rounded-md border border-border p-2">
              {teamMembers.map((m) => (
                <label key={m.user_id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <Checkbox
                    checked={selectedAttendees.includes(m.user_id)}
                    onCheckedChange={() => toggleAttendee(m.user_id)}
                  />
                  <span className="text-xs">{m.display_name}</span>
                  <span className="text-[10px] text-muted-foreground">{m.email}</span>
                </label>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No team members</p>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isPending || !title.trim()} className="w-full h-8 text-xs">
            Create Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Day Cell ──────────────────────────────────────────────
function DayCell({
  date, events, isCurrentMonth, onClickDay, onClickEvent,
}: {
  date: Date; events: OSEvent[]; isCurrentMonth: boolean;
  onClickDay: (d: Date) => void; onClickEvent: (e: OSEvent) => void;
}) {
  return (
    <div
      className={cn(
        "min-h-[90px] p-1 border-b border-r border-border cursor-pointer hover:bg-muted/30 transition-colors",
        !isCurrentMonth && "bg-muted/10 opacity-50",
      )}
      onClick={() => onClickDay(date)}
    >
      <div className={cn(
        "text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5",
        isToday(date) && "bg-primary text-primary-foreground",
      )}>
        {format(date, "d")}
      </div>
      <div className="space-y-0.5">
        {events.slice(0, 3).map((ev) => (
          <div
            key={ev.id}
            className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
            style={{ backgroundColor: EVENT_TYPE_COLORS[ev.event_type] + "22", color: EVENT_TYPE_COLORS[ev.event_type] }}
            onClick={(e) => { e.stopPropagation(); onClickEvent(ev); }}
          >
            {!ev.all_day && <span className="font-mono mr-0.5">{format(new Date(ev.start_time), "HH:mm")}</span>}
            {ev.title}
          </div>
        ))}
        {events.length > 3 && (
          <p className="text-[10px] text-muted-foreground px-1">+{events.length - 3} more</p>
        )}
      </div>
    </div>
  );
}

// ─── Event Detail Dialog ───────────────────────────────────
function EventDetailDialog({
  event, open, onOpenChange, onDelete,
}: {
  event: OSEvent | null; open: boolean; onOpenChange: (o: boolean) => void; onDelete: (id: string) => void;
}) {
  if (!event) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{ borderColor: EVENT_TYPE_COLORS[event.event_type], color: EVENT_TYPE_COLORS[event.event_type] }}
            >
              {EVENT_TYPE_LABELS[event.event_type]}
            </Badge>
            {event.is_global && <Badge variant="secondary" className="text-[10px]">Global</Badge>}
          </div>

          <div className="text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" />
              {event.all_day
                ? format(new Date(event.start_time), "EEEE, MMMM d, yyyy") + " (All day)"
                : `${format(new Date(event.start_time), "EEEE, MMMM d · HH:mm")} – ${format(new Date(event.end_time), "HH:mm")}`
              }
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {event.location}
              </div>
            )}
          </div>

          {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}

          {event.attendees && event.attendees.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold mb-1">Attendees</p>
              <div className="space-y-0.5">
                {event.attendees.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                      {(a.display_name || "?")[0]}
                    </div>
                    <span>{a.display_name}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{a.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="destructive" size="sm" className="w-full h-7 text-xs" onClick={() => { onDelete(event.id); onOpenChange(false); }}>
            <Trash2 className="h-3 w-3 mr-1" /> Delete Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Calendar Page ────────────────────────────────────
export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date>(new Date());
  const [detailEvent, setDetailEvent] = useState<OSEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const { data: events = [], isLoading } = useOSEvents(currentMonth);
  const { data: departments = [] } = useDepartments();
  const createEvent = useCreateOSEvent();
  const deleteEvent = useDeleteOSEvent();

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const filteredEvents = useMemo(() => {
    if (deptFilter === "all") return events;
    if (deptFilter === "global") return events.filter((e) => e.is_global);
    return events.filter((e) => e.department_id === deptFilter || e.is_global);
  }, [events, deptFilter]);

  const getEventsForDay = (day: Date) =>
    filteredEvents.filter((e) => isSameDay(new Date(e.start_time), day));

  const handleDayClick = (day: Date) => {
    setCreateDate(day);
    setCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Calendar" description="Scheduling & meetings" />
        <div className="p-6"><Skeleton className="h-[500px] w-full rounded-lg" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Calendar" description="Global & department scheduling">
        <Button size="sm" className="h-8 text-xs" onClick={() => { setCreateDate(new Date()); setCreateOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> New Event
        </Button>
      </PageHeader>
      <div className="p-6 space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold min-w-[160px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Events</SelectItem>
              <SelectItem value="global" className="text-xs">Global Only</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
            <div key={t} className="flex items-center gap-1 text-[10px]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[t] }} />
              <span className="text-muted-foreground">{EVENT_TYPE_LABELS[t]}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-[11px] font-semibold text-muted-foreground text-center py-2 border-r border-border last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((day) => (
                <DayCell
                  key={day.toISOString()}
                  date={day}
                  events={getEventsForDay(day)}
                  isCurrentMonth={isSameMonth(day, currentMonth)}
                  onClickDay={handleDayClick}
                  onClickEvent={(e) => { setDetailEvent(e); setDetailOpen(true); }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming events sidebar */}
        <div>
          <h3 className="text-xs font-semibold mb-2">Upcoming This Month</h3>
          <div className="space-y-1.5">
            {filteredEvents
              .filter((e) => new Date(e.start_time) >= new Date())
              .slice(0, 8)
              .map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md bg-card border border-border cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => { setDetailEvent(ev); setDetailOpen(true); }}
                >
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[ev.event_type] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {ev.all_day
                        ? format(new Date(ev.start_time), "MMM d")
                        : format(new Date(ev.start_time), "MMM d · HH:mm")}
                      {ev.location && ` · ${ev.location}`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0"
                    style={{ borderColor: EVENT_TYPE_COLORS[ev.event_type], color: EVENT_TYPE_COLORS[ev.event_type] }}
                  >
                    {EVENT_TYPE_LABELS[ev.event_type]}
                  </Badge>
                  {ev.attendees && ev.attendees.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{ev.attendees.length} 👤</span>
                  )}
                </div>
              ))}
            {filteredEvents.filter((e) => new Date(e.start_time) >= new Date()).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No upcoming events this month</p>
            )}
          </div>
        </div>
      </div>

      <EventFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialDate={createDate}
        onSubmit={(e) => createEvent.mutate(e, { onSuccess: () => setCreateOpen(false) })}
        isPending={createEvent.isPending}
      />

      <EventDetailDialog
        event={detailEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDelete={(id) => deleteEvent.mutate(id)}
      />
    </div>
  );
}
