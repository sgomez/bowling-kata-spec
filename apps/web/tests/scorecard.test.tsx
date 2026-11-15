import type { BowlerView, FrameView } from "@bowling/domain";
import { toChildArray, type VNode } from "preact";
import { render } from "preact-render-to-string";
import { describe, expect, it, vi } from "vitest";
import { ScorecardSheet } from "../src/scorecard-sheet.js";

const framesWith = (...played: FrameView[]): FrameView[] =>
  Array.from({ length: 10 }, (_, i) => played[i] ?? { rolls: [], score: null });

const bowler = (
  nickname: string,
  total: number,
  frames = framesWith({ rolls: ["5", "2"], score: total }),
): BowlerView => ({
  id: nickname.toLowerCase(),
  nickname,
  colour: 0,
  connected: true,
  finishedFrame: true,
  frames,
  total,
});

const sheet = (bowlers: BowlerView[], you = "luis") =>
  render(<ScorecardSheet you={you} bowlers={bowlers} onClose={() => {}} />);

const text = (html: string) => html.replace(/<[^>]*>/g, " ");

type Props = { children?: unknown; onClick?: () => void };

const buttonLabelled = (
  node: VNode,
  label: string,
): VNode<Props> | undefined => {
  const props = node.props as Props & { "aria-label"?: string };
  if (node.type === "button" && props["aria-label"] === label) {
    return node as VNode<Props>;
  }
  return toChildArray(props.children as VNode)
    .filter((child): child is VNode => typeof child === "object")
    .map((child) => buttonLabelled(child, label))
    .find(Boolean);
};

describe("the scorecard sheet", () => {
  it("opens as a dialog titled Marcador that can be closed", () => {
    const html = sheet([bowler("Luis", 7)]);

    expect(html).toMatch(/role="dialog"[^>]*>.*Marcador/s);
    expect(html).toContain('aria-label="Cerrar marcador"');
  });

  it("closes from its close button", () => {
    const onClose = vi.fn();
    const tree = ScorecardSheet({ you: "luis", bowlers: [], onClose }) as VNode;

    buttonLabelled(tree, "Cerrar marcador")?.props.onClick?.();

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ranks Bowlers by total with shared positions", () => {
    const html = text(
      sheet([bowler("Luis", 7), bowler("Marta", 9), bowler("Nuria", 7)]),
    );

    expect(html).toMatch(/1\s+MA\s+Marta.*2\s+LU\s+Luis.*2\s+NU\s+Nuria/s);
  });

  it("shows each Frame in Notation with its running Score", () => {
    const frames = framesWith(
      { rolls: ["X"], score: 19 },
      { rolls: ["7", "/"], score: 29 },
      { rolls: ["-", "9"], score: 38 },
    );
    const html = text(sheet([bowler("Luis", 38, frames)]));

    expect(html).toMatch(/X\s+19\s+.*7\s+\/\s+29\s+.*-\s+9\s+38/s);
  });

  it("shows the Tenth Frame's three Rolls", () => {
    const frames = framesWith(
      ...Array.from({ length: 9 }, (_, i) => ({ rolls: ["-", "-"], score: 0 })),
      { rolls: ["X", "X", "7"], score: 27 },
    );

    expect(text(sheet([bowler("Luis", 27, frames)]))).toMatch(
      /10\s.*X\s+X\s+7\s+27/s,
    );
  });

  it("marks Frames whose Score is pending", () => {
    const frames = framesWith(
      { rolls: ["5", "2"], score: 7 },
      { rolls: ["7", "/"], score: null },
    );
    const html = text(sheet([bowler("Luis", 7, frames)]));

    expect(html).toMatch(/7\s+\/\s+···/);
  });

  it("highlights the viewer's own row", () => {
    const html = sheet([bowler("Luis", 7), bowler("Marta", 9)]);

    expect(html).toMatch(/<li[^>]*aria-current="true"[^>]*>(?:(?!<li).)*Luis/s);
    expect(html).not.toMatch(
      /<li[^>]*aria-current="true"[^>]*>(?:(?!<li).)*Marta/s,
    );
    expect(text(html)).toMatch(/Luis\s+tú/);
  });

  it("explains the Notation", () => {
    const html = text(sheet([bowler("Luis", 7)]));

    expect(html).toMatch(/X\s+pleno/);
    expect(html).toMatch(/\/\s+semipleno/);
    expect(html).toMatch(/-\s+cero/);
    expect(html).toMatch(/1–9\s+bolos derribados/);
    expect(html).toMatch(/···\s+pendiente de bonificación/);
  });
});
