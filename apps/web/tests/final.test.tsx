import type { BowlerView, RoomSnapshot } from "@bowling/domain";
import { type ComponentChildren, toChildArray, type VNode } from "preact";
import { render } from "preact-render-to-string";
import { describe, expect, it, vi } from "vitest";
import { Final } from "../src/final.js";

const room = {
  code: "K7MPQ",
  phase: "finished",
  hostId: "ana",
  bowlers: [
    { id: "ana", nickname: "Ana", frames: [], total: 90 },
    { id: "bea", nickname: "Bea", frames: [], total: 90 },
  ],
  standing: [],
  winners: ["ana", "bea"],
} as unknown as RoomSnapshot;

const bowler = (nickname: string, total: number): BowlerView => ({
  id: nickname.toLowerCase(),
  nickname,
  colour: 0,
  connected: true,
  finishedFrame: true,
  frames: [],
  total,
});

const finalWith = (bowlers: BowlerView[]) =>
  render(
    <Final
      seat={{ you: "luis", room: { ...room, bowlers }, receivedAt: 0 }}
      onRematch={() => {}}
      onLeave={() => {}}
    />,
  );

const text = (html: string) => html.replace(/<[^>]*>/g, " ");

const podium = (html: string) =>
  text(html.match(/<ol aria-label="Podio".*?<\/ol>/s)?.[0] ?? "");

const final = (you: string, onLeave = () => {}) => (
  <Final
    seat={{ you, room, receivedAt: 0 }}
    onRematch={() => {}}
    onLeave={onLeave}
  />
);

type Props = { children?: ComponentChildren; onClick?: () => void };

const buttonLabelled = (
  node: VNode,
  label: string,
): VNode<Props> | undefined => {
  const { children } = node.props as Props;
  if ("onClick" in node.props && children === label) {
    return node as VNode<Props>;
  }
  return toChildArray(children)
    .filter((child): child is VNode => typeof child === "object")
    .map((child) => buttonLabelled(child, label))
    .find(Boolean);
};

const finalTree = (you: string, onLeave: () => void) =>
  Final(final(you, onLeave).props) as VNode;

describe("final Scores screen", () => {
  it("crowns a single winner on a podium of the top three", () => {
    const html = finalWith([
      bowler("Nuria", 139),
      bowler("Marta", 183),
      bowler("Carmen", 131),
      bowler("Luis", 149),
    ]);

    expect(text(html)).toMatch(/Partida terminada\s+¡Gana Marta!/);
    expect(podium(html)).toMatch(
      /LU\s+Luis\s+149\s+2\s+MA\s+Marta\s+183\s+1\s+NU\s+Nuria\s+139\s+3/,
    );
    expect(podium(html)).not.toContain("Carmen");
  });

  it("shares the top step on a tie", () => {
    const html = finalWith([
      bowler("Nuria", 139),
      bowler("Marta", 183),
      bowler("Luis", 183),
    ]);

    expect(text(html)).toMatch(/Partida terminada\s+Empate entre Marta y Luis/);
    expect(podium(html)).toMatch(
      /MA\s+Marta\s+183\s+1\s+LU\s+Luis\s+183\s+1\s+NU\s+Nuria\s+139\s+3/,
    );
  });

  it("shows the full scorecard with its legend under the podium", () => {
    const html = text(
      finalWith([
        bowler("Marta", 183),
        bowler("Luis", 149),
        bowler("Nuria", 139),
        bowler("Carmen", 131),
      ]),
    );

    expect(html).toMatch(
      /Marcador completo.*semipleno.*1\s+MA\s+Marta.*4\s+CA\s+Carmen\s+131/s,
    );
  });

  it("lets only the Host start a Rematch", () => {
    expect(render(final("ana"))).toContain("Revancha");
    expect(render(final("bea"))).not.toContain("Revancha");
    expect(render(final("bea"))).toContain(
      "Esperando a que el anfitrión pida la revancha",
    );
  });

  it.each(["ana", "bea"])("lets %s leave the Room", (you) => {
    const onLeave = vi.fn();

    buttonLabelled(
      finalTree(you, onLeave),
      "Salir de la sala",
    )?.props.onClick?.();

    expect(onLeave).toHaveBeenCalledOnce();
  });
});
