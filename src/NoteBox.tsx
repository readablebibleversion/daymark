import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Textarea that grows with its content and saves while you type (debounced) and on blur.
 * `value` is the saved note; `onSave` is called with the new text.
 */
export function NoteBox({
  value, onSave, placeholder, label, autoFocus, minRows = 2,
}: { value: string; onSave: (text: string) => void; placeholder: string; label: string; autoFocus?: boolean; minRows?: number }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef({ text, value, onSave });
  latest.current = { text, value, onSave };

  // Follow outside changes (e.g. switching days) when not mid-edit.
  useEffect(() => {
    if (document.activeElement !== ref.current) setText(value);
  }, [value]);

  // Grow to fit.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [text]);

  const flush = () => {
    window.clearTimeout(timer.current);
    const { text: t, value: v, onSave: save } = latest.current;
    if (t !== v) save(t);
  };

  // Save pending text if the component goes away (tab switch, day change).
  useEffect(() => flush, []);

  return (
    <textarea
      ref={ref}
      className="input note"
      rows={minRows}
      value={text}
      placeholder={placeholder}
      aria-label={label}
      autoFocus={autoFocus}
      maxLength={4000}
      onChange={(e) => {
        setText(e.target.value);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(flush, 500);
      }}
      onBlur={flush}
    />
  );
}
