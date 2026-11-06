import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

axios.defaults.baseURL = API_URL
axios.defaults.withCredentials = true

const nativeFetch = window.fetch.bind(window)

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

  const isApiRequest =
    url.startsWith(API_URL) ||
    url.startsWith('http://localhost:3333') ||
    url.startsWith('http://127.0.0.1:3333')

  if (isApiRequest) {
    return nativeFetch(input, { credentials: 'include', ...init })
  }

  return nativeFetch(input, init)
}
