import { MAX_NICKNAME_LENGTH } from "@bowling/domain";
import { useState } from "preact/hooks";
import { CodeBoxes } from "./code-boxes.js";
import { HomeHero } from "./home-hero.js";
import { Button, Field, Notice } from "./ui.js";
import "./styles/home.css";

const CONNECTING = "Conectando…";

interface HomeProps {
  initialCode: string;
  error?: string;
  entering?: "create" | "join";
  onCreate: (nickname: string) => void;
  onJoin: (code: string, nickname: string) => void;
}

export const Home = ({
  initialCode,
  error,
  entering,
  onCreate,
  onJoin,
}: HomeProps) => {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(initialCode);
  const invited = initialCode !== "";
  const waiting = entering !== undefined;

  const create = (
    <Button
      variant={invited ? "secondary" : "primary"}
      busy={entering === "create" ? CONNECTING : undefined}
      disabled={waiting}
      onClick={() => onCreate(nickname)}
    >
      Crear sala
    </Button>
  );
  const join = (
    <Button
      variant={invited ? "primary" : "secondary"}
      type="submit"
      busy={entering === "join" ? CONNECTING : undefined}
      disabled={waiting}
    >
      Unirse
    </Button>
  );

  const boxes = <CodeBoxes code={code} disabled={waiting} onChange={setCode} />;

  return (
    <main class="home">
      <HomeHero />
      <h1 class="home-title">Bolos</h1>
      <form
        class="home-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!waiting) {
            onJoin(code, nickname);
          }
        }}
      >
        {invited && (
          <Notice tone="info">
            Te han invitado a la sala <strong>{initialCode}</strong>. Elige un
            apodo para entrar.
          </Notice>
        )}
        <Field
          label="Tu apodo"
          name="nickname"
          value={nickname}
          placeholder="De 1 a 16 caracteres"
          maxLength={MAX_NICKNAME_LENGTH}
          autoComplete="nickname"
          autoFocus={invited}
          disabled={waiting}
          required
          onInput={(event) => setNickname(event.currentTarget.value)}
        />
        {invited ? (
          <>
            {boxes}
            {join}
            <p class="divider">o</p>
            {create}
          </>
        ) : (
          <>
            {create}
            <p class="divider">o únete a la de un amigo</p>
            {boxes}
            {join}
          </>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </form>
      <footer class="home-footer">
        Sin registro: nada se guarda al terminar.
        <br />
        Taller del Aula de Software Libre
      </footer>
    </main>
  );
};
