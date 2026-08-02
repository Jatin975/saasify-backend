import express, { Application, Request, Response } from "express";
import prisma from "./config/db";

const app: Application = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/health", async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`
    console.log(`query res ${JSON.stringify(result)}`);

    res.status(200).json({
      status: "success",
      message: "SaasSify server is health and running",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
