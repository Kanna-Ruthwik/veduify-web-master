// lib/vedumark-parser.ts

import { Block, VeduMarkDocument } from "@/components/VeduMarkRenderer";

export interface ChartDataPoint {
  [key: string]: string | number;
}


export function parseVeduMark(text: string): VeduMarkDocument {
  const lines = text.split(/\r?\n/);
  const content: Block[] = [];
const metadata: Record<string, unknown> = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith("#")) {
      const level = line.match(/^#+/)![0].length;
      const contentText = line.replace(/^#+\s*/, "");
      content.push({ type: "heading", level, content: contentText });
      i++;
      continue;
    }

    if (line.startsWith("[math:")) {
      const contentText = line.match(/\[math:([^\]]+)\]/)![1].trim();
      content.push({ type: "math", content: contentText });
      i++;
      continue;
    }

    if (line.startsWith("[chem:")) {
      const contentText = line.match(/\[chem:([^\]]+)\]/)![1].trim();
      content.push({ type: "chem", content: contentText });
      i++;
      continue;
    }

    if (line === "[hint]") {
      let hint = "";
      i++;
      while (i < lines.length && lines[i].trim()) {
        hint += lines[i++] + "\n";
      }
      content.push({ type: "hint", content: hint.trim() });
      continue;
    }

    if (line.startsWith("[code:")) {
      const language = line.match(/\[code:([^\]]+)\]/)![1].trim();
      let code = "";
      i++;
      while (i < lines.length && lines[i].trim() !== "[/code]") {
        code += lines[i++] + "\n";
      }
      i++; // skip [/code]
      content.push({ type: "code", language, content: code.trim() });
      continue;
    }

    if (line === "[table]") {
      const headers: string[] = lines[++i].split("|").map(cell => cell.trim()).filter(Boolean);
      i++; // skip separator row (e.g., |----|)
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() !== "[/table]") {
        const row = lines[i++].split("|").map(cell => cell.trim()).filter(Boolean);
        rows.push(row);
      }
      i++; // skip [/table]
      content.push({ type: "table", headers, rows });
      continue;
    }

    if (line.startsWith("[quiz:single]")) {
      const question = line.replace("[quiz:single]", "").trim();
      const options: { text: string; correct: boolean }[] = [];
      i++;
      while (i < lines.length && lines[i].startsWith("- [")) {
        const match = lines[i].match(/- \[(x| )\] (.+)/i);
        if (match) {
          options.push({ text: match[2], correct: match[1].toLowerCase() === "x" });
        }
        i++;
      }
      content.push({ type: "quiz-single", question, options });
      continue;
    }

    if (line.startsWith("[video:src=")) {
      const src = line.match(/\[video:src=\"(.+?)\"\]/)![1];
      content.push({ type: "video", src });
      i++;
      continue;
    }

    if (line.startsWith("[chart:")) {
  const chartLines: string[] = [];

  // Collect all lines until [/chart]
  while (i < lines.length && !lines[i].includes("[/chart]")) {
    chartLines.push(lines[i]);
    i++;
  }

  // Add the closing [/chart] line too
  if (i < lines.length && lines[i].includes("[/chart]")) {
    chartLines.push(lines[i]);
  }

  // Join into one block
  const fullChartBlock = chartLines.join("\n");

  // Extract chartType, x, y
  const chartType = fullChartBlock.match(/type=([^;\n]+);?/)?.[1].trim() ?? "bar";
  const x = fullChartBlock.match(/x=([^;\n]+);?/)?.[1].trim() ?? "label";
  const y = fullChartBlock.match(/y=([^;\n]+);?/)?.[1].trim() ?? "value";

  // Extract everything after data=[
  const dataMatch = fullChartBlock.match(/data=\[([\s\S]*?)\][\s\S]*?\[\/chart\]/);
  const dataRaw = dataMatch?.[1];

  let data: ChartDataPoint[] = [];

  if (dataRaw) {
    try {
      // Wrap back into array brackets
      data = JSON.parse(`[${dataRaw}]`);
    } catch (err) {
      console.error("Invalid chart data JSON:", err, "Raw:", dataRaw);
    }
  } else {
    console.error("Missing or invalid 'data' in chart block:", fullChartBlock);
  }

  content.push({ type: "chart", chartType, data, x, y });
  i++; // move past [/chart]
  continue;
}


    // Default fallback as paragraph
    let paragraph = line;
    i++;
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("[")) {
      paragraph += "\n" + lines[i++];
    }
    content.push({ type: "paragraph", content: paragraph.trim() });
  }

  return { metadata, content };
}
