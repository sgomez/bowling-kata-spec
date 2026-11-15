import type { RoomSnapshot } from "@bowling/domain";
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
  if (node.type === "button" && children === label) {
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
