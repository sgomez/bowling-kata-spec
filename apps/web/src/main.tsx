import { render } from "preact";
import { Home } from "./home.js";
import "./styles.css";

const root = document.getElementById("app");
if (root) {
  render(<Home />, root);
}
