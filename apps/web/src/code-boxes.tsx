import { ROOM_CODE_LENGTH } from "@bowling/domain";
import { useRef } from "preact/hooks";
import "./styles/code-boxes.css";

export const typeInBox = (code: string, box: number, typed: string) => {
  const chars = typed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const start = Math.min(box, code.length);
  if (typed && !chars) {
    return { code, focus: start };
  }
  const next = (
    code.slice(0, start) +
    chars +
    code.slice(start + Math.max(chars.length, 1))
  ).slice(0, ROOM_CODE_LENGTH);
  return {
    code: next,
    focus: Math.min(start + chars.length, ROOM_CODE_LENGTH - 1),
  };
};

interface CodeBoxesProps {
  code: string;
  disabled?: boolean;
  onChange: (code: string) => void;
}

export const CodeBoxes = ({ code, disabled, onChange }: CodeBoxesProps) => {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <fieldset class="code-boxes" disabled={disabled}>
      <legend class="label">Código de sala</legend>
      <div>
        {Array.from({ length: ROOM_CODE_LENGTH }, (_, box) => (
          <input
            key={box}
            ref={(input) => {
              boxes.current[box] = input;
            }}
            name={box === 0 ? "code" : undefined}
            value={code[box] ?? ""}
            class={code[box] ? "filled" : undefined}
            aria-label={`Carácter ${box + 1} de ${ROOM_CODE_LENGTH}`}
            autoCapitalize="characters"
            autoComplete="off"
            spellcheck={false}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !code[box] && box > 0) {
                boxes.current[box - 1]?.focus();
              }
            }}
            onInput={(event) => {
              const input = event.currentTarget;
              const next = typeInBox(code, box, input.value);
              input.value = next.code[box] ?? "";
              onChange(next.code);
              if (next.focus !== box) {
                boxes.current[next.focus]?.focus();
              }
            }}
          />
        ))}
      </div>
    </fieldset>
  );
};
