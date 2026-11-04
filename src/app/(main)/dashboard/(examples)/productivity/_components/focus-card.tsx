"use client";

import { useEffect, useState } from "react";

import { BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMessages } from "@/core/i18n/client";

import { FOCUS_MS, formatClock, idleTimer, isRunning, pauseTimer, remainingAt, startTimer } from "./focus-timer";
import { productivityMessageKey } from "./messages";

const TICK_MS = 250;

/** The focus session: Start runs a 90-minute countdown, Pause stops it where it is, and it resumes from there. */
export function FocusCard() {
  const text = useMessages(productivityMessageKey).focus;
  const [timer, setTimer] = useState(idleTimer);
  const [now, setNow] = useState(0);
  const running = isRunning(timer);
  const remaining = running ? remainingAt(timer, now) : timer.remainingMs;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  // A countdown that reaches zero stops by itself.
  useEffect(() => {
    if (running && remaining === 0) setTimer((current) => pauseTimer(current, Date.now()));
  }, [running, remaining]);

  const toggle = () => {
    const at = Date.now();
    setNow(at);
    setTimer((current) => (isRunning(current) ? pauseTimer(current, at) : startTimer(current, at)));
  };
  const started = remaining < FOCUS_MS && remaining > 0;
  const idleLabel = started ? text.resume : text.start;
  const label = running ? text.pause : idleLabel;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0 text-3xl tracking-tight tabular-nums">{formatClock(remaining)}</div>
            <Button className="min-w-24" onClick={toggle}>
              {label}
            </Button>
          </div>

          <div className="text-muted-foreground flex items-start gap-2 text-xs">
            <BellOff className="mt-0.5 size-3 shrink-0" />
            <span className="min-w-0 break-words">{text.noNotifications}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
