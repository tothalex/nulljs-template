/** @jsxImportSource solid-js */
// A Solid SSR page: same single-file layout as React pages, but the
// defineSolidPage call switches this file to the Solid JSX transform — keep all
// of the page's JSX in this one file. The pragma above points the TYPE CHECKER
// at Solid's JSX types; the deploy pipeline picks the framework from the config.
import { createSignal, For } from "solid-js";
import { defineSolidPage } from "@tothalex/cloud";

type Props = { title: string; items: string[] };

export const Page = (props: Props) => {
  const [clicks, setClicks] = createSignal(0);
  return (
    <main>
      <h1>Board: {props.title}</h1>
      <ul>
        <For each={props.items}>{(item) => <li>{item}</li>}</For>
      </ul>
      <button onClick={() => setClicks(clicks() + 1)}>clicked {clicks()} times</button>
    </main>
  );
};

export default defineSolidPage<Props>({
  name: "board",
  route: "/board",
  props: async (request) => ({
    title: request.query_params.title ?? "welcome",
    items: ["alpha", "beta", "gamma"],
  }),
});
