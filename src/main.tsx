import { render } from "solid-js/web";
import "styles/index.css";
import App from "./App";

const root = document.getElementById("root")!;

render(() => <App />, root);

// ReactDOM.createRoot(root).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

postMessage({ payload: "removeLoading" }, "*");
