import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Keeps the outgoing form present until its animation finishes. */
export function usePanelMotion<T>(day: string) {
  const [form, commitForm] = useState<T>();
  const [exiting, setExiting] = useState(false);
  const [revision, setRevision] = useState(0);
  const content = useRef<HTMLDivElement>(null);
  const dayContent = useRef<HTMLDivElement>(null);
  const current = useRef<T | undefined>(undefined);
  const animation = useRef<Animation | undefined>(undefined);
  const generation = useRef(0);
  const reduced = useRef(false);
  const keyboard = useRef(false);
  const mounted = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const finishExit = useRef<(() => void) | undefined>(undefined);
  const enterFrom = useRef<Keyframe | undefined>(undefined);
  const previousDay = useRef(day);
  const dayAnimation = useRef<Animation | undefined>(undefined);

  const snapshot = useCallback((): Keyframe | undefined => {
    const node = content.current;
    if (!node || animation.current?.playState !== "running") return undefined;
    const style = getComputedStyle(node);
    return { opacity: style.opacity, transform: style.transform };
  }, []);
  const invalidate = useCallback(() => {
    ++generation.current;
  }, []);
  const stop = useCallback(() => {
    animation.current?.cancel();
    animation.current = undefined;
  }, []);
  const animate = useCallback((node: HTMLElement, frames: Keyframe[], token: string) => {
    if (reduced.current || keyboard.current || matchMedia("(prefers-reduced-motion: reduce)").matches || typeof node.animate !== "function") return undefined;
    const style = getComputedStyle(node);
    return node.animate(frames, {
      duration: parseFloat(style.getPropertyValue(token)) || 0,
      easing: style.getPropertyValue("--calendar-ease-out").trim(),
      fill: "both",
    });
  }, []);

  const setForm = useCallback((next?: T, restoreFocus = true) => {
    if (!next && !current.current) return;
    const id = ++generation.current;
    const from = snapshot();
    const hadForm = Boolean(current.current);
    stop();
    finishExit.current = undefined;
    const apply = () => {
      if (id !== generation.current) return;
      finishExit.current = undefined;
      stop();
      current.current = next;
      // The outgoing form must become interactive again before the new render.
      if (content.current) content.current.inert = false;
      setExiting(false);
      enterFrom.current = hadForm ? undefined : from;
      if (!next) enterFrom.current = { opacity: 0, transform: "none" };
      commitForm(next);
      setRevision(value => value + 1);
      if (!next && restoreFocus) {
        if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
        else content.current?.parentElement?.focus({ preventScroll: true });
      }
    };
    if (next && (!current.current || !content.current?.contains(document.activeElement))) {
      trigger.current = document.activeElement as HTMLElement;
    }
    if (current.current) {
      const node = content.current;
      if (node) {
        node.inert = true;
        setExiting(true);
        const exit = animate(node, [from || { opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(4px)" }], "--calendar-exit-duration");
        if (exit) {
          animation.current = exit;
          finishExit.current = apply;
          void exit.finished.then(apply).catch(() => {});
          return;
        }
      }
    }
    enterFrom.current = from;
    apply();
  }, [animate, snapshot, stop]);

  useLayoutEffect(() => {
    const node = content.current;
    if (!node) return;
    const from = enterFrom.current;
    enterFrom.current = undefined;
    if (!mounted.current) { mounted.current = true; return; }
    stop();
    animation.current = animate(node, [from || { opacity: 0, transform: form ? "translateY(8px)" : "none" }, { opacity: 1, transform: "none" }], form ? "--calendar-enter-duration" : "--calendar-day-duration");
    if (form) {
      node.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
      if (matchMedia("(max-width: 1150px)").matches) {
        node.parentElement?.scrollIntoView({ block: "start", behavior: keyboard.current || reduced.current || matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    }
  }, [form, revision, animate, stop]);

  useLayoutEffect(() => {
    if (previousDay.current === day) return;
    previousDay.current = day;
    const node = dayContent.current;
    if (!node || current.current) return;
    const style = dayAnimation.current?.playState === "running" ? getComputedStyle(node) : undefined;
    const from = style ? { opacity: style.opacity, transform: style.transform } : { opacity: 0, transform: "translateY(4px)" };
    dayAnimation.current?.cancel();
    dayAnimation.current = animate(node, [from, { opacity: 1, transform: "none" }], "--calendar-day-duration");
  }, [day, animate]);

  useEffect(() => {
    const onKey = () => { keyboard.current = true; };
    const onPointer = () => { keyboard.current = false; };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reduced.current = media.matches;
      if (media.matches) {
        const finish = finishExit.current;
        stop();
        dayAnimation.current?.cancel();
        finish?.();
      }
    };
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
      invalidate();
      stop();
      dayAnimation.current?.cancel();
    };
  }, [stop, invalidate]);
  return { form, setForm, exiting, content, dayContent };
}
