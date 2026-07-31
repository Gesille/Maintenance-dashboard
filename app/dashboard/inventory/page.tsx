"use client";

import { PartListPanel } from "@/component/PartListPanel";
import { Part } from "@/types/Part";

export default function Page() {
  const handleSelect = (part: Part) => {
    console.log("selected", part);
  };

  const handleNew = () => {
    console.log("new part");
  };

  return (
    <div>
      <PartListPanel
        parts={[]}
        selectedId={null}
        onSelect={handleSelect}
        onNew={handleNew}
      />
    </div>
  );
}