import app from "./app";
import cors from "cors";

const corsOptions = {
  origin: process.env.ALLOWED_CLIENT || "*",
  optionsSuccessStatus: 200,
};

app.app.use(cors(corsOptions));

app.app.get("/", function (req, res) {
  res.send("Hello World!");
});

const port = process.env.PORT || 8080;

app.server.listen(port, function () {
  console.log(`App is running on port ${port}!`);
});
