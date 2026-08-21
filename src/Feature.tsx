import { useState } from "react";
import {
  MeshNameInput,
  useNamedPeer,
  useSharedCollection,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };
type LadderState = {
  id: "ladder";
  stage: number;
  facilitator: string;
  requestBy: string;
  updatedAt: number;
};
type Note = { id: string; stage: number; body: string; author: string; createdAt: number };

const STAGES = [
  {
    name: "Warm up",
    prompt: "What feels worth noticing before we begin?",
    aim: "Make space for everyone to arrive.",
  },
  {
    name: "Grounded",
    prompt: "What is one concrete example that helps the group understand?",
    aim: "Move from abstractions to shared evidence.",
  },
  {
    name: "Stretch",
    prompt: "Which assumption could we gently challenge together?",
    aim: "Invite productive curiosity without forcing agreement.",
  },
  {
    name: "Honest",
    prompt: "What does this situation ask of us that is uncomfortable but useful?",
    aim: "Name the tension with care.",
  },
  {
    name: "Commit",
    prompt: "What is one small next step you want to carry forward?",
    aim: "Leave with an actionable signal, not a verdict.",
  },
];

export function isValidLadder(value: unknown): value is LadderState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<LadderState>;
  return (
    state.id === "ladder" &&
    Number.isInteger(state.stage) &&
    (state.stage ?? -1) >= 0 &&
    (state.stage ?? STAGES.length) < STAGES.length &&
    typeof state.facilitator === "string" &&
    state.facilitator.length > 0 &&
    state.facilitator.length <= 128 &&
    typeof state.requestBy === "string" &&
    state.requestBy.length <= 128 &&
    Number.isFinite(state.updatedAt)
  );
}

export function isValidNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<Note>;
  return (
    typeof note.id === "string" &&
    note.id.length >= 8 &&
    note.id.length <= 96 &&
    Number.isInteger(note.stage) &&
    (note.stage ?? -1) >= 0 &&
    (note.stage ?? STAGES.length) < STAGES.length &&
    typeof note.body === "string" &&
    note.body.trim().length > 0 &&
    note.body.length <= 280 &&
    typeof note.author === "string" &&
    note.author.length <= 64 &&
    Number.isFinite(note.createdAt)
  );
}

