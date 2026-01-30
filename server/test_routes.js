async function testEndpoints() {
    try {
        console.log("Testing GET /game/ ...");
        const url = 'http://localhost:8000/game/';
        const res = await fetch(url);
        console.log(`GET ${url} Status: ${res.status}`);
    } catch (error) {
        console.error(`GET Error: ${error.message}`);
    }

    try {
        console.log("Testing POST /game/submitResponse (without file) ...");
        const url = 'http://localhost:8000/game/submitResponse';
        const res = await fetch(url, { method: 'POST', body: JSON.stringify({}) });
        console.log(`POST ${url} Status: ${res.status}`);
    } catch (error) {
        console.error(`POST Error: ${error.message}`);
    }
}

testEndpoints();
