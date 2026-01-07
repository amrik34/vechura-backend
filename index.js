const express = require("express");
const app = express();
const port = 3200;
// app.use(express.json());
app.get("/", (req, res) => {
  res.send("hellp api");
});

// app.get("/", (req, res) => {
//   res.send("Hello, World!");
// });
app.listen(port, () => {
  console.log("server is running");
});

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });
