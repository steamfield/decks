import { DRAW, DUR, useStageEntrance } from "@steamfield/decks/kit";
import { useTween } from "@steamfield/decks/motion";
import { house, senate, statewideOffices } from "../data/02-power-board";
import { BallotOval } from "./BallotOval";
import { FIELD, FRAME, OFF, ON } from "./design";

const OFFICES = [
  ...statewideOffices.map((office) => ({
    name: office.office,
    won: office.status === "confirmed",
  })),
  { name: house.office, won: house.majorityStatus === "confirmed" },
  { name: senate.office, won: false },
];

export function BallotField() {
  const fills = [
    useTween({ fill: OFF }),
    useTween({ fill: OFF }),
    useTween({ fill: OFF }),
    useTween({ fill: OFF }),
    useTween({ fill: OFF }),
    useTween({ fill: OFF }),
  ];
  const fillAt = (i: number) => {
    const value = fills[i];
    if (!value) throw new Error(`BallotField has no fill for office ${i}`);
    return value;
  };
  useStageEntrance((tl) => {
    OFFICES.forEach((office, i) => {
      if (office.won) tl.to(fillAt(i), { fill: ON, duration: DUR.color, ease: DRAW });
    });
  });
  return (
    <svg
      className="tx-ballot-field"
      viewBox={FRAME.viewBox}
      role="img"
      aria-label="Governor, Lieutenant Governor, Attorney General, Comptroller and Texas House changed hands; Texas Senate did not."
    >
      {OFFICES.map((office, i) => (
        <g key={office.name} transform={`translate(0 ${FIELD.y + i * FIELD.gap})`}>
          <text className="tx-field-label" x={FIELD.x} y={FIELD.labelDy}>
            {office.name}
          </text>
          <line
            className="tx-field-rule"
            x1={FIELD.x}
            x2={FRAME.right}
            y1={FIELD.ruleY}
            y2={FIELD.ruleY}
          />
          <BallotOval
            cx={FIELD.ovalX}
            cy={OFF}
            state={office.won ? "filled" : "empty"}
            meaning={office.won ? "changed" : "neutral"}
            fill={fillAt(i).fill}
          />
        </g>
      ))}
    </svg>
  );
}
