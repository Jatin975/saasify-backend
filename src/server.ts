import express, {Application, Request, Response} from 'express';

const app: Application = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', (req: Request, res: Response)=>{
    res.status(200).json({
        status: "success",
        message: "SaasSify server is health and running",
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, ()=>{
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
})