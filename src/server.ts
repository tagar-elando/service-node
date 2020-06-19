import app from "./app";
import cors from "cors";

const corsOptions = {
  origin: process.env.ALLOWED_CLIENT || "*",
  optionsSuccessStatus: 200,
};

app.app.use(cors(corsOptions));

app.server.listen(8080, function () {
  console.log(`App is running on port 8080!`);
});
