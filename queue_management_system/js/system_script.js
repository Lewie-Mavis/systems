// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const getTicketBtn = document.getElementById('getTicketBtn');
const downloadTicketBtn = document.getElementById('downloadTicketBtn');
const callNextBtn = document.getElementById('callNextBtn');
const callManualBtn = document.getElementById('callManualBtn');
const resetQueueBtn = document.getElementById('resetQueueBtn');
const makeAnnouncementBtn = document.getElementById('makeAnnouncementBtn');
const displayTicketNumber = document.getElementById('displayTicketNumber');
const displayDate = document.getElementById('displayDate');
const displayTime = document.getElementById('displayTime');
const displayQueue = document.getElementById('displayQueue');
const queueList = document.getElementById('queueList');
const counter1 = document.getElementById('counter1');
const counter2 = document.getElementById('counter2');
const counter3 = document.getElementById('counter3');
const announcementText = document.getElementById('announcementText');
const currentTimeElement = document.getElementById('currentTime');

// Application State
let queue = [];
let currentTicketNumber = 0;

// Voice synthesis variables
let speechSynthesisSupported = false;
let voicesLoaded = false;
let availableVoices = [];

// Initialize the application
function init() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    loadFromLocalStorage();
    renderQueue();
    updateCounterDisplays();
    
    // Initialize speech synthesis
    initializeSpeechSynthesis();
    
    // Set up event listeners
    setupEventListeners();
}

// Initialize speech synthesis
function initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        speechSynthesisSupported = true;
        console.log('Speech synthesis supported');
        
        // Load voices
        loadVoices();
        
        // Some browsers need this event to load voices
        speechSynthesis.onvoiceschanged = loadVoices;
    } else {
        console.log('Speech synthesis not supported in this browser');
        speechSynthesisSupported = false;
    }
}

// Load available voices
function loadVoices() {
    if (speechSynthesisSupported) {
        availableVoices = speechSynthesis.getVoices();
        voicesLoaded = availableVoices.length > 0;
        console.log('Available voices:', availableVoices.length);
        
        if (voicesLoaded) {
            console.log('Voices loaded successfully');
        } else {
            console.log('No voices available yet, will retry...');
            // Retry after a short delay
            setTimeout(loadVoices, 1000);
        }
    }
}

// Get a female voice
function getFemaleVoice() {
    if (!voicesLoaded) return null;
    
    // Prefer female voices
    const femaleVoices = availableVoices.filter(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') || // Windows
        voice.name.toLowerCase().includes('victoria') || // macOS
        voice.name.toLowerCase().includes('karen') || // Australian English
        voice.name.toLowerCase().includes('samantha') || // macOS
        voice.name.toLowerCase().includes('veena') || // Indian English
        voice.name.toLowerCase().includes('tessa') // South African English
    );
    
    if (femaleVoices.length > 0) {
        return femaleVoices[0];
    }
    
    // Fallback to any available voice
    return availableVoices.length > 0 ? availableVoices[0] : null;
}

// Real voice announcement using Web Speech API
function simulateVoiceAnnouncement(message) {
    console.log('Attempting voice announcement:', message);
    
    if (!speechSynthesisSupported) {
        console.log('Speech synthesis not supported - using fallback');
        showVisualAnnouncement(message);
        return;
    }
    
    if (!voicesLoaded) {
        console.log('Voices not loaded yet - retrying in 500ms');
        setTimeout(() => simulateVoiceAnnouncement(message), 500);
        return;
    }
    
    try {
        // Stop any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Configure voice settings
        utterance.rate = 0.85; // Slower for clarity
        utterance.pitch = 1.1; // Slightly higher for female-like voice
        utterance.volume = 1.0;
        
        // Get female voice
        const femaleVoice = getFemaleVoice();
        if (femaleVoice) {
            utterance.voice = femaleVoice;
            console.log('Using voice:', femaleVoice.name);
        } else {
            console.log('No female voice found, using default');
        }
        
        // Event handlers for debugging
        utterance.onstart = function() {
            console.log('Speech started');
            showVisualAnnouncement(message);
        };
        
        utterance.onend = function() {
            console.log('Speech ended');
        };
        
        utterance.onerror = function(event) {
            console.error('Speech error:', event.error);
            showVisualAnnouncement(message);
        };
        
        // Speak the message
        speechSynthesis.speak(utterance);
        
    } catch (error) {
        console.error('Error with speech synthesis:', error);
        showVisualAnnouncement(message);
    }
}

