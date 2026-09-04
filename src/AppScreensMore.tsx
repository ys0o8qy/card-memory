import { useState } from "react";

import {
  labelForFace,
} from "./domain/cards";
import {
  DEFAULT_PAO_TEMPLATE,
  type ResolvedPaoMapping,
} from "./domain/pao";
import type { Repository } from "./domain/storage";
import type { ExerciseState, PaoEditorValue } from "./appTypes";
import { Metric, PlayingCard } from "./AppUi";

export function RemainingQuestionScreen({
  exercise,
  onAnswer,
}: {
  exercise: Extract<ExerciseState, { type: "remaining-question" }>;
  onAnswer: (answer: number) => void;
}) {
  return (
    <>
      <p className="eyebrow">剩余牌判断</p>
      <h2>观察已出牌</h2>
      <div className="card-grid">
        {exercise.seenCards.map((card) => (
          <PlayingCard card={card} key={card.id} />
        ))}
      </div>
      <div className="band question-band">
        <h3>{exercise.question.prompt}</h3>
        <div className="actions">
          {[0, 1, 2, 3, 4].map((answer) => (
            <button
              className="secondary"
              key={answer}
              onClick={() => onAnswer(answer)}
              type="button"
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function RemainingResult({
  exercise,
  onAgain,
  onToday,
}: {
  exercise: Extract<ExerciseState, { type: "remaining-result" }>;
  onAgain: () => void;
  onToday: () => void;
}) {
  const correct = exercise.answer === exercise.question.expectedAnswer;

  return (
    <>
      <p className="eyebrow">剩余牌结果</p>
      <h2>{correct ? "回答正确" : "再看一遍"}</h2>
      <p className={`notice ${correct ? "" : "warning"}`}>
        你的答案：{exercise.answer}；正确答案：
        {exercise.question.expectedAnswer}。{exercise.question.explanation}
      </p>
      <div className="actions">
        <button className="primary" type="button" onClick={onAgain}>
          再练一组
        </button>
        <button className="secondary" type="button" onClick={onToday}>
          回今日训练
        </button>
      </div>
    </>
  );
}

export function PaoTable({
  mappings,
  onEdit,
}: {
  mappings: Map<string, ResolvedPaoMapping>;
  onEdit: (faceId: string) => void;
}) {
  return (
    <>
      <p className="eyebrow">PAO 表</p>
      <h2>默认映射，可随时修改</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>牌</th>
              <th>领域</th>
              <th>钩子</th>
              <th>人物</th>
              <th>动作</th>
              <th>物品</th>
              <th>场景</th>
              <th>来源</th>
              <th>
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_PAO_TEMPLATE.mappings.map((entry) => {
              const mapping = mappings.get(entry.faceId);
              return (
                <tr key={entry.faceId}>
                  <td>{labelForFace(entry.faceId)}</td>
                  <td>{mapping?.domain ?? "-"}</td>
                  <td>{mapping?.numberHook ?? "-"}</td>
                  <td>{mapping?.persona}</td>
                  <td>{mapping?.action}</td>
                  <td>{mapping?.object}</td>
                  <td className="scene-cell">{mapping?.scene ?? "-"}</td>
                  <td>{mapping?.source === "custom" ? "已修改" : "默认"}</td>
                  <td>
                    <button
                      className="secondary compact-button"
                      onClick={() => onEdit(entry.faceId)}
                      type="button"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PaoEditor({
  faceId,
  mapping,
  onCancel,
  onReset,
  onSave,
}: {
  faceId: string;
  mapping?: ResolvedPaoMapping;
  onCancel: () => void;
  onReset: () => void;
  onSave: (value: PaoEditorValue) => void;
}) {
  const [value, setValue] = useState<PaoEditorValue>({
    persona: mapping?.persona ?? "",
    action: mapping?.action ?? "",
    object: mapping?.object ?? "",
  });
  const canSave =
    value.persona.trim().length > 0 &&
    value.action.trim().length > 0 &&
    value.object.trim().length > 0;

  return (
    <>
      <p className="eyebrow">编辑 PAO</p>
      <h2>{labelForFace(faceId)}</h2>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) onSave(value);
        }}
      >
        <Field
          id="persona"
          label="Persona"
          value={value.persona}
          onChange={(persona) => setValue({ ...value, persona })}
        />
        <Field
          id="action"
          label="Action"
          value={value.action}
          onChange={(action) => setValue({ ...value, action })}
        />
        <Field
          id="object"
          label="Object"
          value={value.object}
          onChange={(object) => setValue({ ...value, object })}
        />
        <div className="actions">
          <button className="primary" disabled={!canSave} type="submit">
            保存
          </button>
          <button className="secondary" type="button" onClick={onCancel}>
            返回
          </button>
          <button className="danger" type="button" onClick={onReset}>
            恢复默认
          </button>
        </div>
      </form>
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        onChange={(event) => onChange(event.currentTarget.value)}
        required
        value={value}
      />
    </div>
  );
}

export function ProgressView({
  repository,
  appState,
}: {
  repository: Repository;
  appState: ReturnType<Repository["getState"]>;
}) {
  const sessions = repository.listSessions({ limit: 100 }).items;
  const latest = sessions.at(-1)?.scoringResults.at(0);

  return (
    <>
      <p className="eyebrow">进度</p>
      <h2>训练记录</h2>
      <div className="stat-grid">
        <Metric label="训练次数" value={sessions.length} />
        <Metric
          label="最近准确率"
          value={latest ? `${Math.round(latest.accuracy * 100)}%` : "-"}
        />
        <Metric label="自定义 PAO" value={appState.paoOverrides.length} />
      </div>
      <div className="band history-band">
        <h3>最近记录</h3>
        <ol className="compact-list">
          {sessions.length === 0 ? (
            <li>还没有训练记录</li>
          ) : (
            sessions
              .slice(-8)
              .reverse()
              .map((session) => (
                <li key={session.id}>
                  {new Date(session.completedAt ?? session.startedAt).toLocaleString()} -{" "}
                  {Math.round((session.scoringResults.at(0)?.accuracy ?? 0) * 100)}%
                </li>
              ))
          )}
        </ol>
      </div>
    </>
  );
}
