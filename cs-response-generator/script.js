/* ===================================
   CS Response Generator - JavaScript
   Two-Step AI Reasoning Architecture
   =================================== */

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-6';
const API_KEY_STORAGE_KEY = 'anthropic_api_key';

// Language display names
const LANGUAGE_NAMES = {
    'es': 'Spanish',
    'en': 'English',
    'fr': 'French'
};

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    // API Key Management
    apiKeySection: document.getElementById('apiKeySection'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    clearApiKeyBtn: document.getElementById('clearApiKeyBtn'),
    
    // Main App
    mainApp: document.getElementById('mainApp'),
    inputText: document.getElementById('inputText'),
    contextText: document.getElementById('contextText'),
    generateBtn: document.getElementById('generateBtn'),
    generateBtnText: document.getElementById('generateBtnText'),
    generateBtnLoader: document.getElementById('generateBtnLoader'),
    
    // Mini Summary
    miniSummary: document.getElementById('miniSummary'),
    summaryLanguage: document.getElementById('summaryLanguage'),
    summaryTone: document.getElementById('summaryTone'),
    summarySentiment: document.getElementById('summarySentiment'),
    summaryTopicsList: document.getElementById('summaryTopicsList'),
    summaryKeyIssues: document.getElementById('summaryKeyIssues'),
    
    // Output
    outputSection: document.getElementById('outputSection'),
    outputText: document.getElementById('outputText'),
    copyBtn: document.getElementById('copyBtn'),
    copyBtnText: document.getElementById('copyBtnText'),
    copyBtnSuccess: document.getElementById('copyBtnSuccess'),
    
    // Error
    errorDisplay: document.getElementById('errorDisplay')
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachEventListeners();
});

function initializeApp() {
    // Check if API key exists in localStorage
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    
    if (savedApiKey) {
        elements.apiKeyInput.value = savedApiKey;
        showMainApp();
    }
}

function attachEventListeners() {
    elements.saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
    elements.clearApiKeyBtn.addEventListener('click', handleClearApiKey);
    elements.generateBtn.addEventListener('click', handleGenerate);
    elements.copyBtn.addEventListener('click', handleCopyToClipboard);
    
    // Allow Enter key in API key input
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSaveApiKey();
        }
    });
}

// ============================================
// API KEY MANAGEMENT
// ============================================

function handleSaveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
        showError('Please enter a valid API key.');
        return;
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
        showError('Invalid API key format. Anthropic API keys start with "sk-ant-".');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    
    // Show main app
    showMainApp();
}

function handleClearApiKey() {
    if (confirm('Are you sure you want to clear your API key? You will need to enter it again.')) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        elements.apiKeyInput.value = '';
        hideMainApp();
    }
}

function showMainApp() {
    elements.apiKeySection.style.display = 'none';
    elements.mainApp.style.display = 'block';
    elements.clearApiKeyBtn.style.display = 'inline-flex';
}

function hideMainApp() {
    elements.apiKeySection.style.display = 'block';
    elements.mainApp.style.display = 'none';
    elements.clearApiKeyBtn.style.display = 'none';
    
    // Reset UI
    elements.miniSummary.style.display = 'none';
    elements.outputSection.style.display = 'none';
    elements.errorDisplay.style.display = 'none';
}

// ============================================
// CORE FUNCTIONALITY: TWO-STEP AI REASONING
// ============================================

async function handleGenerate() {
    const inputText = elements.inputText.value.trim();
    const contextText = elements.contextText.value.trim();
    
    if (!inputText) {
        showError('Please paste the client\'s latest message.');
        return;
    }
    
    // Reset UI
    hideError();
    elements.miniSummary.style.display = 'none';
    elements.outputSection.style.display = 'none';
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // STEP 1: Classification Call
        const classification = await classifyInput(inputText, contextText);
        
        // Display Mini Summary Card
        displayMiniSummary(classification);
        
        // STEP 2: Conditional Logic - Select Instruction Modifier
        const instructionModifier = selectInstructionModifier(classification);
        
        // STEP 3: Generation Call
        const response = await generateResponse(inputText, contextText, classification, instructionModifier);
        
        // Display final response
        displayResponse(response);
        
    } catch (error) {
        showError(error.message);
    } finally {
        setLoadingState(false);
    }
}

