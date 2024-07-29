import './App.css';
import LinePlot from './components/CustomGraph';

async function fetchData() {
  const response = await fetch('http://127.0.0.1:5000/data');
  const data = await response.json();
  console.log("Fetched data:", data);
  return data;
}

var data = await fetchData()

console.log("Hello!")

function App() {
  return (
    <div className="app">
      <h3>My Graph</h3>
      <div className="graph">
        <LinePlot data={data}/>
      </div>
    </div>
  );
}

export default App;