// Visual indicator for announcements
function showVisualAnnouncement(message) {
    const announcementBox = document.querySelector('.announcement-box');
    announcementText.textContent = message;
    
    // Add visual animation
    announcementBox.style.animation = 'none';
    setTimeout(() => {
        announcementBox.style.animation = 'pulse 1.5s ease';
        announcementBox.style.borderLeftColor = '#34a853'; // Green for called tickets
    }, 10);
    
    // Reset color after 5 seconds
    setTimeout(() => {
        announcementBox.style.borderLeftColor = '#fbbc05'; // Back to accent color
    }, 5000);
}

// Set up event listeners
function setupEventListeners() {
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Get new ticket
    getTicketBtn.addEventListener('click', generateNewTicket);

    // Print ticket
    downloadTicketBtn.addEventListener('click', printTicket);

    // Call next patient
    callNextBtn.addEventListener('click', callNextPatient);

    // Call manual ticket
    callManualBtn.addEventListener('click', callManualTicket);

    // Reset queue
    resetQueueBtn.addEventListener('click', resetQueue);

    // Make announcement
    makeAnnouncementBtn.addEventListener('click', makeAnnouncement);

    // Report buttons - FIXED: Changed to printReportBtn
    document.getElementById('generateReportBtn').addEventListener('click', generateDailyReport);
    document.getElementById('printReportBtn').addEventListener('click', printReport);
    document.getElementById('viewAnalyticsBtn').addEventListener('click', viewAnalytics);
}

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    currentTimeElement.textContent = `${dateString} | ${timeString}`;
}

// Generate a new ticket
function generateNewTicket() {
    currentTicketNumber++;
    const ticketNumber = `A${currentTicketNumber.toString().padStart(3, '0')}`;
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create ticket object
    const ticket = {
        number: ticketNumber,
        date: dateString,
        time: timeString,
        status: 'waiting',
        calledTo: null,
        timestamp: now.getTime()
    };
    
    // Add to queue
    queue.push(ticket);
    
    // Update display
    displayTicketNumber.textContent = ticketNumber;
    displayDate.textContent = dateString;
    displayTime.textContent = timeString;
    displayQueue.textContent = `Position: ${queue.length}`;
    
    // Enable print button
    downloadTicketBtn.disabled = false;
    
    // Render updated queue
    renderQueue();
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Show confirmation
    alert(`Ticket ${ticketNumber} generated successfully! Your position in queue is ${queue.length}.`);
}

// Print ticket function
function printTicket() {
    const ticketNumber = displayTicketNumber.textContent;
    const date = displayDate.textContent;
    const time = displayTime.textContent;
    const queuePosition = displayQueue.textContent.replace('Position: ', '');
    
    if (ticketNumber === '---') {
        alert('No ticket to print. Please generate a ticket first.');
        return;
    }
    
    // Create a print-friendly HTML content for the ticket
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Queue Ticket - ${ticketNumber}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px;
                    color: #333;
                    background: white;
                }
                .ticket { 
                    border: 3px solid #1a73e8; 
                    border-radius: 15px; 
                    padding: 30px; 
                    max-width: 500px; 
                    margin: 0 auto;
                    background: linear-gradient(135deg, #f5f7fa, #e4e8f0);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 25px; 
                    border-bottom: 2px solid #1a73e8;
                    padding-bottom: 15px;
                }
                .hospital-name { 
                    font-size: 28px; 
                    font-weight: bold; 
                    color: #1a73e8; 
                    margin-bottom: 5px;
                }
                .system-name { 
                    font-size: 16px; 
                    color: #666;
                    margin-bottom: 10px;
                }
                .ticket-number { 
                    font-size: 72px; 
                    font-weight: bold; 
                    color: #1a73e8; 
                    text-align: center; 
                    margin: 30px 0;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                }
                .barcode { 
                    text-align: center; 
                    margin: 25px 0; 
                    font-family: "Libre Barcode 128", monospace; 
                    font-size: 48px;
                    letter-spacing: 2px;
                }
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 15px; 
                    margin: 25px 0;
                }
                .info-item { 
                    text-align: center; 
                    padding: 12px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                }
                .info-label { 
                    font-size: 12px; 
                    color: #666; 
                    margin-bottom: 5px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .info-value { 
                    font-size: 16px; 
                    font-weight: bold; 
                    color: #333;
                }
                .instructions { 
                    text-align: center; 
                    margin-top: 30px; 
                    font-size: 14px; 
                    color: #666;
                    line-height: 1.5;
                    padding: 15px;
                    background: rgba(26, 115, 232, 0.1);
                    border-radius: 8px;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 25px; 
                    font-size: 12px; 
                    color: #999; 
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .ticket { box-shadow: none; border-width: 2px; }
                }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="header">
                    <div class="hospital-name">City General Hospital</div>
                    <div class="system-name">Queue Management System</div>
                </div>
                
                <div class="ticket-number">${ticketNumber}</div>
                
                <div class="barcode">*${ticketNumber}*</div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${date}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Time</div>
                        <div class="info-value">${time}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Queue Position</div>
                        <div class="info-value">${queuePosition}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Estimated Wait</div>
                        <div class="info-value">15-20 minutes</div>
                    </div>
                </div>
                
                <div class="instructions">
                    <strong>Please keep this ticket with you</strong><br>
                    Wait for your number to be called on the display screens<br>
                    Listen for voice announcements
                </div>
                
                <div class="footer">
                    <p>Thank you for choosing City General Hospital</p>
                    <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        // Optional: Close the window after printing
        // printWindow.afterprint = function() { printWindow.close(); };
    };
    
    alert('Opening print dialog for your ticket...');
}