// ============================================
// STEP 1: CLASSIFICATION CALL
// ============================================

async function classifyInput(latestMessage, contextInfo) {
    const systemPrompt = `You are a classification system. Analyze the client's latest message and respond ONLY with valid JSON (no prose, no markdown fences, no explanations).

Your response must be EXACTLY this structure:
{
  "detected_language": "es" | "en" | "fr",
  "formality_level": "casual" | "neutral" | "formal",
  "topics": [
    {
      "category": "billing" | "technical_issue" | "complaint_churn_risk" | "general_inquiry" | "feature_request" | "recommendation_request" | "logistics_clarification",
      "urgency": "high" | "medium" | "low",
      "sentiment": "frustrated" | "neutral" | "satisfied",
      "key_issue": "one-line summary of this specific topic"
    }
  ]
}

Rules:
- detected_language: Detect if the text is in Spanish (es), English (en), or French (fr)
- formality_level: Assess the tone/formality of the message (casual, neutral, or formal)
- topics: Array of topics found in the latest message. Most messages have 1 topic, but some may have multiple.
- category options:
  * billing: Payment, invoicing, pricing questions
  * technical_issue: Bugs, errors, technical problems
  * complaint_churn_risk: Complaints, frustration, considering leaving
  * general_inquiry: General questions, information requests
  * feature_request: Requests for new features or improvements
  * recommendation_request: Asking for advice, "what should I do", "which option is better"
  * logistics_clarification: Questions about scheduling, sequencing, timing, "should we do X first or wait for Y"
- urgency: Assess how urgent this topic is
- sentiment: Detect the emotional tone
- key_issue: Summarize the main point of this topic in one short sentence

IMPORTANT: If context/background info is provided, use it to better understand the latest message, but DO NOT classify the context itself. Only classify topics from the latest message.

Respond ONLY with the JSON object. No other text.`;

    let userMessage = `Client's Latest Message:\n${latestMessage}`;
    
    if (contextInfo) {
        userMessage += `\n\nContext / Background Info (for reference only, do not classify):\n${contextInfo}`;
    }

    const response = await callClaudeAPI(systemPrompt, userMessage);
    
    // Parse JSON response
    try {
        // Remove any potential markdown fences or extra whitespace
        let cleanedResponse = response.trim();
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        const classification = JSON.parse(cleanedResponse);
        
        // Validate required fields
        if (!classification.detected_language || !classification.topics || !Array.isArray(classification.topics)) {
            throw new Error('Classification response missing required fields');
        }
        
        // Validate each topic
        for (const topic of classification.topics) {
            if (!topic.category || !topic.urgency || !topic.sentiment || !topic.key_issue) {
                throw new Error('Topic missing required fields');
            }
        }
        
        return classification;
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw Response:', response);
        throw new Error('Failed to parse classification response. The AI did not return valid JSON. Please try again.');
    }
}

// ============================================
// STEP 2: CONDITIONAL LOGIC - INSTRUCTION MODIFIER
// ============================================

/**
 * This is the REASONING LAYER that makes the second call context-aware.
 * Based on the classification result, we select different instruction modifiers
 * to customize the tone and approach of the generated response.
 * Now handles multiple topics by combining instruction modifiers.
 */
function selectInstructionModifier(classification) {
    const { topics } = classification;
    
    if (!topics || topics.length === 0) {
        return getDefaultModifier();
    }
    
    // Collect all instruction modifiers for each topic
    const modifiers = topics.map(topic => getModifierForTopic(topic));
    
    // If single topic, return its modifier
    if (modifiers.length === 1) {
        return modifiers[0];
    }
    
    // Multiple topics: combine them
    return `This message contains multiple topics. Address each one:\n\n${modifiers.join('\n\n')}`;
}

function getModifierForTopic(topic) {
    const { category, urgency, sentiment } = topic;
    
    // HIGH PRIORITY: Complaint/Churn Risk + High Urgency
    if (category === 'complaint_churn_risk' && urgency === 'high') {
        return `HIGH-PRIORITY churn risk (${topic.key_issue}):
- Acknowledge the client's frustration explicitly and empathetically
- Apologize sincerely for the inconvenience
- Offer immediate escalation to a manager or senior team member
- Provide a concrete next step with a specific timeline (within 24 hours)
- Use an urgent but calm, reassuring tone
- Show that you take this seriously and are personally committed to resolution`;
    }
    
    // Complaint/Churn Risk (any urgency)
    if (category === 'complaint_churn_risk') {
        return `Churn risk (${topic.key_issue}):
- Acknowledge the client's concerns with genuine empathy
- Apologize for the negative experience
- Offer a clear path to resolution with specific next steps
- Consider offering escalation or a follow-up call
- Use a warm, understanding tone that rebuilds trust`;
    }
    
    // Billing Issues
    if (category === 'billing') {
        return `Billing issue (${topic.key_issue}):
- Provide clear, precise next steps for resolving the billing concern
- Include a concrete timeline (e.g., "within 2-3 business days")
- Explain the billing process transparently
- Offer to provide documentation or receipts if relevant
- Use a professional, reassuring tone that builds confidence`;
    }
    
    // Technical Issues
    if (category === 'technical_issue') {
        return `Technical issue (${topic.key_issue}):
- Acknowledge the inconvenience caused by the technical problem
- Provide a clear resolution path or next diagnostic step
- If you don't have an immediate solution, explain what you'll investigate
- Offer a timeline for follow-up
- Use a helpful, solution-oriented tone`;
    }
    
    // Logistics Clarification
    if (category === 'logistics_clarification') {
        return `Logistics/sequencing question (${topic.key_issue}):
- Directly answer the sequencing/timing question being asked
- Be clear and decisive about next steps
- If multiple options exist, briefly lay them out before recommending one
- Use a confident, helpful tone`;
    }
    
    // Recommendation Request
    if (category === 'recommendation_request') {
        return `Recommendation request (${topic.key_issue}):
- Provide a clear recommendation based on the context
- Explain the reasoning briefly
- If there are trade-offs, mention them but still give a definitive suggestion
- Use a confident, advisory tone`;
    }
    
    // Feature Request
    if (category === 'feature_request') {
        return `Feature request (${topic.key_issue}):
- Thank the client for their valuable feedback
- Explain how feature requests are evaluated and prioritized
- If possible, mention if this is already on the roadmap or being considered
- Use an appreciative, collaborative tone`;
    }
    
    // High Urgency (any category not covered above)
    if (urgency === 'high') {
        return `High-urgency issue (${topic.key_issue}):
- Prioritize urgency in your tone and language
- Show that immediate action is being taken
- Provide a specific timeline for next steps
- Use a responsive, action-oriented tone`;
    }
    
    // Frustrated Sentiment (any category not covered above)
    if (sentiment === 'frustrated') {
        return `Client is frustrated (${topic.key_issue}):
- Acknowledge their frustration with empathy
- Apologize for the inconvenience
- Provide clear next steps to resolve the issue
- Use a warm, understanding tone that de-escalates tension`;
    }
    
    // General Inquiry
    if (category === 'general_inquiry') {
        return `General inquiry (${topic.key_issue}):
- Provide clear, helpful information
- Anticipate follow-up questions if relevant
- Use a friendly, informative tone`;
    }
    
    // DEFAULT
    return `Topic (${topic.key_issue}):
- Be professional but warm and friendly
- Provide clear next steps or information
- Use a helpful, resolution-oriented tone
- Ensure the client feels heard and supported`;
}

function getDefaultModifier() {
    return `Your response must:
- Be professional but warm and friendly
- Provide clear next steps or information
- Use a helpful, resolution-oriented tone
- Ensure the client feels heard and supported`;
}

// ============================================
// STEP 3: GENERATION CALL
// ============================================

async function generateResponse(latestMessage, contextInfo, classification, instructionModifier) {
    const systemPrompt = `You are an expert Customer Success Manager who handles client communications across B2B SaaS, fintech, and tech-enabled service industries.

CRITICAL LANGUAGE RULE: You MUST respond in the SAME language as detected_language (${classification.detected_language}). 
- If detected_language is "es" (Spanish), respond ENTIRELY in Spanish
- If detected_language is "en" (English), respond ENTIRELY in English  
- If detected_language is "fr" (French), respond ENTIRELY in French
DO NOT translate to another language. Match the detected language EXACTLY.

Your tone is professional but warm and friendly, never robotic or overly formal. You write like a real person who genuinely cares about helping clients.

Your task: Generate a ready-to-send email response that addresses the client's latest message.

${instructionModifier}

WRITING STYLE RULES (critical):
- Do NOT use markdown formatting of any kind (no **bold**, no *italics*, no bullet points, no headers). This is a plain-text email, not a markdown document.
- Do NOT use emojis.
- Do NOT use em dashes (—). Use periods or commas instead.
- Do NOT use generic enthusiasm phrases like "I'm genuinely excited", "I really appreciate you taking the time", "looking forward to", "thanks again for". If gratitude or interest needs to be expressed, do it in a specific, low-key way tied to the actual content of the message, not a stock phrase.
- Do NOT add a "P.S." unless the original message specifically requires one.
- Vary sentence length. Avoid having every sentence be the same length and rhythm.
- Write the way a real person writes a quick professional email: direct, a little informal, not overly polished or "perfect."
- These style rules apply regardless of which language you are writing in (Spanish, English, or French). Avoid generic stock enthusiasm phrases in ANY language — for example, avoid things like "I'm genuinely excited" / "estoy genuinamente emocionada" / "je suis vraiment ravi(e)", or "I really appreciate" / "agradezco mucho" / "j'apprécie vraiment". Express interest or gratitude in a specific way tied to the actual content, not with a generic enthusiastic phrase, in whichever language you're writing.
- Keep the response concise. Address every detected topic, but don't pad with unnecessary pleasantries, repetition, or over-explaining. Aim for the shortest version that still feels complete and human — most responses should be well under 150 words unless the complexity of the topics genuinely requires more.

Format your response as a complete email (greeting, body, closing, signature). Make it feel personal and human.`;

    let userPrompt = `Client's Latest Message:\n${latestMessage}`;
    
    if (contextInfo) {
        userPrompt += `\n\nContext / Background Info:\n${contextInfo}`;
    }
    
    userPrompt += `\n\nClassification Analysis:
- Language: ${LANGUAGE_NAMES[classification.detected_language]} (${classification.detected_language})
- Topics: ${classification.topics.map(t => `${t.category} (${t.urgency}, ${t.sentiment}): ${t.key_issue}`).join('; ')}

Generate a professional, friendly email response in ${LANGUAGE_NAMES[classification.detected_language]} that addresses the client's message.`;

    return await callClaudeAPI(systemPrompt, userPrompt);
}

// ============================================
// ANTHROPIC API CALL
// ============================================

async function callClaudeAPI(systemPrompt, userMessage) {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    
    if (!apiKey) {
        throw new Error('API key not found. Please save your API key first.');
    }
    
    const requestBody = {
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: userMessage
            }
        ]
    };
    
    try {
        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': ANTHROPIC_VERSION,
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            throw new Error('Invalid response format from API');
        }
        
        return data.content[0].text;
        
    } catch (error) {
        if (error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
    }
}

// ============================================
// UI DISPLAY FUNCTIONS
// ============================================

function displayMiniSummary(classification) {
    const { detected_language, formality_level, topics } = classification;
    
    // Language
    elements.summaryLanguage.textContent = LANGUAGE_NAMES[detected_language] || detected_language.toUpperCase();
    elements.summaryLanguage.className = `summary-value language ${detected_language}`;
    
    // Tone (formality level)
    const formalityDisplay = formality_level ? formality_level.charAt(0).toUpperCase() + formality_level.slice(1) : 'Neutral';
    elements.summaryTone.textContent = formalityDisplay;
    elements.summaryTone.className = 'summary-value';
    
    // Sentiment badge - show most negative sentiment across all topics
    if (topics && topics.length > 0) {
        const sentimentLevels = { frustrated: 3, neutral: 2, satisfied: 1 };
        const dominantSentiment = topics.reduce((max, topic) => 
            sentimentLevels[topic.sentiment] > sentimentLevels[max] ? topic.sentiment : max, 
            topics[0].sentiment
        );
        elements.summarySentiment.textContent = dominantSentiment.charAt(0).toUpperCase() + dominantSentiment.slice(1);
        elements.summarySentiment.className = `summary-value badge ${dominantSentiment}`;
        
        // Topics list - show each topic as "Category — Urgency" badge
        elements.summaryTopicsList.innerHTML = '';
        topics.forEach(topic => {
            const topicBadge = document.createElement('span');
            topicBadge.className = `topic-badge ${topic.category} ${topic.urgency}`;
            const categoryDisplay = topic.category.replace(/_/g, ' ');
            const urgencyDisplay = topic.urgency.charAt(0).toUpperCase() + topic.urgency.slice(1);
            topicBadge.textContent = `${categoryDisplay} — ${urgencyDisplay}`;
            elements.summaryTopicsList.appendChild(topicBadge);
        });
        
        // Key issues - show as list items
        elements.summaryKeyIssues.innerHTML = '';
        topics.forEach(topic => {
            const li = document.createElement('li');
            li.textContent = topic.key_issue;
            elements.summaryKeyIssues.appendChild(li);
        });
    }
    
    // Show the mini summary with animation
    elements.miniSummary.style.display = 'block';
}

function displayResponse(responseText) {
    elements.outputText.textContent = responseText;
    elements.outputSection.style.display = 'block';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setLoadingState(isLoading) {
    elements.generateBtn.disabled = isLoading;
    elements.generateBtnText.style.display = isLoading ? 'none' : 'inline';
    elements.generateBtnLoader.style.display = isLoading ? 'inline-block' : 'none';
}

function showError(message) {
    elements.errorDisplay.textContent = `❌ Error: ${message}`;
    elements.errorDisplay.style.display = 'block';
}

function hideError() {
    elements.errorDisplay.style.display = 'none';
}

async function handleCopyToClipboard() {
    const text = elements.outputText.textContent;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Show success feedback
        elements.copyBtnText.style.display = 'none';
        elements.copyBtnSuccess.style.display = 'inline';
        
        // Reset after 2 seconds
        setTimeout(() => {
            elements.copyBtnText.style.display = 'inline';
            elements.copyBtnSuccess.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        showError('Failed to copy to clipboard. Please copy manually.');
    }
}

// ============================================
// DATA FLOW SUMMARY (for interview explanation)
// ============================================

/*
DATA FLOW ARCHITECTURE:

1. USER INPUT
   └─> User pastes text → clicks "Generate"

2. CLASSIFICATION CALL (Step 1)
   └─> callClaudeAPI(classificationSystemPrompt, inputText)
   └─> Returns JSON: { detected_language, category, urgency, sentiment, key_issue }
   └─> Parse JSON with error handling

3. DISPLAY MINI SUMMARY
   └─> displayMiniSummary(classification)
   └─> Visual representation with colored badges and animation

4. CONDITIONAL LOGIC (Step 2) - THE REASONING LAYER
   └─> selectInstructionModifier(classification)
   └─> Analyzes: category + urgency + sentiment
   └─> Returns: instruction modifier string (customized prompt instructions)
   
   Example logic:
   IF category === "complaint_churn_risk" AND urgency === "high"
      → Return escalation-focused modifier
   ELSE IF category === "billing"
      → Return billing-specific modifier
   ELSE
      → Return default modifier

5. GENERATION CALL (Step 3)
   └─> callClaudeAPI(generationSystemPrompt + instructionModifier, originalText + classification)
   └─> System prompt includes: language requirement + instruction modifier
   └─> Returns: Final email response in detected language

6. DISPLAY RESPONSE
   └─> displayResponse(generatedEmail)
   └─> Show with copy-to-clipboard functionality

WHY TWO CALLS?
- Separation of concerns: Understanding vs. Generation
- Enables conditional logic between calls
- Makes AI reasoning transparent to user
- Allows customization based on context
*/
