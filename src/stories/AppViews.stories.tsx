import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import {
  PaoDemo,
  PaoEditor,
  PaoTable,
  RemainingQuestionScreen,
  RemainingResult,
  SequenceResult,
  TodayView,
  TrainView,
} from "../App";
import {
  createFixtureRepository,
  fixtureDemoExercise,
  fixturePaoMappings,
  fixtureRemainingQuestion,
  fixtureRemainingResult,
  fixtureSequenceResult,
} from "../fixtures/uiFixtures";

const meta = {
  title: "Card Memory/App Views",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

function noop() {
  return undefined;
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <main className="main-panel">{children}</main>
    </div>
  );
}

export const Today: Story = {
  render: () => {
    const repository = createFixtureRepository();
    return (
      <Frame>
        <TodayView
          appState={repository.getState()}
          repository={repository}
          onStartDemo={noop}
          onStartSequence={noop}
        />
      </Frame>
    );
  },
};

export const TrainModes: Story = {
  render: () => (
    <Frame>
      <TrainView
        onStartDemo={noop}
        onStartRemaining={noop}
        onStartSequence={noop}
      />
    </Frame>
  ),
};

export const PaoTableView: Story = {
  render: () => (
    <Frame>
      <PaoTable mappings={fixturePaoMappings} onEdit={noop} />
    </Frame>
  ),
};

export const PaoEditorView: Story = {
  render: () => (
    <Frame>
      <PaoEditor
        faceId="spade_A"
        mapping={fixturePaoMappings.get("spade_A")}
        onCancel={noop}
        onReset={noop}
        onSave={noop}
      />
    </Frame>
  ),
};

export const PaoDemoView: Story = {
  render: () => (
    <Frame>
      <PaoDemo
        exercise={fixtureDemoExercise}
        mappings={fixturePaoMappings}
        onEdit={noop}
        onNext={noop}
        onStartSequence={noop}
      />
    </Frame>
  ),
};

export const SequenceResultView: Story = {
  render: () => (
    <Frame>
      <SequenceResult
        exercise={fixtureSequenceResult}
        onAgain={noop}
        onEdit={noop}
        onPaoTable={noop}
      />
    </Frame>
  ),
};

export const RemainingQuestionView: Story = {
  render: () => (
    <Frame>
      <RemainingQuestionScreen
        exercise={fixtureRemainingQuestion}
        onAnswer={noop}
      />
    </Frame>
  ),
};

export const RemainingResultView: Story = {
  render: () => (
    <Frame>
      <RemainingResult
        exercise={fixtureRemainingResult}
        onAgain={noop}
        onToday={noop}
      />
    </Frame>
  ),
};