export function Feature({ room, config }: Props) {
  const { name, setName, myName, nameOf } = useNamedPeer(config, room);
  const ladder = useSharedCollection<LadderState>(room, "mesh-prompt-ladder:state", {
    validate: isValidLadder,
  });
  const notes = useSharedCollection<Note>(room, "mesh-prompt-ladder:notes", {
    validate: isValidNote,
  });
  const [note, setNote] = useState("");
  const state = ladder.byId("ladder");
  const stage = state ? STAGES[state.stage] : undefined;
  const isFacilitator = Boolean(room && state?.facilitator === room.peerId);
  const isFinalStage = Boolean(state && state.stage === STAGES.length - 1);
  const requestName = state?.requestBy ? nameOf(state.requestBy) || "A participant" : "";
  const stageNotes = state ? notes.items.filter((entry) => entry.stage === state.stage) : [];

  const start = () => {
    if (!room || state) return;
    ladder.add({
      id: "ladder",
      stage: 0,
      facilitator: room.peerId,
      requestBy: "",
      updatedAt: Date.now(),
    });
  };
  const requestAdvance = () => {
    if (!room || !state || isFinalStage || state.requestBy) return;
    ladder.update("ladder", { requestBy: room.peerId, updatedAt: Date.now() });
  };
  const confirmAdvance = () => {
    if (!room || !state || !isFacilitator || !state.requestBy || isFinalStage) return;
    ladder.update("ladder", { stage: state.stage + 1, requestBy: "", updatedAt: Date.now() });
  };
  const restart = () => {
    if (!room || !state || !isFacilitator) return;
    ladder.update("ladder", { stage: 0, requestBy: "", updatedAt: Date.now() });
  };
  const addNote = () => {
    const body = note.trim();
    if (!room || !state || !body) return;
    notes.add({
      id: crypto.randomUUID(),
      stage: state.stage,
      body,
      author: myName,
      createdAt: Date.now(),
    });
    setNote("");
  };

  if (!room)
    return (
      <main className="ladder-page">
        <h1>{config.appName}</h1>
        <p role="status" className="live-status">
          Joining the discussion room…
        </p>
      </main>
    );

  return (
    <main className="ladder-page">
      <section className="hero" aria-labelledby="ladder-title">
        <p className="eyebrow">Guided group discussion</p>
        <h1 id="ladder-title">A little deeper, one rung at a time.</h1>
        <p>
          Use the shared ladder to move from a low-stakes opening to a concrete next step. The
          facilitator confirms each transition.
        </p>
        <p className="live-status" role="status" aria-live="polite">
          {state && stage
            ? `${stage.name}, rung ${state.stage + 1} of ${STAGES.length}.`
            : "No ladder has started yet."}
        </p>
      </section>
      <section className="stage-card" aria-labelledby="stage-title">
        <div className="rung">{state ? `${state.stage + 1} / ${STAGES.length}` : "Ready"}</div>
        <p className="eyebrow">{stage?.name ?? "Start together"}</p>
        <h2 id="stage-title">
          {stage?.prompt ?? "Choose a facilitator and begin the first rung."}
        </h2>
        <p className="aim">
          {stage?.aim ??
            "The starter becomes facilitator and can safely confirm every stage change."}
        </p>
        {!state ? (
          <button className="primary" type="button" onClick={start}>
            Start as facilitator
          </button>
        ) : (
          <div className="transition" aria-live="polite">
            {isFinalStage ? (
              <p className="complete">
                You reached the final rung. Pause, reflect, or restart when the facilitator is
                ready.
              </p>
            ) : state.requestBy ? (
              <>
                <p>
                  <strong>{requestName}</strong> requested the next rung.
                </p>
                {isFacilitator ? (
                  <button className="primary" type="button" onClick={confirmAdvance}>
                    Confirm and advance
                  </button>
                ) : (
                  <p className="hint">
                    Waiting for the facilitator to confirm the shared transition.
                  </p>
                )}
              </>
            ) : (
              <button className="secondary" type="button" onClick={requestAdvance}>
                Request next rung
              </button>
            )}
          </div>
        )}
      </section>
      {state && (
        <section className="notes-card" aria-labelledby="notes-title">
          <div>
            <p className="eyebrow">Optional response notes</p>
            <h2 id="notes-title">Keep a few useful words.</h2>
          </div>
          <label>
            Response note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Optional: share a short response with the room"
            />
          </label>
          <button className="secondary" type="button" onClick={addNote} disabled={!note.trim()}>
            Add note
          </button>
          <ol aria-live="polite">
            {stageNotes.length === 0 ? (
              <li className="empty">No notes on this rung yet.</li>
            ) : (
              stageNotes.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.body}</span>
                  <small>{entry.author}</small>
                </li>
              ))
            )}
          </ol>
        </section>
      )}
      <section className="room-card" aria-labelledby="room-title">
        <div>
          <p className="eyebrow">Room role</p>
          <h2 id="room-title">
            {isFacilitator
              ? "You are facilitating"
              : state
                ? "A shared facilitator is guiding"
                : "Set your name before starting"}
          </h2>
          <p>
            {state
              ? "Any participant may request the next rung; the facilitator has the final confirmation button."
              : "Your name is shared only with peers in this room."}
          </p>
        </div>
        <MeshNameInput value={name} onChange={setName} ariaLabel="Your display name" />
      </section>
      {state && isFacilitator && (
        <button className="restart" type="button" onClick={restart}>
          Restart ladder from warm up
        </button>
      )}
    </main>
  );
}
