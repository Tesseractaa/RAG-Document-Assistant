frontend: npm run dev

backend: python -m uvicorn main:app --reload

Auto-scroll — chat should scroll to the latest message automatically
Upload progress — a subtle animation while the document processes
Clear/reset button — swap out the document and clear chat history
Error states — friendly message if the backend is down or query fails visibly in the UI
Send button alongside Enter
Typing indicator that's more animated than "Thinking..."
Mobile responsiveness