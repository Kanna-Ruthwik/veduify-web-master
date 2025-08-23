"use client";

import React, { useState, useEffect, useMemo } from "react";
import { VeduMarkRenderer } from "@/components/VeduMarkRenderer";
import { parseVeduMark } from "@/lib/vedumark-parser";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

// 👇 match the type used in your parser/renderer
type VeduMarkDocument = {
  content: any[];
  metadata: Record<string, any>;
};

export default function VeduMarkEditorPage() {
  const params = useParams();
  const router = useRouter();
  const subtopic = decodeURIComponent(params.subtopic as string);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, "aiContents", subtopic);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setInput(snap.data().content);
        } else {
          setInput("# New Topic\n\nStart writing...");
        }
      } catch (err) {
        console.error("Error loading content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [subtopic]);

  // ✅ Safe parsing into full document
  const document: VeduMarkDocument = useMemo(() => {
    try {
      const parsed = parseVeduMark(input); // should return { content, metadata }
      setParseError(null);
      return parsed;
    } catch (err: any) {
      setParseError(err.message || "Invalid VeduMark syntax");
      return { content: [], metadata: {} }; // fallback doc
    }
  }, [input]);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "aiContents", subtopic), {
        content: input,
        updatedAt: Date.now(),
      });
      router.push(`/dashboard/course/${params.id}`);
    } catch (err) {
      console.error("Error saving content:", err);
    }
  };

  if (loading) {
    return <p className="p-6">Loading editor...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen overflow-hidden">
      {/* Editor */}
      <div className="p-4 border-r overflow-auto">
        <h2 className="text-lg font-semibold mb-2">VeduMark Editor</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-[85%] resize-none border rounded p-2 font-mono"
        />
        <div className="mt-3 flex gap-2">
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Renderer */}
      <div className="p-4 overflow-auto">
        <h2 className="text-lg font-semibold mb-2">Preview</h2>
        {parseError ? (
          <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            ⚠️ Preview error: {parseError}
          </div>
        ) : (
          <VeduMarkRenderer doc={document} />
        )}
      </div>
    </div>
  );
}
