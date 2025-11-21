let allLinks = [];
const BASE_URL = window.location.origin;

document.addEventListener("DOMContentLoaded", () => {
    loadLinks();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById("addLinkForm").addEventListener("submit", handleFormSubmit);

    let searchTimeout;
    document.getElementById("searchInput").addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => handleSearch(e), 200);
    });

    document.getElementById("customCode").addEventListener("input", (e) => {
        const val = e.target.value;
        const err = document.getElementById("codeError");

        if (val && !/^[A-Za-z0-9]{0,8}$/.test(val)) {
            err.textContent = "Only alphanumeric characters allowed";
        } else if (val && val.length < 6) {
            err.textContent = "Minimum 6 characters required";
        } else {
            err.textContent = "";
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    const urlError = document.getElementById("urlError");
    const codeError = document.getElementById("codeError");
    const successMessage = document.getElementById("successMessage");

    urlError.textContent = "";
    codeError.textContent = "";
    successMessage.style.display = "none";

    const targetUrl = document.getElementById("targetUrl").value.trim();
    const customCode = document.getElementById("customCode").value.trim();

    if (!isValidUrl(targetUrl)) {
        urlError.textContent = "Please enter a valid URL (must start with http:// or https://)";
        return;
    }

    if (customCode && !/^[A-Za-z0-9]{6,8}$/.test(customCode)) {
        codeError.textContent = "Code must be 6-8 alphanumeric characters";
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating...";

    try {
        const res = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                target_url: targetUrl,
                code: customCode || undefined
            })
        });

        const data = await res.json();

        if (!res.ok) {
            if (res.status === 409) codeError.textContent = "Code already exists";
            else urlError.textContent = data.error || "Failed to create link";
            return;
        }

        // Success toasted message
        showToast("Link created successfully!");

        const shortUrl = `${BASE_URL}/${data.code}`;
        document.getElementById("shortUrlDisplay").value = shortUrl;
        successMessage.style.display = "block";

        document.getElementById("addLinkForm").reset();
        loadLinks();
    } catch (err) {
        urlError.textContent = "Network error. Try again.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Short Link";
    }
}

async function loadLinks() {
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const tableContainer = document.getElementById("tableContainer");

    loadingState.style.display = "block";
    emptyState.style.display = "none";
    tableContainer.style.display = "none";

    try {
        const res = await fetch("/api/links");
        allLinks = await res.json();

        loadingState.style.display = "none";

        if (allLinks.length === 0) {
            emptyState.style.display = "block";
        } else {
            tableContainer.style.display = "block";
            renderLinks(allLinks);
        }
    } catch (err) {
        loadingState.innerHTML = `<p style="color:red;">Error fetching data</p>`;
    }
}

function renderLinks(list) {
    const tbody = document.getElementById("linksTableBody");
    tbody.innerHTML = "";

    list.forEach((link) => {
        const row = createLinkRow(link);
        tbody.appendChild(row);
    });
}

function createLinkRow(link) {
    const tr = document.createElement("tr");

    const shortUrl = `${BASE_URL}/${link.code}`;
    const lastClicked = link.last_clicked ? new Date(link.last_clicked).toLocaleString() : "Never";
    const created = new Date(link.created_at).toLocaleString();

    tr.innerHTML = `
        <td class="code-cell">${escapeHtml(link.code)}</td>
        <td class="url-cell" title="${escapeHtml(link.target_url)}">
            <a href="${escapeHtml(link.target_url)}" target="_blank">
                ${escapeHtml(truncateUrl(link.target_url, 40))}
            </a>
        </td>
        <td>${link.clicks}</td>
        <td>${lastClicked}</td>
        <td>${created}</td>
        <td>
            <div class="actions-cell">
                <button onclick="copyToClipboard('${shortUrl}')" class="btn btn-secondary btn-small">Copy</button>
                <a href="/code/${escapeHtml(link.code)}" class="btn btn-primary btn-small">Stats</a>
                <button onclick="deleteLink('${escapeHtml(link.code)}')" class="btn btn-danger btn-small">Delete</button>
            </div>
        </td>
    `;

    return tr;
}

function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    const filtered = allLinks.filter(
        (l) => l.code.toLowerCase().includes(q) || l.target_url.toLowerCase().includes(q)
    );

    renderLinks(filtered);

    const emptyState = document.getElementById("emptyState");
    const tableContainer = document.getElementById("tableContainer");

    if (filtered.length === 0) {
        tableContainer.style.display = "none";
        emptyState.style.display = "block";
        emptyState.innerHTML = "<p>No links match your search.</p>";
    } else {
        emptyState.style.display = "none";
        tableContainer.style.display = "block";
    }
}

async function deleteLink(code) {
    if (!confirm(`Delete link "${code}"?`)) return;

    try {
        const res = await fetch(`/api/links/${code}`, { method: "DELETE" });

        if (!res.ok) return showToast("Failed to delete link", true);

        showToast("Link deleted!");
        loadLinks();
    } catch {
        showToast("Network error", true);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast("Copied!"));
}

function copyShortUrl() {
    const input = document.getElementById("shortUrlDisplay");
    input.select();
    navigator.clipboard.writeText(input.value).then(() => showToast("Copied!"));
}

/* Helpers */
function isValidUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
function escapeHtml(t) {
    const div = document.createElement("div");
    div.textContent = t;
    return div.innerHTML;
}
function truncateUrl(url, max) {
    return url.length <= max ? url : url.slice(0, max) + "...";
}

/* 🔥 Toast for non-blocking feedback */
function showToast(msg, isError = false) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.position = "fixed";
    toast.style.bottom = "25px";
    toast.style.right = "25px";
    toast.style.background = isError ? "#ef4444" : "#10b981";
    toast.style.color = "white";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.style.zIndex = 9999;
    toast.style.fontWeight = "600";
    toast.style.opacity = "0";
    toast.style.transition = "opacity .2s, transform .2s";
    toast.style.transform = "translateY(6px)";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = 1;
        toast.style.transform = "translateY(0)";
    }, 10);

    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = "translateY(6px)";
        setTimeout(() => toast.remove(), 200);
    }, 2500);
}
