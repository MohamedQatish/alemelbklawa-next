"use client"
import { useState } from "react"

export default function SetupPage() {
  const [log, setLog] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  async function runSetup() {
    setRunning(true)
    setLog(["Starting database setup..."])
    try {
      const res = await fetch("/api/setup-db", { method: "POST" })
      const data = await res.json()
      setLog(data.log || [`Error: ${data.error}`])
      setDone(data.success)
    } catch (e: any) {
      setLog(prev => [...prev, `Network error: ${e.message}`])
    }
    setRunning(false)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-amber-400">{"إعداد قاعدة البيانات"}</h1>
        <p className="text-gray-400 mb-6">{"سيتم إنشاء جميع الجداول وملء البيانات الأولية"}</p>
        <button
          onClick={runSetup}
          disabled={running}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-lg disabled:opacity-50 mb-6"
        >
          {running ? "جاري الإعداد..." : done ? "تم الإعداد بنجاح" : "بدء الإعداد"}
        </button>
        {log.length > 0 && (
          <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
            <h2 className="text-sm font-bold text-gray-400 mb-2">{"سجل العمليات:"}</h2>
            {log.map((l, i) => (
              <div key={i} className={`text-sm py-1 font-mono ${l.includes("ERROR") ? "text-red-400" : l.includes("Created") || l.includes("seeded") ? "text-green-400" : "text-gray-300"}`}>
                {l}
              </div>
            ))}
          </div>
        )}
        {done && (
          <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-green-400 font-bold">{"تم إعداد قاعدة البيانات بنجاح!"}</p>
            <div className="flex gap-4 mt-3">
              <a href="/" className="text-amber-400 underline">{"الموقع الرئيسي"}</a>
              <a href="/admin" className="text-amber-400 underline">{"لوحة التحكم"}</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
