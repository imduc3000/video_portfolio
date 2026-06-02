import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import EditorPortfolio from "@/components/editor/EditorPortfolio";
import WelcomeScreen from "@/components/editor/WelcomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nguyễn Minh Đức — Video Editor Portfolio" },
      {
        name: "description",
        content:
          "Portfolio tương tác của Nguyễn Minh Đức — Video Editor / Media Creator, trình bày như một phần mềm dựng phim với timeline có thể kéo, cắt và phát.",
      },
      { property: "og:title", content: "Nguyễn Minh Đức — Video Editor Portfolio" },
      {
        property: "og:description",
        content: "Một portfolio editor‑style: kéo timeline, nhấn play, cắt clip — và xem hồ sơ render dần ra.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [booted, setBooted] = useState(false);
  return booted ? <EditorPortfolio /> : <WelcomeScreen onReady={() => setBooted(true)} />;
}