// Call next patient in queue
function callNextPatient() {
    if (queue.length === 0) {
        alert('No patients in the queue.');
        return;
    }
    
    const counter = document.getElementById('counterSelect').value;
    const nextPatient = queue.find(ticket => ticket.status === 'waiting');
    
    if (!nextPatient) {
        alert('No waiting patients in the queue.');
        return;
    }
    
    // Update ticket status
    nextPatient.status = 'called';
    nextPatient.calledTo = counter;
    nextPatient.calledTime = new Date().toLocaleTimeString();
    
    // Render updated queue and counters
    renderQueue();
    updateCounterDisplays();
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Voice announcement
    const announcementMessage = `Ticket number ${nextPatient.number}, please proceed to ${counter}.`;
    simulateVoiceAnnouncement(announcementMessage);
    
    // Show confirmation
    alert(`Called ticket ${nextPatient.number} to ${counter}.`);
}

// Call a specific ticket manually - allows calling regardless of previous status
function callManualTicket() {
    const ticketNumber = document.getElementById('manualTicketInput').value.trim().toUpperCase();
    const counter = document.getElementById('manualCounterSelect').value;
    
    if (!ticketNumber) {
        alert('Please enter a ticket number.');
        return;
    }
    
    // Find the ticket
    const ticket = queue.find(t => t.number === ticketNumber);
    
    if (!ticket) {
        alert(`Ticket ${ticketNumber} not found in the queue.`);
        return;
    }
    
    // Check if ticket was already called
    const wasAlreadyCalled = ticket.status === 'called';
    
    // Update ticket status - always update even if already called
    ticket.status = 'called';
    ticket.calledTo = counter;
    ticket.calledTime = new Date().toLocaleTimeString();
    
    // Render updated queue and counters
    renderQueue();
    updateCounterDisplays();
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Voice announcement
    const announcementMessage = `Ticket number ${ticket.number}, please proceed to ${counter}.`;
    simulateVoiceAnnouncement(announcementMessage);
    
    // Show appropriate confirmation message
    if (wasAlreadyCalled) {
        alert(`Re-called ticket ${ticket.number} to ${counter}. This ticket was already called before.`);
    } else {
        alert(`Called ticket ${ticket.number} to ${counter}.`);
    }
    
    // Clear input
    document.getElementById('manualTicketInput').value = '';
}

// Reset the entire queue
function resetQueue() {
    if (confirm('Are you sure you want to reset the entire queue? This action cannot be undone.')) {
        queue = [];
        currentTicketNumber = 0;
        
        // Update displays
        displayTicketNumber.textContent = '---';
        displayDate.textContent = '--/--/----';
        displayTime.textContent = '--:--';
        displayQueue.textContent = '--';
        
        // Disable print button
        downloadTicketBtn.disabled = true;
        
        // Render empty queue and reset counters
        renderQueue();
        updateCounterDisplays();
        
        // Save to localStorage
        saveToLocalStorage();
        
        alert('Queue has been reset successfully.');
    }
}

