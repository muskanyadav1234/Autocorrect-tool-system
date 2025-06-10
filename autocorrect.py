import re
from collections import Counter
import string

class AutoCorrect:
    def __init__(self):
        self.word_counts = Counter()
        self.total_words = 0
        
    def train(self, text):
        """Train the autocorrect model with sample text"""
        words = self._tokenize(text.lower())
        self.word_counts.update(words)
        self.total_words = sum(self.word_counts.values())
    
    def _tokenize(self, text):
        """Convert text into tokens/words"""
        return re.findall(r'\w+', text)
    
    def _get_candidates(self, word):
        """Generate possible spelling corrections for a word"""
        letters = string.ascii_lowercase
        splits = [(word[:i], word[i:]) for i in range(len(word) + 1)]
        
        deletes = [L + R[1:] for L, R in splits if R]
        transposes = [L + R[1] + R[0] + R[2:] for L, R in splits if len(R) > 1]
        replaces = [L + c + R[1:] for L, R in splits if R for c in letters]
        inserts = [L + c + R for L, R in splits for c in letters]
        
        return set(deletes + transposes + replaces + inserts)
    
    def correct_word(self, word):
        """Correct a single word"""
        if word in self.word_counts:
            return word
        
        candidates = self._get_candidates(word)
        valid_candidates = [w for w in candidates if w in self.word_counts]
        
        if not valid_candidates:
            return word
            
        return max(valid_candidates, key=lambda w: self.word_counts[w])
    
    def correct_text(self, text):
        """Correct all words in a text"""
        words = self._tokenize(text)
        corrected_words = [self.correct_word(word.lower()) for word in words]
        
        # Preserve original capitalization
        for i, (orig, corr) in enumerate(zip(words, corrected_words)):
            if orig[0].isupper():
                corrected_words[i] = corr.capitalize()
                
        return ' '.join(corrected_words)
