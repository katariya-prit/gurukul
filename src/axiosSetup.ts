import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

axios.defaults.withCredentials = true

const nativeFetch = window.fetch.bind(window)

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

  if (url.startsWith(API_URL)) {
    return nativeFetch(input, { credentials: 'include', ...init })
  }

  return nativeFetch(input, init)
}