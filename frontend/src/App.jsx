import { useState, useEffect } from 'react'
import { uploadDocument, queryDocument, resetCollection } from './api'

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  )
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const handleUploadClick = () => {
    document.getElementById('file-input').click()
  }

  const handleFileChange = async (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    setUploading(true)
    try {
      await uploadDocument(selected)
      setFiles(prev => [...prev, selected])
      setUploaded(true)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleKeyDown = async (e) => {
    if (e.key !== 'Enter' || !question.trim() || !uploaded) return
    const q = question.trim()
    setQuestion('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await queryDocument(q)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: res.answer,
        citations: res.citations
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Something went wrong. Try again.',
        citations: []
      }])
    } finally {
      setLoading(false)
    }
  }

  // add this handler
const handleReset = async (e) => {
  e.stopPropagation()
  setResetting(true)
  try {
    await resetCollection()
    setFiles([])
    setUploaded(false)
    setMessages([])
    setQuestion('')
    document.getElementById('file-input').value = ''
  } catch (err) {
    console.error('Reset failed:', err)
  } finally {
    setResetting(false)
  }
}

  return (
    <div className="min-h-screen flex flex-col items-center bg-[var(--bg)]">

      {/* Theme toggle */}
      <div className="w-full flex justify-center pt-5 pb-2">
        <button
          onClick={toggleTheme}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-200 tracking-widest uppercase"
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>

      {/* Two panel cards */}
      <div className="flex gap-6 w-full max-w-5xl px-6 mt-8" style={{ height: 'calc(100vh - 120px)' }}>

        {/* Upload panel */}
        <div
          onClick={handleUploadClick}
          className="w-1/2 min-w-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)] transition-all duration-200 gap-3 p-6 overflow-hidden"
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.txt,.md,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploading ? (
            <span className="text-[var(--text-secondary)] text-sm">
              Processing...
            </span>
          ) : uploaded ? (
            <>
              <div className="flex flex-col gap-2 w-full items-center">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-success text-xs">✓</span>
                    <span className="text-[var(--text-primary)] text-xs truncate">
                      {f.name}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-[var(--text-tertiary)] text-xs mt-1">
                Click to add
              </span>
              <button
                onClick={handleReset}
                className="text-xs text-[var(--text-tertiary)] hover:text-danger transition-colors duration-200 border border-[var(--border)] px-3 py-1 rounded-lg mt-2"
              >
                {resetting ? 'Clearing...' : 'Clear & reset'}
              </button>
            </>
          ) : (
            <>
              <span className="text-[var(--text-tertiary)] text-sm tracking-wide">
                Click to upload document
              </span>
              <span className="text-[var(--text-tertiary)] text-xs">
                PDF · DOCX · TXT · MD · CSV
              </span>
            </>
          )}
        </div>

        {/* Chat panel */}
        <div className="w-1/2 min-w-0 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[var(--text-tertiary)] text-sm tracking-wide">
                  {uploaded ? 'Ask document related questions' : 'Upload a document to get started'}
                </span>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent-dim text-[var(--text-primary)] border border-[var(--border)]'
                      : 'bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border)]'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {msg.citations.map((c, j) => (
                        <span key={j} className="text-xs text-[var(--text-tertiary)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                          [{c.index}] {c.source} · p{c.page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-start">
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] px-4 py-3 rounded-xl text-sm text-[var(--text-tertiary)]">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[var(--border)]">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploaded ? 'Ask something... (Enter to send)' : 'Upload a document first'}
              disabled={!uploaded || loading}
              className="w-full bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--border-strong)] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

        </div>
      </div>
    </div>
  )
}