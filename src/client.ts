import * as fs from 'fs';
import pidusage from 'pidusage';

interface ClientData {
  userId: string;
  cpu: number;
  timestamp: number;
}

//function to get and send data to the server
const collectStatus = async (pid: number) => {
  const { cpu, timestamp } = await pidusage(pid);
  console.log('cpu usage:', cpu, 'timestamp:', timestamp);
  // data waiting to send
  const data: ClientData = {
    userId: 'hereIsTheClientId',
    cpu,
    timestamp,
  };
  sendData(data);
};

//function to send data to the server (maybe use protobuf to format data if resources are really tight, but for now JSON is fine)
async function sendData(clientData: ClientData) {
  try {
    const response = await fetch('http://localhost:3000/cpu-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Data sent successfully');
    return response.ok;
  } catch (error) {
    console.error('Failed to send data, caching data');

    await cacheData(clientData);
  }
}

// function to cache data
async function cacheData(data) {
  const filePath = 'failed_transfers.json';
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([data], null, 2));
    return;
  }
  try {
    // Read the existing data from the file
    const fileData = await fs.promises.readFile(filePath, 'utf8');
    const dataToCache = JSON.parse(fileData);
    dataToCache.push(data);

    // Write the updated data back to the file
    await fs.promises.writeFile(filePath, JSON.stringify(dataToCache, null, 2));
    console.log('Data cached successfully');
  } catch (err) {
    console.error('Failed to cache data:', err);
  }
}

// function to send cached data and clear cache
async function resendCachedData() {
  const filePath = 'failed_transfers.json';
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileData = await fs.promises.readFile(filePath, 'utf8');
  const cachedData = JSON.parse(fileData);
  if (!cachedData.length) {
    return;
  }

  for (let i = 0; i < cachedData.length; ) {
    const data = cachedData[i];
    const success = await sendData(data);

    if (success) {
      cachedData.splice(i, 1); // Remove successfully sent data
    } else {
      i++; // Move to next if failed to resend
    }
  }

  // Update the cache file
  await fs.promises.writeFile(filePath, JSON.stringify(cachedData, null, 2));
}

collectStatus(process.pid);
// send data to server every 30 mins
setInterval(() => collectStatus(process.pid), 30 * 60 * 1000);

// resend cached data every some time (need to avoid operating on the cache file at the same time)
setInterval(() => resendCachedData(), 2 * 60 * 60 * 1000);
