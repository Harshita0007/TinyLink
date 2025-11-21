const BASE_URL = window.location.origin;
let currentLink = null;

document.addEventListener('DOMContentLoaded', () => {
    const code = getCodeFromPath();
    if (code) {
        loadLinkStats(code);
    } else {
        showError('Invalid link code');
    }
});

function getCodeFromPath() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

async function loadLinkStats(code) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const statsContainer = document.getElementById('statsContainer');
    
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    statsContainer.style.display = 'none';
    
    try {
        const response = await fetch(`/api/links/${code}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showError('Link not found');
            } else {
                showError('Failed to load link statistics');
            }
            return;
        }
        
        const link = await response.json();
        currentLink = link;
        
        loadingState.style.display = 'none';
        statsContainer.style.display = 'block';
        
        renderStats(link);
    } catch (error) {
        console.error('Error loading stats:', error);
        showError('Network error. Please try again.');
    }
}

function renderStats(link) {
    const shortUrl = `${BASE_URL}/${link.code}`;
    
    document.getElementById('statCode').textContent = link.code;
    document.getElementById('shortUrl').value = shortUrl;
    
    const targetUrlEl = document.getElementById('targetUrl');
    targetUrlEl.href = link.target_url;
    targetUrlEl.textContent = link.target_url;
    
    document.getElementById('statClicks').textContent = link.clicks;
    
    const lastClicked = link.last_clicked 
        ? formatDateTime(new Date(link.last_clicked))
        : 'Never';
    document.getElementById('statLastClicked').textContent = lastClicked;
    
    const created = formatDateTime(new Date(link.created_at));
    document.getElementById('statCreated').textContent = created;
    
    document.title = `Stats: ${link.code} - TinyLink`;
}

function showError(message) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const statsContainer = document.getElementById('statsContainer');
    
    loadingState.style.display = 'none';
    statsContainer.style.display = 'none';
    errorState.style.display = 'block';
    
    document.getElementById('errorMessage').textContent = message;
}

async function deleteLink() {
    if (!currentLink) return;
    
    const confirmMsg = `Are you sure you want to delete the link "${currentLink.code}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/links/${currentLink.code}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            alert('Failed to delete link');
            return;
        }
        
        alert('Link deleted successfully');
        window.location.href = '/';
    } catch (error) {
        console.error('Error deleting link:', error);
        alert('Network error. Please try again.');
    }
}

function copyUrl() {
    const input = document.getElementById('shortUrl');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}