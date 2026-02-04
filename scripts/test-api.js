async function testApi() {
    const payload = {
        prompt: "Counting by 10s",
        grade: 1,
        subject: "Math",
        count: 5
    };

    try {
        const response = await fetch("http://localhost:3000/api/generate-set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testApi();