// Make a voice announcement
function makeAnnouncement() {
    const announcement = document.getElementById('announcementInput').value.trim();
    
    if (!announcement) {
        alert('Please enter an announcement text.');
        return;
    }
    
    // Update announcement display
    announcementText.textContent = announcement;
    
    // Voice announcement
    simulateVoiceAnnouncement(announcement);
    
    // Clear input
    document.getElementById('announcementInput').value = '';
    
    alert('Announcement made successfully.');
}

// Render the queue list
function renderQueue() {
    if (queue.length === 0) {
        queueList.innerHTML = '<div class="queue-item"><div>No patients in the queue</div></div>';
        return;
    }
    
    queueList.innerHTML = '';
    
    queue.forEach(ticket => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        
        const statusClass = ticket.status === 'called' ? 'status-called' : 'status-waiting';
        const statusText = ticket.status === 'called' ? `Called to ${ticket.calledTo} at ${ticket.calledTime || ''}` : 'Waiting';
        
        queueItem.innerHTML = `
            <div>
                <div class="queue-number">${ticket.number}</div>
                <div class="queue-time">${ticket.date} ${ticket.time}</div>
            </div>
            <div class="status-indicator ${statusClass}">
                <i class="fas ${ticket.status === 'called' ? 'fa-check-circle' : 'fa-clock'}"></i>
                ${statusText}
            </div>
        `;
        
        queueList.appendChild(queueItem);
    });
}

// Update counter displays to show the last called ticket for each counter
function updateCounterDisplays() {
    // Reset all counters first
    counter1.textContent = '---';
    counter2.textContent = '---';
    counter3.textContent = '---';
    
    // Get the most recent called tickets for each counter type
    const recentTickets = {};
    
    // Find the most recent called ticket for each counter
    queue.forEach(ticket => {
        if (ticket.status === 'called' && ticket.calledTo) {
            // If this ticket was called more recently than what we have, update it
            if (!recentTickets[ticket.calledTo] || 
                (ticket.calledTime && (!recentTickets[ticket.calledTo].calledTime || 
                 new Date(`1970-01-01 ${ticket.calledTime}`) > new Date(`1970-01-01 ${recentTickets[ticket.calledTo].calledTime}`)))) {
                recentTickets[ticket.calledTo] = ticket;
            }
        }
    });
    
    // Update the display counters with the most recent tickets
    // Counter 1 - Show most recent ticket from any counter
    const allCalledTickets = queue.filter(t => t.status === 'called' && t.calledTo);
    if (allCalledTickets.length > 0) {
        // Find the most recently called ticket
        const mostRecent = allCalledTickets.reduce((latest, ticket) => {
            if (!latest) return ticket;
            const latestTime = new Date(`1970-01-01 ${latest.calledTime || '00:00'}`);
            const ticketTime = new Date(`1970-01-01 ${ticket.calledTime || '00:00'}`);
            return ticketTime > latestTime ? ticket : latest;
        }, null);
        
        if (mostRecent) {
            counter1.textContent = mostRecent.number;
        }
    }
    
    // Counter 2 - Show second most recent ticket
    if (allCalledTickets.length > 1) {
        const sortedTickets = [...allCalledTickets].sort((a, b) => {
            const timeA = new Date(`1970-01-01 ${a.calledTime || '00:00'}`);
            const timeB = new Date(`1970-01-01 ${b.calledTime || '00:00'}`);
            return timeB - timeA;
        });
        counter2.textContent = sortedTickets[1]?.number || '---';
    }
    
    // Counter 3 - Show third most recent ticket
    if (allCalledTickets.length > 2) {
        const sortedTickets = [...allCalledTickets].sort((a, b) => {
            const timeA = new Date(`1970-01-01 ${a.calledTime || '00:00'}`);
            const timeB = new Date(`1970-01-01 ${b.calledTime || '00:00'}`);
            return timeB - timeA;
        });
        counter3.textContent = sortedTickets[2]?.number || '---';
    }
}

// Get counter name from value (updated for your new counter names)
function getCounterName(counterValue) {
    // Since you're now using descriptive names directly, just return the value
    return counterValue;
}

