const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;  
const WINDOW_SIZE = 10;

const numberWindows = {
    'primes': [], // prime numbers
    'fibo': [], // fibonacci numbers
    'e': [], // even numbers
    'rand': []  // random numbers
};

const fetchNumbers = async (numberid) => {
    const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE4MjYxNDA4LCJpYXQiOjE3MTgyNjExMDgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjY5MjE4ZmQ3LTc1MDMtNGRhMi1hMGY0LWJlNjAwZmVhZDdjYiIsInN1YiI6IjIxMDAwMzE5OTNjc2VoQGdtYWlsLmNvbSJ9LCJjb21wYW55TmFtZSI6IktMIFVuaXZlcnNpdHkiLCJjbGllbnRJRCI6IjY5MjE4ZmQ3LTc1MDMtNGRhMi1hMGY0LWJlNjAwZmVhZDdjYiIsImNsaWVudFNlY3JldCI6IkxRZVdJdHpwS2RXQVhlQ3EiLCJvd25lck5hbWUiOiJIYXJpa2EgQ2hpbm1heSIsIm93bmVyRW1haWwiOiIyMTAwMDMxOTkzY3NlaEBnbWFpbC5jb20iLCJyb2xsTm8iOiIyMTAwMDMxOTkzIn0.Phw-cCMiK642_-esi-5vGQnNGPy0AySRU6yvKSDzzDU'; // Replace with your actual token

    const options = {
        headers: {
            'Authorization': token
        }
    };

    try {
        console.log(`Fetching numbers for ${numberid} from external server...`);

        const response = await axios.get(`http://20.244.56.144/numbers/${numberid}`, options);

        console.log(`Received response for ${numberid}:`, response.data);
        
        return response.data.numbers;
    } catch (error) {
        console.error(`Error fetching ${numberid} numbers:`, error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        return [];
    }
};


app.get('/numbers/:numberid', async (req, res) => {
    const numberid = req.params.numberid;
    console.log(`Received request for /numbers/${numberid}`);

    if (!numberWindows[numberid]) {
        console.log(`Invalid numberid: ${numberid}`);
        return res.status(400).json({ error: 'Invalid numberid' });
    }

    try {
        const window = numberWindows[numberid];
        const previousState = [...window];
        const newNumbers = await fetchNumbers(numberid);

        if (newNumbers.length === 0) {
            console.log('No numbers received');
            return res.status(500).json({ error: 'No numbers received' });
        }

        newNumbers.forEach(num => {
            if (!window.includes(num)) {
                if (window.length >= WINDOW_SIZE) {
                    window.shift();
                }
                window.push(num);
            }
        });

        const avg = window.reduce((acc, val) => acc + val, 0) / window.length;

        const response = {
            numbers: newNumbers,
            windowPrevState: previousState,
            windowCurrState: window,
            avg: avg
        };

        return res.json(response);

    } catch (error) {
        console.error('Error in /numbers/:numberid route:', error);
        return res.status(500).json({ error: 'Error fetching numbers' });
    }
});


app.get('/test/:numberid', async (req, res) => {
    const numberid = req.params.numberid;
    console.log(`Received request for /test/${numberid}`);

 
    const testMap = {
        'even': 'e',
        'primes': 'primes',
        'fibo': 'fibo',
        'rand': 'rand'
    };

    const mappedNumberId = testMap[numberid];

    if (!numberWindows[mappedNumberId]) {
        console.log(`Invalid numberid: ${numberid}`);
        return res.status(400).json({ error: 'Invalid numberid' });
    }

    try {
        const newNumbers = await fetchNumbers(mappedNumberId);

        if (newNumbers.length === 0) {
            console.log('No numbers received');
            return res.status(500).json({ error: 'No numbers received' });
        }

        console.log(`Fetched numbers for /test/${numberid}: ${newNumbers}`);
        return res.json({ numbers: newNumbers });

    } catch (error) {
        console.error('Error in /test/:numberid route:', error);
        return res.status(500).json({ error: 'Error fetching numbers' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


process.on('uncaughtException', (err) => {
    console.error('There was an uncaught exception:', err);
    process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1); 
});
