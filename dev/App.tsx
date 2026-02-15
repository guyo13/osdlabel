import { render } from 'solid-js/web';

function App() {
  return <h1>Image Annotator — Dev</h1>;
}

const root = document.getElementById('app');
if (root) {
  render(() => <App />, root);
}
