// components/VeduMarkRenderer.tsx
"use client";

import React, { JSX } from "react";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";


export interface ChartDataPoint {
  [key: string]: string | number;
}

export type Block =
  | { type: "heading"; level: number; content: string }
  | { type: "paragraph"; content: string }
  | { type: "code"; language: string; content: string }
  | { type: "math"; content: string }
  | { type: "chem"; content: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hint"; content: string }
  | { type: "quiz-single"; question: string; options: { text: string; correct: boolean }[] }
  | { type: "video"; src: string }
  | { type: "chart"; chartType: string; data: ChartDataPoint[]; x: string; y: string };

export interface VeduMarkDocument {
metadata: Record<string, unknown>;
  content: Block[];
}



export const VeduMarkRenderer: React.FC<{ doc: VeduMarkDocument }> = ({ doc }) => {
  return (
    <div className="space-y-6">
      {doc.content.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
            return <HeadingTag key={i} className="font-bold text-xl mt-4">{block.content}</HeadingTag>;
          }
          case "paragraph":
            return <p key={i} className="text-base leading-relaxed whitespace-pre-line">{block.content}</p>;

          case "code":
            return (
              <pre key={i} className="p-4 rounded overflow-x-auto text-sm">
                <code>{block.content}</code>
              </pre>
            );

          case "math":
            return (
              <div key={i} className=" p-2 rounded text-lg">
                <InlineMath math={block.content} />
              </div>
            );

          case "chem":
            return (
              <div key={i} className=" border-l-4  p-3 rounded font-mono">
                🧪 {block.content}
              </div>
            );

          case "hint":
            return (
              <div key={i} className=" border-l-4  p-3 rounded">
                💡 {block.content}
              </div>
            );

          case "video":
            return (
              <div key={i} className="aspect-video">
                <iframe
                  src={block.src}
                  className="w-full h-full rounded"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            );

          case "quiz-single":
            return (
              <div key={i} className="p-4 rounded">
                <p className="font-semibold">🧠 {block.question}</p>
                <ul className="space-y-1 mt-2">
                  {block.options.map((opt, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <input type="radio" name={`quiz-${i}`} disabled checked={opt.correct} /> {opt.text}
                    </li>
                  ))}
                </ul>
              </div>
            );

          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="table-auto border-collapse border w-full text-sm">
                  <thead>
                    <tr>
                      {block.headers.map((h, j) => (
                        <th key={j} className="border px-2 py-1  font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k} className="border px-2 py-1 whitespace-pre-line">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "chart":
            return (
              <div key={i} className=" p-4 border rounded">
                <h3 className="font-semibold mb-2">📊 Chart: {block.chartType}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={block.data}>
                    <XAxis dataKey={block.x} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey={block.y} fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
