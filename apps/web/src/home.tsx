import { MAX_NICKNAME_LENGTH } from "@bowling/domain";
import { useState } from "preact/hooks";

interface HomeProps {
  initialCode: string;
  error?: string;
  onCreate: (nickname: string) => void;
  onJoin: (code: string, nickname: string) => void;
}

export const Home = ({ initialCode, error, onCreate, onJoin }: HomeProps) => {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(initialCode);

  return (
    <main>
      <h1>Bolos</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onJoin(code, nickname);
        }}
      >
        <label>
          Tu apodo
          <input
            name="nickname"
            value={nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="nickname"
            required
            onInput={(event) => setNickname(event.currentTarget.value)}
          />
        </label>
        <button type="button" onClick={() => onCreate(nickname)}>
          Crear sala
        </button>
        <p>o únete a la de un amigo</p>
        <label>
          Código de sala
          <input
            name="code"
            value={code}
            maxLength={5}
            autoCapitalize="characters"
            autoComplete="off"
            onInput={(event) => setCode(event.currentTarget.value)}
          />
        </label>
        <button type="submit">Unirse</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
};
