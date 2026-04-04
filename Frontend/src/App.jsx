import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-8 p-8">
      <div className="flex gap-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo h-24 w-24" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react h-24 w-24" alt="React logo" />
        </a>
      </div>
      
      <h1 className="text-5xl font-bold text-primary">Vite + React</h1>
      
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Counter Demo</h2>
          <p className="text-2xl font-semibold">count is {count}</p>
          <div className="card-actions">
            <button className="btn btn-primary" onClick={() => setCount((count) => count + 1)}>
              Increment
            </button>
            <button className="btn btn-secondary" onClick={() => setCount(0)}>
              Reset
            </button>
          </div>
        </div>
      </div>
      
      <div className="alert alert-info max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Edit <code className="badge badge-ghost">src/App.jsx</code> and save to test HMR</span>
      </div>
      
      <p className="text-sm opacity-70">
        Click on the Vite and React logos to learn more
      </p>
      
      <div className="flex gap-2">
        <div className="badge badge-primary">Vite</div>
        <div className="badge badge-secondary">React</div>
        <div className="badge badge-accent">Tailwind CSS v4</div>
        <div className="badge badge-ghost">DaisyUI</div>
      </div>
    </div>
  )
}

export default App
