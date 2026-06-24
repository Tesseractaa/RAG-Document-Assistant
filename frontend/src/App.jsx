import { useState, useEffect, useRef } from 'react'
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
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const toggleTheme = () =>
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const handleUploadClick = () => {
    document.getElementById('file-input').click()
  }

  const handleFileChange = async (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    setUploading(true)
    setError(null)
    try {
      await uploadDocument(selected)
      setFiles(prev => [...prev, selected])
      setUploaded(true)
    } catch (err) {
      setError('Upload failed. Make sure the backend is running.')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = async (e) => {
    e.stopPropagation()
    setResetting(true)
    setError(null)
    try {
      await resetCollection()
      setFiles([])
      setUploaded(false)
      setMessages([])
      setQuestion('')
      document.getElementById('file-input').value = ''
    } catch (err) {
      setError('Reset failed. Make sure the backend is running.')
    } finally {
      setResetting(false)
    }
  }

  const handleSubmit = async () => {
    if (!question.trim() || !uploaded || loading) return
    const q = question.trim()
    setQuestion('')
    setError(null)
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
      setError('Query failed. Make sure the backend is running.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Something went wrong. Please try again.',
        citations: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
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

      {/* Error banner */}
      {error && (
        <div className="w-full max-w-5xl px-6 mt-2">
          <div className="w-full bg-[var(--danger-dim)] border border-[var(--danger)] text-[var(--danger)] text-xs px-4 py-2 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 hover:opacity-70">✕</button>
          </div>
        </div>
      )}

      {/* Two panel cards */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl px-6 mt-4" style={{ height: 'calc(100vh - 100px)' }}>

        {/* Upload panel */}
        <div
          onClick={handleUploadClick}
          className="h-1/2 md:h-full md:w-1/2 flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)] transition-all duration-200 gap-3 p-6 overflow-hidden"
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
        <div className="h-1/2 md:h-full md:w-1/2 flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]">

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
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[var(--border)] flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploaded ? 'Ask something...' : 'Upload a document first'}
              disabled={!uploaded || loading}
              className="flex-1 bg-[var(--surface-raised)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--border-strong)] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSubmit}
              disabled={!uploaded || loading || !question.trim()}
              className="px-4 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}