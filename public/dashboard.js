let allLinks = [];
const BASE_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    loadLinks();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('addLinkForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    const codeInput = document.getElementById('customCode');
    codeInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const errorEl = document.getElementById('codeError');
        
        if (value && !/^[A-Za-z0-9]{0,8}$/.test(value)) {
            errorEl.textContent = 'Only alphanumeric characters allowed';
        } else if (value && value.length < 6) {
            errorEl.textContent = 'Minimum 6 characters required';
        } else {
            errorEl.textContent = '';
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const urlError = document.getElementById('urlError');
    const codeError = document.getElementById('codeError');
    const successMessage = document.getElementById('successMessage');
    
    urlError.textContent = '';
    codeError.textContent = '';
    successMessage.style.display = 'none';
    
    const targetUrl = document.getElementById('targetUrl').value.trim();
    const customCode = document.getElementById('customCode').value.trim();
    
    if (!isValidUrl(targetUrl)) {
        urlError.textContent = 'Please enter a valid URL (must start with http:// or https://)';
        return;
    }
    
    if (customCode && !/^[A-Za-z0-9]{6,8}$/.test(customCode)) {
        codeError.textContent = 'Code must be 6-8 alphanumeric characters';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    try {
        const response = await fetch('/api/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target_url: targetUrl,
                code: customCode || undefined
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 409) {
                codeError.textContent = 'This code is already taken. Please choose another.';
            } else {
                urlError.textContent = data.error || 'Failed to create link';
            }
            return;
        }
        
        const shortUrl = `${BASE_URL}/${data.code}`;
        document.getElementById('shortUrlDisplay').value = shortUrl;
        successMessage.style.display = 'block';
        
        document.getElementById('addLinkForm').reset();
        loadLinks();
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 10000);
        
    } catch (error) {
        console.error('Error creating link:', error);
        urlError.textContent = 'Network error. Please try again.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Short Link';
    }
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

async function loadLinks() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');
    
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    tableContainer.style.display = 'none';
    
    try {
        const response = await fetch('/api/links');
        const links = await response.json();
        
        allLinks = links;
        
        loadingState.style.display = 'none';
        
        if (links.length === 0) {
            emptyState.style.display = 'block';
        } else {
            tableContainer.style.display = 'block';
            renderLinks(links);
        }
    } catch (error) {
        console.error('Error loading links:', error);
        loadingState.innerHTML = '<p style="color: red;">Error loading links. Please refresh the page.</p>';
    }
}

function renderLinks(links) {
    const tbody = document.getElementById('linksTableBody');
    tbody.innerHTML = '';
    
    links.forEach(link => {
        const row = createLinkRow(link);
        tbody.appendChild(row);
    });
}

function createLinkRow(link) {
    const tr = document.createElement('tr');
    
    const shortUrl = `${BASE_URL}/${link.code}`;
    const lastClicked = link.last_clicked 
        ? new Date(link.last_clicked).toLocaleString()
        : 'Never';
    const created = new Date(link.created_at).toLocaleString();
    
    tr.innerHTML = `
        <td class="code-cell">${escapeHtml(link.code)}</td>
        <td class="url-cell" title="${escapeHtml(link.target_url)}">
            <a href="${escapeHtml(link.target_url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(truncateUrl(link.target_url, 40))}
            </a>
        </td>
        <td>${link.clicks}</td>
        <td>${lastClicked}</td>
        <td>${created}</td>
        <td>
            <div class="actions-cell">
                <button onclick="copyToClipboard('${shortUrl}')" class="btn btn-secondary btn-small">
                    Copy
                </button>
                <a href="/code/${escapeHtml(link.code)}" class="btn btn-primary btn-small">
                    Stats
                </a>
                <button onclick="deleteLink('${escapeHtml(link.code)}')" class="btn btn-danger btn-small">
                    Delete
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    const filteredLinks = allLinks.filter(link => {
        return link.code.toLowerCase().includes(searchTerm) ||
               link.target_url.toLowerCase().includes(searchTerm);
    });
    
    renderLinks(filteredLinks);
    
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');
    
    if (filteredLinks.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<p>No links match your search.</p>';
    } else {
        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';
    }
}

async function deleteLink(code) {
    if (!confirm(`Are you sure you want to delete the link "${code}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/links/${code}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            alert('Failed to delete link');
            return;
        }
        
        loadLinks();
    } catch (error) {
        console.error('Error deleting link:', error);
        alert('Network error. Please try again.');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

function copyShortUrl() {
    const input = document.getElementById('shortUrlDisplay');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        alert('Copied to clipboard!');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}