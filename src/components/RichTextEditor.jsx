import React, { useRef } from "react";

const wrapSelection = (value, start, end, before, after = before) => {
  const selected = value.slice(start, end) || "Text";
  return `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
};

const RichTextEditor = ({ value, onChange }) => {
  const inputRef = useRef(null);

  const applyFormat = (format) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    let nextValue = value || "";

    if (format === "h2") nextValue = wrapSelection(nextValue, start, end, "<h2>", "</h2>");
    if (format === "p") nextValue = wrapSelection(nextValue, start, end, "<p>", "</p>");
    if (format === "bold") nextValue = wrapSelection(nextValue, start, end, "<strong>", "</strong>");
    if (format === "list") nextValue = wrapSelection(nextValue, start, end, "<ul><li>", "</li></ul>");
    if (format === "link") {
      const url = window.prompt("URL");
      if (!url) return;
      nextValue = wrapSelection(nextValue, start, end, `<a href="${url}" target="_blank" rel="noreferrer">`, "</a>");
    }

    onChange(nextValue);
    window.requestAnimationFrame(() => input.focus());
  };

  return (
    <div className="rich-editor">
      <div className="editor-toolbar" aria-label="Editor toolbar">
        <button type="button" onClick={() => applyFormat("h2")}>H2</button>
        <button type="button" onClick={() => applyFormat("p")}>P</button>
        <button type="button" onClick={() => applyFormat("bold")}>B</button>
        <button type="button" onClick={() => applyFormat("list")}>List</button>
        <button type="button" onClick={() => applyFormat("link")}>Link</button>
      </div>
      <textarea ref={inputRef} rows="12" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
};

export default RichTextEditor;
