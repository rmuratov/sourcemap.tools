import { throwError } from './utils.ts'

function App() {
  function handleClick() {
    throwError()
  }

  return (
    <div className="container">
      <div className="navbar bg-base-100">
        <a className="btn btn-ghost normal-case text-xl">smtool</a>
      </div>

      <textarea className="textarea textarea-bordered" placeholder="Bio"></textarea>

      <div>
        <button className="btn btn-primary" onClick={handleClick}>
          Generate error
        </button>
      </div>
    </div>
  )
}

export default App
