import type {
  ButtonHTMLAttributes,
  ComponentChildren,
  InputHTMLAttributes,
} from "preact";
import "./styles/button.css";
import "./styles/field.css";
import "./styles/chip.css";
import "./styles/notice.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "primary" | "secondary";
  busy?: string;
};

export const Button = ({
  variant,
  busy,
  children,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) => (
  <button
    {...rest}
    type={type}
    class={`button button-${variant}`}
    disabled={disabled || Boolean(busy)}
    aria-busy={busy ? "true" : undefined}
  >
    {busy ? (
      <>
        <Icon class="spinner" d="M21 12a9 9 0 1 1-6.22-8.56" />
        {busy}
      </>
    ) : (
      children
    )}
  </button>
);

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
};

export const Field = ({ label, name, ...input }: FieldProps) => (
  <div class="field">
    <label for={name} class="label">
      {label}
    </label>
    <input {...input} id={name} name={name} class="input" />
  </div>
);

type Tone = "success" | "warning" | "error" | "info";

export const Chip = ({
  tone,
  children,
}: {
  tone: Tone | "muted" | "accent";
  children: ComponentChildren;
}) => <span class={`chip chip-${tone}`}>{children}</span>;

const ICONS: Record<Tone, string> = {
  error:
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4m0 4h.01",
  info: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
  success: "M20 6 9 17l-5-5",
  warning: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
};

export const Icon = ({ d, class: name }: { d: string; class?: string }) => (
  <svg
    aria-hidden="true"
    class={name}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d={d} />
  </svg>
);

interface NoticeProps {
  tone: Tone;
  children: ComponentChildren;
}

export const Notice = ({ tone, children }: NoticeProps) => (
  <div role={tone === "error" ? "alert" : "status"} class={`notice ${tone}`}>
    <Icon d={ICONS[tone]} />
    <span>{children}</span>
  </div>
);

export const Toast = ({ tone, children }: NoticeProps) => (
  <div role="status" class={`notice toast ${tone}`}>
    <Icon d={ICONS[tone]} />
    <span>{children}</span>
  </div>
);
