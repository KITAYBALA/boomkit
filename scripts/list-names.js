const apiKey = "AIzaSyBJcKB1BFqEIlcL8VGJ-q6BKFvBLB8jXmc";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function run() {
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.models) {
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models found:", data);
        }
    } catch (err) {
        console.error(err);
    }
}
run();
