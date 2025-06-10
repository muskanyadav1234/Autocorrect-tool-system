
// Initialize state
let correctionHistory = [];
let lastText = '';

// Word count functionality
function updateWordCount() {
    try {
        const text = document.getElementById('inputText').value;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
        
        document.getElementById('wordCount').textContent = words.length;
        document.getElementById('charCount').textContent = text.length;
        document.getElementById('sentenceCount').textContent = sentences.length;
    } catch (error) {
        console.error('Word count error:', error);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} glass-effect`;
    notification.textContent = message;
    
    // Add icon based on type
    const icon = document.createElement('i');
    icon.className = `fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          'info-circle'}`;
    notification.prepend(icon);
    
    document.body.appendChild(notification);
    
    // Animate and remove
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Theme management
const themes = {
    light: {
        '--bg-color': '#f8fafc',
        '--text-color': '#1e293b',
        '--glass-bg': 'rgba(255, 255, 255, 0.8)',
        '--glass-border': 'rgba(255, 255, 255, 0.2)'
    },
    dark: {
        '--bg-color': '#0f172a',
        '--text-color': '#f1f5f9',
        '--glass-bg': 'rgba(30, 41, 59, 0.8)',
        '--glass-border': 'rgba(255, 255, 255, 0.1)'
    },
    nature: {
        '--bg-color': '#f0fdf4',
        '--primary-color': '#16a34a',
        '--secondary-color': '#15803d',
        '--accent-color': '#22c55e'
    },
    warm: {
        '--bg-color': '#fff7ed',
        '--primary-color': '#f97316',
        '--secondary-color': '#ea580c',
        '--accent-color': '#fb923c'
    }
};

function initializeThemeSwitcher() {
    try {
        const themeOptions = document.querySelectorAll('.theme-option');
        
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                applyTheme(theme);
                
                // Update active state
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Save preference
                localStorage.setItem('preferred-theme', theme);
                showNotification(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied`, 'success');
            });
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('preferred-theme');
        if (savedTheme) {
            applyTheme(savedTheme);
            document.querySelector(`[data-theme="${savedTheme}"]`).classList.add('active');
        }
    } catch (error) {
        console.error('Theme switcher error:', error);
        showNotification('Failed to initialize theme switcher', 'error');
    }
}

function applyTheme(themeName) {
    try {
        const theme = themes[themeName];
        if (!theme) {
            throw new Error('Theme not found');
        }
        
        document.documentElement.setAttribute('data-theme', themeName);
        for (const [property, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(property, value);
        }
    } catch (error) {
        console.error('Theme application error:', error);
        showNotification('Failed to apply theme', 'error');
    }
}

// Autocorrect functionality
function autocorrect(text) {
    const commonMistakes = {
        'teh': 'the',
        'recieve': 'receive',
        'theif': 'thief',
        'seperate': 'separate',
        'occured': 'occurred',
        'ur': 'your',
        'dont': "don't",
        'cant': "can't",
        'wont': "won't",
        'im': "I'm",
        'iam': "I am",
        'wanna': "want to",
        'gonna': "going to",
        'shouldnt': "shouldn't",
        'wouldnt': "wouldn't",
        'couldnt': "couldn't",
        'wasnt': "wasn't",
        'didnt': "didn't",
        'isnt': "isn't",
        'arent': "aren't"
    };
    
    let correctedText = text;
    let corrections = 0;
    let suggestions = [];
    
    // Split text into words
    let words = text.split(/(\s+)/);
    
    // Process each word
    for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        if (commonMistakes[word]) {
            suggestions.push({
                original: words[i],
                corrected: commonMistakes[word],
                context: words.slice(Math.max(0, i-3), Math.min(words.length, i+4)).join('')
            });
            words[i] = commonMistakes[word];
            corrections++;
        }
    }
    
    correctedText = words.join('');
    return { text: correctedText, corrections, suggestions };
}

