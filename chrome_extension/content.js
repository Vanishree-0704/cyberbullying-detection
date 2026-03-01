console.log("CyberGuard Active: Protecting your Instagram experience.");

const API_ENDPOINT = "http://localhost:8000/api/v1/analyze";

// Function to scan and hide toxic comments
async function scanComments() {
    // Instagram comments are often inside specific spans or divs
    const commentSelectors = 'span._ap30, div._a9zs span';
    const comments = document.querySelectorAll(commentSelectors);

    for (let comment of comments) {
        if (comment.dataset.scanned) continue;
        comment.dataset.scanned = "true";

        const text = comment.innerText;
        if (text.length < 3) continue;

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, user_handle: "ig_external" })
            });
            const data = await response.json();

            if (data.is_toxic) {
                console.warn("CyberGuard: Flagged toxic comment ->", text);
                applyProtection(comment, data.categories);
            }
        } catch (e) {
            console.error("CyberGuard Service Offline. Run your FastAPI backend!");
        }
    }
}

function applyProtection(element, categories) {
    element.style.filter = "blur(8px)";
    element.style.opacity = "0.4";
    element.title = "CyberGuard: This comment was hidden because it contains " + categories.join(', ');

    // Add a small shield badge
    const badge = document.createElement("span");
    badge.innerText = " 🛡️ [CyberGuard Protected]";
    badge.style.fontSize = "10px";
    badge.style.color = "red";
    badge.style.fontWeight = "bold";
    element.parentNode.appendChild(badge);
}

// Observe for new comments (dynamic loading)
const observer = new MutationObserver((mutations) => {
    scanComments();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial scan
scanComments();
