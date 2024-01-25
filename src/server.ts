import os from 'os';
import cluster from 'cluster';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const port = 3000;

const prisma = new PrismaClient();

// use cluster module to create a worker for each CPU core
if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;

  for (let i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }
} else {
  const server = express();

  // Middleware to parse JSON requests
  server.use(express.json());

  server.get('/cpu-usage', (req, res) => {
    res.send('Hello from server!');
  });

  // Endpoint to receive CPU usage data
  server.post('/cpu-usage', async (req, res) => {
    const cpuData = req.body;
    console.log('Received CPU data:', cpuData);

    try {
      await prisma.data.create({
        data: {
          cpu: cpuData.cpu as number,
          timestamp: cpuData.timestamp.toString() as string,
          userId: cpuData.userId as string,
        },
      });
    } catch (error) {
      throw new Error(`Failed to save data: ${error}`);
    }

    res.status(200).send('CPU data uploaded successfully!');
  });

  // Starting the server
  server.listen(port, () => {
    console.log(`Worker ${process.pid} running on port ${port}`);
  });
}
