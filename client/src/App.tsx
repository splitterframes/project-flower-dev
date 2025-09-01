import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState<string>('')

  const testAPI = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setMessage(data.message)
    } catch (error) {
      setMessage('API connection failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 max-w-md text-center shadow-2xl">
        <div className="text-6xl mb-6">🦋</div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Mariposa
        </h1>
        <p className="text-gray-600 mb-8">
          Das magische Garten-Management-Spiel mit 960 Schmetterlingen
        </p>
        <button 
          onClick={testAPI}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
        >
          API Testen
        </button>
        {message && (
          <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default App