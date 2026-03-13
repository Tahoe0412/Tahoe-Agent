"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  }

  function removeTag(indexToRemove: number) {
    onChange(value.filter((_, index) => index !== indexToRemove));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "") {
      e.preventDefault();
      if (value.length > 0) {
        removeTag(value.length - 1);
      }
    }
  }

  return (
    <div
      className={cn(
        "theme-input flex min-h-[48px] flex-wrap items-center gap-2 rounded-[18px] px-3 py-2 text-sm",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <span
          key={index}
          className="theme-pill flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
        >
          {tag}
          <span
            role="button"
            tabIndex={0}
            className="cursor-pointer text-[var(--text-3)] hover:text-[var(--text-1)]"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                removeTag(index);
              }
            }}
          >
            ✕
          </span>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
        className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-[var(--text-3)]"
        placeholder={value.length === 0 ? placeholder : ""}
      />
    </div>
  );
}
