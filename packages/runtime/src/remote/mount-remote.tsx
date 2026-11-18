import { createRoot } from "react-dom/client";
import { connectRemote, type RemoteState } from "./remote-connection";
import { RemoteView } from "./remote-view";

export function mountRemote(root?: HTMLElement): () => void {
  const element = root ?? document.getElementById("deck-root");
  if (!element) throw new Error("Missing mount element #deck-root");
  const reactRoot = createRoot(element);
  const connection = connectRemote(render);
  function render(state: RemoteState) {
    reactRoot.render(<RemoteView state={state} send={connection.send} />);
  }
  render({});
  return () => {
    connection.dispose();
    reactRoot.unmount();
  };
}
