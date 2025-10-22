"use client";
export default function Error({ error }: { error: any }) {
  return <div className="p-8 text-red-600">Error: {String(error)}</div>;
}