// Enhanced UI initialization
function initializeUI() {
    try {
        const inputText = document.getElementById('inputText');
        const correctBtn = document.getElementById('correctBtn');
        
        if (!inputText || !correctBtn) {
            throw new Error('Required elements not found');
        }
        
        // Initialize word count
        inputText.addEventListener('input', updateWordCount);
        
        // Initialize toolbar buttons
        document.querySelector('[data-action="copy"]').addEventListener('click', () => {
            navigator.clipboard.writeText(inputText.value);
            showNotification('Text copied to clipboard!', 'success');
        });
        
        document.querySelector('[data-action="paste"]').addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                inputText.value = text;
                updateWordCount();
                showNotification('Text pasted successfully!', 'success');
            } catch (err) {
                showNotification('Failed to paste text. Please try manually.', 'error');
            }
        });
        
        document.querySelector('[data-action="undo"]').addEventListener('click', () => {
            document.execCommand('undo');
            updateWordCount();
        });
        
        document.querySelector('[data-action="clear"]').addEventListener('click', () => {
            inputText.value = '';
            document.getElementById('outputText').innerHTML = '';
            document.getElementById('wordCount').textContent = '0';
            document.getElementById('charCount').textContent = '0';
            document.getElementById('correctionCount').textContent = '0';
            document.getElementById('processTime').textContent = '0.0s';
            document.getElementById('accuracy').textContent = '100%';
            document.getElementById('suggestionsList').innerHTML = '';
            showNotification('Editor cleared', 'info');
        });
        
        // Initialize autocorrect button
        correctBtn.addEventListener('click', () => {
            const startTime = performance.now();
            const text = inputText.value;
            
            if (!text.trim()) {
                showNotification('Please enter some text to correct', 'error');
                return;
            }
            
            const { text: correctedText, corrections, suggestions } = autocorrect(text);
            const endTime = performance.now();
            const processTime = ((endTime - startTime) / 1000).toFixed(2);
            
            // Update output
            document.getElementById('outputText').textContent = correctedText;
            document.getElementById('correctionCount').textContent = corrections;
            document.getElementById('processTime').textContent = processTime + 's';
            document.getElementById('accuracy').textContent = 
                Math.round((text.length - corrections) / text.length * 100) + '%';
            
            // Update suggestions panel
            const suggestionsList = document.getElementById('suggestionsList');
            suggestionsList.innerHTML = '';
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `
                    <span class="original">${suggestion.original}</span>
                    <span class="arrow">→</span>
                    <span class="corrected">${suggestion.corrected}</span>
                `;
                suggestionsList.appendChild(item);
            });
            
            // Add to history
            addToHistory(text, correctedText);
            
            if (corrections > 0) {
                showNotification(`Corrected ${corrections} mistake${corrections === 1 ? '' : 's'}!`, 'success');
            } else {
                showNotification('No corrections needed!', 'info');
            }
        });
        
        // Initialize premium features
        document.querySelectorAll('.premium-feature').forEach(btn => {
            btn.addEventListener('click', () => {
                showNotification('This is a premium feature. Upgrade to access!', 'info');
            });
        });
        
        // Initialize theme switcher
        initializeThemeSwitcher();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize the editor', 'error');
    }
}

// History management
function addToHistory(original, corrected) {
    const timestamp = new Date().toLocaleString();
    correctionHistory.unshift({ original, corrected, timestamp });
    
    // Limit history to 5 items
    if (correctionHistory.length > 5) correctionHistory.pop();
    
    // Update history panel
    updateHistoryPanel();
}

function updateHistoryPanel() {
    try {
        const historyList = document.querySelector('.history-list');
        if (!historyList) {
            throw new Error('History list element not found');
        }
        
        historyList.innerHTML = '';
        
        correctionHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <div class="history-details">
                    <span class="history-title">Document ${index + 1}</span>
                    <span class="history-date">${item.timestamp}</span>
                </div>
            `;
            
            historyItem.addEventListener('click', () => {
                document.getElementById('inputText').value = item.original;
                document.getElementById('outputText').textContent = item.corrected;
                updateWordCount();
            });
            
            historyList.appendChild(historyItem);
        });
    } catch (error) {
        console.error('History panel update error:', error);
        showNotification('Failed to update history panel', 'error');
    }
}

// Export functionality
document.getElementById('downloadBtn').addEventListener('click', () => {
    const text = document.getElementById('outputText').textContent;
    if (!text) {
        showNotification('No text to export', 'error');
        return;
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corrected-text.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showNotification('Text exported successfully!', 'success');
});

// Share functionality
document.getElementById('shareBtn').addEventListener('click', async () => {
    const text = document.getElementById('outputText').textContent;
    if (!text) {
        showNotification('No text to share', 'error');
        return;
    }
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Corrected Text',
                text: text
            });
            showNotification('Shared successfully!', 'success');
        } catch (err) {
            showNotification('Failed to share', 'error');
        }
    } else {
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(text);
        showNotification('Text copied to clipboard!', 'success');
    }
});

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUI);