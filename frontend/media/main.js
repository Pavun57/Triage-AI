// Store VS Code API reference
const vscode = acquireVsCodeApi();
  
// Global state
let currentStep = 1;
const totalSteps = 4;
let animationsEnabled = true; // Flag to control animations

// Log execution start to verify the script is loaded
console.log('Triage AI: Script executed');

// DOM Elements
let analyzeButton = null;
let nextButtons = null;
let backButtons = null;
let applyPlanButton = null;
let stepIndicators = null;
let agentPanels = null;
let loadingSpinner = null;
let loadingMessage = null;

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Triage AI: DOM content loaded');
  initializeUI();
});

// Also try immediate initialization for VSCode webviews
initializeUI();

function initializeUI() {
  // Check if we've already initialized to avoid duplicate handlers
  if (analyzeButton !== null) {
    console.log('UI already initialized');
    return;
  }
  
  console.log('Triage AI: Initializing UI elements');
  
  // Get all UI elements
  analyzeButton = document.getElementById('analyze-prompt');
  nextButtons = document.querySelectorAll('.next-button');
  backButtons = document.querySelectorAll('.back-button');
  applyPlanButton = document.getElementById('apply-plan');
  stepIndicators = document.querySelectorAll('.step-indicator .step');
  agentPanels = document.querySelectorAll('.agent-panel');
  loadingSpinner = document.getElementById('loading-spinner');
  loadingMessage = document.getElementById('loading-message');
  
  // Debug element counts
  console.log(`Elements found: ${nextButtons?.length || 0} next buttons, ${backButtons?.length || 0} back buttons, ${agentPanels?.length || 0} panels`);

  // Set up analyze button
  if (analyzeButton) {
    console.log('Setting analyze button handler');
    analyzeButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Analyze button clicked');
      
      const userPrompt = document.getElementById('user-prompt');
      if (userPrompt && userPrompt.value.trim() === '') {
        vscode.postMessage({
          command: 'alert',
          text: 'Please enter a description before analyzing'
        });
        return;
      }
      
      showLoading('Analyzing request...');
      
      // Simulate processing
      setTimeout(function() {
        const pmOutput = document.getElementById('pm-output');
        if (pmOutput) {
          pmOutput.style.display = 'block';
          console.log('PM output displayed');
        }
        hideLoading();
      }, 1500);
    });
  }

  // Set up next buttons
  nextButtons.forEach(function(button) {
    console.log('Setting next button handler');
    button.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Next button clicked');
      
      if (currentStep < totalSteps) {
        showLoading(`Processing step ${currentStep}...`);
        
        setTimeout(function() {
          currentStep++;
          updateUI();
          hideLoading();
          console.log(`Advanced to step ${currentStep}`);
        }, 1000);
      }
    });
  });

  // Set up back buttons
  backButtons.forEach(function(button) {
    console.log('Setting back button handler');
    button.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Back button clicked');
      
      if (currentStep > 1) {
        currentStep--;
        updateUI();
        console.log(`Went back to step ${currentStep}`);
      }
    });
  });

  // Set up apply plan button
  if (applyPlanButton) {
    console.log('Setting apply plan button handler');
    applyPlanButton.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Apply plan button clicked');
      
      showLoading('Finalizing plan...');
      
      setTimeout(function() {
        hideLoading();
        vscode.postMessage({
          command: 'alert',
          text: 'Plan ready for implementation!'
        });
      }, 1500);
    });
  }

  updateUI();
}

// Update UI based on current step
function updateUI() {
  console.log(`Updating UI for step ${currentStep}`);
  
  // Update step indicators with staggered animation
  if (stepIndicators) {
    stepIndicators.forEach(function(indicator, index) {
      const step = index + 1;
      indicator.classList.remove('active', 'completed');
      
      // Add a slight delay for visual effect
      setTimeout(() => {
        if (step === currentStep) {
          indicator.classList.add('active');
        } else if (step < currentStep) {
          indicator.classList.add('completed');
        }
      }, index * 100);
    });
  }

  // Show active panel, hide others with smooth transitions
  if (agentPanels) {
    // First, remove active class from all panels
    agentPanels.forEach(function(panel) {
      if (panel.classList.contains('active')) {
        panel.classList.remove('active');
      }
    });
    
    // Then, after a short delay, add active class to the current panel
    setTimeout(() => {
      const currentPanel = agentPanels[currentStep - 1];
      if (currentPanel) {
        currentPanel.classList.add('active');
        console.log(`Panel ${currentStep} activated`);
        
        // Add focus effect to the first input in the panel
        const firstInput = currentPanel.querySelector('textarea, input');
        if (firstInput) {
          setTimeout(() => {
            firstInput.focus();
          }, 500);
        }
      }
    }, 100);
  }
  
  // Add ripple effect to all buttons
  addRippleToButtons();
}

// Add ripple effect to buttons
function addRippleToButtons() {
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach(button => {
    // Only add the event listener once
    if (!button.getAttribute('data-has-ripple')) {
      button.setAttribute('data-has-ripple', 'true');
      
      button.addEventListener('click', function(e) {
        if (!animationsEnabled) return;
        
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    }
  });
}

// Show loading spinner with enhanced animation
function showLoading(message) {
  console.log(`Loading: ${message}`);
  
  // Create typing animation for loading message
  if (loadingMessage) {
    const finalMessage = message || 'Processing...';
    loadingMessage.textContent = '';
    
    if (animationsEnabled) {
      // Animate the text appearing one character at a time
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < finalMessage.length) {
          loadingMessage.textContent += finalMessage.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, 50);
    } else {
      // No animation, just set the text
      loadingMessage.textContent = finalMessage;
    }
  }
  
  if (loadingSpinner) {
    loadingSpinner.classList.add('active');
  }
}

// Hide loading spinner with fade out
function hideLoading() {
  console.log('Loading complete');
  
  if (loadingSpinner) {
    // Add fade-out class for smooth transition
    loadingSpinner.classList.add('fade-out');
    
    // Remove classes after animation completes
    setTimeout(() => {
      loadingSpinner.classList.remove('active', 'fade-out');
    }, 300);
  }
}

// Function to animate text appearing in output areas
function animateTextAppearance(element, text) {
  if (!element || !text || !animationsEnabled) {
    if (element) element.innerHTML = text;
    return;
  }
  
  element.innerHTML = '';
  let i = 0;
  const speed = 5; // Characters per frame
  
  function typeWriter() {
    if (i < text.length) {
      const nextChunk = text.substring(i, i + speed);
      element.innerHTML += nextChunk;
      i += speed;
      
      // Scroll to bottom as text appears
      element.scrollTop = element.scrollHeight;
      
      requestAnimationFrame(typeWriter);
    }
  }
  
  requestAnimationFrame(typeWriter);
}

// Add CSS for ripple effect
function addRippleStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .ripple-effect {
      position: absolute;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
      animation: ripple-animation 0.6s linear;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .fade-out {
      animation: fade-out 0.3s ease forwards;
    }
    
    @keyframes fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded - initializing main.js');
  
  // Add ripple effect styles
  addRippleStyles();
  
  // Initialize UI
  initializeUI();
  
  // Add ripple effect to all buttons
  addRippleToButtons();
});

// Also try immediate initialization for VSCode webviews
addRippleStyles();
initializeUI();
addRippleToButtons(); // Add ripple effect to all buttons
