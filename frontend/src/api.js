import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export async function uploadDocument(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/ingest', formData)
  return res.data
}

export async function queryDocument(question) {
  const res = await api.post('/query', { question })
  return res.data
}

export async function resetCollection() {
  const res = await api.post('/reset')
  return res.data
}