// Report generation functions
function generateDailyReport() {
    const reportDate = document.getElementById('reportDate').value;
    const todayTickets = queue.filter(ticket => {
        const ticketDate = new Date(ticket.timestamp).toISOString().split('T')[0];
        return ticketDate === reportDate;
    });
    
    const totalTickets = todayTickets.length;
    const calledTickets = todayTickets.filter(t => t.status === 'called').length;
    const waitingTickets = todayTickets.filter(t => t.status === 'waiting').length;
    
    // Calculate average wait time (simplified)
    const avgWaitTime = totalTickets > 0 ? Math.round((calledTickets * 15) / totalTickets) : 0;
    
    // Update stats
    document.getElementById('totalTickets').textContent = totalTickets;
    document.getElementById('calledTickets').textContent = calledTickets;
    document.getElementById('waitingTickets').textContent = waitingTickets;
    document.getElementById('avgWaitTime').textContent = `${avgWaitTime} min`;
    
    // Generate report summary
    const summary = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p><strong>Date:</strong> ${reportDate}</p>
            <p><strong>Total Tickets Issued:</strong> ${totalTickets}</p>
            <p><strong>Tickets Served:</strong> ${calledTickets}</p>
            <p><strong>Tickets Waiting:</strong> ${waitingTickets}</p>
            <p><strong>Service Rate:</strong> ${totalTickets > 0 ? Math.round((calledTickets / totalTickets) * 100) : 0}%</p>
            <p><strong>Average Wait Time:</strong> ${avgWaitTime} minutes</p>
        </div>
    `;
    
    document.getElementById('reportSummary').innerHTML = summary;
    document.getElementById('reportResults').style.display = 'block';
    
    alert(`Daily report generated for ${reportDate}`);
}

// Print report function - FIXED: This function now works correctly
function printReport() {
    const reportDate = document.getElementById('reportDate').value;
    const todayTickets = queue.filter(ticket => {
        const ticketDate = new Date(ticket.timestamp).toISOString().split('T')[0];
        return ticketDate === reportDate;
    });
    
    const totalTickets = todayTickets.length;
    const calledTickets = todayTickets.filter(t => t.status === 'called').length;
    const waitingTickets = todayTickets.filter(t => t.status === 'waiting').length;
    const avgWaitTime = totalTickets > 0 ? Math.round((calledTickets * 15) / totalTickets) : 0;
    const serviceRate = totalTickets > 0 ? Math.round((calledTickets / totalTickets) * 100) : 0;

    // Create a print-friendly HTML content
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Daily Queue Report - ${reportDate}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #1a73e8; 
                    padding-bottom: 20px;
                }
                .hospital-name { 
                    font-size: 28px; 
                    font-weight: bold; 
                    color: #1a73e8; 
                    margin-bottom: 10px;
                }
                .report-title { 
                    font-size: 20px; 
                    color: #333; 
                    margin: 10px 0;
                }
                .stats-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 15px; 
                    margin: 25px 0;
                }
                .stat-card { 
                    border: 1px solid #ddd; 
                    padding: 15px; 
                    border-radius: 8px; 
                    text-align: center;
                    background: #f8f9fa;
                }
                .stat-number { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #1a73e8; 
                    margin: 5px 0;
                }
                .stat-label { 
                    font-size: 14px; 
                    color: #666; 
                    font-weight: bold;
                }
                .summary { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 20px 0;
                    border-left: 4px solid #1a73e8;
                }
                .summary h3 { 
                    margin-top: 0; 
                    color: #1a73e8;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 40px; 
                    font-size: 12px; 
                    color: #666; 
                    border-top: 1px solid #ddd; 
                    padding-top: 20px;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="hospital-name">City General Hospital</div>
                <div class="report-title">Daily Queue Management Report</div>
                <div><strong>Date:</strong> ${reportDate}</div>
                <div><strong>Generated on:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${totalTickets}</div>
                    <div class="stat-label">Total Tickets Issued</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${calledTickets}</div>
                    <div class="stat-label">Tickets Served</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${waitingTickets}</div>
                    <div class="stat-label">Tickets Waiting</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgWaitTime} min</div>
                    <div class="stat-label">Average Wait Time</div>
                </div>
            </div>
            
            <div class="summary">
                <h3>Performance Summary</h3>
                <p><strong>Service Rate:</strong> ${serviceRate}%</p>
                <p><strong>Efficiency Score:</strong> ${serviceRate > 80 ? 'Excellent' : serviceRate > 60 ? 'Good' : 'Needs Improvement'}</p>
                <p><strong>Total Service Time:</strong> ${calledTickets * 15} minutes</p>
                <p><strong>Average Service Time per Ticket:</strong> ${totalTickets > 0 ? Math.round((calledTickets * 15) / totalTickets) : 0} minutes</p>
                
                <h4>Recommendations:</h4>
                <ul>
                    ${waitingTickets > 5 ? '<li>Consider opening additional counters during peak hours</li>' : ''}
                    ${serviceRate < 60 ? '<li>Review counter staffing and efficiency</li>' : ''}
                    ${avgWaitTime > 20 ? '<li>Implement measures to reduce wait times</li>' : '<li>Current wait times are within acceptable range</li>'}
                    ${calledTickets === 0 ? '<li>No tickets were served on this date</li>' : ''}
                </ul>
            </div>
            
            <div class="footer">
                <p>MediQueue Pro - Advanced Hospital Queue Management System</p>
                <p>This report was automatically generated by the system.</p>
            </div>
        </body>
        </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };
    
    alert('Opening print dialog for daily report...');
}

function viewAnalytics() {
    const reportDate = document.getElementById('reportDate').value;
    const todayTickets = queue.filter(ticket => {
        const ticketDate = new Date(ticket.timestamp).toISOString().split('T')[0];
        return ticketDate === reportDate;
    });
    
    // Simple analytics display
    const counterStats = {};
    todayTickets.forEach(ticket => {
        if (ticket.calledTo) {
            counterStats[ticket.calledTo] = (counterStats[ticket.calledTo] || 0) + 1;
        }
    });
    
    let analyticsHTML = '<h5>Counter Statistics:</h5>';
    Object.keys(counterStats).forEach(counter => {
        analyticsHTML += `<p>${counter}: ${counterStats[counter]} tickets</p>`;
    });
    
    analyticsHTML += '<h5>Hourly Distribution:</h5>';
    const hourlyStats = {};
    todayTickets.forEach(ticket => {
        const hour = new Date(ticket.timestamp).getHours();
        const hourLabel = hour.toString().padStart(2, '0') + ':00';
        hourlyStats[hourLabel] = (hourlyStats[hourLabel] || 0) + 1;
    });
    
    Object.keys(hourlyStats).sort().forEach(hour => {
        analyticsHTML += `<p>${hour} - ${hourlyStats[hour]} tickets</p>`;
    });

    // Add peak hours analysis
    const peakHours = Object.entries(hourlyStats).sort((a, b) => b[1] - a[1]).slice(0, 3);
    analyticsHTML += '<h5>Peak Hours:</h5>';
    peakHours.forEach(([hour, count]) => {
        analyticsHTML += `<p>${hour}: ${count} tickets (Peak)</p>`;
    });

    // Add efficiency metrics
    const totalWaitTime = todayTickets.reduce((total, ticket) => {
        if (ticket.status === 'called' && ticket.timestamp && ticket.calledTime) {
            return total + 15; // Simplified wait time calculation
        }
        return total;
    }, 0);

    const efficiencyScore = todayTickets.length > 0 ? Math.round((calledTickets / todayTickets.length) * 100) : 0;
    
    analyticsHTML += `
        <h5>Efficiency Metrics:</h5>
        <p><strong>Efficiency Score:</strong> ${efficiencyScore}%</p>
        <p><strong>Total Service Time:</strong> ${totalWaitTime} minutes</p>
        <p><strong>Average Service Time per Ticket:</strong> ${todayTickets.length > 0 ? Math.round(totalWaitTime / todayTickets.length) : 0} minutes</p>
    `;
    
    document.getElementById('reportSummary').innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
            ${analyticsHTML}
        </div>
    `;
    document.getElementById('reportResults').style.display = 'block';
}

// Save data to localStorage
function saveToLocalStorage() {
    const data = {
        queue: queue,
        currentTicketNumber: currentTicketNumber
    };
    
    localStorage.setItem('mediQueueData', JSON.stringify(data));
}

// Load data from localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('mediQueueData');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        queue = data.queue || [];
        currentTicketNumber = data.currentTicketNumber || 0;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);