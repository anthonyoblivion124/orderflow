import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { dailyPrintRouter } from "./routes/dailyPrint.js";

const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

app.use(healthRouter);
app.use("/api", dailyPrintRouter);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`OrderFlow backend listening on http://localhost:${env.port}`);
});
