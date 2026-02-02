class TextReader {
    private speechSynthesis: SpeechSynthesis;
    private utterance: SpeechSynthesisUtterance | null = null;
    private currentText: string = '';
    private currentElement: HTMLElement | null = null;
    private charIndex: number = 0; // Tracks the current character index for progress
    private isPaused: boolean = false;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
        } else {
            console.error('SpeechSynthesis API is not supported in this browser.');
            // Provide a fallback or throw an error if necessary
            this.speechSynthesis = {} as SpeechSynthesis; // Dummy object to prevent further errors
        }
    }

    private initializeUtterance(text: string): void {
        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.onend = () => {
            console.log('Speech finished.');
            this.resetState();
        };
        this.utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            this.resetState();
        };
        this.utterance.onboundary = (event) => {
            if (event.name === 'word') {
                this.charIndex = event.charIndex;
            }
        };
    }

    private resetState(): void {
        this.currentText = '';
        this.currentElement = null;
        this.utterance = null;
        this.charIndex = 0;
        this.isPaused = false;
    }

    public speak(source: string | HTMLElement): void {
        if (!this.speechSynthesis || !('speak' in this.speechSynthesis)) {
            console.error('SpeechSynthesis is not available.');
            return;
        }

        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel(); // Stop any ongoing speech
            this.resetState();
        }

        if (typeof source === 'string') {
            this.currentText = source;
        } else if (source instanceof HTMLElement) {
            this.currentElement = source;
            this.currentText = source.innerText || source.textContent || '';
        } else {
            console.error('Invalid source type. Must be a string or HTMLElement.');
            return;
        }

        if (!this.currentText.trim()) {
            console.warn('No text to speak.');
            return;
        }

        this.initializeUtterance(this.currentText);
        if (this.utterance) {
            this.speechSynthesis.speak(this.utterance);
            this.isPaused = false;
        }
    }

    public pause(): void {
        if (this.speechSynthesis && this.speechSynthesis.speaking && !this.isPaused) {
            this.speechSynthesis.pause();
            this.isPaused = true;
            console.log('Speech paused.');
        }
    }

    public resume(): void {
        if (this.speechSynthesis && this.speechSynthesis.paused && this.isPaused) {
            this.speechSynthesis.resume();
            this.isPaused = false;
            console.log('Speech resumed.');
        }
    }

    public reset(): void {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        this.resetState();
        console.log('Speech reset.');
    }

    public get progress(): number {
        if (!this.currentText || !this.utterance || !this.speechSynthesis.speaking) {
            return 0;
        }
        // A more accurate progress might require tracking words or sentences.
        // For simplicity, this uses charIndex if available, otherwise a rough estimate.
        // The 'boundary' event with charIndex is the most reliable for detailed progress.
        return this.currentText.length > 0 ? (this.charIndex / this.currentText.length) * 100 : 0;
    }

    public get isSpeaking(): boolean {
        return this.speechSynthesis ? this.speechSynthesis.speaking : false;
    }

    public getVolume(): number {
        return this.utterance ? this.utterance.volume * 100 : 100; // Volume is 0-1, return as 0-100
    }

    public setVolume(volume: number): void {
        if (this.utterance) {
            this.utterance.volume = Math.max(0, Math.min(1, volume / 100)); // Ensure volume is between 0 and 1
        } else {
            console.warn('Utterance not initialized. Speak some text first to set volume.');
        }
    }

    public getRate(): number {
        return this.utterance ? this.utterance.rate : 1; // Rate is 0.1-10
    }

    public setRate(rate: number): void {
        if (this.utterance) {
            this.utterance.rate = Math.max(0.1, Math.min(10, rate)); // Ensure rate is within valid range
        } else {
            console.warn('Utterance not initialized. Speak some text first to set rate.');
        }
    }

    public getVoice(): SpeechSynthesisVoice | null {
        return this.utterance ? this.utterance.voice : null;
    }

    public setVoice(voice: SpeechSynthesisVoice): void {
        if (this.utterance) {
            this.utterance.voice = voice;
        } else {
            console.warn('Utterance not initialized. Speak some text first to set voice.');
        }
    }

    public getAvailableVoices(): SpeechSynthesisVoice[] {
        return this.speechSynthesis ? this.speechSynthesis.getVoices() : [];
    }
}

// Example Usage (uncomment to test in a browser environment):
/*
document.addEventListener('DOMContentLoaded', () => {
    const reader = new TextReader();
    const textToSpeak = "Hello world. This is a test of the text reader class.";
    const paragraphElement = document.getElementById('myParagraph'); // Assuming you have <p id="myParagraph">Some text</p>

    const speakButton = document.createElement('button');
    speakButton.textContent = 'Speak Text';
    speakButton.onclick = () => reader.speak(textToSpeak);
    document.body.appendChild(speakButton);

    if (paragraphElement) {
        const speakElementButton = document.createElement('button');
        speakElementButton.textContent = 'Speak from Element';
        speakElementButton.onclick = () => reader.speak(paragraphElement);
        document.body.appendChild(speakElementButton);
    }

    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause';
    pauseButton.onclick = () => reader.pause();
    document.body.appendChild(pauseButton);

    const resumeButton = document.createElement('button');
    resumeButton.textContent = 'Resume';
    resumeButton.onclick = () => reader.resume();
    document.body.appendChild(resumeButton);

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.onclick = () => reader.reset();
    document.body.appendChild(resetButton);

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = String(reader.getVolume());
    volumeSlider.oninput = (e) => reader.setVolume(Number((e.target as HTMLInputElement).value));
    document.body.appendChild(document.createTextNode('Volume: '));
    document.body.appendChild(volumeSlider);
    document.body.appendChild(document.createElement('br'));

    const rateSlider = document.createElement('input');
    rateSlider.type = 'range';
    rateSlider.min = '0.1';
    rateSlider.max = '2'; // Practical max, API supports up to 10
    rateSlider.step = '0.1';
    rateSlider.value = String(reader.getRate());
    rateSlider.oninput = (e) => reader.setRate(Number((e.target as HTMLInputElement).value));
    document.body.appendChild(document.createTextNode('Rate: '));
    document.body.appendChild(rateSlider);
    document.body.appendChild(document.createElement('br'));

    const progressDisplay = document.createElement('div');
    document.body.appendChild(progressDisplay);
    setInterval(() => {
        if (reader.isSpeaking) {
            progressDisplay.textContent = `Progress: ${reader.progress.toFixed(2)}%`;
        }
    }, 500);

    // Voice selection example
    const voices = reader.getAvailableVoices();
    if (voices.length > 0) {
        const voiceSelect = document.createElement('select');
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            voiceSelect.appendChild(option);
        });
        voiceSelect.onchange = (e) => {
            const selectedVoiceName = (e.target as HTMLSelectElement).value;
            const selectedVoice = voices.find(v => v.name === selectedVoiceName);
            if (selectedVoice) {
                reader.setVoice(selectedVoice);
            }
        };
        document.body.appendChild(document.createTextNode('Voice: '));
        document.body.appendChild(voiceSelect);
         // Set a default voice if needed, after voices are loaded
        // reader.setVoice(voices[0]);
    }
    // Note: getVoices() might return an empty list initially and populate asynchronously.
    // It's often better to listen for the 'voiceschanged' event on speechSynthesis.
    if (reader.speechSynthesis && 'onvoiceschanged' in reader.speechSynthesis) {
        reader.speechSynthesis.onvoiceschanged = () => {
            console.log('Voices changed, update UI if necessary');
            // You might want to re-populate the voiceSelect here
        };
    }
});
*/